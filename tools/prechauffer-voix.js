#!/usr/bin/env node
/* =====================================================================================
   PRÉ-GÉNÉRATION DES VOIX D'UN CHAPITRE — « on génère tout une fois, puis plus jamais »
   -------------------------------------------------------------------------------------
   Le serveur met déjà chaque voix en cache (disque .tts-cache + bucket Supabase partagé),
   mais ce cache ne se remplit qu'AU FIL de la lecture : la toute première fois qu'une
   phrase est prononcée, l'élève attend la synthèse — et si le quota Gemini est épuisé à
   cet instant, la phrase bascule sur la voix du navigateur (autre timbre).
   Ce script remplit le cache À L'AVANCE, hors classe :
     • il rassemble TOUT ce qui est dit dans le chapitre — narration des étapes ET phrases
       des simulations (mots prononcés au toucher, encouragements, reprises, félicitations) ;
     • il demande chaque phrase à /api/tts, exactement comme le ferait le navigateur, donc
       le serveur la range dans ses caches ;
     • sur quota Gemini épuisé, il ATTEND et recommence — indéfiniment, sans jamais se
       rabattre sur une autre voix. À la fin, tout le chapitre est en cache, en voix Gemini.
   Relancer le script est sans effet ni coût : ce qui est déjà en cache est resservi.

   Usage :  node tools/prechauffer-voix.js [--base http://localhost:3000] [--chapitre son-m-nouveau]
            node tools/prechauffer-voix.js --lister      (affiche les phrases, ne génère rien)
            node tools/prechauffer-voix.js --verifier    (dit ce qui est en cache et ce qui manque)
            node tools/prechauffer-voix.js --exporter <dossier> [--manquantes]  (textes à faire enregistrer ailleurs)
            node tools/prechauffer-voix.js --importer <dossier> [--voix <nom>]  (installe les audios reçus)
   ===================================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const opt = (nom, defaut) => { const i = args.indexOf('--' + nom); return i >= 0 && args[i + 1] ? args[i + 1] : defaut; };
const BASE = opt('base', 'http://localhost:3000').replace(/\/+$/, '');
const CHAPITRE = opt('chapitre', 'son-m-nouveau');

/* ---------------------------------------------------------------------------------
   1. La narration des étapes — lue dans lecons.js tel quel (le fichier expose
   window.LECONS), puis corrigée par les réécritures du professeur, comme le fait
   effSay() dans index.html. On ne duplique donc aucun texte à la main.
   --------------------------------------------------------------------------------- */
function chargerChapitre(id) {
  const source = fs.readFileSync(path.join(ROOT, 'prototype', 'lecons.js'), 'utf8');
  const sandbox = { window: {}, document: { addEventListener() {} } };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'lecons.js' });
  const lecons = sandbox.window.LECONS || [];
  const chapitre = lecons.find(l => l && l.id === id);
  if (!chapitre) throw new Error(`chapitre « ${id} » introuvable dans lecons.js`);
  return chapitre;
}
function reecrituresProf(id) {
  try { return (JSON.parse(fs.readFileSync(path.join(ROOT, 'lesson_overrides.json'), 'utf8')) || {})[id] || {}; }
  catch (e) { return {}; }
}
function phrasesDuChapitre(chapitre) {
  const ov = reecrituresProf(chapitre.id), textes = [];
  (chapitre.etapes || []).forEach((etape, n) => {
    const o = ov[String(n)] || {};
    textes.push('say' in o ? o.say : etape.say);
    // carrousel d'images : chaque diapo a sa propre phrase (cf. speakStepNarration)
    const slides = o.mediaSlides || (etape.board && etape.board.mediaSlides) || [];
    slides.forEach(s => textes.push(s && s.say));
    if (etape.reveal) textes.push(etape.reveal.say);
    if (etape.redire) textes.push(etape.redire.say);
  });
  return textes;
}

/* ---------------------------------------------------------------------------------
   2. Les phrases des SIMULATIONS. Les simulations sont muettes : elles envoient leur
   texte à l'avatar, qui le prononce avec la voix du cours — ces phrases passent donc
   par le même /api/tts et méritent le même cache. Les mots (« mouton », « m majuscule »…)
   sont relus dans les simulations elles-mêmes pour que la liste suive le jour où on en
   ajoute un ; les tournures fixes accompagnent chaque simulation ci-dessous.
   --------------------------------------------------------------------------------- */
