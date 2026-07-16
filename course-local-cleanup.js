'use strict';

const COURSE_ID_RE=/^[0-9a-f-]{36}$/i;
const UPLOAD_RE=/\/uploads\/([a-z0-9._-]{1,180})/gi;

function uploadNames(value){
  const names=new Set(),text=JSON.stringify(value==null?null:value);
  let match;
  UPLOAD_RE.lastIndex=0;
  while((match=UPLOAD_RE.exec(text)))names.add(match[1]);
  return names;
}

function planLocalCourseCleanup(courseId,stores){
  const id=String(courseId||'').trim();
  if(!COURSE_ID_RE.test(id))throw new Error('Identifiant de cours invalide.');
  const key='published-'+id,source=stores&&typeof stores==='object'?stores:{};
  const names=new Set(),changed=[];
  for(const name of ['content','customSteps','structure','overrides']){
    const store=source[name]&&typeof source[name]==='object'?source[name]:{};
    source[name]=store;
    if(!Object.prototype.hasOwnProperty.call(store,key))continue;
    uploadNames(store[key]).forEach(file=>names.add(file));
    delete store[key];changed.push(name);
  }
  const stillUsed=new Set();
  uploadNames(source).forEach(file=>stillUsed.add(file));
  return {
    courseId:id,
    key,
    stores:source,
    changed,
    uploadFiles:[...names].filter(file=>!stillUsed.has(file))
  };
}

module.exports={COURSE_ID_RE,uploadNames,planLocalCourseCleanup};
