'use strict';

function text(value, max = 400) {
  return String(value == null ? '' : value).replace(/[<>]/g, '').trim().slice(0, max);
}

function number(value, min, max, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}

function color(value, fallback = '#2563eb') {
  return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : fallback;
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
      unit: text(item && item.unit, 24),
      min,
      max,
      step,
      initial: number(item && item.initial, min, max, min)
    };
  });

  const variableNames = new Set(variables.map(item => item.name));
  const elements = (Array.isArray(raw.elements) ? raw.elements : []).slice(0, 10).map((item, index) => ({
    id: text(item && item.id, 40) || `element-${index + 1}`,
    label: text(item && item.label, 80),
    shape: ['circle', 'rect', 'bar', 'arrow'].includes(item && item.shape) ? item.shape : 'rect',
    x: number(item && item.x, 0, 100, 10 + (index % 4) * 22),
    y: number(item && item.y, 0, 100, 18 + Math.floor(index / 4) * 30),
    width: number(item && item.width, 4, 80, 18),
    height: number(item && item.height, 4, 80, 18),
    color: color(item && item.color, ['#2563eb', '#16a34a', '#ea580c', '#7c3aed'][index % 4]),
    bindVariable: variableNames.has(text(item && item.bindVariable, 80)) ? text(item.bindVariable, 80) : '',
    bindProperty: ['x', 'y', 'width', 'height', 'opacity', 'rotation'].includes(item && item.bindProperty) ? item.bindProperty : '',
    outputMin: number(item && item.outputMin, -360, 360, 10),
    outputMax: number(item && item.outputMax, -360, 360, 90)
  }));

  const rules = (Array.isArray(raw.rules) ? raw.rules : []).slice(0, 10).map(item => ({
    variable: variableNames.has(text(item && item.variable, 80)) ? text(item.variable, 80) : '',
    operator: ['lt', 'lte', 'gt', 'gte', 'eq', 'between'].includes(item && item.operator) ? item.operator : 'gte',
    threshold: number(item && item.threshold, -100000, 100000, 0),
    thresholdMax: number(item && item.thresholdMax, -100000, 100000, 0),
    observation: text(item && item.observation, 260)
  })).filter(item => item.variable && item.observation);

  return {
    enonce: text(raw.enonce, 700),
    goal: text(raw.goal, 400),
    observe: text(raw.observe, 500),
    visual: text(raw.visual, 500),
    conclusionQuestion: text(raw.conclusionQuestion, 400),
    variables,
    elements,
    rules,
    imageUseful: raw.imageUseful === true,
    imagePrompt: text(raw.imagePrompt, 900),
    imageAlt: text(raw.imageAlt, 220)
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
  if (!spec.variables.length) throw new Error('La simulation doit avoir au moins une variable manipulable.');
  const title = text(options && options.title, 160) || 'Simulation pédagogique';
  const targetLabel = text(options && options.targetLabel, 240);
  const imageDataUrl = /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(String(options && options.imageDataUrl || ''))
    ? String(options.imageDataUrl) : '';
  const payload = { title, targetLabel, spec, imageDataUrl };

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title><style>
:root{font-family:Inter,Arial,sans-serif;color:#12233f;background:#eef5ff}*{box-sizing:border-box}body{margin:0;padding:14px}.app{max-width:980px;margin:auto;background:#fff;border-radius:20px;box-shadow:0 16px 40px #17325b22;overflow:hidden}.head{padding:15px 20px;background:linear-gradient(120deg,#14376d,#2563eb);color:#fff}.head h1{font-size:clamp(20px,3vw,30px);margin:0}.target{margin-top:5px;font-size:13px;opacity:.9}.grid{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(240px,.8fr);gap:14px;padding:14px}.card{border:1px solid #d7e4f6;border-radius:15px;padding:13px;background:#f8fbff}.card h2{font-size:15px;margin:0 0 8px;color:#1d4ed8}.statement{font-size:16px;line-height:1.48}.scene{position:relative;min-height:285px;overflow:hidden;background:linear-gradient(#eef7ff,#fff);border:1px solid #bfdbfe;border-radius:15px}.scene img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:.28}.scene svg{position:absolute;inset:0;width:100%;height:100%}.controls{display:grid;gap:12px}.control label{display:flex;justify-content:space-between;gap:8px;font-weight:700}.control output{color:#1d4ed8}.control input{width:100%;height:36px;accent-color:#2563eb}.actions{display:flex;gap:9px;flex-wrap:wrap}.actions button{border:0;border-radius:11px;padding:11px 14px;font-weight:800;cursor:pointer;background:#2563eb;color:#fff}.actions button.secondary{background:#e2e8f0;color:#17325b}.observation{min-height:84px;font-size:15px;line-height:1.45}.question{font-weight:700;color:#7c2d12}.foot{padding:0 14px 14px;color:#50627d;font-size:12px}.element-label{font:800 4.4px Arial;fill:#102a56;text-anchor:middle;paint-order:stroke;stroke:#ffffffd9;stroke-width:1px;stroke-linejoin:round}.value-badge{font:800 3.6px Arial;fill:#1d4ed8;text-anchor:middle;paint-order:stroke;stroke:#ffffffe6;stroke-width:.9px}.empty{font:700 5px Arial;fill:#50627d;text-anchor:middle}@media(max-width:720px){.grid{grid-template-columns:1fr}.scene{min-height:235px}}
</style></head><body><main class="app"><header class="head"><h1>${escapeHtml(title)}</h1><div class="target">${escapeHtml(targetLabel)}</div></header>
<section class="grid"><div><div class="card statement"><h2>Énoncé</h2><div id="statement"></div></div><div class="scene" aria-label="Schéma interactif"><img id="sceneImage" hidden alt=""><svg id="scene" viewBox="0 0 100 70" role="img"></svg></div><div class="card"><h2>Observations</h2><div id="observation" class="observation" aria-live="polite"></div></div></div>
<aside class="controls"><div class="card"><h2>Objectif</h2><div id="goal"></div></div><div id="controls" class="card controls"></div><div class="actions"><button id="demo" type="button">▶ Démonstration</button><button id="reset" class="secondary" type="button">↺ Réinitialiser</button></div><div class="card question"><h2>À toi de conclure</h2><div id="question"></div></div></aside></section><div class="foot">Manipule une variable à la fois, observe, puis explique la relation avec tes mots.</div></main>
<script>'use strict';const DATA=${escapeJson(payload)};const S=DATA.spec;const state={};let timer=null;
const byId=id=>document.getElementById(id);byId('statement').textContent=S.enonce||'Manipule les réglages et observe ce qui change.';byId('goal').textContent=S.goal||S.observe;byId('question').textContent=S.conclusionQuestion||'Qu’as-tu découvert en manipulant les variables ?';
if(DATA.imageDataUrl){const img=byId('sceneImage');img.src=DATA.imageDataUrl;img.alt=S.imageAlt||'Illustration pédagogique de la simulation';img.hidden=false}
S.variables.forEach(v=>state[v.name]=v.initial);
function fmt(n){return Number.isInteger(n)?String(n):String(Math.round(n*100)/100)}function ratio(v){return (state[v.name]-v.min)/(v.max-v.min||1)}
/* ---- RENDU PSEUDO-3D : sphères ombrées, boîtes en perspective, cylindres, ombres au sol.
   Mêmes formes déclaratives (circle/rect/bar/arrow), mais dessinées avec dégradés,
   reflets et profondeur pour un visuel de qualité, lisible par les plus jeunes. ---- */
const NS='http://www.w3.org/2000/svg';
function mk(tag,attrs){const n=document.createElementNS(NS,tag);Object.keys(attrs||{}).forEach(k=>n.setAttribute(k,attrs[k]));return n}
function shade(hex,f){const n=parseInt(hex.slice(1),16);let r=(n>>16)&255,g=(n>>8)&255,b=n&255;
  const adj=c=>Math.round(f<0?c*(1+f):c+(255-c)*f);r=adj(r);g=adj(g);b=adj(b);
  return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}
function gradKey(c){return c.replace('#','')}
function buildDefs(colors){
  const defs=mk('defs',{});
  defs.appendChild(mk('marker',{id:'arrow',markerWidth:'5',markerHeight:'5',refX:'4',refY:'2.5',orient:'auto'})).appendChild(mk('path',{d:'M0,0 L5,2.5 L0,5 Z',fill:'context-stroke'}));
  colors.forEach(c=>{const k=gradKey(c);
    const sph=mk('radialGradient',{id:'sph'+k,cx:'35%',cy:'30%',r:'75%'});
    sph.appendChild(mk('stop',{offset:'0%','stop-color':shade(c,.72)}));
    sph.appendChild(mk('stop',{offset:'45%','stop-color':shade(c,.18)}));
    sph.appendChild(mk('stop',{offset:'100%','stop-color':shade(c,-.42)}));defs.appendChild(sph);
    const box=mk('linearGradient',{id:'box'+k,x1:'0',y1:'0',x2:'0',y2:'1'});
    box.appendChild(mk('stop',{offset:'0%','stop-color':shade(c,.28)}));
    box.appendChild(mk('stop',{offset:'100%','stop-color':shade(c,-.22)}));defs.appendChild(box);
    const cyl=mk('linearGradient',{id:'cyl'+k,x1:'0',y1:'0',x2:'1',y2:'0'});
    cyl.appendChild(mk('stop',{offset:'0%','stop-color':shade(c,-.32)}));
    cyl.appendChild(mk('stop',{offset:'30%','stop-color':shade(c,.5)}));
    cyl.appendChild(mk('stop',{offset:'65%','stop-color':c}));
    cyl.appendChild(mk('stop',{offset:'100%','stop-color':shade(c,-.38)}));defs.appendChild(cyl);
  });
  return defs;
}
function groundShadow(cx,cy,rw){return mk('ellipse',{cx:cx,cy:Math.min(66,cy),rx:rw,ry:Math.max(1.2,rw*.24),fill:'#0f2a55',opacity:'.16'})}
function shape(el){
  const g=mk('g',{});g.dataset.id=el.id;const k=gradKey(el.color);let node;
  if(el.shape==='circle'){
    const r=Math.min(el.width,el.height)/2;
    g.appendChild(groundShadow(el.x,el.y+r*1.12,r*.92));
    node=mk('circle',{cx:el.x,cy:el.y,r:r,fill:'url(#sph'+k+')'});
    g.appendChild(node);
    g.appendChild(mk('ellipse',{cx:el.x-r*.32,cy:el.y-r*.4,rx:r*.3,ry:r*.18,fill:'#ffffff',opacity:'.5'}));   // reflet
  }else if(el.shape==='arrow'){
    g.appendChild(mk('line',{x1:el.x,y1:el.y,x2:el.x+el.width,y2:el.y+el.height,stroke:el.color,'stroke-width':'4.6','stroke-linecap':'round',opacity:'.22'}));
    node=mk('line',{x1:el.x,y1:el.y,x2:el.x+el.width,y2:el.y+el.height,stroke:el.color,'stroke-width':'2.4','stroke-linecap':'round','marker-end':'url(#arrow)'});
    g.appendChild(node);
  }else if(el.shape==='bar'){
    // cylindre 3D : corps en dégradé horizontal + couvercle clair
    g.appendChild(groundShadow(el.x+el.width/2,el.y+el.height+1.2,el.width*.62));
    node=mk('rect',{x:el.x,y:el.y,width:el.width,height:el.height,fill:'url(#cyl'+k+')'});
    g.appendChild(node);
    g.appendChild(mk('ellipse',{cx:el.x+el.width/2,cy:el.y,rx:el.width/2,ry:Math.min(2.6,el.width*.16),fill:shade(el.color,.55),stroke:shade(el.color,-.2),'stroke-width':'.35','data-cap':'1'}));
    g.appendChild(mk('ellipse',{cx:el.x+el.width/2,cy:el.y+el.height,rx:el.width/2,ry:Math.min(2.6,el.width*.16),fill:shade(el.color,-.3),'data-base':'1'}));
  }else{
    // boîte 3D : face avant + dessus clair + côté sombre
    const d=Math.max(1.6,Math.min(3.4,el.width*.2));
    g.appendChild(groundShadow(el.x+el.width/2+d/2,el.y+el.height+1.4,el.width*.66));
    node=mk('rect',{x:el.x,y:el.y,width:el.width,height:el.height,rx:'.8',fill:'url(#box'+k+')',stroke:shade(el.color,-.35),'stroke-width':'.3'});
    g.appendChild(node);
    g.appendChild(mk('polygon',{points:el.x+','+el.y+' '+(el.x+d)+','+(el.y-d)+' '+(el.x+el.width+d)+','+(el.y-d)+' '+(el.x+el.width)+','+el.y,fill:shade(el.color,.42),'data-top':'1'}));
    g.appendChild(mk('polygon',{points:(el.x+el.width)+','+el.y+' '+(el.x+el.width+d)+','+(el.y-d)+' '+(el.x+el.width+d)+','+(el.y+el.height-d)+' '+(el.x+el.width)+','+(el.y+el.height),fill:shade(el.color,-.32),'data-side':'1'}));
  }
  node.dataset.shape='1';
  if(el.label){g.appendChild(mk('text',{x:el.shape==='circle'?el.x:el.x+el.width/2,y:Math.min(68.5,(el.shape==='circle'?el.y+Math.min(el.width,el.height)/2:el.y+el.height)+5.4),'class':'element-label'})).textContent=el.label}
  return g;
}
function draw(){
  const svg=byId('scene');svg.innerHTML='';
  const colors=[...new Set((S.elements.length?S.elements.map(e=>e.color):['#2563eb','#16a34a','#ea580c']))];
  svg.appendChild(buildDefs(colors));
  // sol légèrement dégradé : donne la profondeur de la scène
  const floor=mk('linearGradient',{id:'floor',x1:'0',y1:'0',x2:'0',y2:'1'});
  floor.appendChild(mk('stop',{offset:'0%','stop-color':'#dbeafe','stop-opacity':'0'}));
  floor.appendChild(mk('stop',{offset:'100%','stop-color':'#93c5fd','stop-opacity':'.45'}));
  svg.querySelector('defs').appendChild(floor);
  svg.appendChild(mk('rect',{x:'0',y:'52',width:'100',height:'18',fill:'url(#floor)'}));
  if(!S.elements.length){
    // pas d'éléments déclarés : un cylindre 3D par variable, hauteur = valeur
    S.variables.forEach((v,i)=>{
      const h=8+ratio(v)*40;
      const e={id:v.id,label:v.name,shape:'bar',x:14+i*28,y:58-h,width:15,height:h,color:['#2563eb','#16a34a','#ea580c'][i]};
      const g=shape(e);
      g.appendChild(mk('text',{x:e.x+e.width/2,y:Math.max(6,e.y-3.4),'class':'value-badge'})).textContent=fmt(state[v.name])+(v.unit?' '+v.unit:'');
      svg.appendChild(g);
    });
  }else S.elements.forEach(el=>{
    const bound=el.bindVariable&&el.bindProperty?Object.assign({},el):el;
    if(el.bindVariable&&el.bindProperty){
      const v=S.variables.find(x=>x.name===el.bindVariable),r=v?ratio(v):0,val=el.outputMin+r*(el.outputMax-el.outputMin);
      if(['x','y','width','height'].includes(el.bindProperty))bound[el.bindProperty]=val;   // la géométrie 3D suit la variable
    }
    const g=shape(bound),node=g.querySelector('[data-shape]');
    if(el.bindVariable&&el.bindProperty){
      const v=S.variables.find(x=>x.name===el.bindVariable),r=v?ratio(v):0,val=el.outputMin+r*(el.outputMax-el.outputMin);
      if(el.bindProperty==='opacity')g.setAttribute('opacity',Math.max(0,Math.min(1,val)));
      else if(el.bindProperty==='rotation')g.setAttribute('transform','rotate('+val+' '+el.x+' '+el.y+')');
    }
    svg.appendChild(g);
  });
}
function matches(rule){const n=state[rule.variable];if(rule.operator==='lt')return n<rule.threshold;if(rule.operator==='lte')return n<=rule.threshold;if(rule.operator==='gt')return n>rule.threshold;if(rule.operator==='eq')return Math.abs(n-rule.threshold)<0.0001;if(rule.operator==='between')return n>=Math.min(rule.threshold,rule.thresholdMax)&&n<=Math.max(rule.threshold,rule.thresholdMax);return n>=rule.threshold}
function update(){draw();const values=S.variables.map(v=>v.name+' = '+fmt(state[v.name])+(v.unit?' '+v.unit:'')).join(' · '),rules=S.rules.filter(matches).map(r=>r.observation);byId('observation').textContent=(rules.length?rules.join(' '):(S.observe||S.visual||'Observe le schéma.'))+' '+values;S.variables.forEach(v=>{const input=byId('input-'+v.id),out=byId('out-'+v.id);if(input)input.value=state[v.name];if(out)out.textContent=fmt(state[v.name])+(v.unit?' '+v.unit:'')});parent.postMessage({type:'cc-sim-state',state:{...state},capabilities:{actions:['demo','reset','set'],variables:S.variables.map(v=>({name:v.name,min:v.min,max:v.max,step:v.step,unit:v.unit}))}},'*')}
const controls=byId('controls');S.variables.forEach(v=>{const wrap=document.createElement('div');wrap.className='control';const label=document.createElement('label');label.htmlFor='input-'+v.id;label.append(document.createTextNode(v.name));const out=document.createElement('output');out.id='out-'+v.id;label.appendChild(out);const input=document.createElement('input');input.type='range';input.id='input-'+v.id;input.min=v.min;input.max=v.max;input.step=v.step;input.value=v.initial;input.addEventListener('input',()=>{state[v.name]=Number(input.value);update()});wrap.append(label,input);controls.appendChild(wrap)});
function reset(){if(timer){clearInterval(timer);timer=null}S.variables.forEach(v=>state[v.name]=v.initial);update()}function setVariable(name,value){const v=S.variables.find(x=>x.name===name);if(!v||!Number.isFinite(value))return;state[name]=Math.max(v.min,Math.min(v.max,value));update()}function demo(){if(timer){clearInterval(timer);timer=null}let tick=0;timer=setInterval(()=>{tick++;S.variables.forEach((v,i)=>{const p=((tick+i*7)%40)/39;state[v.name]=v.min+p*(v.max-v.min)});update();if(tick>=40){clearInterval(timer);timer=null}},180)}
byId('demo').onclick=demo;byId('reset').onclick=reset;window.CourseSimulation={getState:()=>({...state}),getCapabilities:()=>({actions:['demo','reset','set'],variables:S.variables}),dispatch:m=>{if(!m)return;if(m.action==='demo')demo();if(m.action==='reset')reset();if(m.action==='set')setVariable(String(m.name||''),Number(m.value))}};window.addEventListener('message',e=>{const m=e.data||{};if(m.type==='cc-sim')window.CourseSimulation.dispatch(m)});update();
</script></body></html>`;
}

module.exports = { sanitizeSimulationSpec, buildSimulationHtml };