// Une entrée par mot/lettre de la simulation : { dit, aLeSon, place }. On relit les
// données de la simulation plutôt que de les recopier, et on tient compte de aLeSon /
// place pour ne pas fabriquer des phrases qui ne seront jamais prononcées
// (« On entend mmm dans ballon », « Dans plume, on entend mmm au début »…).
function motsDeLaSimulation(fichier) {
  const source = fs.readFileSync(path.join(ROOT, 'prototype', 'son-m-nouveau', fichier), 'utf8');
  const entrees = [];
  const ligne = /\{[^{}\n]*\bdit\s*:\s*'((?:[^'\\]|\\.)*)'[^{}\n]*\}/g;
  let m;
  while ((m = ligne.exec(source))) {
    const bloc = m[0];
    const place = /\bplace\s*:\s*'([^']*)'/.exec(bloc);
    entrees.push({
      dit: m[1].replace(/\\'/g, "'"),
      aLeSon: !/\baLeSon\s*:\s*false/.test(bloc),
      place: place ? place[1] : '',
      bon: /\bbon\s*:\s*true/.test(bloc)
    });
  }
  return entrees;
}
const SIMULATIONS = ['sim-01-panier-nouveau.html', 'sim-02-position-nouveau.html',
  'sim-03-monstre-nouveau.html', 'sim-04-fabrique-nouveau.html', 'sim-05-ecritures-nouveau.html'];

// Phrases écrites TELLES QUELLES dans une simulation : `parle('progress','…')`, ainsi que
// `reprendre('…')` (l'aide au tracé, qui ne fait que transmettre son message à `parle`).
// On les relit dans le fichier au lieu de les recopier ici — sinon corriger une phrase dans la
// leçon (par exemple pour contourner un filtre de modération) laisserait le script demander
// l'ancienne, et la nouvelle n'aurait jamais de voix. La parenthèse fermante ou la virgule
// juste après l'apostrophe garantit qu'on ne prend QUE les textes littéraux : ceux construits
// par concaténation (« … » + mot) finissent par un `+` et sont, eux, listés à la main plus bas.
function phrasesLitteralesDeSimulation(fichier) {
  const source = fs.readFileSync(path.join(ROOT, 'prototype', 'son-m-nouveau', fichier), 'utf8');
  const motif = /(?:parle\(\s*'(?:word|retry|progress|success)'\s*,\s*|reprendre\(\s*)'((?:[^'\\]|\\.)*)'\s*[,)]/g;
  const out = [];
  let m; while ((m = motif.exec(source))) out.push(m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\'));
  return out;
}

