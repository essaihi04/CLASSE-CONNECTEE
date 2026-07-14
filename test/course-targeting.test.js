'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {GRADE_PROFILES,SUBJECT_PROFILES,getCourseTarget,sanitizeSourceAssessment,assertSourceCompatible,buildTargetPrompt}=require('../course-targeting');

function assignment(subjectCode,subjectName,gradeCode,gradeName){
  return {id:'a1',subjects:{code:subjectCode,name:subjectName},grade_levels:{code:gradeCode,name:gradeName},study_streams:null};
}

test('distingue chaque année du primaire',()=>{
  const first=getCourseTarget(assignment('maths','Mathématiques','1apep','1re année primaire'));
  const second=getCourseTarget(assignment('maths','Mathématiques','2apep','2e année primaire'));
  assert.equal(first.cycle,'Primaire');
  assert.equal(second.cycle,'Primaire');
  assert.notEqual(first.gradeRules,second.gradeRules);
  assert.match(first.gradeRules,/phrases très courtes/i);
  assert.match(second.gradeRules,/lecture débutante/i);
  const primaryCodes=['1apep','2apep','3apep','4apep','5apep','6apep'];
  assert.deepEqual(primaryCodes.filter(code=>!GRADE_PROFILES[code]),[]);
  assert.equal(new Set(primaryCodes.map(code=>GRADE_PROFILES[code].rules)).size,primaryCodes.length);
});

test('applique une pédagogie différente selon la matière',()=>{
  const science=getCourseTarget(assignment('svt','SVT','3apic','3e année collège'));
  const history=getCourseTarget(assignment('histoire_geo','Histoire-Géographie','3apic','3e année collège'));
  const religion=getCourseTarget(assignment('education_islamique','Éducation islamique','3apic','3e année collège'));
  assert.notEqual(science.disciplineFamily,history.disciplineFamily);
  assert.notEqual(history.disciplineFamily,religion.disciplineFamily);
  assert.match(buildTargetPrompt(science),/faits et interprétations/i);
  assert.match(buildTargetPrompt(history),/chronologie/i);
  assert.match(buildTargetPrompt(religion),/textes et références/i);
  const catalogCodes=['arabe','amazighe','francais','anglais','espagnol','allemand','education_islamique','education_civique','maths','svt','pc','sciences_activite','histoire_geo','philosophie','informatique','technologie','economie_gestion','comptabilite','droit','education_physique','arts_plastiques','education_musicale'];
  assert.deepEqual(catalogCodes.filter(code=>!SUBJECT_PROFILES[code]),[]);
});

test('bloque une matière ou une année incompatible',()=>{
  const target=getCourseTarget(assignment('maths','Mathématiques','1apep','1re année primaire'));
  const assessment=sanitizeSourceAssessment({detectedSubject:'Histoire',detectedCycle:'Primaire',detectedGradeLevel:'2e année primaire',subjectMatch:'mismatch',gradeLevelMatch:'mismatch'});
  assert.throws(()=>assertSourceCompatible(assessment,target),error=>error.status===422&&/Import bloqué/.test(error.message));
});

test('autorise une source imprécise pour adaptation contrôlée',()=>{
  const target=getCourseTarget(assignment('francais','Français','4apep','4e année primaire'));
  const assessment=sanitizeSourceAssessment({subjectMatch:'match',gradeLevelMatch:'uncertain'});
  assert.doesNotThrow(()=>assertSourceCompatible(assessment,target));
});
