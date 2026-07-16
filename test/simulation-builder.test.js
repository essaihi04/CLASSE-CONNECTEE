'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeSimulationSpec, sanitizeSvgAsset, buildSimulationHtml } = require('../simulation-builder');

test('borne la simulation à trois variables et supprime les champs exécutables', () => {
  const spec = sanitizeSimulationSpec({
    enonce: '<script>alert(1)</script> Observer',
    variables: [
      { name:'Température', min:0, max:100, initial:20 },
      { name:'Temps', min:0, max:60, initial:5 },
      { name:'Quantité', min:1, max:10, initial:3 },
      { name:'Variable en trop', min:0, max:1 }
    ],
    elements:[{id:'x',shape:'rect',bindVariable:'Variable inconnue',onclick:'attaque()'}]
  });
  assert.equal(spec.variables.length, 3);
  assert.equal(spec.elements[0].bindVariable, '');
  assert.doesNotMatch(spec.enonce, /[<>]/);
  assert.equal(Object.hasOwn(spec.elements[0], 'onclick'), false);
});

test('produit une page autonome avec le contrat de pilotage IA', () => {
  const html = buildSimulationHtml({
    title:'Effet de la température',
    targetLabel:'Sciences · 5e primaire',
    spec:{
      enonce:'Fais varier la température.',
      goal:'Observer la relation.',
      variables:[{name:'Température',unit:'°C',min:0,max:50,step:1,initial:20}],
      rules:[{variable:'Température',operator:'gte',threshold:30,observation:'La valeur est élevée.'}]
    }
  });
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /window\.CourseSimulation/);
  assert.match(html, /cc-sim-state/);
  assert.match(html, /m\.type==='cc-sim'/);
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /fetch\(|XMLHttpRequest|WebSocket/);
});

test('refuse une simulation sans variable manipulable', () => {
  assert.throws(() => buildSimulationHtml({ spec:{ enonce:'Observer seulement.' } }), /variable manipulable/);
});

test('construit une activité de glisser-déposer SVG sans variable numérique', () => {
  const html = buildSimulationHtml({
    title:'Le panier du son m',
    targetLabel:'Français · 1re année primaire',
    spec:{
      interactionType:'drag_drop',
      enonce:'Déplace les images dans le panier ou dehors.',
      goal:'Reconnaître le son m.',
      successMessage:'Bravo !',
      retryMessage:'Écoute encore.',
      variables:[], rules:[],
      elements:[
        {id:'mouton',label:'mouton',x:5,y:8,width:18,height:18,color:'#f59e0b',draggable:true,svg:'<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="#ffffff"/></svg>'},
        {id:'pyjama',label:'pyjama',x:5,y:35,width:18,height:18,color:'#2563eb',draggable:true,svg:'<svg viewBox="0 0 100 100"><path d="M20 10 L80 10 L70 90 L30 90 Z" fill="#2563eb"/></svg>'}
      ],
      zones:[
        {id:'panier',label:'panier',x:58,y:8,width:30,height:25,color:'#16a34a',accepts:['mouton','pyjama'],svg:'<svg viewBox="0 0 100 100"><path d="M10 30 L90 30 L80 90 L20 90 Z" fill="#b45309"/></svg>'},
        {id:'dehors',label:'dehors',x:58,y:40,width:30,height:20,color:'#64748b',accepts:[],svg:''}
      ]
    }
  });
  assert.match(html, /Le panier du son m/);
  assert.match(html, /mouton/);
  assert.match(html, /drag_drop/);
  assert.match(html, /class:'drag-hit'/);
  assert.match(html, /pointer-events:all/);
  assert.match(html, /placeInZone/);
  assert.match(html, /actions:S\.interactionType===/);
});

test('prononce le mot d’un objet au toucher et lit les retours à voix haute', () => {
  const html = buildSimulationHtml({
    title:'Le panier du son m',
    spec:{
      interactionType:'drag_drop',
      enonce:'Écoute chaque mot, puis mets dans le panier ceux qui contiennent [m].',
      variables:[], rules:[],
      elements:[{id:'mouton',label:'mouton',word:'mouton',x:5,y:8,width:18,height:18,draggable:true,svg:''}],
      zones:[{id:'panier',label:'panier',x:58,y:8,width:30,height:25,accepts:['mouton'],svg:''}]
    }
  });
  assert.match(html, /speechSynthesis/);
  assert.match(html, /fr-FR/);
  assert.match(html, /"word":"mouton"/);
  assert.match(html, /if\(el\.word\)speakWord\(el\.word\)/);
  assert.match(html, /Touche un objet pour entendre son mot/);
  // Les retours bravo/réessaie sont lus pour les non-lecteurs.
  assert.match(html, /,false,true\)/);
  assert.match(html, /,true,true\)/);
});