function phrasesDesSimulations() {
  const t = [];
  const ajouter = (...phrases) => phrases.forEach(p => t.push(p));

  // Tout ce qui est écrit littéralement dans les cinq simulations (« On recommence ! »,
  // « Miam ! C'est bien un m. », les consignes du tracé…) : relu directement des fichiers.
  SIMULATIONS.forEach(f => ajouter(...phrasesLitteralesDeSimulation(f)));

  // LE SON CONTINU ne se glisse JAMAIS dans une phrase quelconque : la synthèse le réduirait
  // au nom de la lettre (« èm », mesuré à 0,30 s contre 0,65 s). Les simulations closent donc
  // leurs phrases par PHRASE_SON, la phrase de l'écran 2 qui DIT que le son dure. C'est un
  // ancrage de la leçon, et les ancrages ne passent pas par phrasesDuChapitre() : sans les
  // lignes qui suivent, ce serait le seul texte du cours à partir en synthèse à froid, au
  // moment précis où l'enfant touche le jeton.
  const phraseSonDe = fichier => /var\s+PHRASE_SON\s*=\s*'([^']+)'/.exec(
    fs.readFileSync(path.join(ROOT, 'prototype', 'son-m-nouveau', fichier), 'utf8'))[1];
  const PS = phraseSonDe('sim-02-position-nouveau.html');   // « Le son peut durer : mmmm. »
  ajouter(PS);
  // Les félicitations tournent avec le rang de la réussite : les trois sont donc possibles.
  const BRAVOS = ['Bravo !', 'Super !', 'Très bien joué !'];

  // 1 — le panier : on touche une image, l'avatar dit le mot ; puis réussite ou reprise.
  motsDeLaSimulation('sim-01-panier-nouveau.html').forEach(({ dit, aLeSon }) => {
    // mot sans [m] : on ne fait pas entendre le son au moment où on dit qu'il est absent.
    if (!aLeSon) { ajouter(dit, 'Écoute encore ' + dit + '. On n\'y entend pas le son.'); return; }
    ajouter(dit, ...BRAVOS.map(b => b + ' Dans ' + dit + ', on entend le son. ' + PS));
  });
  ajouter('Bravo ! Tu as trouvé les trois mots. ' + PS);

  // 2 — la place du son : chaque position = un wagon du train (1er / milieu / dernier).
  const OU = {
    'début':  "au début : c'est le premier wagon.",
    'milieu': "au milieu : c'est le wagon du milieu.",
    'fin':    "à la fin : c'est le dernier wagon."
  };
  ajouter("Voici le train du son. Regarde l'image et écoute bien le mot. " +
    'Prends la lettre, puis pose-la dans le bon wagon du train : ' +
    'le premier wagon si tu entends le son au début du mot ; le wagon du milieu si c\'est au milieu ; ' +
    'le dernier wagon si c\'est à la fin. ' + PS);
  motsDeLaSimulation('sim-02-position-nouveau.html').forEach(({ dit, place }) => {
    ajouter(dit, 'Écoute encore ' + dit + '. ' + PS,
      ...BRAVOS.map(b => b + ' Dans ' + dit + ', le son est ' + (OU[place] || place) + ' ' + PS));
  });
  ajouter('Bravo ! Tu as trouvé le bon wagon pour les trois mots. ' + PS);

  // 4 — fabriquer le son : l'étape 3 se tient, la voix tient le son avec l'enfant.
  ajouter('Très bien joué ! Tu as tenu le son. ' + PS,
    'Le son s\'est arrêté. Garde le doigt posé plus longtemps. ' + PS,
    'Bravo ! Lèvres fermées, gorge qui vibre, et un son bien tenu. ' + PS);

  // 3 — le monstre : le mot au toucher, puis l'encouragement. Ces deux tournures sont
  // CONCATÉNÉES dans la simulation (« … » + dit + « … ») : la lecture des littéraux ne les
  // capte donc pas, il faut les reconstruire ici comme pour le panier et la position, sinon
  // elles partent en synthèse à froid (autre timbre) au moment où l'enfant nourrit le monstre.
  motsDeLaSimulation('sim-03-monstre-nouveau.html').forEach(({ dit, bon }) => {
    ajouter(dit);
    if (bon) ajouter('Miam ! C\'est bien ' + dit + '. ' + PS);
    else ajouter('Le monstre n\'en veut pas : c\'est ' + dit + '. Regarde bien ses jambes.');
  });

  // 5 — tracer : « Bravo ! Tu as écrit le … » est construit avec le nom de la lettre.
  ['M majuscule', 'm minuscule', 'm attaché'].forEach(nom =>
    ajouter('Bravo ! Tu as écrit le ' + nom + '.'));

  return t;
}

/* 3. La question « as-tu compris ? », posée à chaque point de contrôle du cours.
   Les sept formulations sont tirées au sort : il faut donc les sept en cache. */
function phrasesDeComprehension() {
  const source = fs.readFileSync(path.join(ROOT, 'prototype', 'index.html'), 'utf8');
  const bloc = /const COMPRIS_QS\s*=\s*\[([\s\S]*?)\];/.exec(source);
  if (!bloc) return [];
  const textes = [];
  const motif = /"((?:[^"\\]|\\.)*)"/g;
  let m; while ((m = motif.exec(bloc[1]))) textes.push(m[1]);
  return textes;
}

/* 3bis. L'ÉVALUATION (quizSets). À chaque question, l'avatar lit à voix haute DEUX choses :
   - la question `q`, débarrassée de son HTML (index.html : speak(stripHtml(item.q))) ;
   - le feedback `fb`, précédé de « Bravo ! » si la réponse est juste, « Pas tout à fait. »
     sinon (index.html : speak((ok?'Bravo ! ':'Pas tout à fait. ')+fb)). Les deux issues
     sont possibles, donc les deux variantes doivent être en cache.
   L'énoncé, l'intro du test et les libellés d'options sont AFFICHÉS mais jamais prononcés :
   on ne les met donc pas en cache. Sans cette collecte, les questions du quiz partaient en
   synthèse à froid au moment où l'enfant y arrive — exactement le défaut corrigé ailleurs. */
