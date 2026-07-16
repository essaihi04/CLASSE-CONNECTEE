'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {planLocalCourseCleanup}=require('../course-local-cleanup');

const ID='11111111-1111-4111-8111-111111111111';

test('retire les quatre traces locales d’un cours Supabase supprimé',()=>{
  const key='published-'+ID;
  const plan=planLocalCourseCleanup(ID,{
    content:{[key]:{'0':[{type:'image',url:'/uploads/course-image.png'}]}},
    customSteps:{[key]:[{id:'custom'}]},
    structure:{[key]:{order:['b0'],hidden:[]}},
    overrides:{[key]:{'0':{mediaSrc:'/uploads/course-video.mp4'}}}
  });
  assert.deepEqual(plan.changed,['content','customSteps','structure','overrides']);
  assert.deepEqual(plan.uploadFiles,['course-image.png','course-video.mp4']);
  for(const store of Object.values(plan.stores))assert.equal(Object.hasOwn(store,key),false);
});

test('conserve un téléversement encore référencé par un autre cours',()=>{
  const key='published-'+ID;
  const plan=planLocalCourseCleanup(ID,{
    content:{[key]:{'0':[{url:'/uploads/shared.png'}]},'another-course':{'0':[{url:'/uploads/shared.png'}]}},
    customSteps:{},structure:{},overrides:{[key]:{'0':{mediaSrc:'/uploads/private.png'}}}
  });
  assert.deepEqual(plan.uploadFiles,['private.png']);
});

test('conserve aussi un média référencé directement par le cours prédéfini',()=>{
  const key='published-'+ID;
  const plan=planLocalCourseCleanup(ID,{
    content:{[key]:{'0':[{url:'/uploads/builtin.mp4'},{url:'/uploads/orphan.mp4'}]}},
    customSteps:{},structure:{},overrides:{},
    protected:'media:{src:"/uploads/builtin.mp4"}'
  });
  assert.deepEqual(plan.uploadFiles,['orphan.mp4']);
});

test('refuse un identifiant qui pourrait viser une autre clé locale',()=>{
  assert.throws(()=>planLocalCourseCleanup('../les-aliments',{}),/invalide/i);
});
