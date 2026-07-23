'use strict';

function text(value, max = 400) {
  return String(value == null ? '' : value).replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, max);
}

function number(value, min, max, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}

function color(value, fallback = '#2563eb') {
  return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : fallback;
}

function id(value, fallback) {
  const clean = String(value == null ? '' : value).trim().replace(/[^a-z0-9_-]/gi, '-').replace(/-+/g, '-').slice(0, 48);
  return clean || fallback;
}

// Les illustrations proposées par l'IA restent purement déclaratives. On reconstruit
// uniquement un petit sous-ensemble SVG : aucun script, événement, lien, image, style,
// filtre ou référence externe ne peut atteindre la page de la simulation.
function sanitizeSvgAsset(raw) {
  raw = String(raw == null ? '' : raw).slice(0, 6000);
  if (!raw) return '';
  const allowedTags = new Set(['svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon']);
  const numericAttrs = new Set(['x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'stroke-width', 'opacity']);
  const enumAttrs = new Set(['stroke-linecap', 'stroke-linejoin', 'fill-rule', 'clip-rule']);
  const tokens = raw.match(/<\/?[a-z][^>]*>/gi) || [];
  const out = [];
  let depth = 0;
  for (const token of tokens) {
    const match = token.match(/^<\s*(\/?)\s*([a-z0-9:-]+)/i);
    if (!match) continue;
    const closing = !!match[1];
    const tag = match[2].toLowerCase();
    if (!allowedTags.has(tag)) continue;
    if (closing) {
      if (tag === 'svg' || tag === 'g') {
        out.push(`</${tag}>`);
        depth = Math.max(0, depth - 1);
      }
      continue;
    }
    const attrs = [];
    const attrSource = token.slice(match[0].length, token.length - 1);
    const attrPattern = /([a-zA-Z][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    let attr;
    while ((attr = attrPattern.exec(attrSource))) {
      const name = attr[1].toLowerCase();
      const value = String(attr[2] == null ? attr[3] : attr[2]).trim().slice(0, 2500);
      let safe = '';
      if (numericAttrs.has(name) && /^-?\d+(?:\.\d+)?%?$/.test(value)) safe = value;
      else if (name === 'viewbox' && /^-?\d+(?:\.\d+)?(?:[ ,]+-?\d+(?:\.\d+)?){3}$/.test(value)) safe = value.replace(/,/g, ' ');
      else if ((name === 'fill' || name === 'stroke') && (/^#[0-9a-f]{3,8}$/i.test(value) || /^(?:none|currentColor)$/i.test(value))) safe = value;
      else if (name === 'd' && /^[MmZzLlHhVvCcSsQqTtAa0-9.,+\- eE]+$/.test(value)) safe = value;
      else if (name === 'points' && /^[0-9.,+\- eE]+$/.test(value)) safe = value;
      else if (name === 'transform' && /^(?:(?:matrix|translate|scale|rotate|skewX|skewY)\([0-9.,+\- eE]+\)\s*)+$/i.test(value)) safe = value;
      else if (enumAttrs.has(name) && /^(?:round|square|butt|miter|bevel|nonzero|evenodd)$/i.test(value)) safe = value;
      if (safe) attrs.push(`${name === 'viewbox' ? 'viewBox' : name}="${safe}"`);
    }
    const selfClosing = !['svg', 'g'].includes(tag) || /\/\s*>$/.test(token);
    out.push(`<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}${selfClosing ? '/>' : '>'}`);
    if (!selfClosing) depth++;
  }
  while (depth-- > 0) out.push('</g>');
  const result = out.join('');
  return /^<svg[\s>]/i.test(result) ? result.slice(0, 6500) : '';
}

function sanitizeSimulationSpec(raw) {
  raw = raw && typeof raw === 'object' ? raw : {};
  const variables = (Array.isArray(raw.variables) ? raw.variables : []).slice(0, 3).map((item, index) => {
    const min = number(item && item.min, -100000, 100000, 0);
    const max = number(item && item.max, min + 0.001, 100000, Math.max(100, min + 1));
    const step = number(item && item.step, 0.001, Math.max(0.001, max - min), 1);
    return {
      id: `v${index + 1}`,
      name: text(item && item.name, 80) || `Variable ${index + 1}`,
      unit: text(item && item.unit, 24), min, max, step,
      initial: number(item && item.initial, min, max, min)
    };
  });

  const variableNames = new Set(variables.map(item => item.name));
  const usedIds = new Set();
  const elements = (Array.isArray(raw.elements) ? raw.elements : []).slice(0, 12).map((item, index) => {
    let elementId = id(item && item.id, `element-${index + 1}`);
    while (usedIds.has(elementId)) elementId += `-${index + 1}`;
    usedIds.add(elementId);
    const bindVariable = text(item && item.bindVariable, 80);
    return {
      id: elementId,
      label: text(item && item.label, 80),
      // Mot prononcé à voix haute quand l'élève touche l'objet (discrimination auditive,
      // non-lecteurs du primaire). Chaîne vide = objet muet.
      word: text(item && item.word, 80),
      // Description d'une vraie illustration à générer (carte-image). Le serveur la
      // transforme en data URL via l'API d'images ; le SVG reste le repli.
      imagePrompt: text(item && item.imagePrompt, 400),
      shape: ['circle', 'rect', 'bar', 'arrow'].includes(item && item.shape) ? item.shape : 'rect',
      x: number(item && item.x, 0, 96, 6 + (index % 4) * 23),
      y: number(item && item.y, 0, 66, 8 + Math.floor(index / 4) * 20),
      width: number(item && item.width, 4, 45, 16),
      height: number(item && item.height, 4, 45, 16),
      color: color(item && item.color, ['#2563eb', '#16a34a', '#ea580c', '#7c3aed'][index % 4]),
      bindVariable: variableNames.has(bindVariable) ? bindVariable : '',
      bindProperty: ['x', 'y', 'width', 'height', 'opacity', 'rotation'].includes(item && item.bindProperty) ? item.bindProperty : '',
      outputMin: number(item && item.outputMin, -360, 360, 10),
      outputMax: number(item && item.outputMax, -360, 360, 90),
      draggable: item && item.draggable === true,
      svg: sanitizeSvgAsset(item && item.svg)
    };
  });

  const elementIds = new Set(elements.map(item => item.id));
  const zoneIds = new Set();
  const zones = (Array.isArray(raw.zones) ? raw.zones : []).slice(0, 6).map((item, index) => {
    let zoneId = id(item && item.id, `zone-${index + 1}`);
    while (zoneIds.has(zoneId) || elementIds.has(zoneId)) zoneId += `-${index + 1}`;
    zoneIds.add(zoneId);
    return {
      id: zoneId,
      label: text(item && item.label, 80) || `Zone ${index + 1}`,
      imagePrompt: text(item && item.imagePrompt, 400),
      x: number(item && item.x, 0, 90, 52 + (index % 2) * 24),
      y: number(item && item.y, 0, 60, 8 + Math.floor(index / 2) * 24),
      width: number(item && item.width, 8, 55, 22),
      height: number(item && item.height, 8, 55, 22),
      color: color(item && item.color, ['#0ea5e9', '#f59e0b', '#22c55e'][index % 3]),
      accepts: (Array.isArray(item && item.accepts) ? item.accepts : []).map(value => id(value, '')).filter(value => elementIds.has(value)).slice(0, 12),
      svg: sanitizeSvgAsset(item && item.svg)
    };
  });

  const rules = (Array.isArray(raw.rules) ? raw.rules : []).slice(0, 10).map(item => ({
    variable: variableNames.has(text(item && item.variable, 80)) ? text(item.variable, 80) : '',
    operator: ['lt', 'lte', 'gt', 'gte', 'eq', 'between'].includes(item && item.operator) ? item.operator : 'gte',
    threshold: number(item && item.threshold, -100000, 100000, 0),
    thresholdMax: number(item && item.thresholdMax, -100000, 100000, 0),
    observation: text(item && item.observation, 260)
  })).filter(item => item.variable && item.observation);

  let interactionType = ['variable', 'drag_drop', 'free_move'].includes(raw.interactionType) ? raw.interactionType : '';
  if (!interactionType) interactionType = zones.length && elements.some(item => item.draggable) ? 'drag_drop' : 'variable';
  // Dans un mode de manipulation spatiale, chaque élément est un objet que l'élève doit
  // pouvoir saisir. Ne laisse pas une valeur `false` produite par l'IA rendre un SVG inerte.
  if (interactionType !== 'variable') elements.forEach(item => { item.draggable = true; });
  resolveLayout(interactionType, elements, zones);

  return {
    interactionType,
    enonce: text(raw.enonce, 700), goal: text(raw.goal, 400), observe: text(raw.observe, 500),
    visual: text(raw.visual, 500), conclusionQuestion: text(raw.conclusionQuestion, 400),
    successMessage: text(raw.successMessage, 260), retryMessage: text(raw.retryMessage, 260),
    variables, elements, zones, rules,
    imageUseful: raw.imageUseful === true,
    imagePrompt: text(raw.imagePrompt, 900), imageAlt: text(raw.imageAlt, 220)
  };
}

// ---- MISE EN PLACE GARANTIE DANS LA SCÈNE 100 x 70 -----------------------------------
// L'IA place les objets « au jugé » : elle superpose parfois deux cartes, ou les colle aux
// bords où le libellé (dessiné SOUS l'objet) sort du cadre. On ne se fie donc pas à ses
// coordonnées : on les recadre toujours, et si un chevauchement subsiste on redispose
// proprement — objets à manipuler en haut, contenants en bas, ce qui est la disposition
// attendue d'un jeu de tri au primaire.
const SCENE = { width: 100, height: 70, labelRoom: 5, gap: 2 };

function boxesOverlap(a, b, pad) {
  return !(a.x + a.width + pad <= b.x || b.x + b.width + pad <= a.x ||
           a.y + a.height + pad <= b.y || b.y + b.height + pad <= a.y);
}

function clampBox(item, maxBottom) {
  item.width = Math.min(item.width, SCENE.width);
  item.height = Math.min(item.height, maxBottom);
  item.x = Math.max(0, Math.min(SCENE.width - item.width, item.x));
  item.y = Math.max(0, Math.min(maxBottom - item.height, item.y));
}

// Répartit des boîtes en rangées régulières dans une bande horizontale.
function layoutRow(items, top, bandHeight, perRow) {
  const rows = Math.ceil(items.length / perRow);
  const rowHeight = bandHeight / rows;
  items.forEach((item, index) => {
    const row = Math.floor(index / perRow);
    const inRow = items.slice(row * perRow, (row + 1) * perRow);
    const column = index - row * perRow;
    const cell = SCENE.width / inRow.length;
    item.width = Math.min(item.width, cell - SCENE.gap * 2);
    item.height = Math.min(item.height, rowHeight - SCENE.labelRoom);
    item.x = column * cell + (cell - item.width) / 2;
    item.y = top + row * rowHeight + (rowHeight - SCENE.labelRoom - item.height) / 2;
  });
}

function resolveLayout(interactionType, elements, zones) {
  // Le libellé est écrit sous la boîte : réserver sa place évite qu'il sorte de la scène.
  const maxBottom = SCENE.height - SCENE.labelRoom;
  elements.forEach(item => clampBox(item, maxBottom));
  zones.forEach(item => clampBox(item, maxBottom));
  // En mode « variable », les positions portent du sens (barres liées aux variables) : on se
  // contente du recadrage, sans jamais réorganiser la scène.
  if (interactionType === 'variable' || !elements.length) return;

  const boxes = [...zones, ...elements];
  let collision = false;
  for (let i = 0; i < boxes.length && !collision; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      if (boxesOverlap(boxes[i], boxes[j], SCENE.gap)) { collision = true; break; }
    }
  }
  if (!collision) return;

  if (zones.length) {
    layoutRow(elements, 2, 30, Math.min(4, elements.length));
    layoutRow(zones, 36, maxBottom - 36, Math.min(3, zones.length));
  } else {
    layoutRow(elements, 2, maxBottom - 2, Math.min(4, elements.length));
  }
}

function escapeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function buildSimulationHtml(options) {
  const spec = sanitizeSimulationSpec(options && options.spec);
  const movable = spec.elements.filter(item => item.draggable);
  if (spec.interactionType === 'variable' && !spec.variables.length) throw new Error('La simulation à variables doit avoir au moins une variable manipulable.');
  if (spec.interactionType === 'drag_drop' && (!movable.length || !spec.zones.length)) throw new Error('La simulation de déplacement doit avoir des objets mobiles et des zones-cibles.');
  if (spec.interactionType === 'free_move' && !movable.length) throw new Error('La simulation libre doit avoir au moins un objet mobile.');
  const title = text(options && options.title, 160) || 'Simulation pédagogique';
  const targetLabel = text(options && options.targetLabel, 240);
  const IMAGE_DATA_URL = /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i;
  const imageDataUrl = IMAGE_DATA_URL.test(String(options && options.imageDataUrl || ''))
    ? String(options.imageDataUrl) : '';
  // Cartes-images générées par le serveur ({id d'objet ou de zone: data URL}). Seules des
  // data URL d'images validées entrent dans la page ; tout le reste retombe sur le SVG.
  const cardImages = options && options.cardImages && typeof options.cardImages === 'object' ? options.cardImages : {};
  [...spec.elements, ...spec.zones].forEach(item => {
    const src = String(cardImages[item.id] || '');
    item.image = IMAGE_DATA_URL.test(src) ? src : '';
  });
  const payload = { title, targetLabel, spec, imageDataUrl };

  // MODE TABLEAU : la page ne montre que le titre et la scène (aucun panneau de texte),
  // remplit tout son cadre sans défilement et DÉLÈGUE la voix au parent (l'avatar du cours)
  // via postMessage {type:'cc-sim-voice'}. Ouverte seule (hors iframe), elle garde une voix
  // de repli du navigateur pour rester utilisable.
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title><style>
:root{font-family:Inter,Arial,sans-serif;color:#12233f}*{box-sizing:border-box}html,body{height:100%;margin:0;overflow:hidden}body{background:transparent;touch-action:manipulation}.app{display:flex;flex-direction:column;height:100%;background:#fff}.head{display:flex;align-items:center;gap:9px;padding:7px 12px;background:linear-gradient(120deg,#14376d,#2563eb);color:#fff}.head h1{font-size:clamp(15px,2.8vh,22px);margin:0;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.head button{border:0;border-radius:9px;padding:6px 11px;font-weight:800;cursor:pointer;background:#ffffff2b;color:#fff;font-size:13px;white-space:nowrap}.head button[hidden]{display:none}.head button:hover{background:#ffffff45}.stage{position:relative;flex:1;min-height:0;padding:6px}.scene{position:relative;width:100%;height:100%;overflow:hidden;background:linear-gradient(#eef7ff,#fff);border:2px solid #bfdbfe;border-radius:14px;touch-action:none;user-select:none}.scene>img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:.16}.scene>svg{position:absolute;inset:0;width:100%;height:100%}.toast{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);max-width:92%;background:#0f172ae0;color:#fff;padding:8px 15px;border-radius:12px;font-size:clamp(13px,2.2vh,17px);font-weight:700;opacity:0;transition:opacity .25s;pointer-events:none;text-align:center}.toast.show{opacity:1}.toast.ok{background:#14532de6}.toast.bad{background:#7f1d1de6}.controls{display:flex;gap:16px;padding:6px 12px;background:#f1f5f9;border-top:1px solid #dbe7f5}.controls[hidden]{display:none}.control{flex:1;display:flex;align-items:center;gap:8px;font-weight:800;font-size:13px;min-width:0}.control label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.control output{color:#1d4ed8;min-width:52px;text-align:right}.control input{flex:1;height:32px;accent-color:#2563eb;min-width:60px}.element-label,.zone-label{font:800 3.8px Arial;fill:#102a56;text-anchor:middle;paint-order:stroke;stroke:#fff;stroke-width:.9px;stroke-linejoin:round;pointer-events:none}.zone-label{font-size:4.1px}.value-badge{font:800 3.6px Arial;fill:#1d4ed8;text-anchor:middle;paint-order:stroke;stroke:#fff;stroke-width:.9px}.draggable{cursor:grab;filter:drop-shadow(0 2px 2px #0f172a44)}.drag-hit{fill:transparent;stroke:none;pointer-events:all}.draggable:active{cursor:grabbing}.draggable:focus{outline:none;filter:drop-shadow(0 0 4px #f59e0b)}.zone-hit{stroke-width:1.2;stroke-dasharray:2 1;fill-opacity:.08}.zone-hit.active{fill-opacity:.22;stroke-width:2}
</style></head><body><main class="app"><header class="head"><h1>${escapeHtml(title)}</h1><button id="finish" type="button" title="Terminer la manipulation">✓ Terminer</button><button id="demo" type="button" title="Démonstration automatique">▶ Montrer</button><button id="reset" type="button" title="Recommencer">↺</button></header>
<div class="stage"><div class="scene" id="sceneBox"><img id="sceneImage" hidden alt=""><svg id="scene" viewBox="0 0 100 70" role="img"></svg></div><div id="observation" class="toast" aria-live="polite"></div></div>
<div id="controls" class="controls" hidden></div></main>
<script>'use strict';const DATA=${escapeJson(payload)};const S=DATA.spec;const variableState={},placements={},failures={};let timer=null,drag=null,toastTimer=null,completionSent=false;
const NS='http://www.w3.org/2000/svg',byId=id=>document.getElementById(id),scene=byId('scene');
// VOIX DÉLÉGUÉE : intégrée dans le cours, la simulation est muette et envoie chaque
// message vocal au parent ({type:'cc-sim-voice'}) — c'est l'avatar qui parle. Ouverte
// seule (hors iframe), elle garde la voix du navigateur en repli.
const EMBEDDED=(()=>{try{return !!(window.parent&&window.parent!==window)}catch(e){return true}})();
function voice(kind,message,extra){message=String(message||'').trim();if(!message)return;if(EMBEDDED){try{parent.postMessage(Object.assign({type:'cc-sim-voice',kind:kind,text:message},extra||{}),'*')}catch(e){}return}if(!('speechSynthesis' in window))return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(message);u.lang='fr-FR';u.rate=.85;speechSynthesis.speak(u)}catch(e){}}
// Un caractère seul ("W", "n", "5") n'a aucun indice de langue : le moteur TTS le lit en
// ANGLAIS. On l'annonce donc toujours dans une phrase française.
const frSeul=w=>{const t=String(w||'').trim();if(t.length!==1)return t;if(/[0-9]/.test(t))return 'le chiffre '+t;if(/[a-zà-ÿ]/i.test(t))return 'la lettre '+t;return t};
function speakWord(el){if(el&&el.word)voice('word',frSeul(el.word),{elementId:el.id})}
byId('sceneBox').setAttribute('aria-label',S.enonce||'Activité interactive');
if(DATA.imageDataUrl){const img=byId('sceneImage');img.src=DATA.imageDataUrl;img.alt=S.imageAlt||'Illustration pédagogique de la simulation';img.hidden=false}S.variables.forEach(v=>variableState[v.name]=v.initial);S.elements.forEach(el=>placements[el.id]={x:el.x,y:el.y,zoneId:''});
function mk(tag,attrs){const n=document.createElementNS(NS,tag);Object.keys(attrs||{}).forEach(k=>n.setAttribute(k,attrs[k]));return n}function fmt(n){return Number.isInteger(n)?String(n):String(Math.round(n*100)/100)}function ratio(v){return (variableState[v.name]-v.min)/(v.max-v.min||1)}
function asset(svg,x,y,w,h){if(!svg)return null;const holder=mk('g',{'pointer-events':'none'});holder.innerHTML=svg;const node=holder.firstElementChild;if(!node)return null;node.setAttribute('x',x);node.setAttribute('y',y);node.setAttribute('width',w);node.setAttribute('height',h);node.setAttribute('preserveAspectRatio','xMidYMid meet');return holder}
function cardArt(item,x,y,w,h){if(!item.image)return null;const g=mk('g',{'pointer-events':'none'});g.appendChild(mk('rect',{x:x,y:y,width:w,height:h,rx:'2.6',fill:'#ffffff',stroke:item.color||'#94a3b8','stroke-width':'.7'}));const img=mk('image',{x:x+1.2,y:y+1.2,width:w-2.4,height:h-2.4,preserveAspectRatio:'xMidYMid meet'});img.setAttribute('href',item.image);img.setAttributeNS('http://www.w3.org/1999/xlink','href',item.image);g.appendChild(img);return g}
function defaultShape(el){const g=mk('g',{}),x=el.x,y=el.y,w=el.width,h=el.height,c=el.color;if(el.shape==='circle')g.appendChild(mk('ellipse',{cx:x+w/2,cy:y+h/2,rx:w/2,ry:h/2,fill:c,stroke:'#0f172a','stroke-width':'.45'}));else if(el.shape==='arrow')g.appendChild(mk('path',{d:'M '+x+' '+(y+h/2)+' L '+(x+w*.72)+' '+(y+h/2)+' L '+(x+w*.72)+' '+y+' L '+(x+w)+' '+(y+h/2)+' L '+(x+w*.72)+' '+(y+h)+' L '+(x+w*.72)+' '+(y+h*.68)+' L '+x+' '+(y+h*.68)+' Z',fill:c}));else g.appendChild(mk('rect',{x:x,y:y,width:w,height:h,rx:el.shape==='bar'?'1.2':'2.2',fill:c,stroke:'#0f172a','stroke-width':'.45'}));return g}
function drawZone(zone){const g=mk('g',{'data-zone':zone.id}),art=cardArt(zone,zone.x,zone.y,zone.width,zone.height)||asset(zone.svg,zone.x,zone.y,zone.width,zone.height);if(art)g.appendChild(art);const hit=mk('rect',{x:zone.x,y:zone.y,width:zone.width,height:zone.height,rx:'2.5',fill:zone.color,stroke:zone.color,'class':'zone-hit','data-zone-hit':zone.id});g.appendChild(hit);const label=mk('text',{x:zone.x+zone.width/2,y:Math.min(69,zone.y+zone.height+4.2),'class':'zone-label'});label.textContent=zone.label;g.appendChild(label);scene.appendChild(g)}
function boundElement(el){if(S.interactionType!=='variable'||!el.bindVariable||!el.bindProperty)return Object.assign({},el);const v=S.variables.find(item=>item.name===el.bindVariable),r=v?ratio(v):0,value=el.outputMin+r*(el.outputMax-el.outputMin),out=Object.assign({},el);if(['x','y','width','height'].includes(el.bindProperty))out[el.bindProperty]=value;out._boundValue=value;return out}
function drawElement(source){const el=boundElement(source),pos=placements[source.id]||{x:el.x,y:el.y},g=mk('g',{'data-element':source.id});if(source.draggable||source.word)g.appendChild(mk('rect',{x:el.x,y:el.y,width:el.width,height:el.height,rx:'2',class:'drag-hit'}));const visual=cardArt(el,el.x,el.y,el.width,el.height)||asset(el.svg,el.x,el.y,el.width,el.height)||defaultShape(el);g.appendChild(visual);if(el.label){const label=mk('text',{x:el.x+el.width/2,y:Math.min(69,el.y+el.height+4.1),'class':'element-label'});label.textContent=el.label;g.appendChild(label)}if(source.draggable){g.classList.add('draggable');g.setAttribute('tabindex','0');g.setAttribute('role','button');g.setAttribute('aria-label','Déplacer '+(source.label||source.id));g.addEventListener('pointerdown',startDrag);g.addEventListener('keydown',keyboardMove)}else if(source.word){g.style.cursor='pointer';g.addEventListener('pointerdown',()=>speakWord(source))}if(el.bindProperty==='opacity')g.setAttribute('opacity',Math.max(0,Math.min(1,el._boundValue)));if(el.bindProperty==='rotation')g.setAttribute('transform','rotate('+el._boundValue+' '+el.x+' '+el.y+')');if(S.interactionType!=='variable')g.setAttribute('transform','translate('+(pos.x-source.x)+' '+(pos.y-source.y)+')');scene.appendChild(g)}
function draw(){scene.innerHTML='';S.zones.forEach(drawZone);if(S.interactionType==='variable'&&!S.elements.length)S.variables.forEach((v,i)=>{const h=8+ratio(v)*43,e={id:v.id,label:v.name,shape:'bar',x:12+i*29,y:59-h,width:17,height:h,color:['#2563eb','#16a34a','#ea580c'][i],draggable:false,svg:''};drawElement(e);const badge=mk('text',{x:e.x+e.width/2,y:Math.max(5,e.y-2.5),'class':'value-badge'});badge.textContent=fmt(variableState[v.name])+(v.unit?' '+v.unit:'');scene.appendChild(badge)});else S.elements.forEach(drawElement)}
// Le viewBox 100x70 est centre avec des bandes vides des que le cadre n'est pas au ratio
// 10:7 (plein ecran du tableau, telephone, iframe etiree...). Convertir le pointeur avec un
// simple rapport de largeur suppose au contraire que la scene remplit tout le cadre : le
// doigt etait alors lu jusqu'a ~24 unites a cote de l'objet reellement dessine. On utilise
// donc la matrice reelle du SVG, exacte quel que soit le format ; le rapport reste le repli.
function point(event){const m=scene.getScreenCTM&&scene.getScreenCTM();if(m){const p=scene.createSVGPoint();p.x=event.clientX;p.y=event.clientY;const r=p.matrixTransform(m.inverse());return{x:r.x,y:r.y}}const rect=scene.getBoundingClientRect();return{x:(event.clientX-rect.left)*100/rect.width,y:(event.clientY-rect.top)*70/rect.height}}
function startDrag(event){const elementId=this.getAttribute('data-element'),el=S.elements.find(item=>item.id===elementId);if(!el)return;event.preventDefault();speakWord(el);try{this.setPointerCapture(event.pointerId)}catch(e){}const p=point(event),pos=placements[elementId];drag={pointerId:event.pointerId,elementId,startX:pos.x,startY:pos.y,startZoneId:pos.zoneId||'',offsetX:p.x-pos.x,offsetY:p.y-pos.y,moved:false,node:this};this.addEventListener('pointermove',moveDrag);this.addEventListener('pointerup',endDrag);this.addEventListener('pointercancel',endDrag)}
function moveDrag(event){if(!drag||event.pointerId!==drag.pointerId)return;const p=point(event),el=S.elements.find(item=>item.id===drag.elementId),pos=placements[drag.elementId];pos.x=Math.max(0,Math.min(100-el.width,p.x-drag.offsetX));pos.y=Math.max(0,Math.min(70-el.height,p.y-drag.offsetY));pos.zoneId='';drag.moved=drag.moved||Math.abs(pos.x-drag.startX)+Math.abs(pos.y-drag.startY)>1;drag.node.setAttribute('transform','translate('+(pos.x-el.x)+' '+(pos.y-el.y)+')');highlightZone(p)}
function highlightZone(p){scene.querySelectorAll('[data-zone-hit]').forEach(node=>{const z=S.zones.find(item=>item.id===node.getAttribute('data-zone-hit'));node.classList.toggle('active',!!z&&p.x>=z.x&&p.x<=z.x+z.width&&p.y>=z.y&&p.y<=z.y+z.height)})}
function endDrag(event){if(!drag||event.pointerId!==drag.pointerId)return;const current=drag,node=current.node,p=point(event);node.removeEventListener('pointermove',moveDrag);node.removeEventListener('pointerup',endDrag);node.removeEventListener('pointercancel',endDrag);highlightZone({x:-1,y:-1});drag=null;if(S.interactionType==='drag_drop'){const zone=S.zones.find(z=>p.x>=z.x&&p.x<=z.x+z.width&&p.y>=z.y&&p.y<=z.y+z.height);if(!zone&&!current.moved){placements[current.elementId].zoneId=current.startZoneId;return}if(zone&&zone.accepts.includes(current.elementId))placeInZone(current.elementId,zone.id,true);else{placements[current.elementId]={x:current.startX,y:current.startY,zoneId:current.startZoneId};failures[current.elementId]=(failures[current.elementId]||0)+1;const moved=S.elements.find(item=>item.id===current.elementId)||{};const correct=S.zones.find(z=>z.accepts.includes(current.elementId));showFeedback(S.retryMessage||'Ce n’est pas encore le bon endroit. Réessaie.',false,'retry',{elementId:current.elementId,elementLabel:moved.label||'',zoneId:zone?zone.id:'',zoneLabel:zone?zone.label:'',correctZoneId:correct?correct.id:'',correctZoneLabel:correct?correct.label:'',attempts:failures[current.elementId]});draw();publishState()}}else{showFeedback(S.observe||'Observe la nouvelle position.',true);publishState()}}
function keyboardMove(event){const el=S.elements.find(item=>item.id===this.getAttribute('data-element'));if(!el)return;const keys={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(!keys[event.key])return;event.preventDefault();const pos=placements[el.id],d=keys[event.key];pos.x=Math.max(0,Math.min(100-el.width,pos.x+d[0]*2));pos.y=Math.max(0,Math.min(70-el.height,pos.y+d[1]*2));pos.zoneId='';draw();publishState()}
function placeInZone(elementId,zoneId,announce,quiet){const el=S.elements.find(item=>item.id===elementId),zone=S.zones.find(item=>item.id===zoneId);if(!el||!zone||!zone.accepts.includes(elementId))return false;const accepted=zone.accepts.filter(id=>S.elements.some(item=>item.id===id)),slot=Math.max(0,accepted.indexOf(elementId)),cols=Math.max(1,Math.ceil(Math.sqrt(accepted.length))),rows=Math.max(1,Math.ceil(accepted.length/cols)),cellW=zone.width/cols,cellH=zone.height/rows,col=slot%cols,row=Math.floor(slot/cols);placements[elementId]={x:zone.x+col*cellW+(cellW-el.width)/2,y:zone.y+row*cellH+(cellH-el.height)/2,zoneId:zone.id};failures[elementId]=0;draw();const expected=S.elements.filter(item=>item.draggable&&S.zones.some(zone=>zone.accepts.includes(item.id))),done=expected.filter(item=>placements[item.id]&&placements[item.id].zoneId).length,complete=expected.length>0&&done===expected.length;if(announce)showFeedback(complete?(S.successMessage||'Bravo, tout est bien placé !'):'Très bien ! Continue.',true,quiet?'':(complete?'success':'progress'),{elementId:elementId});publishState();if(complete)publishComplete();return true}
function matches(rule){const n=variableState[rule.variable];if(rule.operator==='lt')return n<rule.threshold;if(rule.operator==='lte')return n<=rule.threshold;if(rule.operator==='gt')return n>rule.threshold;if(rule.operator==='eq')return Math.abs(n-rule.threshold)<0.0001;if(rule.operator==='between')return n>=Math.min(rule.threshold,rule.thresholdMax)&&n<=Math.max(rule.threshold,rule.thresholdMax);return n>=rule.threshold}
function showFeedback(message,ok,voiceKind,extra){if(!message)return;const out=byId('observation');out.textContent=message;out.className='toast show '+(ok?'ok':'bad');clearTimeout(toastTimer);if(S.interactionType!=='variable')toastTimer=setTimeout(()=>{out.className='toast'},4500);if(voiceKind)voice(voiceKind,message,extra)}
function updateVariables(){draw();const values=S.variables.map(v=>v.name+' = '+fmt(variableState[v.name])+(v.unit?' '+v.unit:'')).join(' · '),rules=S.rules.filter(matches).map(r=>r.observation);byId('observation').textContent=(rules.length?rules.join(' '):(S.observe||S.visual||'Observe le schéma.'))+(values?' '+values:'');byId('observation').className='toast show';S.variables.forEach(v=>{const input=byId('input-'+v.id),out=byId('out-'+v.id);if(input)input.value=variableState[v.name];if(out)out.textContent=fmt(variableState[v.name])+(v.unit?' '+v.unit:'')});publishState()}
function capabilities(){return{actions:S.interactionType==='variable'?['demo','reset','set','finish']:['demo','reset','place','finish'],variables:S.variables.map(v=>({name:v.name,min:v.min,max:v.max,step:v.step,unit:v.unit})),elements:S.elements.filter(e=>e.draggable).map(e=>({id:e.id,label:e.label})),zones:S.zones.map(z=>({id:z.id,label:z.label,accepts:z.accepts}))}}
function naturalComplete(){if(S.interactionType!=='drag_drop')return false;const expected=S.elements.filter(item=>item.draggable&&S.zones.some(zone=>zone.accepts.includes(item.id)));return expected.length>0&&expected.every(item=>{const zoneId=placements[item.id]&&placements[item.id].zoneId;return !!zoneId&&S.zones.some(zone=>zone.id===zoneId&&zone.accepts.includes(item.id))})}
function currentState(){return S.interactionType==='variable'?Object.assign({},variableState):JSON.parse(JSON.stringify(placements))}function publishState(){parent.postMessage({type:'cc-sim-state',state:currentState(),mode:S.interactionType,completed:naturalComplete(),capabilities:capabilities()},'*')}function publishComplete(){if(completionSent)return;completionSent=true;parent.postMessage({type:'cc-sim-complete',mode:S.interactionType,state:currentState()},'*')}function finish(){if(S.interactionType==='drag_drop'&&!naturalComplete()){showFeedback(S.retryMessage||'Place encore tous les objets.',false,'retry',{});return}showFeedback(S.successMessage||'Bravo, tu as terminé !',true,'success',{});publishState();publishComplete()}
const controls=byId('controls'),finishButton=byId('finish');finishButton.hidden=S.interactionType==='drag_drop';finishButton.onclick=finish;if(S.interactionType==='variable'){controls.hidden=false;S.variables.forEach(v=>{const wrap=document.createElement('div');wrap.className='control';const label=document.createElement('label');label.htmlFor='input-'+v.id;label.textContent=v.name;const input=document.createElement('input');input.type='range';input.id='input-'+v.id;input.min=v.min;input.max=v.max;input.step=v.step;input.value=v.initial;input.addEventListener('input',()=>{variableState[v.name]=Number(input.value);updateVariables()});const out=document.createElement('output');out.id='out-'+v.id;wrap.append(label,input,out);controls.appendChild(wrap)})}
function reset(){if(timer){clearInterval(timer);timer=null}completionSent=false;S.variables.forEach(v=>variableState[v.name]=v.initial);S.elements.forEach(el=>placements[el.id]={x:el.x,y:el.y,zoneId:''});showFeedback(S.observe||(S.interactionType==='variable'?'Observe ce qui change.':'À toi de jouer !'),true);S.interactionType==='variable'?updateVariables():(draw(),publishState())}function setVariable(name,value){const v=S.variables.find(x=>x.name===name);if(!v||!Number.isFinite(value))return;variableState[name]=Math.max(v.min,Math.min(v.max,value));updateVariables()}
function demo(){if(timer){clearInterval(timer);timer=null}if(S.interactionType==='variable'){let tick=0;timer=setInterval(()=>{tick++;S.variables.forEach((v,i)=>{const p=((tick+i*7)%40)/39;variableState[v.name]=v.min+p*(v.max-v.min)});updateVariables();if(tick>=40){clearInterval(timer);timer=null;finish()}},180);return}const moves=[];S.elements.filter(el=>el.draggable).forEach(el=>{const zone=S.zones.find(z=>z.accepts.includes(el.id));if(zone)moves.push([el.id,zone.id])});let index=0;reset();timer=setInterval(()=>{if(index>=moves.length){clearInterval(timer);timer=null;return}placeInZone(moves[index][0],moves[index][1],true);index++},650)}
byId('demo').onclick=demo;byId('reset').onclick=reset;window.CourseSimulation={getState:currentState,getCapabilities:capabilities,dispatch:m=>{if(!m)return;if(m.action==='demo')demo();if(m.action==='reset')reset();if(m.action==='finish')finish();if(m.action==='set')setVariable(String(m.name||''),Number(m.value));if(m.action==='place')placeInZone(String(m.elementId||''),String(m.zoneId||''),true,m.quiet===true)}};window.addEventListener('message',e=>{const m=e.data||{};if(m.type==='cc-sim')window.CourseSimulation.dispatch(m)});reset();
</script></body></html>`;
}

module.exports = { sanitizeSimulationSpec, sanitizeSvgAsset, buildSimulationHtml };