function sansHtml(s) {
  return String(s == null ? '' : s).replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
}
function phrasesDeLEvaluation(chapitre) {
  const textes = [];
  const sets = Array.isArray(chapitre.quizSets) ? chapitre.quizSets : [];
  const items = [].concat(
    ...sets.map(s => Array.isArray(s && s.quiz) ? s.quiz : []),
    Array.isArray(chapitre.quiz) ? chapitre.quiz : []   // format hérité (quiz à plat)
  );
  items.forEach(it => {
    if (!it) return;
    if (it.q)  textes.push(sansHtml(it.q));
    if (it.fb) { textes.push('Bravo ! ' + it.fb); textes.push('Pas tout à fait. ' + it.fb); }
  });
  return textes;
}

/* ---------------------------------------------------------------------------------
   4bis. VÉRIFICATION. Le serveur range chaque voix dans .tts-cache/<voix>/<hash>.wav, où
   <hash> ne dépend QUE du texte (même fonction que server.js) et <voix> du moteur employé.
   On peut donc contrôler, sans rien regénérer et même serveur éteint : (a) que chaque phrase
   du chapitre a bien son fichier, (b) qu'elles sont toutes dans le MÊME dossier de voix —
   c'est-à-dire prononcées par le même timbre, sans repli navigateur ni bascule de moteur.
   --------------------------------------------------------------------------------- */
const CACHE = path.join(ROOT, '.tts-cache');
function hachageTexte(texte) {
  texte = String(texte || '').trim();
  let h = 5381;
  for (let i = 0; i < texte.length; i++) h = ((h << 5) + h + texte.charCodeAt(i)) >>> 0;
  return 'h' + h.toString(36) + '-' + texte.length;
}
function dossiersDeVoix() {
  try { return fs.readdirSync(CACHE).filter(n => fs.statSync(path.join(CACHE, n)).isDirectory()); }
  catch (e) { return []; }
}
function fichierEnCache(voix, texte) {
  for (const ext of ['wav', 'mp3']) {
    const f = path.join(CACHE, voix, hachageTexte(texte) + '.' + ext);
    try { const s = fs.statSync(f); if (s.size) return { fichier: f, octets: s.size }; } catch (e) {}
  }
  return null;
}
// Nom de dossier employé par le serveur pour une étiquette de voix (même assainissement).
const dossierDeVoix = tag => String(tag).replace(/[^a-z0-9._-]+/gi, '_') || 'inconnue';

async function verifier(phrases) {
  const voix = dossiersDeVoix();
  if (!voix.length) { console.log('Aucun cache de voix : rien n’a encore été généré.'); return; }

  // Seul le dossier de la voix ACTIVE est consulté par le serveur : les autres sont des
  // restes d'un moteur précédent. Sans cette distinction, un ancien dossier incomplet ferait
  // croire à tort que le chapitre n'est pas prêt.
  let active = null;
  try { active = dossierDeVoix((await (await fetch(BASE + '/api/tts-voice')).json()).voice); }
  catch (e) { /* serveur éteint : on affiche tout sans désigner d'active */ }

  console.log(`Cache : ${CACHE}`);
  console.log(`Voix présentes : ${voix.join(', ')}${active ? '   (en service : ' + active + ')' : '   (serveur éteint : voix active inconnue)'}\n`);
  let total = 0;
  const ordre = active ? [...voix].sort((a, b) => (b === active) - (a === active)) : voix;
  ordre.forEach(v => {
    if (active && v !== active) {
      const n = phrases.filter(p => fichierEnCache(v, p)).length;
      console.log(`— ${v} : ${n}/${phrases.length} — ancienne voix, PLUS CONSULTÉE (conservée si vous y revenez)`);
      return;
    }
    const trouves = phrases.map(p => fichierEnCache(v, p));
    // Le numéro affiché est celui de l'export (--exporter sans --manquantes) : la liste des
    // manquantes indique donc directement quels fichiers 0xx.wav restent à enregistrer.
    const manque = phrases.map((p, i) => ({ piste: numeroDe(i), texte: p })).filter((_, i) => !trouves[i]);
    const octets = trouves.reduce((s, t) => s + (t ? t.octets : 0), 0);
    total += phrases.length - manque.length;
    console.log(`— ${v} : ${phrases.length - manque.length}/${phrases.length} phrases (${Math.round(octets / 1048576 * 10) / 10} Mo)${active ? '  ← EN SERVICE' : ''}`);
    if (manque.length) {
      console.log(`  manquantes (${manque.length}) — numéros de piste de l'export :`);
      manque.forEach(m => console.log(`   ${m.piste}  ${m.texte.length > 66 ? m.texte.slice(0, 63) + '…' : m.texte}`));
    }
    const autres = fs.readdirSync(path.join(CACHE, v)).length - (phrases.length - manque.length);
    if (autres > 0) console.log(`  (+ ${autres} pistes d’autres leçons dans ce même dossier)`);
  });
  // Le verdict ne porte QUE sur la voix en service : c'est la seule que les élèves entendront.
  if (!active) console.log('\n⚠ Serveur éteint : impossible de savoir quelle voix est en service. Relancez-le pour un verdict fiable.');
  else if (total === phrases.length) console.log('\n✅ Chapitre complet, une seule voix : ' + active + '.');
  else console.log(`\n⏳ ${phrases.length - total} phrase(s) manquent dans la voix en service : relancer le script.`);
}

