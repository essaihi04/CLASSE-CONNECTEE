import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const SUPPORTED_EXT = new Set(['glb', 'gltf', 'fbx', 'obj', 'svg']);

export async function fetchModelCatalog() {
  let res;
  try {
    res = await fetch('/api/models3d', { cache: 'no-store' });
  } catch (e) {
    throw new Error('Serveur injoignable. Lance « node server.js » puis ouvre http://localhost:3000/schema3d-viewer.html (n\'ouvre pas le fichier directement).');
  }
  if (res.status === 404) {
    throw new Error('Route /api/models3d absente : REDÉMARRE le serveur (Ctrl+C puis « node server.js ») pour charger la bibliothèque 3D.');
  }
  if (!res.ok) {
    throw new Error('Impossible de lire la liste des modèles 3D (HTTP ' + res.status + ').');
  }
  return res.json();
}

// Catalogue mis en cache (évite un fetch par objet quand une expérience charge plusieurs modèles)
let _catalogCache = null;
export async function getCatalog(force) {
  if (!_catalogCache || force) _catalogCache = await fetchModelCatalog();
  return _catalogCache;
}

// Charge UN modèle de la bibliothèque (par id/url du catalogue), le normalise (centré à
// l'horizontale, base posée à y=0, mis à l'échelle sur `size`) et renvoie { object, height }.
// Utilisé par le moteur d'expériences 3D pour composer une scène multi-objets.
export async function loadCatalogModel(spec) {
  const catalog = await getCatalog();
  const resolved = resolveFromCatalog(normalizeScene(spec || {}), catalog);
  if (resolved.missing || !resolved.url) {
    throw new Error('Modèle absent de la bibliothèque : ' + (spec && (spec.model || spec.url || spec.id) || '?'));
  }
  const object = await loadModelByUrl(resolved);
  addDefaultMaterial(object);
  let box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3(); box.getSize(size);
  const maxd = Math.max(size.x, size.y, size.z) || 1;
  object.scale.multiplyScalar((spec && spec.size ? spec.size : 1.6) / maxd);
  box = new THREE.Box3().setFromObject(object);
  const center = new THREE.Vector3(); box.getCenter(center);
  object.position.x -= center.x; object.position.z -= center.z; object.position.y -= box.min.y;
  return { object, height: box.max.y - box.min.y, spec: resolved };
}

function cleanText(value, max = 90) {
  return String(value == null ? '' : value).replace(/[<>]/g, '').slice(0, max).trim();
}

function cleanId(value) {
  const id = cleanText(value, 220).replace(/\\/g, '/');
  return /^[\w .()@+\-\/]+$/i.test(id) ? id : '';
}

function cleanUrl(value) {
  const url = cleanText(value, 300);
  if (url.startsWith('/models3d/') || url.startsWith('/download-models3d/')) return url;
  return '';
}

function normalizeScene(input) {
  if (typeof input === 'string') return { model: cleanId(input), title: cleanText(input) || 'Modèle 3D' };
  const src = input && typeof input === 'object' ? input : {};
  return {
    title: cleanText(src.title) || 'Modèle 3D',
    model: cleanId(src.model || src.id || src.file || src.name || ''),
    url: cleanUrl(src.url || ''),
    scale: clamp(src.scale, 0.05, 8, 1),
    rotation: vec3(src.rotation, [0, 0, 0], Math.PI * 2),
    position: vec3(src.position, [0, 0, 0], 20),
    camera: {
      position: vec3(src.camera && src.camera.position, [0, 1.5, 7], 40),
      target: vec3(src.camera && src.camera.target, [0, 0, 0], 40)
    },
    autoRotate: src.autoRotate !== false,
    // Cadrage sur une ZONE du modèle : fractions [-1..1] de la demi-boîte autour du centre
    // (ex. [0,1,0] = le haut = la bouche pour un tube digestif debout). null = vue d'ensemble.
    focus: Array.isArray(src.focus) ? vec3(src.focus, [0, 0, 0], 1) : null,
    zoom: clamp(src.zoom, 0.4, 6, 1),
    highlight: src.highlight !== false,
    // Étiquettes d'organes : true = tous, ou tableau de clés pour n'afficher QUE les importants
    // (ex. ['bouche','estomac','grele','gros']). false = aucune.
    labels: src.labels === true ? true : (Array.isArray(src.labels) ? src.labels.filter(k => typeof k === 'string').slice(0, 12) : false),
    // Point du bol alimentaire qui parcourt le tube (bouche → gros intestin).
    trajet: src.trajet === true
  };
}

