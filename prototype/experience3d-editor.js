/* ============ ÉDITEUR 3D d'EXPÉRIENCE (espace prof) ============
   Affiche la même paillasse que côté élève (mountLabExperiment3D) mais en mode ÉDITION :
   - clique un objet pour le SÉLECTIONNER (halo bleu) ;
   - glisse-le pour le DÉPLACER sur la paillasse (x/z bornés) ;
   - MOLETTE sur un objet sélectionné = agrandir / réduire (sinon la molette zoome la caméra) ;
   - la config (cfg.objects[].pos / .size) est mise à jour en direct → onChange(cfg).
   Utilisé par prof.html ; le rendu élève reste mountLabExperiment3D (index.html). */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { loadCatalogModel } from './schema3d-library.js';

function buildBench(){
  const bench = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.35, 4.6),
    new THREE.MeshStandardMaterial({ color:0xcdd3da, roughness:.6, metalness:.06 }));
  top.position.y = -0.175; bench.add(top);
  const apron = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.5, 0.22),
    new THREE.MeshStandardMaterial({ color:0x8b9099, roughness:.7 }));
  apron.position.set(0, -0.55, 2.19); bench.add(apron);
  const legMat = new THREE.MeshStandardMaterial({ color:0x5b6472, metalness:.55, roughness:.4 });
  [[-3.9,-1.95],[3.9,-1.95],[-3.9,1.95],[3.9,1.95]].forEach(([x,z])=>{
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,3.4,14), legMat);
    leg.position.set(x, -1.75, z); bench.add(leg);
  });
  return bench;
}

function makeLabel(text){
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
  const g = cv.getContext('2d');
  g.fillStyle = 'rgba(8,15,26,.72)'; g.beginPath();
  g.roundRect ? g.roundRect(4,4,248,56,14) : g.rect(4,4,248,56); g.fill();
  g.fillStyle = '#e2e8f0'; g.font = 'bold 26px system-ui,sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(String(text).slice(0,20), 128, 34);
  const tex = new THREE.CanvasTexture(cv);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true, depthWrite:false }));
  sp.scale.set(1.7, 0.42, 1);
  return sp;
}

const LIMITS = { x:3.4, z:1.8, sizeMin:0.4, sizeMax:3 };

