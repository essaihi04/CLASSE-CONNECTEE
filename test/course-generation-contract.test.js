'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
const importer=fs.readFileSync(path.join(root,'prototype','course-import.js'),'utf8');

test('la création primaire exige le couple image et mot écrit',()=>{
  assert.match(server,/chaque mot concret important[^\n]+doit donc avoir un bloc image/i);
  assert.match(server,/même écran doit montrer son illustration ET le mot écrit/i);
});

// Le studio ne fabrique plus aucune image : l'IA décrit les visuels (imagePrompt), le
// professeur importe lui-même sa ressource dédiée à chaque emplacement.
test('l’import ne génère aucune image et propose un emplacement par prompt',()=>{
  assert.doesNotMatch(importer,/generateMissingImages|generateMissingSimulations/);
  assert.doesNotMatch(importer,/\/api\/generate-course-image/);
  assert.match(importer,/function promptSlots\(block\)/);
  assert.match(importer,/renderPromptSlots/);
  // La simulation est assemblée à partir des images IMPORTÉES, jamais générées.
  assert.match(importer,/noAiImages:true/);
  assert.match(server,/const noAiImages=data\.noAiImages===true/);
});

test('seuls les vrais blocs question attendent une réponse de l’élève',()=>{
  assert.match(server,/SEUL un bloc de type "question" pose[^\n]+attend sa réponse/i);
});

test('la création impose trois évaluations finales de plusieurs questions uniques',()=>{
  assert.match(server,/evaluationSets avec EXACTEMENT 3 évaluations finales/i);
  assert.match(server,/questions\.length<3/);
  assert.match(server,/sets\.length!==3/);
});

test('le contrat IA interdit toute trace écrite extérieure à une simulation',()=>{
  assert.match(server,/EXCEPTION SIMULATION : board vaut toujours \[\]/i);
});
