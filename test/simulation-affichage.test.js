'use strict';

// CONTRAT D'AFFICHAGE DES SIMULATIONS (voir CONTRAT-SIMULATION.md)
// Ces tests empêchent de retomber sur le défaut du cours M 1 : une simulation affichée dans
// un cadre de 1220x152 alors que sa scène est en 16:9, donc réduite à 22 % de la largeur,
// entourée de bandes bleues. Toute NOUVELLE simulation doit respecter les mêmes règles.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const prototype = path.join(root, 'prototype');

// Toutes les pages de simulation autonomes du dépôt (sim-*.html, à n'importe quelle profondeur).
function pagesDeSimulation(dossier, trouvees) {
  trouvees = trouvees || [];
  for (const entree of fs.readdirSync(dossier, { withFileTypes: true })) {
    const complet = path.join(dossier, entree.name);
    if (entree.isDirectory()) {
      if (entree.name === 'node_modules' || entree.name === 'uploads') continue;
      pagesDeSimulation(complet, trouvees);
    } else if (/^sim-.*\.html$/i.test(entree.name)) {
      trouvees.push(complet);
    }
  }
  return trouvees;
}

const pages = pagesDeSimulation(prototype);

// Une page peut satisfaire le contrat par elle-même OU via un script qu'elle inclut
// (cc-sim-bridge.js). On lit donc la page ET ses scripts locaux comme un seul ensemble.
function sourceComplete(page) {
  const html = fs.readFileSync(page, 'utf8');
  let total = html;
  const inclusions = html.matchAll(/<script[^>]+src=["']([^"':]+?)["']/gi);
  for (const inclusion of inclusions) {
    const voisin = path.join(path.dirname(page), inclusion[1]);
    if (fs.existsSync(voisin)) total += '\n' + fs.readFileSync(voisin, 'utf8');
  }
  return total;
}

test('des simulations autonomes existent bien (sinon le contrat ne teste rien)', () => {
  assert.ok(pages.length > 0, 'aucune page sim-*.html trouvée');
});

// Les règles 1, 2 et 4 ne sont plus portées fichier par fichier : le serveur injecte le
// script du contrat dans TOUTE page de simulation. On vérifie donc (a) que le contrat les
// garantit réellement, et (b) qu'aucune page ne peut échapper à cette injection.
test('le contrat garantit : pas de défilement, fond transparent, voix déléguée, pilotage', () => {
  const contrat = fs.readFileSync(path.join(prototype, 'cc-sim-contract.js'), 'utf8');
  assert.match(contrat, /html,body\{[^}]*overflow:hidden/, 'règle 1 : le contrat doit interdire le défilement');
  assert.match(contrat, /html,body\{[^}]*height:100%/, 'règle 1 : le contrat doit occuper toute la hauteur');
  assert.match(contrat, /background:transparent/, 'règle 2 : le contrat doit imposer un fond transparent');
  assert.match(contrat, /cc-sim-voice/, 'règle 4 : le contrat doit relayer la voix à l’avatar');
  assert.match(contrat, /speechSynthesis/, 'règle 4 : le contrat doit rendre la simulation muette');
  assert.match(contrat, /window\.CourseSimulation\s*=/, 'règle 4 : le contrat doit exposer le pilotage');
  assert.match(contrat, /'cc-sim'|"cc-sim"/, 'règle 4 : le contrat doit écouter les ordres de l’avatar');
});

test('aucune page de simulation n’échappe à l’injection du contrat', () => {
  const serveur = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  const debut = serveur.indexOf('const CONTRAT_SIMULATION_URL');
  const fin = serveur.indexOf('// ============ GÉNÉRATION DE SIMULATIONS');
  const { estPageDeSimulation } = new Function(serveur.slice(debut, fin) +
    ';return {estPageDeSimulation};')();
  for (const page of pages) {
    const html = fs.readFileSync(page, 'utf8');
    assert.ok(estPageDeSimulation(html, page),
      path.relative(root, page) + ' : non reconnue comme simulation, le contrat ne lui serait pas appliqué');
  }
});

test('règle 3 : une étape de simulation n’affiche ni titre ni ligne', () => {
  const lecons = fs.readFileSync(path.join(prototype, 'lecons.js'), 'utf8');
  const fautifs = [];
  for (const ligne of lecons.split('\n')) {
    if (!/type:'simulation'/.test(ligne)) continue;
    const titre = ligne.match(/board:\{title:"([^"]*)"/);
    if (titre && titre[1].trim()) fautifs.push('titre non vide : « ' + titre[1] + ' »');
    const lignes = ligne.match(/,lines:\[([^\]]*)/);
    if (lignes && lignes[1].trim()) fautifs.push('lignes non vides sur une simulation');
  }
  assert.deepEqual(fautifs, [],
    'la simulation EST le tableau : la consigne est dite par l’avatar (say), pas écrite à côté');
});

test('le tableau étire la simulation quelle que soit la profondeur d’emboîtement', () => {
  const index = fs.readFileSync(path.join(prototype, 'index.html'), 'utf8');
  // Sans cette règle, un div intermédiaire garde sa hauteur auto et écrase l'iframe.
  assert.match(index, /\.board:has\(\.simulation-embedded\)\s+\.content>\*:has\(\.simulation-embedded\)/,
    'index.html : il manque la règle qui étire le conteneur intermédiaire de la simulation');
  assert.match(index, /\.lesson-media\.simulation-embedded iframe\{[^}]*background:transparent/,
    'index.html : l’iframe d’une simulation doit être transparente, sinon elle dessine un cadre clair');
});

