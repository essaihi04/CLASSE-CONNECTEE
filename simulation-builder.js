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

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title><style>
:root{font-family:Inter,Arial,sans-serif;color:#12233f;background:#eef5ff}*{box-sizing:border-box}body{margin:0;padding:12px;touch-action:manipulation}.app{max-width:1040px;margin:auto;background:#fff;border-radius:20px;box-shadow:0 16px 40px #17325b22;overflow:hidden}.head{padding:14px 20px;background:linear-gradient(120deg,#14376d,#2563eb);color:#fff}.head h1{font-size:clamp(20px,3vw,30px);margin:0}.target{margin-top:5px;font-size:13px;opacity:.9}.grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(240px,.75fr);gap:12px;padding:12px}.card{border:1px solid #d7e4f6;border-radius:15px;padding:12px;background:#f8fbff}.card h2{font-size:15px;margin:0 0 7px;color:#1d4ed8}.statement{font-size:16px;line-height:1.42}.scene{position:relative;min-height:330px;overflow:hidden;background:linear-gradient(#eef7ff,#fff);border:2px solid #bfdbfe;border-radius:15px;touch-action:none;user-select:none}.scene>img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:.16}.scene>svg{position:absolute;inset:0;width:100%;height:100%}.controls{display:grid;gap:11px}.control label{display:flex;justify-content:space-between;gap:8px;font-weight:800}.control output{color:#1d4ed8}.control input{width:100%;height:42px;accent-color:#2563eb}.actions{display:flex;gap:9px;flex-wrap:wrap}.actions button{border:0;border-radius:11px;padding:11px 14px;font-weight:800;cursor:pointer;background:#2563eb;color:#fff}.actions button.secondary{background:#e2e8f0;color:#17325b}.observation{min-height:70px;font-size:15px;line-height:1.42}.observation.ok{color:#15803d;font-weight:800}.observation.bad{color:#b91c1c;font-weight:800}.question{font-weight:700;color:#7c2d12}.foot{padding:0 14px 14px;color:#50627d;font-size:12px}.element-label,.zone-label{font:800 3.8px Arial;fill:#102a56;text-anchor:middle;paint-order:stroke;stroke:#fff;stroke-width:.9px;stroke-linejoin:round;pointer-events:none}.zone-label{font-size:4.1px}.value-badge{font:800 3.6px Arial;fill:#1d4ed8;text-anchor:middle;paint-order:stroke;stroke:#fff;stroke-width:.9px}.draggable{cursor:grab;filter:drop-shadow(0 2px 2px #0f172a44)}.drag-hit{fill:transparent;stroke:none;pointer-events:all}.draggable:active{cursor:grabbing}.draggable:focus{outline:none;filter:drop-shadow(0 0 4px #f59e0b)}.zone-hit{stroke-width:1.2;stroke-dasharray:2 1;fill-opacity:.08}.zone-hit.active{fill-opacity:.22;stroke-width:2}.empty{font:700 5px Arial;fill:#50627d;text-anchor:middle}@media(max-width:720px){.grid{grid-template-columns:1fr}.scene{min-height:300px}.head{padding:12px 15px}}
</style></head><body><main class="app"><header class="head"><h1>${escapeHtml(title)}</h1><div class="target">${escapeHtml(targetLabel)}</div></header>
<section class="grid"><div><div class="card statement"><h2>Consigne</h2><div id="statement"></div></div><div class="scene" aria-label="Activité interactive"><img id="sceneImage" hidden alt=""><svg id="scene" viewBox="0 0 100 70" role="img"></svg></div><div class="card"><h2>Retour</h2><div id="observation" class="observation" aria-live="polite"></div></div></div>
<aside class="controls"><div class="card"><h2>Objectif</h2><div id="goal"></div></div><div id="controls" class="card controls"></div><div class="actions"><button id="demo" type="button">▶ Montrer</button><button id="reset" class="secondary" type="button">↺ Recommencer</button></div><div class="card question"><h2>À toi de conclure</h2><div id="question"></div></div></aside></section><div class="foot" id="foot"></div></main>
<script>'use strict';const DATA=${escapeJson(payload)};const S=DATA.spec;const variableState={},placements={};let timer=null,drag=null;
const NS='http://www.w3.org/2000/svg',byId=id=>document.getElementById(id),scene=byId('scene');
function speakWord(message){message=String(message||'').trim();if(!message||!('speechSynthesis' in window))return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(message);u.lang='fr-FR';u.rate=.85;speechSynthesis.speak(u)}catch(e){}}
byId('statement').textContent=S.enonce||(S.interactionType==='variable'?'Manipule les réglages et observe ce qui change.':'Déplace les objets au bon endroit.');byId('goal').textContent=S.goal||S.observe;byId('question').textContent=S.conclusionQuestion||'Qu’as-tu découvert ?';byId('foot').textContent=(S.interactionType==='variable'?'Manipule une variable à la fois, observe, puis explique la relation avec tes mots.':'Utilise ton doigt ou la souris pour déplacer les objets.')+(S.elements.some(e=>e.word)?' Touche un objet pour entendre son mot.':'');
if(DATA.imageDataUrl){const img=byId('sceneImage');img.src=DATA.imageDataUrl;img.alt=S.imageAlt||'Illustration pédagogique de la simulation';img.hidden=false}S.variables.forEach(v=>variableState[v.name]=v.initial);S.elements.forEach(el=>placements[el.id]={x:el.x,y:el.y,zoneId:''});
function mk(tag,attrs){const n=document.createElementNS(NS,tag);Object.keys(attrs||{}).forEach(k=>n.setAttribute(k,attrs[k]));return n}function fmt(n){return Number.isInteger(n)?String(n):String(Math.round(n*100)/100)}function ratio(v){return (variableState[v.name]-v.min)/(v.max-v.min||1)}
function asset(svg,x,y,w,h){if(!svg)return null;const holder=mk('g',{'pointer-events':'none'});holder.innerHTML=svg;const node=holder.firstElementChild;if(!node)return null;node.setAttribute('x',x);node.setAttribute('y',y);node.setAttribute('width',w);node.setAttribute('height',h);node.setAttribute('preserveAspectRatio','xMidYMid meet');return holder}
function cardArt(item,x,y,w,h){if(!item.image)return null;const g=mk('g',{'pointer-events':'none'});g.appendChild(mk('rect',{x:x,y:y,width:w,height:h,rx:'2.6',fill:'#ffffff',stroke:item.color||'#94a3b8','stroke-width':'.7'}));const img=mk('image',{x:x+1.2,y:y+1.2,width:w-2.4,height:h-2.4,preserveAspectRatio:'xMidYMid meet'});img.setAttribute('href',item.image);img.setAttributeNS('http://www.w3.org/1999/xlink','href',item.image);g.appendChild(img);return g}
function defaultShape(el){const g=mk('g',{}),x=el.x,y=el.y,w=el.width,h=el.height,c=el.color;if(el.shape==='circle')g.appendChild(mk('ellipse',{cx:x+w/2,cy:y+h/2,rx:w/2,ry:h/2,fill:c,stroke:'#0f172a','stroke-width':'.45'}));else if(el.shape==='arrow')g.appendChild(mk('path',{d:'M '+x+' '+(y+h/2)+' L '+(x+w*.72)+' '+(y+h/2)+' L '+(x+w*.72)+' '+y+' L '+(x+w)+' '+(y+h/2)+' L '+(x+w*.72)+' '+(y+h)+' L '+(x+w*.72)+' '+(y+h*.68)+' L '+x+' '+(y+h*.68)+' Z',fill:c}));else g.appendChild(mk('rect',{x:x,y:y,width:w,height:h,rx:el.shape==='bar'?'1.2':'2.2',fill:c,stroke:'#0f172a','stroke-width':'.45'}));return g}
function drawZone(zone){const g=mk('g',{'data-zone':zone.id}),art=cardArt(zone,zone.x,zone.y,zone.width,zone.height)||asset(zone.svg,zone.x,zone.y,zone.width,zone.height);if(art)g.appendChild(art);const hit=mk('rect',{x:zone.x,y:zone.y,width:zone.width,height:zone.height,rx:'2.5',fill:zone.color,stroke:zone.color,'class':'zone-hit','data-zone-hit':zone.id});g.appendChild(hit);const label=mk('text',{x:zone.x+zone.width/2,y:Math.min(69,zone.y+zone.height+4.2),'class':'zone-label'});label.textContent=zone.label;g.appendChild(label);scene.appendChild(g)}
function boundElement(el){if(S.interactionType!=='variable'||!el.bindVariable||!el.bindProperty)return Object.assign({},el);const v=S.variables.find(item=>item.name===el.bindVariable),r=v?ratio(v):0,value=el.outputMin+r*(el.outputMax-el.outputMin),out=Object.assign({},el);if(['x','y','width','height'].includes(el.bindProperty))out[el.bindProperty]=value;out._boundValue=value;return out}
function drawElement(source){const el=boundElement(source),pos=placements[source.id]||{x:el.x,y:el.y},g=mk('g',{'data-element':source.id});if(source.draggable||source.word)g.appendChild(mk('rect',{x:el.x,y:el.y,width:el.width,height:el.height,rx:'2',class:'drag-hit'}));const visual=cardArt(el,el.x,el.y,el.width,el.height)||asset(el.svg,el.x,el.y,el.width,el.height)||defaultShape(el);g.appendChild(visual);if(el.label){const label=mk('text',{x:el.x+el.width/2,y:Math.min(69,el.y+el.height+4.1),'class':'element-label'});label.textContent=el.label;g.appendChild(label)}if(source.draggable){g.classList.add('draggable');g.setAttribute('tabindex','0');g.setAttribute('role','button');g.setAttribute('aria-label','Déplacer '+(source.label||source.id));g.addEventListener('pointerdown',startDrag);g.addEventListener('keydown',keyboardMove)}else if(source.word){g.style.cursor='pointer';g.addEventListener('pointerdown',()=>speakWord(source.word))}if(el.bindProperty==='opacity')g.setAttribute('opacity',Math.max(0,Math.min(1,el._boundValue)));if(el.bindProperty==='rotation')g.setAttribute('transform','rotate('+el._boundValue+' '+el.x+' '+el.y+')');if(S.interactionType!=='variable')g.setAttribute('transform','translate('+(pos.x-source.x)+' '+(pos.y-source.y)+')');scene.appendChild(g)}
function draw(){scene.innerHTML='';S.zones.forEach(drawZone);if(S.interactionType==='variable'&&!S.elements.length)S.variables.forEach((v,i)=>{const h=8+ratio(v)*43,e={id:v.id,label:v.name,shape:'bar',x:12+i*29,y:59-h,width:17,height:h,color:['#2563eb','#16a34a','#ea580c'][i],draggable:false,svg:''};drawElement(e);const badge=mk('text',{x:e.x+e.width/2,y:Math.max(5,e.y-2.5),'class':'value-badge'});badge.textContent=fmt(variableState[v.name])+(v.unit?' '+v.unit:'');scene.appendChild(badge)});else S.elements.forEach(drawElement)}
function point(event){const rect=scene.getBoundingClientRect();return{x:(event.clientX-rect.left)*100/rect.width,y:(event.clientY-rect.top)*70/rect.height}}
function startDrag(event){const elementId=this.getAttribute('data-element'),el=S.elements.find(item=>item.id===elementId);if(!el)return;event.preventDefault();if(el.word)speakWord(el.word);try{this.setPointerCapture(event.pointerId)}catch(e){}const p=point(event),pos=placements[elementId];drag={pointerId:event.pointerId,elementId,startX:pos.x,startY:pos.y,startZoneId:pos.zoneId||'',offsetX:p.x-pos.x,offsetY:p.y-pos.y,moved:false,node:this};this.addEventListener('pointermove',moveDrag);this.addEventListener('pointerup',endDrag);this.addEventListener('pointercancel',endDrag)}
function moveDrag(event){if(!drag||event.pointerId!==drag.pointerId)return;const p=point(event),el=S.elements.find(item=>item.id===drag.elementId),pos=placements[drag.elementId];pos.x=Math.max(0,Math.min(100-el.width,p.x-drag.offsetX));pos.y=Math.max(0,Math.min(70-el.height,p.y-drag.offsetY));pos.zoneId='';drag.moved=drag.moved||Math.abs(pos.x-drag.startX)+Math.abs(pos.y-drag.startY)>1;drag.node.setAttribute('transform','translate('+(pos.x-el.x)+' '+(pos.y-el.y)+')');highlightZone(p)}
function highlightZone(p){scene.querySelectorAll('[data-zone-hit]').forEach(node=>{const z=S.zones.find(item=>item.id===node.getAttribute('data-zone-hit'));node.classList.toggle('active',!!z&&p.x>=z.x&&p.x<=z.x+z.width&&p.y>=z.y&&p.y<=z.y+z.height)})}
function endDrag(event){if(!drag||event.pointerId!==drag.pointerId)return;const current=drag,node=current.node,p=point(event);node.removeEventListener('pointermove',moveDrag);node.removeEventListener('pointerup',endDrag);node.removeEventListener('pointercancel',endDrag);highlightZone({x:-1,y:-1});drag=null;if(S.interactionType==='drag_drop'){const zone=S.zones.find(z=>p.x>=z.x&&p.x<=z.x+z.width&&p.y>=z.y&&p.y<=z.y+z.height);if(!zone&&!current.moved){placements[current.elementId].zoneId=current.startZoneId;return}if(zone&&zone.accepts.includes(current.elementId))placeInZone(current.elementId,zone.id,true);else{placements[current.elementId]={x:current.startX,y:current.startY,zoneId:current.startZoneId};showFeedback(S.retryMessage||'Ce n’est pas encore le bon endroit. Réessaie.',false,true);draw();publishState()}}else{showFeedback(S.observe||'Observe la nouvelle position.',true);publishState()}}
function keyboardMove(event){const el=S.elements.find(item=>item.id===this.getAttribute('data-element'));if(!el)return;const keys={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(!keys[event.key])return;event.preventDefault();const pos=placements[el.id],d=keys[event.key];pos.x=Math.max(0,Math.min(100-el.width,pos.x+d[0]*2));pos.y=Math.max(0,Math.min(70-el.height,pos.y+d[1]*2));pos.zoneId='';draw();publishState()}
function placeInZone(elementId,zoneId,announce){const el=S.elements.find(item=>item.id===elementId),zone=S.zones.find(item=>item.id===zoneId);if(!el||!zone||!zone.accepts.includes(elementId))return false;const accepted=zone.accepts.filter(id=>S.elements.some(item=>item.id===id)),slot=Math.max(0,accepted.indexOf(elementId)),cols=Math.max(1,Math.ceil(Math.sqrt(accepted.length))),rows=Math.max(1,Math.ceil(accepted.length/cols)),cellW=zone.width/cols,cellH=zone.height/rows,col=slot%cols,row=Math.floor(slot/cols);placements[elementId]={x:zone.x+col*cellW+(cellW-el.width)/2,y:zone.y+row*cellH+(cellH-el.height)/2,zoneId:zone.id};draw();const expected=S.elements.filter(item=>item.draggable&&S.zones.some(zone=>zone.accepts.includes(item.id))),done=expected.filter(item=>placements[item.id]&&placements[item.id].zoneId).length;if(announce)showFeedback(done===expected.length?(S.successMessage||'Bravo, tout est bien placé !'):'Très bien ! Continue.',true,true);publishState();return true}
function matches(rule){const n=variableState[rule.variable];if(rule.operator==='lt')return n<rule.threshold;if(rule.operator==='lte')return n<=rule.threshold;if(rule.operator==='gt')return n>rule.threshold;if(rule.operator==='eq')return Math.abs(n-rule.threshold)<0.0001;if(rule.operator==='between')return n>=Math.min(rule.threshold,rule.thresholdMax)&&n<=Math.max(rule.threshold,rule.thresholdMax);return n>=rule.threshold}
function showFeedback(message,ok,say){const out=byId('observation');out.textContent=message;out.className='observation '+(ok?'ok':'bad');if(say)speakWord(message)}
function updateVariables(){draw();const values=S.variables.map(v=>v.name+' = '+fmt(variableState[v.name])+(v.unit?' '+v.unit:'')).join(' · '),rules=S.rules.filter(matches).map(r=>r.observation);byId('observation').textContent=(rules.length?rules.join(' '):(S.observe||S.visual||'Observe le schéma.'))+(values?' '+values:'');byId('observation').className='observation';S.variables.forEach(v=>{const input=byId('input-'+v.id),out=byId('out-'+v.id);if(input)input.value=variableState[v.name];if(out)out.textContent=fmt(variableState[v.name])+(v.unit?' '+v.unit:'')});publishState()}
function capabilities(){return{actions:S.interactionType==='variable'?['demo','reset','set']:['demo','reset','place'],variables:S.variables.map(v=>({name:v.name,min:v.min,max:v.max,step:v.step,unit:v.unit})),elements:S.elements.filter(e=>e.draggable).map(e=>({id:e.id,label:e.label})),zones:S.zones.map(z=>({id:z.id,label:z.label,accepts:z.accepts}))}}
function publishState(){parent.postMessage({type:'cc-sim-state',state:S.interactionType==='variable'?Object.assign({},variableState):JSON.parse(JSON.stringify(placements)),mode:S.interactionType,capabilities:capabilities()},'*')}
const controls=byId('controls');if(S.interactionType==='variable')S.variables.forEach(v=>{const wrap=document.createElement('div');wrap.className='control';const label=document.createElement('label');label.htmlFor='input-'+v.id;label.append(document.createTextNode(v.name));const out=document.createElement('output');out.id='out-'+v.id;label.appendChild(out);const input=document.createElement('input');input.type='range';input.id='input-'+v.id;input.min=v.min;input.max=v.max;input.step=v.step;input.value=v.initial;input.addEventListener('input',()=>{variableState[v.name]=Number(input.value);updateVariables()});wrap.append(label,input);controls.appendChild(wrap)});else{controls.innerHTML='<h2>Manipulation au tableau</h2><div>Déplace chaque objet avec ton doigt ou la souris.</div>'}
function reset(){if(timer){clearInterval(timer);timer=null}S.variables.forEach(v=>variableState[v.name]=v.initial);S.elements.forEach(el=>placements[el.id]={x:el.x,y:el.y,zoneId:''});showFeedback(S.observe||(S.interactionType==='variable'?'Observe ce qui change.':'À toi de jouer !'),true);S.interactionType==='variable'?updateVariables():(draw(),publishState())}function setVariable(name,value){const v=S.variables.find(x=>x.name===name);if(!v||!Number.isFinite(value))return;variableState[name]=Math.max(v.min,Math.min(v.max,value));updateVariables()}
function demo(){if(timer){clearInterval(timer);timer=null}if(S.interactionType==='variable'){let tick=0;timer=setInterval(()=>{tick++;S.variables.forEach((v,i)=>{const p=((tick+i*7)%40)/39;variableState[v.name]=v.min+p*(v.max-v.min)});updateVariables();if(tick>=40){clearInterval(timer);timer=null}},180);return}const moves=[];S.elements.filter(el=>el.draggable).forEach(el=>{const zone=S.zones.find(z=>z.accepts.includes(el.id));if(zone)moves.push([el.id,zone.id])});let index=0;reset();timer=setInterval(()=>{if(index>=moves.length){clearInterval(timer);timer=null;return}placeInZone(moves[index][0],moves[index][1],true);index++},650)}
byId('demo').onclick=demo;byId('reset').onclick=reset;window.CourseSimulation={getState:()=>S.interactionType==='variable'?Object.assign({},variableState):JSON.parse(JSON.stringify(placements)),getCapabilities:capabilities,dispatch:m=>{if(!m)return;if(m.action==='demo')demo();if(m.action==='reset')reset();if(m.action==='set')setVariable(String(m.name||''),Number(m.value));if(m.action==='place')placeInZone(String(m.elementId||''),String(m.zoneId||''),true)}};window.addEventListener('message',e=>{const m=e.data||{};if(m.type==='cc-sim')window.CourseSimulation.dispatch(m)});reset();
</script></body></html>`;
}

module.exports = { sanitizeSimulationSpec, sanitizeSvgAsset, buildSimulationHtml };
