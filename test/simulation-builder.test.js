'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeSimulationSpec, buildSimulationHtml } = require('../simulation-builder');

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