test('les simulations générées par l’IA suivent le même contrat', () => {
  const builder = fs.readFileSync(path.join(root, 'simulation-builder.js'), 'utf8');
  assert.match(builder, /html,body\{height:100%;margin:0;overflow:hidden\}/,
    'simulation-builder.js : la page générée doit interdire le défilement');
  assert.match(builder, /body\{background:transparent/,
    'simulation-builder.js : la page générée doit avoir un fond transparent');
});

// APPLICATION AUTOMATIQUE : toute page de simulation servie par le serveur reçoit le script
// du contrat, d'où qu'elle vienne (IA externe, page écrite à la main, fichier déposé).
// L'iframe du tableau étant en sandbox sans allow-same-origin, le parent ne PEUT pas
// injecter après coup : c'est au service du fichier que la règle doit s'appliquer.
test('le serveur applique le contrat à toute simulation, même produite à l’extérieur', () => {
  const serveur = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  const debut = serveur.indexOf('const CONTRAT_SIMULATION_URL');
  const fin = serveur.indexOf('// ============ GÉNÉRATION DE SIMULATIONS');
  assert.ok(debut > 0 && fin > debut, 'server.js : le normaliseur du contrat est introuvable');
  const module = { exports: {} };
  const creer = new Function(serveur.slice(debut, fin) +
    ';return {estPageDeSimulation, appliquerContratSimulation, CONTRAT_SIMULATION_URL};');
  const { estPageDeSimulation, appliquerContratSimulation, CONTRAT_SIMULATION_URL } = creer();

  // reconnaissance
  assert.equal(estPageDeSimulation("<script>parent.postMessage({type:'cc-sim-complete'})</script>", 'x.html'), true);
  assert.equal(estPageDeSimulation('<html><body>page ordinaire</body></html>', 'courses.html'), false);
  assert.equal(estPageDeSimulation('<html></html>', 'dossier/sim-42-jeu.html'), true);

  // le contrat s'installe AVANT le script du jeu, sinon il n'intercepterait pas sa voix
  const page = '<html><body><div class="app"></div><script>var jeu=1;</script></body></html>';
  const normalisee = appliquerContratSimulation(page);
  assert.ok(normalisee.includes(CONTRAT_SIMULATION_URL), 'le script du contrat n’est pas injecté');
  assert.ok(normalisee.indexOf(CONTRAT_SIMULATION_URL) < normalisee.indexOf('var jeu=1'),
    'le contrat doit être injecté avant le script du jeu');

  // le fichier servi doit exister
  assert.ok(fs.existsSync(path.join(prototype, 'cc-sim-contract.js')),
    'prototype/cc-sim-contract.js est introuvable');
});

test('le contrat n’écrase jamais une simulation déjà conforme', () => {
  const contrat = fs.readFileSync(path.join(prototype, 'cc-sim-contract.js'), 'utf8');
  assert.match(contrat, /if\s*\(window\.CourseSimulation\)\s*return/,
    'cc-sim-contract.js doit laisser intact le pilotage métier d’une page déjà conforme');
});

// RÈGLE PÉDAGOGIQUE : ne JAMAIS donner la réponse avant que l'enfant ait manipulé.
// Chaque simulation déclare ses réponses (<meta name="cc-reponses">) et la narration de
// l'avatar (say) doit poser la tâche sans les révéler. Sinon la manipulation ne sert plus
// à rien : l'élève recopie ce qu'il vient d'entendre au lieu de chercher.
test('la narration ne révèle pas les réponses avant la manipulation', () => {
  const lecons = fs.readFileSync(path.join(prototype, 'lecons.js'), 'utf8');
  const fautes = [];
  const sansAccent = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  for (const ligne of lecons.split('\n')) {
    if (!/type:'simulation'/.test(ligne)) continue;
    const source = ligne.match(/src:'([^']*sim-[^']*\.html)'/);
    const say = ligne.match(/say:"(.*?)",board:/);
    if (!source || !say) continue;
    const fichier = path.join(prototype, source[1]);
    if (!fs.existsSync(fichier)) continue;
    const page = fs.readFileSync(fichier, 'utf8');
    const meta = page.match(/<meta\s+name=["']cc-reponses["']\s+content=["']([^"']*)["']/i);
    assert.ok(meta, path.basename(fichier) +
      ' : il manque <meta name="cc-reponses"> (déclare les réponses, vide si rien à deviner)');
    const narration = sansAccent(say[1]);
    // Une réponse peut être un GROUPE de mots (ex. « moto début » = l'association à trouver).
    // Nommer une seule option ne divulgue rien ; il n'y a divulgation que si TOUS les mots
    // du groupe sont prononcés ensemble, car l'élève n'a alors plus rien à chercher.
    for (const brute of meta[1].split(',')) {
      const groupe = brute.trim();
      if (!groupe) continue;
      const mots = sansAccent(groupe).split(/\s+/).filter(Boolean);
      const tousPresents = mots.every((mot) => {
        const echappe = mot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp('(^|[^a-z])' + echappe + '([^a-z]|$)').test(narration);
      });
      if (tousPresents) {
        fautes.push(path.basename(fichier) + ' : la narration donne la réponse « ' + groupe + ' »');
      }
    }
  }
  assert.deepEqual(fautes, [],
    'l’avatar donne la consigne, pas la solution : l’enfant cherche d’abord, on valide ensuite');
});