test('affiche une vraie carte-image quand le serveur en fournit une, avec repli SVG sinon', () => {
  const spec={
    interactionType:'drag_drop',
    enonce:'Mets dans le panier les mots où tu entends [m].',
    variables:[], rules:[],
    elements:[
      {id:'mouton',label:'mouton',word:'mouton',imagePrompt:'un mouton blanc laineux, dessin plat enfantin',x:5,y:8,width:20,height:20,draggable:true,svg:'<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="#ffffff"/></svg>'},
      {id:'ballon',label:'ballon',word:'ballon',imagePrompt:'',x:5,y:34,width:20,height:20,draggable:true,svg:'<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="#f59e0b"/></svg>'}
    ],
    zones:[{id:'panier',label:'panier',imagePrompt:'un panier en osier',x:58,y:8,width:30,height:25,accepts:['mouton'],svg:''}]
  };
  const clean=sanitizeSimulationSpec(spec);
  assert.match(clean.elements[0].imagePrompt,/mouton blanc/);
  assert.match(clean.zones[0].imagePrompt,/panier en osier/);
  const html=buildSimulationHtml({title:'Le panier de [m]',spec,cardImages:{
    mouton:'data:image/webp;base64,AAAA',
    panier:'data:image/webp;base64,BBBB',
    ballon:'https://evil.test/x.png'
  }});
  // L'image validée est intégrée ; l'URL externe est rejetée (repli SVG).
  assert.match(html,/"id":"mouton"[^}]*"image":"data:image\/webp;base64,AAAA"/);
  assert.match(html,/"id":"panier"[^}]*"image":"data:image\/webp;base64,BBBB"/);
  assert.match(html,/"id":"ballon"[^}]*"image":""/);
  assert.match(html,/function cardArt/);
  assert.match(html,/cardArt\(el,/);
  assert.match(html,/cardArt\(zone,/);
});

test('garde un objet muet quand aucun mot n’est fourni', () => {
  const spec=sanitizeSimulationSpec({
    interactionType:'drag_drop',variables:[],rules:[],
    elements:[{id:'ballon',label:'ballon',x:4,y:6,width:20,height:20,draggable:true,word:' ballon '}],
    zones:[{id:'panier',label:'Panier',x:60,y:8,width:30,height:30,accepts:['ballon']}]
  });
  assert.equal(spec.elements[0].word,'ballon');
  const silent=sanitizeSimulationSpec({interactionType:'drag_drop',variables:[],rules:[],elements:[{id:'x',draggable:true}],zones:[{id:'z',accepts:['x']}]});
  assert.equal(silent.elements[0].word,'');
});

test('rend déplaçable un objet de glisser-déposer même si l’IA l’a marqué inerte', () => {
  const spec=sanitizeSimulationSpec({
    interactionType:'drag_drop',variables:[],rules:[],
    elements:[{id:'mouton',label:'Mouton',x:4,y:6,width:20,height:20,draggable:false}],
    zones:[{id:'panier',label:'Panier',x:60,y:8,width:30,height:30,accepts:['mouton']}]
  });
  assert.equal(spec.elements[0].draggable,true);
});

test('filtre strictement les SVG proposés par l’IA', () => {
  const svg = sanitizeSvgAsset('<svg viewBox="0 0 100 100" onload="alert(1)"><script>alert(2)</script><image href="https://evil.test/x"/><path d="M0 0 L100 100" fill="#123456" onclick="alert(3)"/></svg>');
  assert.match(svg, /^<svg viewBox="0 0 100 100">/);
  assert.match(svg, /<path d="M0 0 L100 100" fill="#123456"\/>/);
  assert.doesNotMatch(svg, /script|onload|onclick|href|image|alert/i);
});

test('refuse un glisser-déposer sans objet mobile ni zone cible', () => {
  assert.throws(() => buildSimulationHtml({spec:{interactionType:'drag_drop',variables:[],elements:[],zones:[]}}), /objets mobiles et des zones-cibles/);
});