export async function mountExperienceEditor(container, cfg, opts = {}){
  const onChange = opts.onChange || (()=>{});
  const onSelect = opts.onSelect || (()=>{});
  container.innerHTML = '';
  const w = container.clientWidth || 560;
  const h = container.clientHeight || Math.round(w * 0.62);
  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, w/h, 0.1, 100);
  camera.position.set(0, 3.4, 7.4);
  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const key = new THREE.DirectionalLight(0xffffff, 1.25); key.position.set(4,7,6); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fd8ff, 0.5); rim.position.set(-5,3,-4); scene.add(rim);
  scene.add(buildBench());

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = .08; controls.enablePan = false;
  controls.minDistance = 4.5; controls.maxDistance = 13;
  controls.target.set(0, 0.9, 0); controls.maxPolarAngle = Math.PI * 0.49;

  // ── charge les objets de la config ──
  const items = [];   // { def, root(Group repositionnable), inner(objet chargé), label, baseHeight }
  const defs = Array.isArray(cfg.objects) ? cfg.objects.slice(0,6) : [];
  await Promise.all(defs.map(async def=>{
    const r = await loadCatalogModel({ model:def.model, size:def.size || 1.6 });
    const root = new THREE.Group();
    root.add(r.object);
    const p = Array.isArray(def.pos) ? def.pos : [0,0];
    root.position.set(p[0]||0, 0, p[1]||0);
    let label = null;
    if(def.label){ label = makeLabel(def.label); label.position.y = r.height + 0.55; root.add(label); }
    scene.add(root);
    items.push({ def, root, inner:r.object, label, baseHeight:r.height, baseSize:def.size || 1.6 });
  }));

  // ── sélection + halo (émissif) ──
  let selected = null;
  function setHalo(it, on){
    if(!it) return;
    it.inner.traverse(o=>{
      if(!o.isMesh || !o.material) return;
      (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{
        if(!m.emissive) return;
        if(on){ m._edSave = m._edSave || m.emissive.clone(); m.emissive.set(0x1d6fa5); }
        else if(m._edSave){ m.emissive.copy(m._edSave); delete m._edSave; }
        else m.emissive.set(0x000000);
      });
    });
  }
  function select(it){
    if(selected === it) return;
    setHalo(selected, false); selected = it; setHalo(selected, true);
    onSelect(it ? it.def : null);
  }

  // ── drag sur le plan de la paillasse (y=0) ──
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0,1,0), 0);
  const hit = new THREE.Vector3();
  function pick(ev){
    const r = renderer.domElement.getBoundingClientRect();
    ndc.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    const roots = items.map(i=>i.root);
    const inter = ray.intersectObjects(roots, true);
    if(!inter.length) return null;
    let obj = inter[0].object;
    while(obj && !roots.includes(obj)) obj = obj.parent;
    return items.find(i=>i.root === obj) || null;
  }
  let dragging = null, dragOff = { x:0, z:0 };
  renderer.domElement.addEventListener('pointerdown', ev=>{
    const it = pick(ev);
    select(it);
    if(!it) return;
    controls.enabled = false;               // le glissement de l'objet prime sur l'orbite
    dragging = it;
    ray.ray.intersectPlane(plane, hit);
    dragOff.x = it.root.position.x - hit.x; dragOff.z = it.root.position.z - hit.z;
    renderer.domElement.setPointerCapture(ev.pointerId);
  });
  renderer.domElement.addEventListener('pointermove', ev=>{
    if(!dragging) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    if(!ray.ray.intersectPlane(plane, hit)) return;
    const x = Math.max(-LIMITS.x, Math.min(LIMITS.x, hit.x + dragOff.x));
    const z = Math.max(-LIMITS.z, Math.min(LIMITS.z, hit.z + dragOff.z));
    dragging.root.position.x = x; dragging.root.position.z = z;
    dragging.def.pos = [ Math.round(x*100)/100, Math.round(z*100)/100 ];
    onChange(cfg);
  });
  function endDrag(ev){
    if(!dragging) return;
    try{ renderer.domElement.releasePointerCapture(ev.pointerId); }catch(_){}
    dragging = null; controls.enabled = true;
  }
  renderer.domElement.addEventListener('pointerup', endDrag);
  renderer.domElement.addEventListener('pointercancel', endDrag);

  // ── molette : redimensionne l'objet SÉLECTIONNÉ (sinon zoom caméra normal) ──
  renderer.domElement.addEventListener('wheel', ev=>{
    if(!selected) return;                    // pas de sélection → OrbitControls zoome
    ev.preventDefault(); ev.stopPropagation();
    const k = ev.deltaY < 0 ? 1.08 : 1/1.08;
    const cur = selected.def.size || selected.baseSize;
    const next = Math.max(LIMITS.sizeMin, Math.min(LIMITS.sizeMax, cur * k));
    const ratio = next / cur;
    selected.inner.scale.multiplyScalar(ratio);
    // garde la base posée sur la paillasse et remonte l'étiquette
    const box = new THREE.Box3().setFromObject(selected.inner);
    selected.inner.position.y -= box.min.y;
    if(selected.label) selected.label.position.y = (box.max.y - box.min.y) + 0.55;
    selected.def.size = Math.round(next*100)/100;
    onChange(cfg);
  }, { passive:false });

  // clic hors objet → désélection (géré dans pointerdown : pick() === null)

  let alive = true, raf = 0;
  (function loop(){ if(!alive) return; raf = requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); })();
  function resize(){
    const nw = container.clientWidth || w, nh = container.clientHeight || h;
    renderer.setSize(nw, nh, false); camera.aspect = nw/nh; camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(container);

  return {
    getConfig: ()=>cfg,
    selectById: id=>select(items.find(i=>i.def.id===id) || null),
    dispose(){
      alive = false; cancelAnimationFrame(raf); ro.disconnect(); controls.dispose();
      scene.traverse(o=>{
        if(o.geometry) o.geometry.dispose();
        if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{ if(m.map)m.map.dispose(); m.dispose(); });
      });
      renderer.dispose();
      if(renderer.domElement.parentNode) renderer.domElement.remove();
    }
  };
}
