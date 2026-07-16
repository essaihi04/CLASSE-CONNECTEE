'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = name => fs.readFileSync(path.join(__dirname,'..','prototype',name),'utf8');
const profSource = read('prof.html');
const playerSource = read('index.html');

test('les scripts classiques de l’éditeur admin restent syntaxiquement valides',()=>{
  const scripts=[...profSource.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(match=>!(/\bsrc\s*=|type\s*=\s*["'](?:module|importmap)/i.test(match[1])))
    .map(match=>match[2]);
  assert.ok(scripts.length>=2);
  scripts.forEach((script,index)=>assert.doesNotThrow(()=>new vm.Script(script,{filename:`prof-inline-${index}.js`})));
});

test('un admin accède aux cours intégrés même sans legacy_access',()=>{
  assert.match(profSource,/function canEditBuiltinLessons\(\)[\s\S]*profile\.legacy_access\|\|isPlatformAdmin\(\)/);
  assert.match(profSource,/if\(!canEditBuiltinLessons\(\) \|\| forcePrivate\) return renderPrivateTeacherHome\(\)/);
});

test('la publication garde le filtre propriétaire pour un professeur normal seulement',()=>{
  assert.match(profSource,/let update=sb\.from\('courses'\)\.update\(\{status:'published'\}\)\.eq\('id',activeImportedCourseId\)/);
  assert.match(profSource,/if\(!isPlatformAdmin\(\)\)update=update\.eq\('teacher_id',teacher\.session\.user\.id\)/);
  assert.match(profSource,/update\.select\('id'\)\.maybeSingle\(\)/);
});

test('un lien admin ouvre explicitement un chapitre intégré, même masqué',()=>{
  assert.match(playerSource,/profile&&profile\.role==='admin'[\s\S]*if\(params\.get\('chapitre'\)\)return profile/);
  assert.match(playerSource,/adminPreview=!!\(accessProfile&&accessProfile\.role==='admin'&&requestedChapter\)/);
  assert.match(playerSource,/!hidden\.has\(c\.id\)\|\|\(adminPreview&&c\.id===requestedChapter\)/);
});

test('une bibliothèque entièrement masquée reste vide et affiche un état dédié',()=>{
  assert.match(playerSource,/window\.LECONS=window\.LECONS\.filter/);
  assert.doesNotMatch(playerSource,/if\(visible\.length\) window\.LECONS=visible/);
  assert.match(playerSource,/if\(!window\.LECONS\.length\)\{showNoAvailableLessons\(\);return;\}/);
  assert.match(playerSource,/function showNoAvailableLessons\(\)/);
});

function protectedLegacyPosts(source){
  const endpoint=/fetch\('\/api\/(?:content|overrides|custom-steps|course-structure|upload)/;
  const lines=source.split(/\r?\n/),snippets=[];
  lines.forEach((line,index)=>{
    if(!endpoint.test(line))return;
    const snippet=lines.slice(index,index+3).join('\n');
    if(/method:'POST'/.test(snippet))snippets.push(snippet);
  });
  return snippets;
}

test('chaque écriture legacy envoie le jeton Supabase',()=>{
  [profSource,playerSource].forEach(source=>{
    const posts=protectedLegacyPosts(source);
    assert.ok(posts.length>0);
    posts.forEach(post=>assert.match(post,/headers:await authorizedApiHeaders\(/));
  });
});