function clamp(value, min, max, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
}

function vec3(value, fallback, limit) {
  const a = Array.isArray(value) ? value : fallback;
  return [
    clamp(a[0], -limit, limit, fallback[0] || 0),
    clamp(a[1], -limit, limit, fallback[1] || 0),
    clamp(a[2], -limit, limit, fallback[2] || 0)
  ];
}

function fileExt(url) {
  const clean = String(url || '').split('?')[0].toLowerCase();
  return clean.includes('.') ? clean.slice(clean.lastIndexOf('.') + 1) : '';
}

function resolveFromCatalog(spec, catalog) {
  const models = Array.isArray(catalog.models) ? catalog.models : [];
  let found = null;
  if (spec.model) {
    found = models.find(m => m.id === spec.model || m.file === spec.model || m.name === spec.model);
  }
  if (!found && spec.url) {
    found = models.find(m => m.url === spec.url);
  }
  if (!found && models.length && !spec.model && !spec.url) found = models[0];
  if (found) {
    // L'outil de téléchargement produit 2 fichiers par modèle : « X.gltf » (géométrie seule,
    // matériau gris) et « X_Textured.gltf » (avec les textures = vraies couleurs). Si la
    // variante texturée existe, on l'utilise, même quand l'id choisi est la version grise.
    const twinId = found.id.replace(/\.(gltf|glb)$/i, m => '_Textured' + m);
    if (twinId !== found.id) {
      const twin = models.find(m => m.id === twinId);
      if (twin) found = twin;
    }
    return Object.assign({}, spec, found, { title: spec.title || found.name });
  }
  if (spec.url) return Object.assign({}, spec, { ext: fileExt(spec.url) });
  return Object.assign({}, spec, { missing: true });
}