/* =====================================================================================
   4ter. ENREGISTREMENT EXTERNE : exporter les textes, réimporter les fichiers audio
   -------------------------------------------------------------------------------------
   Le palier gratuit de Gemini plafonne à 10 requêtes TTS par jour et par modèle : finir le
   chapitre demanderait plusieurs jours. On peut donc faire enregistrer les voix AILLEURS
   (studio en ligne, comédien, autre moteur) et les déposer dans le cache : le serveur les
   servira comme s'il les avait synthétisées, sans jamais rappeler Gemini pour ces phrases.
   Le lien entre un texte et son fichier est le hachage — d'où l'export d'un MANIFESTE qui
   associe un numéro de piste (le nom de fichier à enregistrer) au texte et à son hachage.

   ATTENTION AU TIMBRE : n'importer qu'une partie des phrases mélangerait deux voix dans le
   même cours. L'export propose donc par défaut LA TOTALITÉ du chapitre ; `--manquantes` ne
   sort que ce qui manque, à réserver au cas où l'enregistrement externe imite déjà la voix
   en place.
   ===================================================================================== */
const EXT_AUDIO = ['wav', 'mp3'];          // seuls formats relus par le serveur (readTTSCache)
const numeroDe = i => String(i + 1).padStart(3, '0');

function exporter(phrases, dossier) {
  const seulementManquantes = args.includes('--manquantes');
  const voixActuelle = dossiersDeVoix()[0] || null;
  // Le numéro de piste est TOUJOURS celui du chapitre entier, même en export partiel : deux
  // dossiers qui commenceraient chacun par un « 001 » différent seraient impossibles à suivre.
  const manifeste = phrases
    .map((texte, i) => ({ piste: numeroDe(i), texte, hachage: hachageTexte(texte) }))
    .filter(m => !(seulementManquantes && voixActuelle && fichierEnCache(voixActuelle, m.texte)));

  fs.mkdirSync(dossier, { recursive: true });
  fs.writeFileSync(path.join(dossier, 'manifeste.json'), JSON.stringify(manifeste, null, 1), 'utf8');

  // Liste lisible pour enregistrer à la voix, dans l'ordre, sans ouvrir de JSON.
  const lisible = ['# Textes à enregistrer — chapitre ' + CHAPITRE, '',
    'Enregistrer une piste par ligne, en **wav ou mp3**, nommée par son numéro : `001.wav`, `002.wav`…',
    'Puis : `node tools/prechauffer-voix.js --importer "' + dossier + '"`', '',
    '| Fichier | Texte à dire |', '|---|---|',
    ...manifeste.map(m => `| ${m.piste} | ${m.texte.replace(/\|/g, '\\|')} |`)].join('\n');
  fs.writeFileSync(path.join(dossier, 'textes.md'), lisible, 'utf8');

  // CSV pour les studios qui acceptent un import en lot (séparateur ; et guillemets doublés).
  fs.writeFileSync(path.join(dossier, 'textes.csv'),
    'fichier;texte\n' + manifeste.map(m => `${m.piste};"${m.texte.replace(/"/g, '""')}"`).join('\n'), 'utf8');

  console.log(`${manifeste.length} texte(s) exportés dans ${dossier}`);
  console.log('  · textes.md    → la liste à lire, avec le nom de fichier attendu');
  console.log('  · textes.csv   → même chose pour un studio qui importe en lot');
  console.log('  · manifeste.json → NE PAS SUPPRIMER : c\'est lui qui relie les fichiers aux textes');
  if (seulementManquantes) console.log('\n⚠ Export partiel : le cours mélangera la voix enregistrée et la voix déjà en cache.');
}

