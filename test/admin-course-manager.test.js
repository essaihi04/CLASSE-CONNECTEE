'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const manager=require('../prototype/admin-course-manager');

function queryResult(data,error=null){
  return {data,error};
}

function createClient(options={}){
  const events=[];
  const rows=Object.assign({
    course_sources:[{storage_path:'teacher-1/courses/course-1/resources/image.png'}],
    course_imports:[{source_pdf_path:'teacher-1/courses/course-1/sources/fiche.pdf'}],
    course_assets:[{storage_path:'course-media/teacher-1/courses/course-1/assets/schema.svg'}]
  },options.rows||{});
  const client={
    events,
    from(table){
      return {
        select(columns){
          return {async eq(column,value){events.push(['select',table,columns,column,value]);return queryResult(rows[table]||[])}};
        },
        delete(){
          return {
            eq(column,value){
              return {
                select(columns){
                  return {
                    async maybeSingle(){
                      events.push(['delete',table,column,value,columns]);
                      return queryResult(options.deleted===false?null:{id:value},options.deleteError||null);
                    }
                  };
                }
              };
            }
          };
        },
        update(payload){
          return {
            eq(column,value){
              return {
                select(columns){
                  return {
                    async maybeSingle(){
                      events.push(['update',table,payload,column,value,columns]);
                      return queryResult(options.updated===false?null:{id:value,status:payload.status},options.updateError||null);
                    }
                  };
                }
              };
            }
          };
        }
      };
    },
    storage:{
      from(bucket){
        return {async remove(paths){events.push(['storage-remove',bucket,paths]);return queryResult([],options.storageError||null)}};
      }
    }
  };
  return client;
}

test('collecte et déduplique tous les chemins de stockage connus',()=>{
  const paths=manager.collectStoragePaths({id:'course-1',teacher_id:'teacher-1',settings:{audio_map:{a:'teacher-1/courses/course-1/audio/a.mp3',b:'/course-media/teacher-1/courses/course-1/audio/a.mp3',external:'https://example.test/audio.mp3'}}},{
    sources:[{storage_path:'teacher-1/courses/course-1/resources/image.png'}],
    imports:[{source_pdf_path:'teacher-1/courses/course-1/sources/fiche.pdf'}],
    assets:[{storage_path:'course-media/teacher-1/courses/course-1/assets/schema.svg'},{storage_path:''}]
  });
  assert.deepEqual(paths,[
    'teacher-1/courses/course-1/resources/image.png',
    'teacher-1/courses/course-1/sources/fiche.pdf',
    'teacher-1/courses/course-1/assets/schema.svg',
    'teacher-1/courses/course-1/audio/a.mp3'
  ]);
});

test('ignore tout chemin appartenant à un autre cours ou à un autre professeur',()=>{
  const paths=manager.collectStoragePaths({id:'course-1',teacher_id:'teacher-1',settings:{audio_map:{
    valid:'teacher-1/courses/course-1/audio/voice.mp3',
    otherCourse:'teacher-1/courses/course-2/audio/voice.mp3',
    otherTeacher:'teacher-2/courses/course-1/audio/voice.mp3',
    traversal:'teacher-1/courses/course-1/../course-2/secret.pdf'
  }}},{sources:[
    {storage_path:'teacher-1/courses/course-1/resources/image.png'},
    {storage_path:'teacher-2/courses/course-9/resources/private.png'}
  ]});
  assert.deepEqual(paths,[
    'teacher-1/courses/course-1/resources/image.png',
    'teacher-1/courses/course-1/audio/voice.mp3'
  ]);
});

test('supprime uniquement le cours parent puis nettoie tous ses médias',async()=>{
  const client=createClient();
  const result=await manager.deleteCourse(client,{id:'course-1',teacher_id:'teacher-1',settings:{audio_map:{voice:'teacher-1/courses/course-1/audio/voice.mp3'}}});
  assert.equal(result.deleted,true);
  assert.equal(result.warning,'');
  assert.equal(client.events.filter(event=>event[0]==='delete').length,1);
  assert.deepEqual(client.events.find(event=>event[0]==='delete').slice(0,2),['delete','courses']);
  assert.deepEqual(client.events.find(event=>event[0]==='storage-remove'),[
    'storage-remove','course-media',[
      'teacher-1/courses/course-1/resources/image.png',
      'teacher-1/courses/course-1/sources/fiche.pdf',
      'teacher-1/courses/course-1/assets/schema.svg',
      'teacher-1/courses/course-1/audio/voice.mp3'
    ]
  ]);
  assert.ok(client.events.findIndex(event=>event[0]==='delete')<client.events.findIndex(event=>event[0]==='storage-remove'));
});

test('confirme la suppression SQL même si le nettoyage Storage échoue',async()=>{
  const client=createClient({storageError:{message:'policy refusée'}});
  const result=await manager.deleteCourse(client,{id:'course-1',teacher_id:'teacher-1',settings:{}});
  assert.equal(result.deleted,true);
  assert.match(result.warning,/cours est supprimé/i);
  assert.match(result.warning,/policy refusée/i);
});

test('refuse de déclarer supprimé un cours invisible aux politiques RLS',async()=>{
  const client=createClient({deleted:false});
  await assert.rejects(()=>manager.deleteCourse(client,{id:'course-1',teacher_id:'teacher-1'}),/droits administrateur insuffisants/i);
  assert.equal(client.events.some(event=>event[0]==='storage-remove'),false);
});

test('met à jour uniquement vers un statut de cours autorisé',async()=>{
  const client=createClient();
  const row=await manager.updateStatus(client,'course-4','draft');
  assert.equal(row.status,'draft');
  assert.deepEqual(client.events.find(event=>event[0]==='update').slice(0,4),['update','courses',{status:'draft'},'id']);
  await assert.rejects(()=>manager.updateStatus(client,'course-4','deleted'),/statut de cours invalide/i);
});

test('demande au serveur admin de nettoyer les traces locales du cours',async()=>{
  const calls=[];
  const sb={auth:{async getSession(){return {data:{session:{access_token:'admin-token'}}}}}};
  const result=await manager.deleteLocalCourseData(sb,'11111111-1111-4111-8111-111111111111',async(url,options)=>{
    calls.push({url,options});
    return {ok:true,async json(){return {ok:true,clearedStores:['content','overrides'],deletedUploads:2,warning:''}}};
  });
  assert.equal(result.deletedUploads,2);
  assert.equal(calls[0].url,'/api/admin/course-local-data');
  assert.equal(calls[0].options.method,'DELETE');
  assert.equal(calls[0].options.headers.Authorization,'Bearer admin-token');
  assert.deepEqual(JSON.parse(calls[0].options.body),{courseId:'11111111-1111-4111-8111-111111111111'});
});

test('la migration 011 donne à l’administrateur le droit DELETE sur course-media',()=>{
  const migration=fs.readFileSync(path.join(__dirname,'..','supabase','migrations','20260716_011_admin_course_management.sql'),'utf8');
  assert.match(migration,/for delete to authenticated/i);
  assert.match(migration,/bucket_id\s*=\s*'course-media'/i);
  assert.match(migration,/public\.is_platform_admin\(\)/i);
});

test('la bibliothèque charge le propriétaire requis par la suppression sécurisée',()=>{
  const library=fs.readFileSync(path.join(__dirname,'..','prototype','courses.js'),'utf8');
  assert.match(library,/select\('id,teacher_id,/);
  assert.match(library,/AdminCourseManager\.deleteCourse\(window\.classesSupabase,course\)/);
});
