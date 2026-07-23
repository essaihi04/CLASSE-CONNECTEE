/* =====================================================================================
   PONT DE CONFORMITÉ DES SIMULATIONS — voir CONTRAT-SIMULATION.md
   Une seule ligne à ajouter dans une page de simulation :
       <script src="cc-sim-bridge.js"></script>
   Le pont apporte les 4 règles du contrat sans toucher à la logique du jeu :
     1. la page ne défile jamais et s'ajuste au cadre du tableau ;
     2. son fond est transparent (pas de bandes colorées autour du contenu) ;
     3. (règle portée par l'étape du cours : ni titre ni ligne à côté de la simulation) ;
     4. elle est MUETTE — sa voix part vers l'avatar — et PILOTABLE par l'avatar.
   ===================================================================================== */
(function () {
  'use strict';

  var EMBEDDED = (function () {
    try { return !!(window.parent && window.parent !== window); } catch (e) { return true; }
  })();

  function relayer(kind, texte, extra) {
    texte = String(texte == null ? '' : texte).trim();
    if (!texte) return;
    var message = { type: 'cc-sim-voice', kind: kind, text: texte };
    if (extra) for (var cle in extra) message[cle] = extra[cle];
    try { parent.postMessage(message, '*'); } catch (e) {}
  }

  /* ---- Règle 4a : SILENCE ------------------------------------------------------------
     Ces pages parlent toutes par speechSynthesis.speak(utterance). On intercepte à ce
     niveau : la simulation devient muette et l'avatar reçoit le texte, sans qu'on ait à
     réécrire la fonction say() propre à chaque page. */
  try {
    var synthese = window.speechSynthesis;
    if (synthese && EMBEDDED) {
      synthese.cancel();
      synthese.speak = function (utterance) {
        relayer('word', utterance && utterance.text);
      };
    }
  } catch (e) {}

  /* ---- Règles 1 et 2 : pas de défilement, fond transparent --------------------------- */
  var style = document.createElement('style');
  style.textContent =
    'html,body{height:100%;margin:0;overflow:hidden;background:transparent}' +
    'body{display:flex;align-items:center;justify-content:center;padding:0}';
  document.head.appendChild(style);

  // Le contenu de ces pages suit le flux du document : on le met à l'échelle du cadre
  // plutôt que de le laisser déborder (ce qui ferait défiler et couperait le bas).
  function ajuster() {
    var boite = document.querySelector('.app');
    if (!boite) return;
    boite.style.transformOrigin = 'center center';
    boite.style.transform = 'none';
    var hauteurDispo = window.innerHeight, largeurDispo = window.innerWidth;
    var hauteurReelle = boite.offsetHeight, largeurReelle = boite.offsetWidth;
    if (!hauteurReelle || !largeurReelle) return;
    var facteur = Math.min(1, hauteurDispo / hauteurReelle, largeurDispo / largeurReelle);
    boite.style.transform = facteur < 1 ? 'scale(' + facteur + ')' : 'none';
  }
  window.addEventListener('resize', ajuster);
  window.addEventListener('load', ajuster);
  // Le jeu redessine son contenu (nouvelle manche, objet rangé…) : on se réajuste.
  document.addEventListener('DOMContentLoaded', function () {
    ajuster();
    try { new MutationObserver(ajuster).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
  });

  /* ---- Règle 4b : PILOTAGE PAR L'AVATAR ---------------------------------------------
     Ces pages sont faites de boutons. On expose donc une commande générique « click »
     sur des cibles nommées, plus les actions habituelles reset / demo / finish. */
  function cibles() {
    var noeuds = document.querySelectorAll('button,.card,.choice,[data-i],[data-p]');
    var liste = [];
    Array.prototype.forEach.call(noeuds, function (el, index) {
      if (el.disabled) return;
      if (!el.dataset.ccId) el.dataset.ccId = 'cible-' + index;
      liste.push({ id: el.dataset.ccId, label: (el.textContent || '').trim().slice(0, 60) });
    });
    return liste;
  }
  function parId(id) {
    return document.querySelector('[data-cc-id="' + String(id).replace(/"/g, '') + '"]');
  }
  function boutonRecommencer() {
    return document.getElementById('reset') ||
      Array.prototype.find.call(document.querySelectorAll('button'), function (b) {
        return /recommenc|encore|rejouer/i.test(b.textContent || '');
      }) || null;
  }

  // NE JAMAIS écraser une simulation déjà conforme : si la page expose son propre pilotage
  // (actions métier « place », « demo »… avec sa vraie logique), on la laisse intacte.
  if (window.CourseSimulation) return;

  window.CourseSimulation = {
    getState: function () {
      return { cibles: cibles().length, texte: (document.body.innerText || '').slice(0, 400) };
    },
    getCapabilities: function () {
      return { actions: ['click', 'reset', 'demo', 'finish'], targets: cibles() };
    },
    dispatch: function (ordre) {
      if (!ordre) return;
      if (ordre.action === 'reset') {
        var bouton = boutonRecommencer();
        if (bouton) bouton.click();
      } else if (ordre.action === 'click' || ordre.action === 'place') {
        var cible = parId(ordre.targetId || ordre.elementId || '');
        if (cible) cible.click();
      } else if (ordre.action === 'demo') {
        // Enchaîne les cibles disponibles, lentement, pour montrer le geste attendu.
        var toutes = cibles();
        toutes.slice(0, 8).forEach(function (c, rang) {
          setTimeout(function () { var el = parId(c.id); if (el) el.click(); }, rang * 900);
        });
      } else if (ordre.action === 'finish') {
        try { parent.postMessage({ type: 'cc-sim-complete' }, '*'); } catch (e) {}
      }
    }
  };
  window.addEventListener('message', function (evenement) {
    var message = evenement.data || {};
    if (message.type === 'cc-sim') window.CourseSimulation.dispatch(message);
  });
})();