function importer(dossier) {
  let manifeste;
  try { manifeste = JSON.parse(fs.readFileSync(path.join(dossier, 'manifeste.json'), 'utf8')); }
  catch (e) { console.error(`manifeste.json introuvable dans ${dossier} — relancer d'abord --exporter.`); process.exit(1); }

  // Dossier de destination = celui de la voix ACTIVE : c'est le seul que le serveur consulte.
  const voix = opt('voix', dossiersDeVoix()[0] || 'importee');
  const cible = path.join(CACHE, voix);
  fs.mkdirSync(cible, { recursive: true });

  const fichiers = fs.readdirSync(dossier);
  let repris = 0, absents = [];
  manifeste.forEach(m => {
    const trouve = EXT_AUDIO.map(ext => fichiers.find(f => f.toLowerCase() === m.piste + '.' + ext))
      .find(Boolean);
    if (!trouve) { absents.push(m); return; }
    const ext = path.extname(trouve).slice(1).toLowerCase();
    fs.copyFileSync(path.join(dossier, trouve), path.join(cible, m.hachage + '.' + ext));
    repris++;
  });

  console.log(`${repris}/${manifeste.length} piste(s) installées dans ${cible}`);
  if (absents.length) {
    console.log(`\nManquent encore (${absents.length}) — attendu « <numéro>.wav » ou « <numéro>.mp3 » :`);
    absents.slice(0, 20).forEach(m => console.log(`  · ${m.piste} — ${m.texte.slice(0, 60)}`));
    if (absents.length > 20) console.log(`  … et ${absents.length - 20} autres`);
    const autresFormats = fichiers.filter(f => /\.(m4a|ogg|opus|aac|flac|webm)$/i.test(f));
    if (autresFormats.length) console.log(`\n⚠ ${autresFormats.length} fichier(s) dans un format que le serveur ne relit pas (${EXT_AUDIO.join('/')} uniquement) : ${autresFormats.slice(0,3).join(', ')}…`);
  }
  console.log('\nContrôle : node tools/prechauffer-voix.js --verifier');
}

/* ---------------------------------------------------------------------------------
   4. La demande au serveur. Un 204 signifie « aucun moteur n'a produit d'audio, le
   navigateur prendra le relais » : c'est le cas du quota Gemini épuisé. On ne l'accepte
   PAS — on attend et on recommence, pour que la phrase finisse en voix Gemini comme
   toutes les autres. L'attente s'allonge progressivement (un quota journalier ne se
   rétablit pas en dix secondes) sans jamais dépasser dix minutes.
   --------------------------------------------------------------------------------- */
// L'attente monte en escalier et — c'est important — elle est PARTAGÉE entre les phrases :
// quand le quota journalier est épuisé, il l'est pour toutes. Repartir de 30 s à chaque
// nouvelle phrase ferait des dizaines d'appels inutiles. Un succès remet le compteur à zéro.
const ATTENTES = [30, 60, 120, 300, 600];
let niveauAttente = 0;
const dormir = s => new Promise(r => setTimeout(r, s * 1000));
const horoDate = () => new Date().toLocaleTimeString('fr-FR');

async function synthetiser(texte) {
  const r = await fetch(BASE + '/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: texte })
  });
  // 204 = aucun moteur n'a produit d'audio (le navigateur prendrait le relais) ; le serveur
  // range le motif exact dans un en-tête, le corps étant vide.
  if (r.status === 204) {
    const raison = r.headers.get('x-tts-reason') || 'aucun moteur disponible';
    // TOUT échec n'est pas une question de patience. Un filtre de modération qui refuse un
    // texte (403 guardrail) le refusera à l'identique dans dix minutes : réessayer sans fin
    // bloquerait toutes les phrases suivantes. On distingue donc les pannes passagères
    // (quota, réseau, 5xx) des refus définitifs, qu'on met de côté pour la fin.
    const definitif = /\b403\b|guardrail|\b400\b|invalid_request/i.test(raison);
    return { ok: false, raison, definitif };
  }
  if (!r.ok) return { ok: false, raison: 'HTTP ' + r.status };
  const buf = Buffer.from(await r.arrayBuffer());
  if (!buf.length) return { ok: false, raison: 'audio vide' };
  return { ok: true, octets: buf.length };
}

