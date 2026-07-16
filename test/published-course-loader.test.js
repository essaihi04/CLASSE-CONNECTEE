'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { INTRO_LAYOUT, layoutForScene, normalizePresentation, evaluationQuestion, plannedQuizSets, simulationDocument, simulationStateCompleted, stepFromBlock, studentQuestionReturnStep } = require('../prototype/published-course-loader');

test('garde le grand avatar d’introduction entièrement dans le plein écran', () => {
  const avatar=INTRO_LAYOUT.avatar;
  assert.ok(avatar.y>=5);
  assert.ok(avatar.y+avatar.h<=95);
  assert.ok(avatar.x>=0);
  assert.ok(avatar.x+avatar.w<=100);
});

test('réserve la largeur des mains et place chaque avatar entier devant le contenu',()=>{
  const layouts=[INTRO_LAYOUT,layoutForScene('split_left','full'),layoutForScene('split_right','full'),layoutForScene('activity_focus','full'),layoutForScene('question_focus','full'),layoutForScene('summary_focus','full'),layoutForScene('media_focus','full','sim')];
  layouts.forEach(layout=>{
    const avatar=layout.avatar,pixelAspect=(avatar.w*16/9)/avatar.h;
    assert.ok(pixelAspect>=0.79,`cadre trop étroit : ${pixelAspect.toFixed(3)}`);
    const contentZ=Math.max(0,...Object.values(layout.el||{}).map(item=>Number(item&&item.z)||0));
    assert.ok(avatar.z>contentZ,'l’avatar entier doit rester devant le média ou le tableau');
  });
});

test('donne aux simulations leur mise en scène dédiée : simulation seule, avatar entier à côté', () => {
  const source={kind:'simulation',url:'https://example.test/simulation.html',file_name:'simulation.html',mime_type:'text/html'};
  const presentation=normalizePresentation({scene:'activity_focus',avatarSize:'full',mediaPosition:'auto'},'simulation',source,2);
  assert.equal(presentation.scene,'media_focus');
  assert.equal(presentation.mediaPosition,'sim');
  // La simulation remplit le cadre, l'avatar est entier à côté, aucun bloc de texte.
  assert.ok(presentation.layout.el.media.h>=70);
  assert.equal(presentation.layout.avatar.mode,'full');
  assert.equal(presentation.layout.el.body,undefined);
});

test('garde la zone média large pour les vidéos', () => {
  const source={kind:'video',url:'https://example.test/film.mp4',file_name:'film.mp4',mime_type:'video/mp4'};
  const presentation=normalizePresentation(null,'video',source,1);
  assert.equal(presentation.scene,'media_focus');
  assert.equal(presentation.mediaPosition,'wide');
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
  assert.equal(step.studentQuestion,true);
  assert.equal(studentQuestionReturnStep(4),3);
  assert.equal(studentQuestionReturnStep(0),0);
});

test('affiche simultanément l’image pédagogique et son mot, jamais le nom technique du fichier', () => {
  const source={kind:'image',url:'https://example.test/generated-1729.webp',file_name:'generated-1729.webp',mime_type:'image/webp'};
  const step=stepFromBlock({block_type:'image',title:'Le mot mouton',objective:'Nommer le mouton',content:{
    say:'Regarde cette image. Voici un mouton. Dis MOUTON.',board_lines:[{t:'MOUTON',cls:'ex'}],
    image:{caption:'MOUTON',alt:'Un mouton blanc laineux'}
  }},source,'Regarde cette image.',0,1,'Séance',1,0,[]);
  assert.equal(step.board.media.type,'image');
  assert.equal(step.board.media.desc,'MOUTON');
  assert.equal(step.board.media.alt,'Un mouton blanc laineux');
  assert.equal(step.board.lines[0].t,'MOUTON');
  assert.doesNotMatch(step.board.media.desc,/generated-1729/);
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
  assert.equal(step.board.title,'');
  assert.deepEqual(step.board.lines,[]);
  assert.equal(step.pauseForAnswer,true);
});

test('supprime tout texte extérieur même si l’IA en fournit pour une simulation', () => {
  const html='<!doctype html><title>Jeu</title>';
  const step=stepFromBlock({block_type:'simulation',title:'Le panier',objective:'Classer',content:{
    text:'Ce texte ne doit pas apparaître.',say:'Déplace les cartes.',board_lines:[{t:'Texte parasite',cls:'def'}],simulation_html:html
  }},null,'Déplace les cartes.',0,1,'Séance',1,0,[]);
  assert.equal(step.board.title,'');
  assert.deepEqual(step.board.lines,[]);
  assert.equal(Object.hasOwn(step.board,'probleme'),false);
});

test('construit trois évaluations finales avec plusieurs questions différentes', () => {
  const question=n=>({kind:'qcm',question:`Question ${n}`,options:['Oui','Non'],correctIndex:n%2,feedback:`Retour ${n}`});
  const sets=plannedQuizSets([1,2,3].map(set=>({label:`Jeu ${set}`,intro:`Parcours ${set}`,questions:[1,2,3].map(q=>question((set-1)*3+q))})));
  assert.equal(sets.length,3);
  sets.forEach(set=>assert.equal(set.quiz.length,3));
  assert.equal(new Set(sets.flatMap(set=>set.quiz.map(item=>item.q))).size,9);
});

test('reconnaît la fin naturelle d’un glisser-déposer', () => {
  const elements=[{id:'mouton'},{id:'ballon'}],zones=[{id:'panier',accepts:['mouton']},{id:'dehors',accepts:['ballon']}];
  assert.equal(simulationStateCompleted({mode:'drag_drop',state:{mouton:{zoneId:'panier'},ballon:{zoneId:''}}},elements,zones),false);
  assert.equal(simulationStateCompleted({mode:'drag_drop',state:{mouton:{zoneId:'panier'},ballon:{zoneId:'dehors'}}},elements,zones),true);
  assert.equal(simulationStateCompleted({mode:'variable',completed:true},elements,zones),true);
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
