'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');

test('les scripts du tableau admin restent syntaxiquement valides',()=>{
  const html=read('prototype/admin.html');
  const scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(match=>!(/\bsrc\s*=/i.test(match[1])))
    .map(match=>match[2]);
  assert.ok(scripts.length>=2);
  scripts.forEach((script,index)=>assert.doesNotThrow(()=>new vm.Script(script,{filename:`admin-inline-${index}.js`})));
});

test('le tableau admin expose toutes les actions des cours Supabase',()=>{
  const html=read('prototype/admin.html');
  assert.match(html,/from\('courses'\)[\s\S]*?order\('updated_at'/);
  assert.doesNotMatch(html,/from\('courses'\)[\s\S]{0,300}?\.eq\('status','published'\)/);
  assert.match(html,/data-course-action="status"/);
  assert.match(html,/data-course-action="delete"/);
  assert.match(html,/prof\.html\?course=.*?&boards=1/);
  assert.match(html,/manager\.deleteCourse/);
  assert.match(html,/manager\.updateStatus/);
});

test('les cours prédéfinis restent administrables même lorsqu’ils sont retirés',()=>{
  const html=read('prototype/admin.html');
  assert.match(html,/<script src="lecons\.js"><\/script>/);
  assert.match(html,/id="defaultCourseRows"/);
  assert.match(html,/state\.hiddenDefaults/);
  assert.match(html,/data-default-action="\$\{isHidden\?'restore':'hide'\}"/);
  assert.match(html,/prof\.html\?chapitre=/);
  assert.match(html,/index\.html\?chapitre=.*?&admin=1/);
  assert.match(html,/Authorization:'Bearer '\+session\.access_token/);
});

test('les mutations historiques sont protégées côté serveur',()=>{
  const server=read('server.js');
  assert.match(server,/profile\.role===['"]admin['"]\)return \{ user, profile, access:['"]admin['"]/);
  assert.match(server,/profile\.legacy_access===true\)return \{ user, profile, access:['"]legacy['"]/);
  assert.match(server,/scope\.access===['"]legacy['"] && publishedKey/);
  for(const name of ['Upload','ContentPost','CustomStepsPost','StructurePost','OverridesPost']){
    assert.match(server,new RegExp('handleAuthorized'+name+'=withLegacyCourseMutationAuth'));
  }
});

test('un professeur standard reste limité à son propre cours importé',()=>{
  const server=read('server.js'),prof=read('prototype/prof.html'),player=read('prototype/index.html');
  assert.match(server,/req\.headers\[['"]x-course-id['"]\]/);
  assert.match(server,/teacher_id:'eq\.'\+user\.id/);
  assert.match(server,/scope\.access===['"]owner['"] && key!==['"]published-['"]\+scope\.courseId/);
  assert.match(prof,/headers\[['"]X-Course-Id['"]\]=activeImportedCourseId/);
  assert.match(player,/headers\[['"]X-Course-Id['"]\]=REQUESTED_PUBLISHED_COURSE/);
});

test('la suppression admin nettoie aussi les données locales et leurs uploads orphelins',()=>{
  const server=read('server.js'),manager=read('prototype/admin-course-manager.js');
  assert.match(server,/DELETE['"] && req\.url\.split\('\?'\)\[0\] === ['"]\/api\/admin\/course-local-data/);
  assert.match(server,/planLocalCourseCleanup\(courseId,stores\)/);
  assert.match(server,/verifyAdminUser\(req\)/);
  assert.match(manager,/deleteLocalCourseData\(sb,courseId\)/);
});