const refuses = [];   // textes définitivement refusés : listés à la fin, pas réessayés en boucle
async function synthetiserJusquAuSucces(texte, rang, total) {
  const apercu = texte.length > 58 ? texte.slice(0, 55) + '…' : texte;
  for (;;) {
    let resultat;
    try { resultat = await synthetiser(texte); }
    catch (error) { resultat = { ok: false, raison: String(error.message || error) }; }
    if (resultat.ok) {
      niveauAttente = 0;
      const ko = Math.round(resultat.octets / 1024);
      console.log(`[${rang}/${total}] ✔ ${apercu}  (${ko} Ko)`);
      return;
    }
    if (resultat.definitif) {
      refuses.push({ texte, raison: resultat.raison });
      console.warn(`[${rang}/${total}] ⛔ ${apercu}\n         REFUS DÉFINITIF (on passe à la suite) — ${resultat.raison.slice(0, 160)}`);
      return;
    }
    const attente = ATTENTES[Math.min(niveauAttente, ATTENTES.length - 1)];
    niveauAttente++;
    console.warn(`[${rang}/${total}] ⏳ ${apercu}\n         ${resultat.raison.slice(0, 160)} — nouvelle tentative dans ${attente} s (${horoDate()})`);
    await dormir(attente);
  }
}

/* --------------------------------------------------------------------------------- */
(async function main() {
  const chapitre = chargerChapitre(CHAPITRE);
  const brut = [].concat(phrasesDuChapitre(chapitre), phrasesDesSimulations(),
    phrasesDeComprehension(), phrasesDeLEvaluation(chapitre));
  // Le cache est indexé sur le texte exact : on dédoublonne comme le fait le serveur,
  // sinon « mmm » ou « On recommence ! » seraient demandés dix fois.
  const phrases = [...new Set(brut.map(p => String(p == null ? '' : p).trim().slice(0, 2000)).filter(Boolean))];

  if (args.includes('--verifier')) { await verifier(phrases); return; }
  if (args.includes('--exporter')) { exporter(phrases, opt('exporter', path.join(ROOT, 'tmp', 'voix-' + CHAPITRE))); return; }
  if (args.includes('--importer')) { importer(opt('importer', path.join(ROOT, 'tmp', 'voix-' + CHAPITRE))); return; }
  if (args.includes('--lister')) {
    phrases.forEach((p, i) => console.log(String(i + 1).padStart(3) + '. ' + p));
    console.log(`\n${phrases.length} phrases pour le chapitre « ${chapitre.id} ».`);
    return;
  }

  let voix = 'inconnue';
  try { voix = (await (await fetch(BASE + '/api/tts-voice')).json()).voice; }
  catch (e) { console.error(`Serveur injoignable sur ${BASE} — lancez « npm start » d'abord.`); process.exit(1); }

  console.log(`Chapitre « ${chapitre.id} » — ${phrases.length} phrases à mettre en cache, voix ${voix}.`);
  if (!/^gemini:/.test(voix)) console.warn(`⚠ La voix active n'est pas Gemini (${voix}) : le cache sera constitué avec ce timbre-là.`);

  const debut = Date.now();
  for (let i = 0; i < phrases.length; i++) await synthetiserJusquAuSucces(phrases[i], i + 1, phrases.length);
  const minutes = Math.round((Date.now() - debut) / 6000) / 10;

  if (refuses.length) {
    console.log(`\n⛔ ${refuses.length} phrase(s) refusée(s) par le moteur — à reformuler dans la leçon ou à enregistrer autrement :`);
    refuses.forEach(x => console.log('   · ' + x.texte));
    console.log(`\n${phrases.length - refuses.length}/${phrases.length} phrases en cache (${minutes} min).`);
    return;
  }
  console.log(`\n✅ ${phrases.length} phrases en cache (${minutes} min). Le chapitre se lit désormais sans aucune synthèse.`);
})().catch(error => { console.error('Échec : ' + (error && error.stack || error)); process.exit(1); });
