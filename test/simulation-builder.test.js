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
  assert.match(html, /cc-sim-complete/);
  assert.match(html, /id="finish"/);
  assert.match(html, /m\.action==='finish'/);
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
  assert.match(html, /if\(complete\)publishComplete\(\)/);
  assert.match(html, /completed:naturalComplete\(\)/);
  assert.match(html, /actions:S\.interactionType===/);
});

test('délègue la voix à l’avatar : mot au toucher et retours envoyés au parent', () => {
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
  // Intégrée au cours, la simulation est muette : elle poste cc-sim-voice au parent.
  assert.match(html, /cc-sim-voice/);
  assert.match(html, /"word":"mouton"/);
  assert.match(html, /voice\('word',frSeul\(el\.word\)/);
  // Un caractère isolé serait lu en anglais par le TTS : il est annoncé en français.
  assert.match(html, /'la lettre '\+t/);
  // Le retour d'erreur transporte de quoi corriger : tentative et zone correcte.
  assert.match(html, /'retry',\{elementId/);
  assert.match(html, /correctZoneId/);
  assert.match(html, /'success':'progress'/);
  // Le parent peut placer un objet SANS re-déclencher de voix (correction par l'avatar).
  assert.match(html, /m\.quiet===true/);
  // Hors iframe (page ouverte seule), la voix du navigateur reste en repli.
  assert.match(html, /speechSynthesis/);
  assert.match(html, /fr-FR/);
});

test('mode tableau : seulement le titre et la scène, sans défilement ni panneaux de texte', () => {
  const html = buildSimulationHtml({
    title:'Le panier du son m',
    spec:{
      interactionType:'drag_drop',variables:[],rules:[],
      elements:[{id:'mouton',label:'mouton',x:5,y:8,width:18,height:18,draggable:true,svg:''}],
      zones:[{id:'panier',label:'panier',x:58,y:8,width:30,height:25,accepts:['mouton'],svg:''}]
    }
  });
  assert.match(html, /html,body\{height:100%;margin:0;overflow:hidden\}/);
  assert.doesNotMatch(html, /Consigne<\/h2>|Objectif<\/h2>|À toi de conclure|Retour<\/h2>/);
  assert.doesNotMatch(html, /requestFullscreen/);
  // La consigne reste accessible aux lecteurs d'écran sur la scène.
  assert.match(html, /aria-label',S\.enonce/);
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

// STUDIO SANS GÉNÉRATION : le professeur importe lui-même l'image de chaque carte. Les ids
// de la spec doivent rester stables (le client indexe importedImages par id) et une carte
// sans image importée doit retomber proprement sur son SVG, sans casser la page.
test('les images importées par le professeur sont intégrées, les cartes vides retombent sur le SVG',()=>{
  const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const spec=sanitizeSimulationSpec({
    interactionType:'drag_drop',enonce:'Mets les mots avec [m] dans le panier',goal:'trier',
    variables:[],rules:[],
    elements:[{id:'mouton',label:'mouton',word:'mouton',imagePrompt:'un mouton blanc',draggable:true},
              {id:'ballon',label:'ballon',word:'ballon',imagePrompt:'un ballon',draggable:true}],
    zones:[{id:'panier',label:'panier',imagePrompt:'un panier en osier',accepts:['mouton']}]
  });
  assert.deepEqual(spec.elements.map(item=>item.id),['mouton','ballon']);
  assert.deepEqual(spec.zones.map(item=>item.id),['panier']);
  const html=buildSimulationHtml({title:'Le panier',targetLabel:'CP',spec,imageDataUrl:'',cardImages:{mouton:png,panier:png}});
  assert.equal((html.match(/iVBORw0KGgo/g)||[]).length,2);
  assert.match(html,/ballon/);
});

// GEOMETRIE : la scene est une grille fixe 100x70 et le libelle est ecrit SOUS l'objet.
// Quelles que soient les coordonnees produites par l'IA, rien ne doit sortir du cadre ni se
// chevaucher — mais un placement deja correct doit etre respecte tel quel.
test('la scene garantit le cadrage et le non-chevauchement des objets',()=>{
  const overlap=(a,b)=>!(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y);
  const audit=spec=>{
    const boxes=[...spec.zones,...spec.elements];
    boxes.forEach(item=>{
      assert.ok(item.x>=0&&item.x+item.width<=100,`${item.id} sort horizontalement`);
      assert.ok(item.y>=0&&item.y+item.height<=65,`${item.id} sort verticalement (place du libelle)`);
    });
    for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)
      assert.ok(!overlap(boxes[i],boxes[j]),`${boxes[i].id} chevauche ${boxes[j].id}`);
  };
  // L'IA empile tout au meme endroit
  audit(sanitizeSimulationSpec({interactionType:'drag_drop',enonce:'e',goal:'g',variables:[],rules:[],
    elements:[{id:'mouton',x:10,y:10,width:20,height:20,draggable:true},
              {id:'moto',x:12,y:11,width:20,height:20,draggable:true},
              {id:'ballon',x:14,y:12,width:20,height:20,draggable:true}],
    zones:[{id:'panier',x:15,y:12,width:25,height:25,accepts:['mouton']}]}));
  // L'IA deborde du cadre
  audit(sanitizeSimulationSpec({interactionType:'drag_drop',enonce:'e',goal:'g',variables:[],rules:[],
    elements:[{id:'a',x:95,y:65,width:30,height:30,draggable:true},
              {id:'b',x:-10,y:-5,width:20,height:20,draggable:true}],
    zones:[{id:'z',x:80,y:60,width:30,height:30,accepts:['a']}]}));
  // Un placement deja correct n'est pas touche
  const propre=sanitizeSimulationSpec({interactionType:'drag_drop',enonce:'e',goal:'g',variables:[],rules:[],
    elements:[{id:'a',x:5,y:5,width:18,height:18,draggable:true},
              {id:'b',x:30,y:5,width:18,height:18,draggable:true}],
    zones:[{id:'z',x:5,y:40,width:22,height:20,accepts:['a']}]});
  audit(propre);
  assert.deepEqual(propre.elements.map(e=>[e.x,e.y]),[[5,5],[30,5]]);
  assert.deepEqual(propre.zones.map(z=>[z.x,z.y]),[[5,40]]);
});

// Le pointeur doit etre converti par la matrice reelle du SVG : avec un simple rapport de
// largeur, la scene 100x70 centree dans un cadre plus large decalait le doigt de ~24 unites.
test('le pointeur est converti par la matrice SVG, pas par un rapport de largeur',()=>{
  const spec=sanitizeSimulationSpec({interactionType:'drag_drop',enonce:'e',goal:'g',variables:[],rules:[],
    elements:[{id:'a',x:5,y:5,width:18,height:18,draggable:true}],
    zones:[{id:'z',x:5,y:40,width:22,height:20,accepts:['a']}]});
  const html=buildSimulationHtml({title:'T',targetLabel:'CP',spec,imageDataUrl:'',cardImages:{}});
  assert.match(html,/getScreenCTM/);
  assert.match(html,/matrixTransform/);
});

