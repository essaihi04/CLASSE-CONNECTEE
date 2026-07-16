'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { INTRO_LAYOUT, normalizePresentation, evaluationQuestion, simulationDocument, stepFromBlock } = require('../prototype/published-course-loader');

test('garde le grand avatar d’introduction entièrement dans le plein écran', () => {
  const avatar=INTRO_LAYOUT.avatar;
  assert.ok(avatar.y>=5);
  assert.ok(avatar.y+avatar.h<=95);
  assert.ok(avatar.x>=0);
  assert.ok(avatar.x+avatar.w<=100);
});

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

test('sépare le script oral (say) de la trace écrite (board_lines)', () => {
  const step=stepFromBlock({block_type:'text',title:'Le son de M',objective:'Produire le son [m]',content:{
    text:'M fait le son [m], un son continu.',
    say:'Regarde le gâteau. Dis « Mmmm ! C’est bon ! ». Ferme tes lèvres et fais durer le son : mmmm. Tu vois au tableau : M fait mmmm, pas émé.',
    board_lines:[{t:'M fait [m] — « mmmm »',cls:'def'},{t:'mouton · moto · pyjama',cls:'ex'},{t:'M ne fait pas « émé »',cls:'imp'}]
  }},null,'Regarde le gâteau. Dis « Mmmm ! C’est bon ! ». Ferme tes lèvres et fais durer le son : mmmm. Tu vois au tableau : M fait mmmm, pas émé.',0,1,'Séance',1,0,[]);
  // La voix prononce le script oral tel quel, sans re-préfixer le titre.
  assert.match(step.say,/^Regarde le gâteau/);
  assert.doesNotMatch(step.say,/^Le son de M\./);
  // Le tableau montre la trace écrite structurée, pas la parole recopiée.
  assert.equal(step.board.lines.length,3);
  assert.equal(step.board.lines[0].cls,'def');
  assert.match(step.board.lines[0].t,/M fait \[m\]/);
  assert.doesNotMatch(step.board.lines.map(l=>l.t).join(' '),/Regarde le gâteau/);
});

test('retombe sur l’ancien texte unique quand say/board_lines sont absents', () => {
  const step=stepFromBlock({block_type:'text',title:'Le son de M',objective:'',content:{text:'M fait le son [m].'}},null,'M fait le son [m].',0,1,'Séance',1,0,[]);
  assert.match(step.say,/^Le son de M\. M fait le son \[m\]\./);
  assert.equal(step.board.lines[0].cls,'def');
});

test('affiche la question écrite au tableau, pas le script parlé', () => {
  const step=stepFromBlock({block_type:'question',title:'Où est [m] ?',objective:'Localiser le son',content:{
    text:'Où entends-tu [m] dans PLUME ?',
    say:'Écoute bien : pluuume. Où entends-tu mmm ? Au début, au milieu ou à la fin ? Montre au tableau.',
    board_lines:[{t:'PLUME : où est [m] ?',cls:''}]
  }},null,'Écoute bien : pluuume.',0,1,'Séance',1,0,[]);
  assert.equal(step.board.probleme,'PLUME : où est [m] ?');
  assert.match(step.say,/^Écoute bien/);
});

test('conserve les SVG générés pour un mini-jeu visuel', () => {
  const item=evaluationQuestion({kind:'qcm',question:'Choisis le mouton.',questionSvg:'<svg viewBox="0 0 100 100"></svg>',options:['mouton','ballon'],optionSvgs:['<svg viewBox="0 0 100 100"></svg>',''],correctIndex:0},'');
  assert.equal(item.type,'qcm');
  assert.equal(item.optionSvgs.length,2);
  assert.match(item.svg,/^<svg/);
});

test('donne la priorité à la simulation inline même si une ressource distante existe', () => {
  const html='<!doctype html><title>Jeu</title>';
  const source={kind:'simulation',url:'https://example.test/simulation.html',file_name:'simulation.html',mime_type:'text/html'};
  const step=stepFromBlock({block_type:'simulation',title:'Le panier',objective:'Classer',content:{simulation_html:html,presentation:{scene:'activity_focus',avatarSize:'full'}}},source,'Glisse les images.',0,1,'Séance',1,0,[]);
  assert.equal(step.board.media.type,'simulation');
  assert.equal(step.board.media.srcdoc,html);
  assert.equal(step.board.media.src,undefined);
});

test('répare une ancienne simulation dont toute la page HTML est encodée', () => {
  const encoded='&lt;!doctype html&gt;&lt;html&gt;&lt;title&gt;Jeu &amp; sons&lt;/title&gt;&lt;/html&gt;';
  assert.equal(simulationDocument(encoded),'<!doctype html><html><title>Jeu & sons</title></html>');
});

test('ajoute une surface de saisie aux anciens SVG déplaçables sans republier le cours', () => {
  const legacy='<!doctype html><html><body><svg id="scene"><g data-element="mouton" class="draggable"></g></svg><script>window.CourseSimulation={};const marker="data-element";</script></body></html>';
  const upgraded=simulationDocument(legacy);
  assert.match(upgraded,/id="ccLegacyDragPatch"/);
  assert.match(upgraded,/pointer-events/);
  assert.match(upgraded,/drag-hit/);
});