// Couleur anatomique de secours pour un organe SANS texture, d'après le nom de son matériau
// (beaucoup de modèles « rippés » ne texturent qu'une partie des organes → le reste rend blanc).
// Renvoie null si le nom n'évoque aucun organe connu (on garde alors le bleu clair par défaut).
function organColor(name) {
  const n = String(name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (/(tongue|lengua|langue)/.test(n)) return 0xcf6b62;               // langue : rouge doux
  if (/(diente|teeth|tooth)/.test(n)) return 0xf3ecd8;                 // dents : ivoire
  if (/(higado|liver)/.test(n)) return 0x8a3b2c;                       // foie : brun-rouge
  if (/(pancreas)/.test(n)) return 0xd9a44f;                           // pancréas : ocre
  if (/(gall|vesic|biliar)/.test(n)) return 0x5fa64d;                  // vésicule biliaire : vert
  if (/(saliv|glandula)/.test(n)) return 0xe6a6bc;                     // glandes salivaires : rose clair
  if (/(estomago|estmago|mago|stomach)/.test(n)) return 0xc75f4e;      // estomac : rouge
  if (/(boca|mouth|esofago|esophag|garganta|faringe|nose|canal)/.test(n)) return 0xd98495; // bouche/œsophage/voies : rose-rouge
  if (/(colon|intest|id_|delgado|grele|segmento|recto|duoden|ileon|yeyuno)/.test(n)) return 0xdd9a80; // intestins : rose-chair
  if (/(ligament)/.test(n)) return 0xd8ccbb;                           // ligament : beige
  return null;
}

function addDefaultMaterial(root) {
  root.traverse(obj => {
    if (!obj.isMesh) return;
    obj.castShadow = false;
    obj.receiveShadow = false;
    if (!obj.material) obj.material = new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.6 });

    // MODÈLE ANATOMIQUE où chaque ORGANE est un mesh nommé (ex. mouth_0, stomach_0, liver_0) :
    // souvent tous les organes partagent UN SEUL matériau gris → on le CLONE par organe et on
    // applique une couleur anatomique lisible, en retirant la texture « métal » qui grise tout.
    const meshOrgan = organColor(obj.name);
    if (meshOrgan != null) {
      const src = Array.isArray(obj.material) ? obj.material : [obj.material];
      const cloned = src.map(m => {
        const c = m.clone();
        c.map = null;                                   // enlève la texture grise/métal partagée
        if (c.color && c.color.set) c.color.set(meshOrgan);
        if (typeof c.metalness === 'number') c.metalness = 0.1;
        if (typeof c.roughness === 'number') c.roughness = 0.82;
        if (c.emissive && c.emissive.setHex) c.emissive.setHex(0x000000);
        c.side = THREE.DoubleSide;
        return c;
      });
      obj.material = Array.isArray(obj.material) ? cloned : cloned[0];
      return;
    }

    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach(mat => {
      // Ne repeindre le blanc par défaut QUE s'il n'y a ni texture ni couleurs de sommets :
      // sinon on teinte la vraie couleur du modèle (une base blanche laisse voir la texture).
      const hasTexture = !!mat.map;
      const hasVertexColors = !!(mat.vertexColors && obj.geometry && obj.geometry.attributes && obj.geometry.attributes.color);
      if (!hasTexture && !hasVertexColors && mat.color && mat.color.getHex && mat.color.getHex() === 0xffffff) {
        // Couleur d'organe si le nom du matériau en évoque un ; sinon bleu clair neutre.
        const organ = organColor(mat.name);
        mat.color.set(organ != null ? organ : 0xdbeafe);
        if (organ != null && typeof mat.roughness === 'number') mat.roughness = Math.max(mat.roughness, 0.75);
      }
      // Le matériau glTF par défaut est 100 % métallique (metallicFactor absent = 1.0). Une
      // surface métallique n'a PAS de couleur diffuse : elle ne fait que réfléchir l'environnement,
      // donc elle rend sombre/gris/marron — même AVEC une texture de couleur (celle-ci devient une
      // simple teinte de reflet, d'où une bouteille d'huile jaune qui vire au marron). Beaucoup de
      // modèles « rippés » n'ont pas de carte metalness et ne sont pas vraiment métalliques : on
      // les rend mats pour révéler leur vraie couleur (texture OU couleur unie). On préserve les
      // VRAIS matériaux PBR : s'ils portent une metalnessMap, on n'y touche pas.
      if (!mat.metalnessMap && typeof mat.metalness === 'number' && mat.metalness > 0.5) {
        mat.metalness = 0.1;
      }
      mat.side = THREE.DoubleSide;
    });
  });
}

function loadModelByUrl(item) {
  const ext = (item.ext || fileExt(item.url)).toLowerCase();
  if (!SUPPORTED_EXT.has(ext)) return Promise.reject(new Error('Format non pris en charge: ' + ext));
  if (ext === 'glb' || ext === 'gltf') {
    return new Promise((resolve, reject) => new GLTFLoader().load(item.url, gltf => resolve(gltf.scene), undefined, reject));
  }
  if (ext === 'fbx') {
    return new Promise((resolve, reject) => new FBXLoader().load(item.url, resolve, undefined, reject));
  }
  if (ext === 'obj') {
    return new Promise((resolve, reject) => new OBJLoader().load(item.url, resolve, undefined, reject));
  }
  return loadSvgAsObject(item.url);
}

function loadSvgAsObject(url) {
  return new Promise((resolve, reject) => {
    new SVGLoader().load(url, data => {
      const group = new THREE.Group();
      data.paths.forEach(path => {
        const style = path.userData && path.userData.style ? path.userData.style : {};
        // Remplissages (fills) — ignorés si fill:none dans le SVG.
        if (style.fill !== 'none') {
          const fillMat = new THREE.MeshBasicMaterial({
            color: path.color || 0xe2e8f0,
            side: THREE.DoubleSide,
            depthWrite: false
          });
          SVGLoader.createShapes(path).forEach(shape => {
            group.add(new THREE.Mesh(new THREE.ShapeGeometry(shape), fillMat));
          });
        }
        // Contours (strokes) — beaucoup de schémas SVG ne sont QUE des traits.
        if (style.stroke && style.stroke !== 'none') {
          const strokeMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setStyle(style.stroke),
            side: THREE.DoubleSide,
            depthWrite: false
          });
          path.subPaths.forEach(subPath => {
            const geom = SVGLoader.pointsToStroke(subPath.getPoints(), style);
            if (geom) group.add(new THREE.Mesh(geom, strokeMat));
          });
        }
      });
      group.scale.y *= -1;
      resolve(group);
    }, undefined, reject);
  });
}

