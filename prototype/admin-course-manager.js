(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.AdminCourseManager=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const STORAGE_BUCKET='course-media';
  const DELETE_BATCH_SIZE=100;
  const ALLOWED_STATUSES=new Set(['draft','published','archived']);

  function message(error){
    return error&&error.message?error.message:String(error||'erreur inconnue');
  }

  function normalizeStoragePath(value){
    if(typeof value!=='string')return '';
    let path=value.trim().replace(/\\/g,'/');
    if(!path||/^(?:https?:|data:|blob:)/i.test(path))return '';
    path=path.replace(/^\/+/, '');
    if(path.toLowerCase().startsWith(STORAGE_BUCKET+'/'))path=path.slice(STORAGE_BUCKET.length+1);
    if(path.split('/').some(part=>part==='.'||part==='..'))return '';
    return path;
  }

  function collectStoragePaths(course,collections){
    const identity=requireCourseIdentity(course);
    const allowedPrefix=identity.teacherId+'/courses/'+identity.id+'/';
    const values=[];
    const rows=collections&&typeof collections==='object'?collections:{};
    (rows.sources||[]).forEach(row=>values.push(row&&row.storage_path));
    (rows.imports||[]).forEach(row=>values.push(row&&row.source_pdf_path));
    (rows.assets||[]).forEach(row=>values.push(row&&row.storage_path));
    const audioMap=course&&course.settings&&course.settings.audio_map;
    if(audioMap&&typeof audioMap==='object')Object.values(audioMap).forEach(value=>values.push(value));
    return [...new Set(values.map(normalizeStoragePath).filter(path=>path.startsWith(allowedPrefix)))];
  }

  function requireClient(sb){
    if(!sb||typeof sb.from!=='function'||!sb.storage)throw new Error('Client Supabase indisponible.');
  }

  function requireCourse(course){
    const id=course&&typeof course.id==='string'?course.id.trim():'';
    if(!id)throw new Error('Identifiant du cours manquant.');
    return id;
  }

  function requireCourseIdentity(course){
    const id=requireCourse(course);
    const teacherId=course&&typeof course.teacher_id==='string'?course.teacher_id.trim():'';
    if(!teacherId)throw new Error('Propriétaire du cours manquant.');
    return {id,teacherId};
  }

  function rowsOrThrow(result,label){
    if(result&&result.error)throw new Error(label+' : '+message(result.error));
    return result&&Array.isArray(result.data)?result.data:[];
  }

  async function loadStoragePaths(sb,course){
    const courseId=requireCourseIdentity(course).id;
    const [sourceResult,importResult,assetResult]=await Promise.all([
      sb.from('course_sources').select('storage_path').eq('course_id',courseId),
      sb.from('course_imports').select('source_pdf_path').eq('course_id',courseId),
      sb.from('course_assets').select('storage_path').eq('course_id',courseId)
    ]);
    return collectStoragePaths(course,{
      sources:rowsOrThrow(sourceResult,'Lecture des ressources impossible'),
      imports:rowsOrThrow(importResult,'Lecture du PDF source impossible'),
      assets:rowsOrThrow(assetResult,'Lecture des médias impossible')
    });
  }

  async function deleteCourse(sb,course){
    requireClient(sb);
    const courseId=requireCourseIdentity(course).id;
    const storagePaths=await loadStoragePaths(sb,course);

    // Toutes les tables enfants possèdent une clé étrangère ON DELETE CASCADE.
    // Une seule suppression du parent garde ainsi l'opération SQL atomique.
    const deletion=await sb.from('courses').delete().eq('id',courseId).select('id').maybeSingle();
    if(deletion&&deletion.error)throw new Error('Suppression du cours impossible : '+message(deletion.error));
    if(!deletion||!deletion.data)throw new Error('Cours introuvable ou droits administrateur insuffisants.');

    const cleanupErrors=[];
    for(let index=0;index<storagePaths.length;index+=DELETE_BATCH_SIZE){
      const batch=storagePaths.slice(index,index+DELETE_BATCH_SIZE);
      try{
        const result=await sb.storage.from(STORAGE_BUCKET).remove(batch);
        if(result&&result.error)cleanupErrors.push(message(result.error));
      }catch(error){cleanupErrors.push(message(error))}
    }
    try{
      const local=await deleteLocalCourseData(sb,courseId);
      if(local&&local.warning)cleanupErrors.push(local.warning);
    }catch(error){cleanupErrors.push('les données locales du cours n’ont pas pu être nettoyées : '+message(error))}
    const warning=cleanupErrors.length?'Le cours est supprimé, mais le nettoyage est incomplet : '+cleanupErrors.join(' ; '):'';
    return {deleted:true,courseId,storagePaths,warning};
  }

  async function deleteLocalCourseData(sb,courseId,fetchImpl){
    if(!sb||!sb.auth||typeof sb.auth.getSession!=='function')return {skipped:true,warning:''};
    const request=fetchImpl||(typeof fetch==='function'?fetch:null);
    if(!request)return {skipped:true,warning:''};
    const sessionResult=await sb.auth.getSession();
    const session=sessionResult&&sessionResult.data&&sessionResult.data.session;
    if(!session||!session.access_token)throw new Error('session administrateur expirée');
    const response=await request('/api/admin/course-local-data',{
      method:'DELETE',
      headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},
      body:JSON.stringify({courseId:requireCourse({id:courseId})})
    });
    const payload=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(payload.error||'nettoyage local refusé');
    return payload;
  }

  async function updateStatus(sb,courseId,status){
    requireClient(sb);
    const id=requireCourse({id:courseId});
    if(!ALLOWED_STATUSES.has(status))throw new Error('Statut de cours invalide.');
    const result=await sb.from('courses').update({status}).eq('id',id).select('id,status').maybeSingle();
    if(result&&result.error)throw new Error('Modification du statut impossible : '+message(result.error));
    if(!result||!result.data)throw new Error('Cours introuvable ou droits administrateur insuffisants.');
    return result.data;
  }

  return {
    STORAGE_BUCKET,
    DELETE_BATCH_SIZE,
    normalizeStoragePath,
    collectStoragePaths,
    loadStoragePaths,
    deleteCourse,
    deleteLocalCourseData,
    updateStatus
  };
});
