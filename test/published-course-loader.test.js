'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizePresentation, evaluationQuestion, stepFromBlock } = require('../prototype/published-course-loader');

test('réserve une vraie zone média aux simulations même si l’IA demande activity_focus', () => {
  const source={kind:'simulation',url:'https://example.test/simulation.html',file_name:'simulation.html',mime_type:'text/html'};
  const presentation=normalizePresentation({scene:'activity_focus',avatarSize:'full',mediaPosition:'auto'},'simulation',source,2);
  assert.equal(presentation.scene,'media_focus');
  assert.equal(presentation.mediaPosition,'wide');
  assert.ok(presentation.layout.el.media.h>=60);
});

test('distingue une question formative d’une vraie situation-problème', () => {
  const formative=stepFromBlock({block_type:'question',title:'À toi de répondre',objective:'Vérifier la compréhension',content:{}},null,'Entends-tu le son ?',0,1,'Séance',1,0,[]);
  assert.equal(formative.board.problemeTag,'Question à la classe');
  assert.equal(formative.phase,'structuration');

  const problem=stepFromBlock({block_type:'question',title:'Situation-problème',objective:'Chercher',content:{}},null,'Comment le découvrir ?',0,1,'Séance',1,0,[]);
  assert.equal(problem.board.problemeTag,'Situation-problème');
  assert.equal(problem.phase,'probleme');
});

test('remplace un titre vague répété par l’objectif précis de la fiche', () => {
  const step=stepFromBlock({block_type:'text',title:"J'écoute",objective:'Produire le son [m]',content:{}},null,'Ferme les lèvres et fais mmmm.',0,1,'Séance',1,0,[]);
  assert.equal(step.board.title,'Produire le son [m]');
  assert.doesNotMatch(step.say,/J'écoute/i);
});

test('conserve les SVG générés pour un mini-jeu visuel', () => {
  const item=evaluationQuestion({kind:'qcm',question:'Choisis le mouton.',questionSvg:'<svg viewBox="0 0 100 100"></svg>',options:['mouton','ballon'],optionSvgs:['<svg viewBox="0 0 100 100"></svg>',''],correctIndex:0},'');
  assert.equal(item.type,'qcm');
  assert.equal(item.optionSvgs.length,2);
  assert.match(item.svg,/^<svg/);
});

test('utilise une simulation inline si la ressource distante manque', () => {
  const html='<!doctype html><title>Jeu</title>';
  const step=stepFromBlock({block_type:'simulation',title:'Le panier',objective:'Classer',content:{simulation_html:html,presentation:{scene:'activity_focus',avatarSize:'full'}}},null,'Glisse les images.',0,1,'Séance',1,0,[]);
  assert.equal(step.board.media.type,'simulation');
  assert.equal(step.board.media.srcdoc,html);
});