function frameObject(root, camera, controls, explicitCamera, focus, zoom) {
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  root.position.sub(center);
  const box2 = new THREE.Box3().setFromObject(root);
  const center2 = box2.getCenter(new THREE.Vector3());
  // Cible = centre du modèle, ou une ZONE précise (ex. la bouche = le haut) si `focus` fourni.
  const target = center2.clone();
  if (Array.isArray(focus)) {
    const half = box2.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    target.x += focus[0] * half.x;
    target.y += focus[1] * half.y;
    target.z += focus[2] * half.z;
  }
  controls.target.copy(target);
  const z = zoom > 0 ? zoom : 1;
  const dist = Math.max(3.2, maxDim * 1.8) / z;
  if (!explicitCamera) camera.position.set(target.x, target.y + maxDim * 0.12, target.z + dist);
  camera.near = Math.max(0.01, maxDim / 1000);
  camera.far = Math.max(100, maxDim * 20);
  camera.updateProjectionMatrix();
  controls.update();
}

function disposeScene(scene) {
  scene.traverse(obj => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach(mat => {
        if (mat.map) mat.map.dispose();
        mat.dispose();
      });
    }
  });
}

export async function mountSchema3D(container, input, options = {}) {
  if (!container) throw new Error('Conteneur 3D introuvable');

  // PRIMITIVES GÉNÉRÉES (neurone, virus…) : nom simple sans fichier → rendu procédural intégré.
  // Les VRAIS fichiers de la bibliothèque (glb/fbx/obj/svg) passent, eux, par le catalogue ci-dessous.
  const name = typeof input === 'string' ? input : (input && (input.model || input.name || input.id));
  if (name && typeof window !== 'undefined' && window.__cc3dBuiltins && window.__cc3dBuiltins[name] && window.__cc3dMountBuiltin) {
    return window.__cc3dMountBuiltin(container, name);
  }

  if (options.useGlobalDispose !== false && window.__cc3dDispose) {
    window.__cc3dDispose();
    window.__cc3dDispose = null;
  }

  container.innerHTML = '<div style="color:#94a3b8;font-size:12px;text-align:center;padding:22px">Chargement du modèle 3D...</div>';
  const catalog = await fetchModelCatalog();
  const spec = resolveFromCatalog(normalizeScene(input), catalog);
  if (spec.missing || !spec.url) {
    container.innerHTML = '<div style="color:#fca5a5;font-size:12px;text-align:center;padding:22px">Aucun fichier modèle trouvé. Dépose un fichier dans prototype/models3d.</div>';
    return { dispose(){}, spec };
  }

  container.innerHTML = '';
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
  const w = container.clientWidth || 380;
  const h = container.clientHeight || Math.round(w * 0.75);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);
  // Couleurs justes et vives : sortie sRGB + tone mapping doux (les matériaux PBR
  // paraissent délavés/sombres sans ça).
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, w / h, 0.01, 1000);
  camera.position.set(...spec.camera.position);

  // Environment map : donne aux surfaces métalliques/lisses quelque chose à réfléchir,
  // sinon elles rendent gris/noir et « éteignent » la couleur du modèle.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(4, 6, 7);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x38bdf8, 0.35);
  rim.position.set(-5, 2, -4);
  scene.add(rim);

  const root = new THREE.Group();
  scene.add(root);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.autoRotate = !!spec.autoRotate;
  controls.autoRotateSpeed = 1.1;
  controls.target.set(...spec.camera.target);

  const object = await loadModelByUrl(spec);
  addDefaultMaterial(object);
  object.position.set(...spec.position);
  object.rotation.set(...spec.rotation);
  object.scale.multiplyScalar(spec.scale);
  root.add(object);
  // Sur une vue CADRÉE (focus), on fige la rotation auto pour rester sur la zone visée (la bouche).
  if (spec.focus) spec.autoRotate = false;
  frameObject(root, camera, controls, !!(input && input.camera), spec.focus, spec.zoom);

  // Matériaux qui pourront "s'allumer" (emissive) quand le prof parle de l'objet.
  const glowMats = [];
  object.traverse(o => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach(m => {
      if (m && m.emissive && typeof m.emissive.getHex === 'function') {
        glowMats.push({ m, baseHex: m.emissive.getHex(), baseInt: (m.emissiveIntensity == null ? 1 : m.emissiveIntensity) });
      }
    });
  });

  // ---- ÉTIQUETTES D'ORGANES + TRAJET DU BOL ALIMENTAIRE ----
  // On regroupe les meshes par organe (nom du mesh) et on calcule le centre MONDE de chaque
  // organe (après cadrage). Les étiquettes sont des div HTML reprojetés à chaque frame ; le bol
  // alimentaire est une petite sphère lumineuse qui suit une courbe bouche → gros intestin.
  const ORGAN_DEFS = [
    { re: /(mouth|boca|tongue|lengua|langue)/, key: 'bouche', label: '👄 Bouche' },  // PAS nose/canal : le canal nasal descend vers l'œsophage et tirerait l'étiquette bouche vers le bas
    { re: /(saliv|glandula)/, key: 'salivaires', label: 'Glandes salivaires' },
    { re: /(esofago|esophag|oesoph|garganta|faringe|pharynx|throat)/, key: 'oesophage', label: 'Œsophage' },
    { re: /(estomago|estmago|mago|stomach)/, key: 'estomac', label: '🔴 Estomac' },
    { re: /(higado|liver)/, key: 'foie', label: 'Foie' },
    { re: /(gall|vesic|biliar)/, key: 'vesicule', label: 'Vésicule biliaire' },
    { re: /(pancreas)/, key: 'pancreas', label: 'Pancréas' },
    { re: /(small|grele|delgado|duoden|ileon|yeyuno)/, key: 'grele', label: 'Intestin grêle' },
    { re: /(big|colon|large|gros|recto)/, key: 'gros', label: 'Gros intestin' }
  ];
  let labelLayer = null, leaderSvg = null;
  const labelItems = [];
  let bolus = null, bolusCurve = null, bolusT = 0, trajetLine = null;
  const organBox = {};          // key organe -> Box3 (monde) : sert au zoom sur l'organe parlé
  let md = 1;
  if (spec.labels || spec.trajet) {
    root.updateMatrixWorld(true);
    const groups = {};
    object.traverse(o => {
      if (!o.isMesh) return;
      const nm = String(o.name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const def = ORGAN_DEFS.find(d => d.re.test(nm));
      if (!def) return;
      const b = new THREE.Box3().setFromObject(o);
      if (b.isEmpty()) return;
      if (!groups[def.key]) groups[def.key] = { label: def.label, box: b.clone() };
      else groups[def.key].box.union(b);
    });
    const centers = {};
    Object.keys(groups).forEach(k => { centers[k] = groups[k].box.getCenter(new THREE.Vector3()); organBox[k] = groups[k].box; });
    // La bouche contient parfois un mesh long qui descend vers le pharynx/oesophage.
    // Pour l'etiquette et le zoom, on l'ancre donc sur la partie haute du groupe.
    if (groups.bouche) {
      const b = groups.bouche.box;
      const s = b.getSize(new THREE.Vector3());
      const c = b.getCenter(new THREE.Vector3());
      centers.bouche = new THREE.Vector3(c.x, b.max.y - s.y * 0.08, c.z);
      const topBox = b.clone();
      topBox.min.y = Math.max(b.min.y, b.max.y - Math.max(s.y * 0.22, 0.001));
      organBox.bouche = topBox;
    }
    // Le gros intestin entoure l'intestin grele : son centre tombe souvent au milieu des anses.
    // On place donc le repere sur le bord externe du colon, plus lisible pour l'eleve.
    if (groups.gros) {
      const b = groups.gros.box;
      const s = b.getSize(new THREE.Vector3());
      const c = b.getCenter(new THREE.Vector3());
      centers.gros = new THREE.Vector3(b.max.x - s.x * 0.08, b.min.y + s.y * 0.48, c.z);
      const edgeBox = b.clone();
      edgeBox.min.x = Math.max(b.min.x, b.max.x - Math.max(s.x * 0.24, 0.001));
      organBox.gros = edgeBox;
    }
    const modelBox = new THREE.Box3().setFromObject(root);
    const modelCenter = modelBox.getCenter(new THREE.Vector3());
    const modelSize = modelBox.getSize(new THREE.Vector3());
    md = Math.max(modelSize.x, modelSize.y, modelSize.z) || 1;

    if (spec.labels) {
      // Étiquettes rangées sur les CÔTÉS (gauche/droite), reliées à l'organe par un trait de
      // repère + un point — comme sur une planche d'anatomie. Plus aucun chevauchement.
      labelLayer = document.createElement('div');
      labelLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:2';
      container.appendChild(labelLayer);
      leaderSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      leaderSvg.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible');
      labelLayer.appendChild(leaderSvg);
      const labelAllow = Array.isArray(spec.labels) ? new Set(spec.labels) : null;   // null = tous
      const keys = Object.keys(groups).filter(k => !labelAllow || labelAllow.has(k));
      const sides = { left: [], right: [] };
      keys.forEach(k => { (centers[k].x < modelCenter.x ? sides.left : sides.right).push(k); });
      // Rééquilibrer si tout tombe d'un seul côté (déplace les plus hauts vers l'autre colonne).
      const rebalance = (from, to) => { from.sort((a, b) => centers[a].y - centers[b].y); while (from.length - to.length >= 2) to.push(from.pop()); };
      if (sides.left.length === 0) rebalance(sides.right, sides.left);
      else if (sides.right.length === 0) rebalance(sides.left, sides.right);
      [['left', sides.left], ['right', sides.right]].forEach(([side, arr]) => {
        arr.sort((a, b) => centers[b].y - centers[a].y);   // haut → bas
        arr.forEach((k, i) => {
          const el = document.createElement('div');
          el.textContent = groups[k].label;
          el.style.cssText = 'position:absolute;transform:translate(' + (side === 'left' ? '0' : '-100%') + ',-50%);white-space:nowrap;'
            + 'background:rgba(15,23,42,.9);color:#fde68a;font:600 11px/1.2 system-ui,sans-serif;'
            + 'padding:3px 8px;border:1px solid #38bdf8;border-radius:8px;box-shadow:0 1px 6px rgba(0,0,0,.5);transition:color .2s,border-color .2s';
          labelLayer.appendChild(el);
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('stroke', '#38bdf8'); line.setAttribute('stroke-width', '1.3'); line.setAttribute('opacity', '0.8');
          leaderSvg.appendChild(line);
          const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          dot.setAttribute('r', '3'); dot.setAttribute('fill', '#fde68a');
          leaderSvg.appendChild(dot);
          labelItems.push({ el, line, dot, key: k, pos: centers[k].clone(), side, slot: i, count: arr.length });
        });
      });
    }

    if (spec.trajet) {
      // Ordre du trajet : bouche → (œsophage) → estomac → intestin grêle → gros intestin.
      const order = ['bouche', 'oesophage', 'estomac', 'grele', 'gros'];
      const pts = order.filter(k => centers[k]).map(k => centers[k].clone());
      if (pts.length >= 2) {
        bolusCurve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.15);
        const linePts = bolusCurve.getPoints(80);
        // depthTest:false → le trajet et le point restent visibles PAR-DESSUS les organes opaques
        // (le bol voyage à l'intérieur du tube, il serait sinon caché par les parois).
        trajetLine = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(linePts),
          new THREE.LineDashedMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.5, depthTest: false, dashSize: md * 0.03, gapSize: md * 0.02 })
        );
        trajetLine.computeLineDistances();
        trajetLine.renderOrder = 998;
        scene.add(trajetLine);
        // Petite bille ambrée (le bol alimentaire), SANS source de lumière : pas de halo blanc
        // mobile sur les organes. MeshBasic = non éclairé, donc visible sans lumière.
        bolus = new THREE.Mesh(
          new THREE.SphereGeometry(md * 0.02, 20, 20),
          new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, depthTest: false })
        );
        bolus.renderOrder = 999;
        scene.add(bolus);
      }
    }
  }

  let resume = null;
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
    if (resume) clearTimeout(resume);
    desiredPos = null; desiredTarget = null;   // l'élève reprend la main : on stoppe le zoom auto
  });
  controls.addEventListener('end', () => {
    resume = setTimeout(() => { controls.autoRotate = !!spec.autoRotate; }, 2500);
  });

  function resize() {
    const nw = container.clientWidth || w;
    const nh = container.clientHeight || h;
    renderer.setSize(nw, nh, false);
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  // Reprojette chaque organe et place son étiquette dans la colonne latérale + le trait de repère.
  const _v = new THREE.Vector3();
  function updateLabels() {
    if (!labelItems.length) return;
    const cw = renderer.domElement.clientWidth || w;
    const ch = renderer.domElement.clientHeight || h;
    const topPad = ch * 0.08, span = ch * 0.84;
    for (const it of labelItems) {
      _v.copy(it.pos).project(camera);
      const behind = _v.z >= 1;
      const ox = (_v.x * 0.5 + 0.5) * cw, oy = (-_v.y * 0.5 + 0.5) * ch;
      const ly = topPad + (it.slot + 0.5) / it.count * span;
      const lx = it.side === 'left' ? 12 : cw - 12;
      it.el.style.left = lx + 'px';
      it.el.style.top = ly + 'px';
      const anchorX = it.side === 'left' ? lx + it.el.offsetWidth + 3 : lx - it.el.offsetWidth - 3;
      it.line.setAttribute('x1', anchorX.toFixed(1)); it.line.setAttribute('y1', ly.toFixed(1));
      it.line.setAttribute('x2', ox.toFixed(1)); it.line.setAttribute('y2', oy.toFixed(1));
      it.dot.setAttribute('cx', ox.toFixed(1)); it.dot.setAttribute('cy', oy.toFixed(1));
      it.line.style.display = behind ? 'none' : 'block';
      it.dot.style.display = behind ? 'none' : 'block';
    }
  }

  // ---- ZOOM SUR L'ORGANE DONT LE PROF PARLE (piloté depuis index.html via window.__cc3d) ----
  let desiredTarget = null, desiredPos = null;            // cibles d'interpolation de la caméra
  let focusLerp = 0.28;
  let focusedKey = null;
  const fullTarget = controls.target.clone();             // vue de départ (pour revenir)
  const fullPos = camera.position.clone();
  function focusOrganByKey(key, opts) {
    opts = opts || {};
    const box = organBox[key];
    if (!box) return false;
    const c = box.getCenter(new THREE.Vector3());
    const s = box.getSize(new THREE.Vector3());
    const od = Math.max(s.x, s.y, s.z) || md * 0.2;
    const dir = camera.position.clone().sub(controls.target);
    if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1);
    dir.normalize();
    desiredTarget = c.clone();
    desiredPos = c.clone().add(dir.multiplyScalar(od * 2.4 + md * 0.06));
    const speed = Number(opts.speed);
    focusLerp = Number.isFinite(speed) ? Math.max(0.08, Math.min(1, speed)) : 0.36;
    if (opts.instant) {
      camera.position.copy(desiredPos);
      controls.target.copy(desiredTarget);
      desiredPos = null;
      desiredTarget = null;
    }
    focusedKey = key;
    // surligne l'étiquette de l'organe visé
    if (spec.highlight) {
      labelItems.forEach(it => {
        const on = it.key === key;
        it.el.style.color = on ? '#fff7cc' : '#fde68a';
        it.el.style.borderColor = on ? '#fbbf24' : '#38bdf8';
        it.line.setAttribute('stroke', on ? '#fbbf24' : '#38bdf8');
        it.line.setAttribute('stroke-width', on ? '2' : '1.3');
      });
    }
    return true;
  }
  function resetView3D() {
    desiredTarget = fullTarget.clone();
    desiredPos = fullPos.clone();
    focusedKey = null;
    labelItems.forEach(it => { it.el.style.color = '#fde68a'; it.el.style.borderColor = '#38bdf8'; it.line.setAttribute('stroke', '#38bdf8'); it.line.setAttribute('stroke-width', '1.3'); });
  }
  if (Object.keys(organBox).length) {
    window.__cc3d = { focusOrgan: focusOrganByKey, resetView: resetView3D, organs: Object.keys(organBox) };
  }

  let alive = true;
  let raf = 0;
  let wasSpeaking = false;
  let lastT = performance.now();
  const GLOW_HEX = 0xffcf6b;   // halo chaud (ambre) quand le prof parle
  (function loop() {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    // Quand le prof PARLE de l'objet (window.__cc3dSpeaking) : le modèle s'illumine (glow ambre
    // pulsé), respire légèrement (pulse d'échelle) et tourne un peu plus vite → il "réagit".
    const speaking = !!(spec.highlight && typeof window !== 'undefined' && window.__cc3dSpeaking);
    if (speaking) {
      const p = 0.5 + 0.5 * Math.sin(now / 1000 * 5);   // 0..1
      for (const g of glowMats) { g.m.emissive.setHex(GLOW_HEX); g.m.emissiveIntensity = 0.12 + 0.33 * p; }
      root.scale.setScalar(1 + 0.015 * p);
      controls.autoRotateSpeed = 2.0;
      wasSpeaking = true;
    } else if (wasSpeaking) {
      for (const g of glowMats) { g.m.emissive.setHex(g.baseHex); g.m.emissiveIntensity = g.baseInt; }
      root.scale.setScalar(1);
      controls.autoRotateSpeed = 1.1;
      wasSpeaking = false;
    }
    // Bol alimentaire : le point lumineux avance le long du tube et repart en boucle (petite
    // pause en fin de trajet), avec une pulsation d'éclat pour bien attirer l'œil.
    if (bolus && bolusCurve) {
      bolusT = (bolusT + dt * 0.09) % 1.18;   // 0..1 = trajet ; 1..1.18 = courte pause hors-tube
      const tt = Math.min(1, bolusT);
      bolusCurve.getPointAt(tt, bolus.position);
      const pulse = 0.75 + 0.35 * Math.sin(now / 110);
      bolus.scale.setScalar(bolusT > 1 ? 0.001 : pulse);   // caché pendant la pause
    }
    // Déplacement doux de la caméra vers l'organe parlé (ou retour à la vue d'ensemble).
    if (desiredPos && desiredTarget) {
      camera.position.lerp(desiredPos, focusLerp);
      controls.target.lerp(desiredTarget, focusLerp);
      if (camera.position.distanceTo(desiredPos) < md * 0.002) { desiredPos = null; desiredTarget = null; }
    }
    controls.update();
    updateLabels();
    renderer.render(scene, camera);
  })();

  const dispose = () => {
    alive = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    controls.dispose();
    if (labelLayer && labelLayer.parentNode) labelLayer.remove();
    if (trajetLine) { trajetLine.geometry.dispose(); trajetLine.material.dispose(); }
    if (bolus) { bolus.geometry.dispose(); bolus.material.dispose(); }
    if (window.__cc3d && window.__cc3d.focusOrgan === focusOrganByKey) delete window.__cc3d;
    disposeScene(scene);
    envTex.dispose();
    pmrem.dispose();
    renderer.dispose();
    if (renderer.domElement.parentNode) renderer.domElement.remove();
  };
  if (options.useGlobalDispose !== false) window.__cc3dDispose = dispose;
  return { dispose, spec, catalog };
}

export function registerSchema3DGlobals() {
  window.Schema3D = {
    fetchCatalog: fetchModelCatalog,
    getCatalog: getCatalog,
    loadModel: loadCatalogModel,
    mount: mountSchema3D
  };
  window.mount3DSchema = (container, input, options) => mountSchema3D(container, input, options);
  if (document && document.documentElement) document.documentElement.dataset.schema3d = 'ready';
}

if (typeof window !== 'undefined') registerSchema3DGlobals();
