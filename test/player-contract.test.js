'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname,'..','prototype','index.html'),'utf8');
const avatarSource = fs.readFileSync(path.join(__dirname,'..','prototype','avatar3d.html'),'utf8');

test('les scripts classiques du lecteur restent syntaxiquement valides', () => {
  const scripts=[...source.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(match=>!(/\bsrc\s*=|type\s*=\s*["'](?:module|importmap)/i.test(match[1])))
    .map(match=>match[2]);
  assert.ok(scripts.length>=2);
  scripts.forEach((script,index)=>assert.doesNotThrow(()=>new vm.Script(script,{filename:`index-inline-${index}.js`})));
});

test('la fin de simulation programme une seule avance de diapositive', () => {
  assert.match(source,/data\.type==='cc-sim-complete'.*scheduleSimulationAdvance\(\)/s);
  assert.match(source,/kind==='success'.*scheduleSimulationAdvance\(\)/s);
  assert.match(source,/simulationAdvanceStep===step&&simulationAdvanceTimer/);
  assert.match(source,/const busy=paused\|\|ttsLoading\|\|avatarSpeaking/);
});

test('une réponse à la question du cours revient à l’explication précédente', () => {
  assert.match(source,/function handleStudentQuestionAnswer\(answerText\)/);
  assert.match(source,/ccStudentQuestionReturnStep\(questionStep\)/);
  assert.match(source,/if\(handleStudentQuestionAnswer\(said\)\)return/);
  assert.match(source,/if\(handleStudentQuestionAnswer\(q\)\)/);
});

test('le cadrage corps entier protège les mains et garde l’avatar au premier plan',()=>{
  assert.match(source,/FULL_AVATAR_MIN_ASPECT=0\.80, FULL_AVATAR_FOREGROUND_Z=9/);
  assert.match(source,/Math\.max\(FULL_AVATAR_FOREGROUND_Z,requestedZ\)/);
  assert.match(avatarSource,/FULL_BODY_HALF_WIDTH=0\.72, FULL_BODY_MARGIN=1\.10/);
});
