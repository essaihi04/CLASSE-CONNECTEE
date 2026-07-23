/* =====================================================================
   LEÇONS JOUABLES AU TABLEAU — SVT 3APIC (Maroc), SEMESTRE 2
   Chaque chapitre = { id, sem, titre, etapes:[ { say, board:{title,lines,schema?} } ] }
   - "say"   : ce que l'avatar dit (voix).
   - "board" : ce qui s'écrit au tableau (titre + lignes ; "schema" = SVG dessiné).
   Style "vrai prof" : couleurs craie (r/b/g/o/p/w), termes encadrés (box),
   sous-titres (.sub), flèches, et schémas SVG colorés tracés à la main.
   Expose window.LECONS (tableau de chapitres) utilisé par index.html.
   ===================================================================== */

(function(){   // IIFE : garde les variables internes locales (pas de conflit global)

/* Vignette d'une LETTRE en très grand (boutons-images des évaluations du primaire).
   La vignette est posée sur fond blanc : la lettre est tracée en sombre. */
function LETTRE_SVG(lettre, couleur){
  return "<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'>"
    +"<text x='50' y='74' text-anchor='middle' font-size='70' font-weight='800'"
    +" font-family='Comic Sans MS, Segoe UI, sans-serif' fill='"+(couleur||'#0f172a')+"'>"+lettre+"</text></svg>";
}

/* ===================== SCHÉMAS SVG (style craie, colorés) ===================== */

/* --- structure du système nerveux : encéphale + moelle + nerfs --- */
const schemaSysteme = `
<svg width="240" height="185" viewBox="0 0 240 185">
  <defs>
    <radialGradient id="ns-brain" cx="34%" cy="26%" r="82%">
      <stop offset="0%" stop-color="#fff4e6"/><stop offset="30%" stop-color="#fdba74"/><stop offset="72%" stop-color="#c2620a"/><stop offset="100%" stop-color="#7c3d06"/>
    </radialGradient>
    <linearGradient id="ns-cord" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#7f1d1d"/><stop offset="30%" stop-color="#f87171"/><stop offset="50%" stop-color="#fee2e2"/><stop offset="70%" stop-color="#f87171"/><stop offset="100%" stop-color="#7f1d1d"/>
    </linearGradient>
    <linearGradient id="ns-nerve" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#bbf7d0"/><stop offset="100%" stop-color="#22c55e"/>
    </linearGradient>
    <radialGradient id="ns-spec" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff" stop-opacity=".9"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <filter id="ns-sh" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="4" stdDeviation="3.5" flood-color="#000" flood-opacity=".55"/>
    </filter>
    <filter id="ns-soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1"/></filter>
  </defs>
  <text x="120" y="15" fill="#fde68a" font-size="13" text-anchor="middle" font-weight="bold">Le système nerveux</text>
  <ellipse cx="112" cy="120" rx="70" ry="12" fill="#000" opacity=".25" filter="url(#ns-soft)"/>
  <path d="M104 92 q-46 6 -80 30 M120 92 q46 6 80 30 M104 128 q-40 10 -70 42 M120 128 q40 10 70 42" fill="none" stroke="url(#ns-nerve)" stroke-width="3.2" stroke-linecap="round" filter="url(#ns-sh)"/>
  <path d="M104 92 q-46 6 -80 30 M120 92 q46 6 80 30 M104 128 q-40 10 -70 42 M120 128 q40 10 70 42" fill="none" stroke="#dcfce7" stroke-width=".9" stroke-linecap="round" opacity=".7"/>
  <text x="42" y="180" fill="#86efac" font-size="11">nerfs</text>
  <ellipse cx="112" cy="52" rx="31" ry="24" fill="url(#ns-brain)" stroke="#7c3d06" stroke-width="1.4" filter="url(#ns-sh)"/>
  <path d="M92 40 q10 -7 22 -2 M90 50 q16 9 34 1 M94 60 q12 6 26 1 M96 70 q10 4 20 0 M100 33 q8 -4 16 0" fill="none" stroke="#7c3d06" stroke-width="1.7" opacity=".5" stroke-linecap="round"/>
  <ellipse cx="100" cy="40" rx="12" ry="8" fill="url(#ns-spec)" opacity=".75"/>
  <text x="150" y="48" fill="#fdba74" font-size="11">encéphale</text>
  <rect x="104" y="72" width="16" height="78" rx="8" fill="url(#ns-cord)" stroke="#7f1d1d" stroke-width="1.2" filter="url(#ns-sh)"/>
  <path d="M108 78 v66" stroke="#fff" stroke-width="1.4" opacity=".55" stroke-linecap="round"/>
  <text x="150" y="115" fill="#fca5a5" font-size="11">moelle</text>
</svg>`;

/* --- le neurone (dendrites bleu, corps orange, axone + myéline vert, message rouge) --- */
const schemaNeurone = `
<svg width="320" height="150" viewBox="0 0 320 150">
  <defs>
    <radialGradient id="ne-soma" cx="33%" cy="26%" r="80%">
      <stop offset="0%" stop-color="#fff7ed"/><stop offset="32%" stop-color="#fdba74"/><stop offset="74%" stop-color="#c2410c"/><stop offset="100%" stop-color="#7c2d12"/>
    </radialGradient>
    <radialGradient id="ne-nuc" cx="38%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#b45309"/><stop offset="100%" stop-color="#431407"/>
    </radialGradient>
    <linearGradient id="ne-axon" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/><stop offset="35%" stop-color="#cbd5e1"/><stop offset="60%" stop-color="#94a3b8"/><stop offset="100%" stop-color="#334155"/>
    </linearGradient>
    <linearGradient id="ne-mye" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#dcfce7"/><stop offset="40%" stop-color="#4ade80"/><stop offset="100%" stop-color="#14532d"/>
    </linearGradient>
    <linearGradient id="ne-dend" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#bfdbfe"/><stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
    <radialGradient id="ne-msg" cx="35%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#fecaca"/><stop offset="60%" stop-color="#ef4444"/><stop offset="100%" stop-color="#991b1b"/>
    </radialGradient>
    <radialGradient id="ne-spec" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff" stop-opacity=".95"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="ne-sh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#000" flood-opacity=".5"/></filter>
    <filter id="ne-soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.2"/></filter>
  </defs>
  <text x="160" y="15" fill="#fde68a" font-size="13" text-anchor="middle" font-weight="bold">Le neurone</text>
  <ellipse cx="150" cy="118" rx="140" ry="9" fill="#000" opacity=".22" filter="url(#ne-soft)"/>
  <path d="M62 78 l-26 -18 M58 82 l-30 0 M62 86 l-26 18 M56 70 l-22 -10 M56 94 l-22 10" fill="none" stroke="url(#ne-dend)" stroke-width="3.4" stroke-linecap="round" filter="url(#ne-sh)"/>
  <path d="M40 60 l-8 -5 M30 82 l-8 0 M40 104 l-8 5" fill="none" stroke="#93c5fd" stroke-width="2" stroke-linecap="round"/>
  <text x="6" y="50" fill="#93c5fd" font-size="10">dendrites</text>
  <rect x="108" y="77" width="152" height="9" rx="4.5" fill="url(#ne-axon)" filter="url(#ne-sh)"/>
  <rect x="108" y="78" width="152" height="2.4" rx="1.2" fill="#fff" opacity=".6"/>
  <circle cx="86" cy="82" r="24" fill="url(#ne-soma)" stroke="#7c2d12" stroke-width="1.2" filter="url(#ne-sh)"/>
  <circle cx="83" cy="80" r="9" fill="url(#ne-nuc)"/>
  <ellipse cx="77" cy="73" rx="8" ry="5" fill="url(#ne-spec)" opacity=".8"/>
  <text x="86" y="130" fill="#fdba74" font-size="10" text-anchor="middle">corps cellulaire</text>
  <rect x="126" y="72" width="24" height="19" rx="9" fill="url(#ne-mye)" stroke="#14532d" stroke-width=".8" filter="url(#ne-sh)"/>
  <rect x="168" y="72" width="24" height="19" rx="9" fill="url(#ne-mye)" stroke="#14532d" stroke-width=".8" filter="url(#ne-sh)"/>
  <rect x="210" y="72" width="24" height="19" rx="9" fill="url(#ne-mye)" stroke="#14532d" stroke-width=".8" filter="url(#ne-sh)"/>
  <path d="M130 76 h16 M172 76 h16 M214 76 h16" stroke="#f0fdf4" stroke-width="1.4" opacity=".55" stroke-linecap="round"/>
  <text x="180" y="62" fill="#86efac" font-size="9" text-anchor="middle">myéline</text>
  <text x="160" y="110" fill="#f8fafc" font-size="10" text-anchor="middle">axone</text>
  <circle cx="264" cy="81" r="7" fill="url(#ne-msg)" filter="url(#ne-sh)"/>
  <path d="M272 81 l16 0 M288 81 l-8 -5 M288 81 l-8 5" fill="none" stroke="#fca5a5" stroke-width="3"/>
  <text x="286" y="68" fill="#fca5a5" font-size="9" text-anchor="middle">message</text>
</svg>`;

/* --- trajet de l'acte réflexe (peau rouge → moelle orange → muscle) --- */
const schemaArcReflexe = `
<svg width="330" height="165" viewBox="0 0 330 165">
  <defs>
    <radialGradient id="ar-skin" cx="33%" cy="26%" r="82%"><stop offset="0%" stop-color="#fee2e2"/><stop offset="45%" stop-color="#f87171"/><stop offset="100%" stop-color="#991b1b"/></radialGradient>
    <radialGradient id="ar-cord" cx="38%" cy="26%" r="88%"><stop offset="0%" stop-color="#fff4e6"/><stop offset="45%" stop-color="#fdba74"/><stop offset="100%" stop-color="#9a3412"/></radialGradient>
    <radialGradient id="ar-mus" cx="38%" cy="26%" r="88%"><stop offset="0%" stop-color="#ecfccb"/><stop offset="45%" stop-color="#a3e635"/><stop offset="100%" stop-color="#3f6212"/></radialGradient>
    <linearGradient id="ar-nsen" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#bfdbfe"/><stop offset="100%" stop-color="#2563eb"/></linearGradient>
    <linearGradient id="ar-nmot" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#bbf7d0"/><stop offset="100%" stop-color="#16a34a"/></linearGradient>
    <radialGradient id="ar-spec" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff" stop-opacity=".9"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="ar-sh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#000" flood-opacity=".5"/></filter>
    <filter id="ar-soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.1"/></filter>
  </defs>
  <text x="165" y="15" fill="#fde68a" font-size="13" text-anchor="middle" font-weight="bold">Trajet de l'acte réflexe</text>
  <text x="30" y="44" fill="#fca5a5" font-size="11" text-anchor="middle">stimulus</text>
  <path d="M30 48 q-7 9 0 18 q7 -9 0 -18" fill="#fbbf24"/>
  <ellipse cx="38" cy="126" rx="20" ry="6" fill="#000" opacity=".22" filter="url(#ar-soft)"/>
  <circle cx="36" cy="106" r="18" fill="url(#ar-skin)" stroke="#7f1d1d" stroke-width="1.2" filter="url(#ar-sh)"/>
  <ellipse cx="30" cy="99" rx="7" ry="4.5" fill="url(#ar-spec)" opacity=".8"/>
  <text x="36" y="110" fill="#fff" font-size="9" text-anchor="middle">peau</text>
  <path d="M54 100 L128 78 M128 78 l-11 0 M128 78 l-6 9" fill="none" stroke="url(#ar-nsen)" stroke-width="4.4" stroke-linecap="round" filter="url(#ar-sh)"/>
  <text x="88" y="74" fill="#93c5fd" font-size="9" text-anchor="middle">nerf sensitif</text>
  <rect x="132" y="60" width="54" height="50" rx="13" fill="url(#ar-cord)" stroke="#7c2d12" stroke-width="1.1" filter="url(#ar-sh)"/>
  <ellipse cx="147" cy="72" rx="10" ry="6" fill="url(#ar-spec)" opacity=".7"/>
  <text x="159" y="90" fill="#7c2d12" font-size="10" text-anchor="middle">moelle</text>
  <path d="M186 86 L260 106 M260 106 l-11 -2 M260 106 l-6 9" fill="none" stroke="url(#ar-nmot)" stroke-width="4.4" stroke-linecap="round" filter="url(#ar-sh)"/>
  <text x="208" y="82" fill="#86efac" font-size="9" text-anchor="middle">nerf moteur</text>
  <ellipse cx="296" cy="128" rx="26" ry="6" fill="#000" opacity=".22" filter="url(#ar-soft)"/>
  <ellipse cx="296" cy="110" rx="26" ry="17" fill="url(#ar-mus)" stroke="#1a2e05" stroke-width="1.1" filter="url(#ar-sh)"/>
  <path d="M276 106 q20 -8 40 0 M276 112 q20 8 40 0" fill="none" stroke="#3f6212" stroke-width="1.3" opacity=".5"/>
  <ellipse cx="286" cy="103" rx="9" ry="4.5" fill="url(#ar-spec)" opacity=".7"/>
  <text x="296" y="114" fill="#1a2e05" font-size="9" text-anchor="middle">muscle</text>
  <text x="165" y="156" fill="#a5f3fc" font-size="10" text-anchor="middle">rapide • involontaire • moelle épinière</text>
</svg>`;

/* --- flexion du bras : biceps rouge (contracté) / triceps bleu (relâché) --- */
const schemaMuscle = `
<svg width="260" height="170" viewBox="0 0 260 170">
  <defs>
    <linearGradient id="mu-bone" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fff"/><stop offset="45%" stop-color="#e2e8f0"/><stop offset="100%" stop-color="#64748b"/></linearGradient>
    <radialGradient id="mu-bi" cx="42%" cy="24%" r="78%"><stop offset="0%" stop-color="#fee2e2"/><stop offset="45%" stop-color="#f87171"/><stop offset="100%" stop-color="#991b1b"/></radialGradient>
    <linearGradient id="mu-tri" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#bfdbfe"/><stop offset="50%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#1e3a8a"/></linearGradient>
    <radialGradient id="mu-spec" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff" stop-opacity=".9"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="mu-sh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#000" flood-opacity=".45"/></filter>
  </defs>
  <text x="130" y="15" fill="#fde68a" font-size="13" text-anchor="middle" font-weight="bold">Flexion du bras</text>
  <rect x="34" y="58" width="104" height="12" rx="6" fill="url(#mu-bone)" stroke="#94a3b8" stroke-width=".8" filter="url(#mu-sh)"/>
  <rect x="36" y="59.5" width="100" height="3" rx="1.5" fill="#fff" opacity=".7"/>
  <rect x="128" y="60" width="12" height="82" rx="6" transform="rotate(-24 134 101)" fill="url(#mu-bone)" stroke="#94a3b8" stroke-width=".8" filter="url(#mu-sh)"/>
  <circle cx="134" cy="64" r="8" fill="#f1f5f9" stroke="#a5f3fc" stroke-width="2"/>
  <text x="146" y="54" fill="#a5f3fc" font-size="9">articulation</text>
  <path d="M50 58 Q94 16 126 56 Q96 40 50 58 Z" fill="url(#mu-bi)" stroke="#7f1d1d" stroke-width="1.2" filter="url(#mu-sh)"/>
  <path d="M58 50 Q90 30 118 50" fill="none" stroke="#fff" stroke-width="1.4" opacity=".45"/>
  <ellipse cx="80" cy="42" rx="14" ry="7" fill="url(#mu-spec)" opacity=".7"/>
  <text x="46" y="26" fill="#fca5a5" font-size="10">biceps (contracté)</text>
  <path d="M50 76 Q92 98 126 74" fill="none" stroke="url(#mu-tri)" stroke-width="7.5" stroke-linecap="round" filter="url(#mu-sh)"/>
  <path d="M52 77 Q92 96 124 75" fill="none" stroke="#dbeafe" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>
  <text x="40" y="124" fill="#93c5fd" font-size="10">triceps (relâché)</text>
  <text x="130" y="160" fill="#86efac" font-size="10" text-anchor="middle">muscles antagonistes</text>
</svg>`;

/* --- les 4 types de microbes, chacun sa couleur --- */
const schemaMicrobes = `
<svg width="310" height="130" viewBox="0 0 310 130">
  <defs>
    <radialGradient id="mi-bac" cx="34%" cy="26%" r="85%"><stop offset="0%" stop-color="#ecfccb"/><stop offset="45%" stop-color="#84cc16"/><stop offset="100%" stop-color="#3f6212"/></radialGradient>
    <radialGradient id="mi-vir" cx="34%" cy="26%" r="85%"><stop offset="0%" stop-color="#fee2e2"/><stop offset="45%" stop-color="#f87171"/><stop offset="100%" stop-color="#991b1b"/></radialGradient>
    <radialGradient id="mi-cha" cx="34%" cy="20%" r="95%"><stop offset="0%" stop-color="#fff4e6"/><stop offset="45%" stop-color="#fdba74"/><stop offset="100%" stop-color="#9a3412"/></radialGradient>
    <radialGradient id="mi-pro" cx="34%" cy="26%" r="85%"><stop offset="0%" stop-color="#dbeafe"/><stop offset="45%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#1e3a8a"/></radialGradient>
    <radialGradient id="mi-spec" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff" stop-opacity=".95"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="mi-sh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="2.4" flood-color="#000" flood-opacity=".45"/></filter>
    <filter id="mi-soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1"/></filter>
  </defs>
  <text x="155" y="15" fill="#fde68a" font-size="13" text-anchor="middle" font-weight="bold">Les types de microbes</text>
  <ellipse cx="46" cy="79" rx="28" ry="5" fill="#000" opacity=".2" filter="url(#mi-soft)"/>
  <ellipse cx="46" cy="62" rx="30" ry="13" fill="url(#mi-bac)" stroke="#1a2e05" stroke-width="1.1" filter="url(#mi-sh)"/>
  <ellipse cx="36" cy="56" rx="9" ry="4" fill="url(#mi-spec)" opacity=".85"/>
  <text x="46" y="100" fill="#86efac" font-size="10" text-anchor="middle">bactérie</text>
  <ellipse cx="124" cy="79" rx="16" ry="4.5" fill="#000" opacity=".2" filter="url(#mi-soft)"/>
  <path d="M124 44 l0 -8 M124 76 l0 8 M108 60 l-8 0 M140 60 l8 0 M112 48 l-6 -6 M136 48 l6 -6 M112 72 l-6 6 M136 72 l6 6" stroke="#dc2626" stroke-width="2.6" stroke-linecap="round"/>
  <circle cx="124" cy="60" r="16" fill="url(#mi-vir)" stroke="#7f1d1d" stroke-width="1.1" filter="url(#mi-sh)"/>
  <ellipse cx="118" cy="54" rx="6" ry="3.5" fill="url(#mi-spec)" opacity=".8"/>
  <text x="124" y="100" fill="#fca5a5" font-size="10" text-anchor="middle">virus</text>
  <path d="M182 64 q16 -30 32 0 z" fill="url(#mi-cha)" stroke="#7c2d12" stroke-width="1.1" filter="url(#mi-sh)"/>
  <rect x="196" y="64" width="4" height="16" rx="2" fill="#7c2d12"/>
  <ellipse cx="194" cy="54" rx="7" ry="3" fill="url(#mi-spec)" opacity=".7"/>
  <text x="198" y="100" fill="#fdba74" font-size="10" text-anchor="middle">champignon</text>
  <path d="M252 62 q-8 -20 12 -22 q22 -2 20 16 q-2 18 -18 14 q-16 -2 -14 -8 z" fill="url(#mi-pro)" stroke="#1e3a8a" stroke-width="1.1" filter="url(#mi-sh)"/>
  <circle cx="266" cy="56" r="5" fill="#1e3a8a"/>
  <ellipse cx="260" cy="48" rx="6" ry="3" fill="url(#mi-spec)" opacity=".75"/>
  <text x="268" y="100" fill="#93c5fd" font-size="10" text-anchor="middle">protozoaire</text>
</svg>`;

/* --- chaîne : microbe → contamination → infection --- */
const schemaContamination = `
<svg width="310" height="100" viewBox="0 0 310 100">
  <defs>
    <linearGradient id="co-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#dbeafe"/><stop offset="45%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#1e3a8a"/></linearGradient>
    <linearGradient id="co-o" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fff4e6"/><stop offset="45%" stop-color="#fb923c"/><stop offset="100%" stop-color="#9a3412"/></linearGradient>
    <linearGradient id="co-r" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fee2e2"/><stop offset="45%" stop-color="#f87171"/><stop offset="100%" stop-color="#991b1b"/></linearGradient>
    <filter id="co-sh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000" flood-opacity=".5"/></filter>
  </defs>
  <text x="155" y="15" fill="#fde68a" font-size="13" text-anchor="middle" font-weight="bold">Comment tombe-t-on malade ?</text>
  <rect x="8" y="40" width="84" height="40" rx="11" fill="url(#co-b)" stroke="#1e3a8a" stroke-width="1" filter="url(#co-sh)"/>
  <rect x="13" y="44" width="74" height="10" rx="5" fill="#fff" opacity=".22"/>
  <text x="50" y="58" fill="#fff" font-size="10" text-anchor="middle">microbe</text>
  <text x="50" y="71" fill="#dbeafe" font-size="9" text-anchor="middle">(air, eau…)</text>
  <path d="M96 60 l22 0 M118 60 l-8 -5 M118 60 l-8 5" fill="none" stroke="#fde68a" stroke-width="3.4" stroke-linecap="round"/>
  <rect x="120" y="40" width="90" height="40" rx="11" fill="url(#co-o)" stroke="#7c2d12" stroke-width="1" filter="url(#co-sh)"/>
  <rect x="125" y="44" width="80" height="10" rx="5" fill="#fff" opacity=".25"/>
  <text x="165" y="64" fill="#7c2d12" font-size="10" text-anchor="middle">contamination</text>
  <path d="M214 60 l22 0 M236 60 l-8 -5 M236 60 l-8 5" fill="none" stroke="#fde68a" stroke-width="3.4" stroke-linecap="round"/>
  <rect x="238" y="40" width="64" height="40" rx="11" fill="url(#co-r)" stroke="#7f1d1d" stroke-width="1" filter="url(#co-sh)"/>
  <rect x="243" y="44" width="54" height="10" rx="5" fill="#fff" opacity=".22"/>
  <text x="270" y="64" fill="#fff" font-size="10" text-anchor="middle">infection</text>
</svg>`;

/* --- la phagocytose (phagocyte bleu, microbe rouge) --- */
const schemaPhagocytose = `
<svg width="330" height="130" viewBox="0 0 330 130">
  <defs>
    <radialGradient id="ph-cell" cx="34%" cy="26%" r="85%"><stop offset="0%" stop-color="#eff6ff"/><stop offset="45%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#1d4ed8"/></radialGradient>
    <radialGradient id="ph-mic" cx="35%" cy="28%" r="82%"><stop offset="0%" stop-color="#fee2e2"/><stop offset="55%" stop-color="#f87171"/><stop offset="100%" stop-color="#991b1b"/></radialGradient>
    <radialGradient id="ph-spec" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff" stop-opacity=".9"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="ph-sh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".45"/></filter>
  </defs>
  <text x="165" y="15" fill="#fde68a" font-size="13" text-anchor="middle" font-weight="bold">La phagocytose</text>
  <path d="M26 78 q-14 -26 14 -32 q28 -8 28 16 q14 0 8 20 q-6 20 -24 14 q-24 6 -26 -18 z" fill="url(#ph-cell)" stroke="#1e3a8a" stroke-width="1.2" filter="url(#ph-sh)"/>
  <circle cx="70" cy="56" r="6" fill="url(#ph-mic)"/>
  <ellipse cx="36" cy="52" rx="8" ry="5" fill="url(#ph-spec)" opacity=".75"/>
  <text x="42" y="114" fill="#a5f3fc" font-size="9" text-anchor="middle">1. approche</text>
  <circle cx="158" cy="70" r="26" fill="url(#ph-cell)" stroke="#1e3a8a" stroke-width="1.2" filter="url(#ph-sh)"/>
  <circle cx="158" cy="70" r="6" fill="url(#ph-mic)"/>
  <ellipse cx="148" cy="60" rx="9" ry="5.5" fill="url(#ph-spec)" opacity=".7"/>
  <text x="158" y="114" fill="#a5f3fc" font-size="9" text-anchor="middle">2. ingestion</text>
  <circle cx="278" cy="70" r="26" fill="url(#ph-cell)" stroke="#1e3a8a" stroke-width="1.2" filter="url(#ph-sh)"/>
  <ellipse cx="268" cy="60" rx="9" ry="5.5" fill="url(#ph-spec)" opacity=".7"/>
  <path d="M271 63 l14 14 M285 63 l-14 14" stroke="#22c55e" stroke-width="3.4" stroke-linecap="round"/>
  <text x="278" y="114" fill="#a5f3fc" font-size="9" text-anchor="middle">3. destruction</text>
  <path d="M98 68 l26 0 M124 68 l-8 -5 M124 68 l-8 5" fill="none" stroke="#fde68a" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M192 68 l52 0 M244 68 l-8 -5 M244 68 l-8 5" fill="none" stroke="#fde68a" stroke-width="3.4" stroke-linecap="round"/>
</svg>`;

/* --- anticorps (clé) / antigène (serrure) : reconnaissance spécifique --- */
const schemaCleSerrure = `
<svg width="260" height="130" viewBox="0 0 260 130">
  <defs>
    <radialGradient id="cs-mic" cx="34%" cy="26%" r="85%"><stop offset="0%" stop-color="#fee2e2"/><stop offset="45%" stop-color="#f87171"/><stop offset="100%" stop-color="#991b1b"/></radialGradient>
    <linearGradient id="cs-ab" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#bbf7d0"/><stop offset="50%" stop-color="#22c55e"/><stop offset="100%" stop-color="#14532d"/></linearGradient>
    <radialGradient id="cs-spec" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff" stop-opacity=".9"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="cs-sh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#000" flood-opacity=".45"/></filter>
  </defs>
  <text x="130" y="15" fill="#fde68a" font-size="12" text-anchor="middle" font-weight="bold">Anticorps = clé / antigène = serrure</text>
  <path d="M64 46 l0 -12 M92 74 l12 0 M64 102 l0 12 M36 74 l-12 0" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/>
  <circle cx="64" cy="74" r="28" fill="url(#cs-mic)" stroke="#7f1d1d" stroke-width="1.2" filter="url(#cs-sh)"/>
  <rect x="58" y="22" width="12" height="9" rx="2" fill="#ef4444"/>
  <ellipse cx="53" cy="63" rx="10" ry="6" fill="url(#cs-spec)" opacity=".8"/>
  <text x="64" y="124" fill="#fca5a5" font-size="9" text-anchor="middle">microbe (antigène)</text>
  <path d="M186 90 l0 -26 M186 64 l-14 -16 M186 64 l14 -16" stroke="url(#cs-ab)" stroke-width="6.5" fill="none" stroke-linecap="round" filter="url(#cs-sh)"/>
  <circle cx="186" cy="92" r="4.5" fill="#22c55e" stroke="#14532d" stroke-width="1"/>
  <text x="186" y="124" fill="#86efac" font-size="9" text-anchor="middle">anticorps</text>
  <line x1="100" y1="68" x2="164" y2="56" stroke="#a5f3fc" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="132" y="46" fill="#a5f3fc" font-size="9" text-anchor="middle">spécifique</text>
</svg>`;

/* --- vaccination : microbe affaibli → anticorps + mémoire (préventif) --- */
const schemaVaccination = `
<svg width="310" height="145" viewBox="0 0 310 145">
  <defs>
    <linearGradient id="va-mic" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fff4e6"/><stop offset="45%" stop-color="#fb923c"/><stop offset="100%" stop-color="#9a3412"/></linearGradient>
    <radialGradient id="va-body" cx="38%" cy="26%" r="85%"><stop offset="0%" stop-color="#f0fdf4"/><stop offset="45%" stop-color="#4ade80"/><stop offset="100%" stop-color="#14532d"/></radialGradient>
    <radialGradient id="va-spec" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff" stop-opacity=".9"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="va-sh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".45"/></filter>
  </defs>
  <text x="155" y="15" fill="#fde68a" font-size="13" text-anchor="middle" font-weight="bold">La vaccination (préventive)</text>
  <rect x="14" y="48" width="46" height="18" rx="5" fill="url(#va-mic)" stroke="#7c2d12" stroke-width=".9" filter="url(#va-sh)"/>
  <rect x="17" y="50" width="40" height="4" rx="2" fill="#fff" opacity=".35"/>
  <text x="37" y="42" fill="#fdba74" font-size="9" text-anchor="middle">microbe affaibli</text>
  <path d="M62 57 l24 6 M86 63 l-8 -1 M86 63 l-3 7" fill="none" stroke="#fde68a" stroke-width="3.4" stroke-linecap="round"/>
  <circle cx="165" cy="84" r="42" fill="url(#va-body)" stroke="#14532d" stroke-width="1.2" filter="url(#va-sh)"/>
  <ellipse cx="150" cy="66" rx="16" ry="9" fill="url(#va-spec)" opacity=".7"/>
  <path d="M154 78 l0 -16 M154 62 l-6 7 M154 62 l6 7 M178 86 l0 -16 M178 70 l-6 7 M178 70 l6 7" stroke="#bbf7d0" stroke-width="3" fill="none" stroke-linecap="round"/>
  <text x="165" y="110" fill="#dcfce7" font-size="9" text-anchor="middle">anticorps</text>
  <text x="165" y="124" fill="#a5f3fc" font-size="9" text-anchor="middle">+ mémoire</text>
  <text x="260" y="80" fill="#fca5a5" font-size="10" text-anchor="middle">protégé</text>
  <text x="260" y="94" fill="#fca5a5" font-size="10" text-anchor="middle">à l'avance</text>
</svg>`;

/* --- sérothérapie : anticorps déjà prêts → action rapide (curatif) --- */
const schemaSerum = `
<svg width="310" height="130" viewBox="0 0 310 130">
  <defs>
    <linearGradient id="se-ab" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#dcfce7"/><stop offset="45%" stop-color="#22c55e"/><stop offset="100%" stop-color="#14532d"/></linearGradient>
    <radialGradient id="se-body" cx="38%" cy="26%" r="85%"><stop offset="0%" stop-color="#fee2e2"/><stop offset="45%" stop-color="#f87171"/><stop offset="100%" stop-color="#7f1d1d"/></radialGradient>
    <radialGradient id="se-spec" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff" stop-opacity=".85"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="se-sh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".45"/></filter>
  </defs>
  <text x="155" y="15" fill="#fde68a" font-size="13" text-anchor="middle" font-weight="bold">La sérothérapie (curative)</text>
  <rect x="14" y="46" width="50" height="18" rx="5" fill="url(#se-ab)" stroke="#14532d" stroke-width=".9" filter="url(#se-sh)"/>
  <path d="M22 55 l4 -4 M32 55 l4 -4 M42 55 l4 -4 M52 55 l4 -4" fill="none" stroke="#f0fdf4" stroke-width="2"/>
  <text x="40" y="40" fill="#86efac" font-size="9" text-anchor="middle">anticorps prêts</text>
  <path d="M66 55 l24 6 M90 61 l-8 -1 M90 61 l-3 7" fill="none" stroke="#fde68a" stroke-width="3.4" stroke-linecap="round"/>
  <circle cx="172" cy="76" r="36" fill="url(#se-body)" stroke="#7f1d1d" stroke-width="1.2" filter="url(#se-sh)"/>
  <ellipse cx="159" cy="60" rx="14" ry="8" fill="url(#se-spec)" opacity=".65"/>
  <text x="172" y="72" fill="#fff" font-size="10" text-anchor="middle">malade</text>
  <text x="172" y="88" fill="#fecaca" font-size="9" text-anchor="middle">déjà infecté</text>
  <text x="264" y="72" fill="#86efac" font-size="11" text-anchor="middle">action</text>
  <text x="264" y="88" fill="#86efac" font-size="11" text-anchor="middle">rapide !</text>
</svg>`;

/* --- allergie : substance inoffensive → réaction excessive --- */
const schemaAllergie = `
<svg width="290" height="130" viewBox="0 0 290 130">
  <defs>
    <radialGradient id="al-pol" cx="34%" cy="26%" r="85%"><stop offset="0%" stop-color="#dbeafe"/><stop offset="45%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#1e3a8a"/></radialGradient>
    <radialGradient id="al-re" cx="40%" cy="26%" r="85%"><stop offset="0%" stop-color="#fff1f2"/><stop offset="45%" stop-color="#fb7185"/><stop offset="100%" stop-color="#991b1b"/></radialGradient>
    <radialGradient id="al-spec" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff" stop-opacity=".9"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="al-sh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".45"/></filter>
  </defs>
  <text x="145" y="15" fill="#fde68a" font-size="13" text-anchor="middle" font-weight="bold">L'allergie</text>
  <circle cx="44" cy="62" r="15" fill="url(#al-pol)" stroke="#1e3a8a" stroke-width="1.2" filter="url(#al-sh)"/>
  <ellipse cx="39" cy="56" rx="6" ry="3.5" fill="url(#al-spec)" opacity=".8"/>
  <text x="44" y="94" fill="#93c5fd" font-size="9" text-anchor="middle">pollen</text>
  <text x="44" y="106" fill="#93c5fd" font-size="8" text-anchor="middle">(inoffensif)</text>
  <path d="M62 62 l30 0 M92 62 l-8 -5 M92 62 l-8 5" fill="none" stroke="#fde68a" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M150 28 l9 24 l24 0 l-19 15 l9 24 l-23 -15 l-23 15 l9 -24 l-19 -15 l24 0 z" fill="url(#al-re)" stroke="#7f1d1d" stroke-width="1.3" filter="url(#al-sh)"/>
  <text x="150" y="70" fill="#fff" font-size="9" text-anchor="middle">réaction</text>
  <text x="244" y="58" fill="#fca5a5" font-size="10" text-anchor="middle">excessive</text>
  <text x="244" y="74" fill="#fca5a5" font-size="9" text-anchor="middle">du corps</text>
</svg>`;

/* --- de l'aliment au nutriment (gros morceau → petits nutriments) --- */
const schemaTransfoAliment = `
<svg width="340" height="140" viewBox="0 0 340 140" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tr3-crust" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f7d59d"/><stop offset="42%" stop-color="#e0a458"/><stop offset="80%" stop-color="#b26a24"/><stop offset="100%" stop-color="#7c4712"/></linearGradient>
    <linearGradient id="tr3-crumb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fff3d4"/><stop offset="100%" stop-color="#f0cd93"/></linearGradient>
    <radialGradient id="tr3-enz" cx="34%" cy="26%" r="82%"><stop offset="0%" stop-color="#e6fdef"/><stop offset="40%" stop-color="#4ade9a"/><stop offset="78%" stop-color="#12a56b"/><stop offset="100%" stop-color="#065f46"/></radialGradient>
    <radialGradient id="tr3-glu" cx="32%" cy="24%" r="88%"><stop offset="0%" stop-color="#ffffff"/><stop offset="38%" stop-color="#8bf0b4"/><stop offset="80%" stop-color="#22c55e"/><stop offset="100%" stop-color="#14532d"/></radialGradient>
    <radialGradient id="tr3-spec" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff" stop-opacity=".95"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="tr3-sh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="2.6" flood-color="#000" flood-opacity=".5"/></filter>
    <filter id="tr3-crumbtex" x="-15%" y="-15%" width="130%" height="130%">
      <feTurbulence type="fractalNoise" baseFrequency="0.7 0.85" numOctaves="2" seed="4" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.52  0 0 0 0 0.31  0 0 0 0 0.06  0 0 0 0.5 0" result="spots"/>
      <feComposite in="spots" in2="SourceAlpha" operator="in" result="clip"/>
      <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="clip"/></feMerge>
    </filter>
  </defs>
  <text x="170" y="15" fill="#fde68a" font-size="13" text-anchor="middle" font-weight="bold">De l'aliment au nutriment</text>
  <g class="hot" data-name="Aliment" data-info="Un gros morceau de nourriture (ici du pain), bien trop gros pour passer directement dans le sang.">
    <title>Aliment — clique pour en savoir plus</title>
    <ellipse cx="60" cy="104" rx="46" ry="7" fill="#000" opacity=".28"/>
    <path d="M18 92 V60 Q18 40 46 40 H74 Q102 40 102 60 V92 Q102 100 92 100 H28 Q18 100 18 92 Z" fill="url(#tr3-crust)" stroke="#6e3f0f" stroke-width="1.4" filter="url(#tr3-sh)"/>
    <path d="M24 88 V64 Q24 50 46 50 H74 Q96 50 96 64 V88 Q96 94 90 94 H30 Q24 94 24 88 Z" fill="url(#tr3-crumb)" filter="url(#tr3-crumbtex)"/>
    <path d="M22 62 Q60 52 98 62" fill="none" stroke="#6e3f0f" stroke-width="1.2" opacity=".45"/>
    <ellipse cx="40" cy="58" rx="15" ry="6" fill="url(#tr3-spec)" opacity=".65"/>
    <ellipse cx="42" cy="47" rx="3" ry="1.4" fill="#fff6df"/><ellipse cx="58" cy="45" rx="3" ry="1.4" fill="#fff6df"/><ellipse cx="72" cy="47" rx="3" ry="1.4" fill="#fff6df"/>
    <text x="60" y="122" fill="#fbbf24" font-size="10" text-anchor="middle">aliment (gros morceau)</text>
  </g>
  <g class="hot" data-name="Digestion" data-info="Les sucs digestifs (enzymes) découpent l'aliment comme des ciseaux, jusqu'à obtenir de tout petits nutriments.">
    <title>Digestion — clique pour en savoir plus</title>
    <path d="M112 58 h20 M132 58 l-8 -4 M132 58 l-8 4" fill="none" stroke="#fde68a" stroke-width="3" stroke-linecap="round"/>
    <path d="M150 72 A16 16 0 1 0 150 40 L150 56 Z" fill="url(#tr3-enz)" stroke="#065f46" stroke-width="1.1" filter="url(#tr3-sh)"/>
    <circle cx="150" cy="56" r="16" fill="none" stroke="#a7f3d0" stroke-width=".8" opacity=".5"/>
    <ellipse cx="143" cy="48" rx="6" ry="3.4" fill="url(#tr3-spec)" opacity=".8"/>
    <circle cx="145" cy="50" r="2" fill="#052e2b"/>
    <path d="M168 50 l7 -4 M170 58 l8 0 M168 66 l7 4" stroke="#fbbf24" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
    <text x="156" y="100" fill="#a5f3fc" font-size="10" text-anchor="middle">digestion</text>
    <text x="156" y="112" fill="#93c5fd" font-size="9" text-anchor="middle">(sucs / enzymes)</text>
  </g>
  <g class="hot" data-name="Nutriments" data-info="De tout petits éléments (glucose, acides aminés, sels minéraux, eau) assez fins pour passer dans le sang.">
    <title>Nutriments — clique pour en savoir plus</title>
    <path d="M188 58 h20 M208 58 l-8 -4 M208 58 l-8 4" fill="none" stroke="#fde68a" stroke-width="3" stroke-linecap="round"/>
    <g stroke="#14532d" stroke-width="1" filter="url(#tr3-sh)">
      <polygon points="238,42 247,47 247,59 238,64 229,59 229,47" fill="url(#tr3-glu)"/>
      <polygon points="272,50 281,55 281,67 272,72 263,67 263,55" fill="url(#tr3-glu)"/>
      <polygon points="244,70 253,75 253,87 244,92 235,87 235,75" fill="url(#tr3-glu)"/>
      <polygon points="300,44 307,48 307,58 300,62 293,58 293,48" fill="url(#tr3-glu)"/>
    </g>
    <circle cx="235" cy="48" r="2.2" fill="#fff" opacity=".85"/><circle cx="269" cy="56" r="2.2" fill="#fff" opacity=".85"/><circle cx="297" cy="49" r="1.8" fill="#fff" opacity=".8"/>
    <text x="272" y="112" fill="#86efac" font-size="11" font-weight="bold" text-anchor="middle">nutriments</text>
  </g>
</svg>`;

/* --- le tube digestif : trajet des aliments (bouche → gros intestin) --- */
const schemaTubeDigestif = `
<svg width="270" height="300" viewBox="0 0 270 300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="dg3-eso" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#a8524a"/><stop offset="50%" stop-color="#e79b8e"/><stop offset="100%" stop-color="#a8524a"/></linearGradient>
    <radialGradient id="dg3-sto" cx="36%" cy="24%" r="88%"><stop offset="0%" stop-color="#ffe0d8"/><stop offset="38%" stop-color="#ef9a92"/><stop offset="74%" stop-color="#c14b44"/><stop offset="100%" stop-color="#7a1f1c"/></radialGradient>
    <radialGradient id="dg3-liver" cx="34%" cy="24%" r="92%"><stop offset="0%" stop-color="#b06a60"/><stop offset="42%" stop-color="#8a3a34"/><stop offset="78%" stop-color="#5c201c"/><stop offset="100%" stop-color="#360f0d"/></radialGradient>
    <linearGradient id="dg3-si" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#9a5a2a"/><stop offset="28%" stop-color="#e6ac74"/><stop offset="52%" stop-color="#f7cea2"/><stop offset="74%" stop-color="#e6ac74"/><stop offset="100%" stop-color="#9a5a2a"/></linearGradient>
    <linearGradient id="dg3-colon" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#7a5024"/><stop offset="30%" stop-color="#c79553"/><stop offset="52%" stop-color="#e2be86"/><stop offset="74%" stop-color="#c79553"/><stop offset="100%" stop-color="#7a5024"/></linearGradient>
    <radialGradient id="dg3-panc" cx="36%" cy="26%" r="90%"><stop offset="0%" stop-color="#f5e39a"/><stop offset="45%" stop-color="#d3a747"/><stop offset="100%" stop-color="#8a5f14"/></radialGradient>
    <radialGradient id="dg3-gall" cx="36%" cy="26%" r="88%"><stop offset="0%" stop-color="#c6ea9a"/><stop offset="50%" stop-color="#7fb23f"/><stop offset="100%" stop-color="#3f6212"/></radialGradient>
    <radialGradient id="dg3-spec" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff" stop-opacity=".9"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="dg3-sh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="1" dy="3" stdDeviation="2.4" flood-color="#000" flood-opacity=".5"/></filter>
    <filter id="dg3-organic" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.03 0.05" numOctaves="2" seed="9" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" xChannelSelector="R" yChannelSelector="G"/></filter>
    <filter id="dg3-tex" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency="0.25" numOctaves="2" seed="3" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.16 0" result="d"/><feComposite in="d" in2="SourceAlpha" operator="in" result="c"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="c"/></feMerge></filter>
  </defs>
  <text x="135" y="15" fill="#fde68a" font-size="13" text-anchor="middle" font-weight="bold">L'appareil digestif</text>

  <!-- silhouette du corps -->
  <circle cx="135" cy="34" r="17" fill="rgba(255,255,255,.05)" stroke="rgba(148,163,184,.28)" stroke-width="1.3"/>
  <path d="M104 52 C78 66 74 118 78 154 C82 206 100 258 122 286 L150 286 C172 258 190 206 194 154 C198 118 194 66 168 52 Z" fill="rgba(255,255,255,.045)" stroke="rgba(148,163,184,.28)" stroke-width="1.3"/>

  <!-- GROS INTESTIN (cadre colique, dessiné derrière) -->
  <g class="hot" data-name="Gros intestin" data-info="Il entoure l'intestin grêle : il récupère l'eau restante et rassemble les déchets qui seront éliminés.">
    <title>Gros intestin — clique pour en savoir plus</title>
    <path d="M92 250 L92 196 Q92 178 108 178 L118 178 M92 196 Q92 182 100 182 L164 182 Q176 182 176 196 L176 250"
          fill="none" stroke="url(#dg3-colon)" stroke-width="15" stroke-linecap="round" filter="url(#dg3-sh)"/>
    <path d="M176 250 L176 196 Q176 180 162 180 L104 180 Q92 180 92 196 L92 250" fill="none" stroke="url(#dg3-colon)" stroke-width="15" stroke-linecap="round" filter="url(#dg3-tex)"/>
    <!-- haustrations (sacculations) -->
    <g stroke="#5f3e18" stroke-width="1.2" opacity=".55" fill="none">
      <path d="M85 200 h14 M85 214 h14 M85 228 h14 M85 242 h14"/>
      <path d="M169 200 h14 M169 214 h14 M169 228 h14 M169 242 h14"/>
      <path d="M108 173 v14 M126 173 v14 M144 173 v14"/>
    </g>
    <!-- caecum -->
    <ellipse cx="176" cy="252" rx="9" ry="8" fill="url(#dg3-colon)" stroke="#5f3e18" stroke-width="1" filter="url(#dg3-sh)"/>
    <text x="182" y="238" fill="#e0b878" font-size="10">gros intestin</text>
  </g>

  <!-- INTESTIN GRELE (pelote de anses, au centre) -->
  <g class="hot" data-name="Intestin grêle" data-info="Un très long tuyau replié (6 à 7 m !). C'est ici que les nutriments passent dans le sang grâce aux villosités : l'absorption.">
    <title>Intestin grêle — clique pour en savoir plus</title>
    <path d="M150 176 C176 178 176 190 150 192 C122 194 120 206 148 208 C176 210 176 222 150 224 C124 226 122 238 150 240 C172 242 170 250 150 250
             M120 188 C104 190 104 202 122 204 C138 206 138 218 120 220 C106 222 106 234 124 236"
          fill="none" stroke="url(#dg3-si)" stroke-width="10" stroke-linecap="round" filter="url(#dg3-organic)"/>
    <path d="M150 178 C172 180 172 189 150 190" fill="none" stroke="#fff2e2" stroke-width="1.4" opacity=".5" stroke-linecap="round"/>
    <text x="26" y="214" fill="#f0b57e" font-size="10">intestin grêle</text>
  </g>

  <!-- PANCREAS -->
  <g class="hot" data-name="Pancréas" data-info="Une glande annexe (couleur crème, en grappe) : il verse dans l'intestin des sucs pancréatiques qui découpent les aliments.">
    <title>Pancréas — clique pour en savoir plus</title>
    <path d="M150 162 C124 170 104 168 92 160 C112 168 132 174 152 170 C168 167 176 160 186 158 C176 156 164 158 150 162 Z" fill="url(#dg3-panc)" stroke="#7c5310" stroke-width="1.1" filter="url(#dg3-sh)"/>
    <g fill="#a5771f" opacity=".5"><circle cx="108" cy="164" r="2"/><circle cx="122" cy="167" r="2"/><circle cx="136" cy="167" r="2"/><circle cx="150" cy="166" r="2"/><circle cx="164" cy="163" r="2"/></g>
    <text x="190" y="160" fill="#f2d777" font-size="10">pancréas</text>
  </g>

  <!-- FOIE (grand, en haut à droite, recouvre l'estomac) -->
  <g class="hot" data-name="Foie" data-info="La plus grosse glande du corps : il fabrique la bile (stockée dans la vésicule) qui aide à digérer les graisses.">
    <title>Foie — clique pour en savoir plus</title>
    <path d="M146 94 C168 80 214 82 220 112 C223 130 210 146 186 148 C162 150 150 140 145 126 C132 130 120 126 116 116 C126 112 138 110 146 108 Z" fill="url(#dg3-liver)" stroke="#340d0b" stroke-width="1.3" filter="url(#dg3-sh)"/>
    <path d="M150 100 C176 90 206 92 214 112" fill="none" stroke="#c98a80" stroke-width="1.4" opacity=".5"/>
    <ellipse cx="172" cy="104" rx="16" ry="7" fill="url(#dg3-spec)" opacity=".45"/>
    <text x="200" y="98" fill="#e79b8e" font-size="10">foie</text>
  </g>
  <!-- VESICULE BILIAIRE -->
  <g class="hot" data-name="Vésicule biliaire" data-info="Petit sac vert accroché sous le foie : il stocke la bile puis la déverse dans l'intestin pour digérer les graisses.">
    <title>Vésicule biliaire — clique pour en savoir plus</title>
    <path d="M168 146 C160 150 160 162 168 164 C176 162 176 150 172 146 Z" fill="url(#dg3-gall)" stroke="#3f6212" stroke-width="1" filter="url(#dg3-sh)"/>
    <text x="176" y="176" fill="#9ccc5a" font-size="9">vésicule</text>
  </g>

  <!-- ESTOMAC (forme en J, à gauche) -->
  <g class="hot" data-name="Estomac" data-info="Il brasse les aliments (mécanique) et les mélange aux sucs gastriques (chimique) : ça forme une bouillie.">
    <title>Estomac — clique pour en savoir plus</title>
    <path d="M134 104 C110 100 90 118 90 142 C90 162 106 176 128 172 C146 169 156 154 149 143 C145 137 139 137 135 140 C142 130 145 118 138 106 C136 103 135 103 134 104 Z" fill="url(#dg3-sto)" stroke="#791d1a" stroke-width="1.3" filter="url(#dg3-organic)"/>
    <g stroke="#8f2f2a" stroke-width="1.1" opacity=".45" fill="none"><path d="M100 130 q10 -8 22 -4 M98 142 q12 -6 26 -2 M100 154 q12 -4 24 0"/></g>
    <ellipse cx="106" cy="122" rx="10" ry="6" fill="url(#dg3-spec)" opacity=".55"/>
    <text x="42" y="128" fill="#f0a49c" font-size="10">estomac</text>
  </g>

  <!-- OESOPHAGE -->
  <g class="hot" data-name="Œsophage" data-info="Le tuyau musclé qui conduit les aliments de la bouche jusqu'à l'estomac (par ondes : le péristaltisme).">
    <title>Œsophage — clique pour en savoir plus</title>
    <path d="M133 52 C132 70 131 88 133 102" fill="none" stroke="url(#dg3-eso)" stroke-width="8" stroke-linecap="round" filter="url(#dg3-sh)"/>
    <path d="M131 56 C130 72 130 88 131 100" fill="none" stroke="#f6c4b8" stroke-width="1.4" opacity=".5"/>
    <text x="150" y="74" fill="#e79b8e" font-size="10">œsophage</text>
  </g>

  <!-- BOUCHE (dents + langue) -->
  <g class="hot" data-name="Bouche" data-info="La digestion commence ici : les dents broient (mécanique) et la salive ramollit et transforme les aliments (chimique).">
    <title>Bouche — clique pour en savoir plus</title>
    <path d="M122 42 Q135 34 148 42 Q135 52 122 42 Z" fill="#7a1512" stroke="#4a0d0b" stroke-width="1"/>
    <path d="M124 41 h22" stroke="#fff" stroke-width="3.4" stroke-linecap="butt"/>
    <g fill="none" stroke="#c98" stroke-width=".5" opacity=".6"><path d="M129 39 v4 M135 39 v4 M141 39 v4"/></g>
    <path d="M126 45 Q135 50 144 45" fill="#d9736a" opacity=".8"/>
    <text x="152" y="34" fill="#f0b57e" font-size="10">bouche</text>
  </g>
</svg>`;

/* --- absorption intestinale : nutriments (villosités) → sang --- */
const schemaAbsorption = `
<svg width="320" height="188" viewBox="0 0 320 188" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ab3-vil" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffe6cf"/><stop offset="45%" stop-color="#f0ab6f"/><stop offset="100%" stop-color="#a9541f"/></linearGradient>
    <linearGradient id="ab3-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e8a97a"/><stop offset="100%" stop-color="#8a4718"/></linearGradient>
    <linearGradient id="ab3-blood" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f2607a"/><stop offset="45%" stop-color="#d61e46"/><stop offset="100%" stop-color="#6e1522"/></linearGradient>
    <radialGradient id="ab3-nut" cx="34%" cy="26%" r="86%"><stop offset="0%" stop-color="#ffffff"/><stop offset="40%" stop-color="#6ee7a8"/><stop offset="100%" stop-color="#166534"/></radialGradient>
    <radialGradient id="ab3-fat" cx="34%" cy="26%" r="86%"><stop offset="0%" stop-color="#fffbe6"/><stop offset="55%" stop-color="#fde047"/><stop offset="100%" stop-color="#a16207"/></radialGradient>
    <filter id="ab3-sh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="2.5" stdDeviation="2" flood-color="#000" flood-opacity=".42"/></filter>
    <filter id="ab3-organic" x="-25%" y="-25%" width="150%" height="150%"><feTurbulence type="fractalNoise" baseFrequency="0.05 0.09" numOctaves="2" seed="5" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.5"/></filter>
  </defs>
  <text x="160" y="15" fill="#fde68a" font-size="13" text-anchor="middle" font-weight="bold">L'absorption intestinale</text>
  <text x="160" y="29" fill="#93c5fd" font-size="9" text-anchor="middle">intérieur de l'intestin (les aliments digérés)</text>

  <!-- VILLOSITES + capillaires internes + vaisseau chylifère -->
  <g class="hot" data-name="Villosités" data-info="De tout petits replis en doigt de gant de la paroi de l'intestin grêle. Ils multiplient la surface pour absorber un maximum de nutriments.">
    <title>Villosités — clique pour en savoir plus</title>
    <rect x="18" y="104" width="284" height="20" fill="url(#ab3-wall)" filter="url(#ab3-sh)"/>
    <g filter="url(#ab3-organic)">
      <path d="M44 108 Q42 46 60 42 Q78 46 76 108 Z" fill="url(#ab3-vil)" stroke="#7c3d12" stroke-width="1"/>
      <path d="M104 108 Q102 44 120 40 Q138 44 136 108 Z" fill="url(#ab3-vil)" stroke="#7c3d12" stroke-width="1"/>
      <path d="M164 108 Q162 46 180 42 Q198 46 196 108 Z" fill="url(#ab3-vil)" stroke="#7c3d12" stroke-width="1"/>
      <path d="M224 108 Q222 44 240 40 Q258 44 256 108 Z" fill="url(#ab3-vil)" stroke="#7c3d12" stroke-width="1"/>
    </g>
    <!-- bordure en brosse (microvillosités) -->
    <g stroke="#c47a3a" stroke-width=".9" opacity=".7"><path d="M52 46 v-5 M60 44 v-5 M68 46 v-5 M112 44 v-5 M120 42 v-5 M128 44 v-5 M172 46 v-5 M180 44 v-5 M188 46 v-5 M232 44 v-5 M240 42 v-5 M248 44 v-5"/></g>
  </g>

  <!-- vaisseau chylifère central (lymphe / graisses) dans chaque villosité -->
  <g class="hot" data-name="Vaisseau chylifère" data-info="Le petit vaisseau blanc-jaune au centre de chaque villosité : il récupère les graisses digérées et les envoie dans la lymphe.">
    <title>Vaisseau chylifère — clique pour en savoir plus</title>
    <g stroke="#facc15" stroke-width="3" stroke-linecap="round" opacity=".9">
      <path d="M60 100 V54"/><path d="M120 100 V52"/><path d="M180 100 V54"/><path d="M240 100 V52"/>
    </g>
  </g>

  <!-- capillaires sanguins À L'INTÉRIEUR des villosités -->
  <g class="hot" data-name="Sang" data-info="À l'intérieur de chaque villosité, un fin réseau de capillaires récupère les nutriments, puis le sang les distribue à tout le corps.">
    <title>Sang — clique pour en savoir plus</title>
    <g fill="none" stroke="#e11d48" stroke-width="2.4" stroke-linecap="round" opacity=".92">
      <path d="M53 102 V62 Q60 52 67 62 V102"/>
      <path d="M113 102 V60 Q120 50 127 60 V102"/>
      <path d="M173 102 V62 Q180 52 187 62 V102"/>
      <path d="M233 102 V60 Q240 50 247 60 V102"/>
    </g>
    <rect x="18" y="132" width="284" height="26" rx="12" fill="url(#ab3-blood)" stroke="#6e1522" stroke-width="1" filter="url(#ab3-sh)"/>
    <rect x="22" y="136" width="276" height="4" rx="2" fill="#fff" opacity=".35"/>
    <path d="M150 145 h48 M198 145 l-8 -4 M198 145 l-8 4" fill="none" stroke="#fecaca" stroke-width="2.5" stroke-linecap="round"/>
    <text x="272" y="150" fill="#fecaca" font-size="10" text-anchor="middle">sang → corps</text>
  </g>

  <!-- NUTRIMENTS qui traversent -->
  <g class="hot" data-name="Nutriments" data-info="Ils traversent la paroi très fine des villosités puis entrent dans le sang des capillaires (le glucose, les acides aminés) ou dans le chylifère (les graisses).">
    <title>Nutriments — clique pour en savoir plus</title>
    <circle cx="60" cy="50" r="5" fill="url(#ab3-nut)"/><circle cx="120" cy="46" r="5" fill="url(#ab3-nut)"/><circle cx="180" cy="50" r="5" fill="url(#ab3-nut)"/><circle cx="240" cy="46" r="5" fill="url(#ab3-nut)"/>
    <circle cx="90" cy="44" r="4" fill="url(#ab3-fat)"/><circle cx="210" cy="42" r="4" fill="url(#ab3-fat)"/>
    <circle cx="60" cy="86" r="4.4" fill="url(#ab3-nut)"/><circle cx="180" cy="86" r="4.4" fill="url(#ab3-nut)"/>
    <path d="M60 60 v12 M60 72 l-4 -5 M60 72 l4 -5" fill="none" stroke="#22c55e" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M180 60 v12 M180 72 l-4 -5 M180 72 l4 -5" fill="none" stroke="#22c55e" stroke-width="1.8" stroke-linecap="round"/>
  </g>

  <!-- légende -->
  <circle cx="30" cy="176" r="4" fill="url(#ab3-nut)"/><text x="38" y="179" fill="#86efac" font-size="9">nutriment</text>
  <circle cx="110" cy="176" r="4" fill="url(#ab3-fat)"/><text x="118" y="179" fill="#fde047" font-size="9">graisse</text>
  <rect x="182" y="172" width="8" height="8" rx="2" fill="#e11d48"/><text x="194" y="179" fill="#fca5a5" font-size="9">capillaire (sang)</text>
</svg>`;

/* --- SIMULATION ANIMÉE : l'aliment parcourt le tube, se transforme, et les
   nutriments passent en continu dans le sang (animation SMIL, se joue en boucle) --- */
const simDigestion = `
<svg width="340" height="220" viewBox="0 0 340 220" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="sd3-food" cx="34%" cy="26%" r="86%"><stop offset="0%" stop-color="#fff2df"/><stop offset="42%" stop-color="#fb923c"/><stop offset="100%" stop-color="#9a3412"/></radialGradient>
    <radialGradient id="sd3-nut" cx="34%" cy="26%" r="86%"><stop offset="0%" stop-color="#ffffff"/><stop offset="42%" stop-color="#4ade80"/><stop offset="100%" stop-color="#166534"/></radialGradient>
    <linearGradient id="sd3-blood" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f2607a"/><stop offset="45%" stop-color="#e11d48"/><stop offset="100%" stop-color="#6e1522"/></linearGradient>
    <radialGradient id="sd3-sto" cx="38%" cy="26%" r="84%"><stop offset="0%" stop-color="#ffe0d8"/><stop offset="42%" stop-color="#ef9a92"/><stop offset="100%" stop-color="#7a1f1c"/></radialGradient>
    <linearGradient id="sd3-tube" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#9a3412"/><stop offset="30%" stop-color="#e6ac74"/><stop offset="55%" stop-color="#f7cea2"/><stop offset="100%" stop-color="#b45309"/></linearGradient>
    <filter id="sd3-sh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="2.5" stdDeviation="2" flood-color="#000" flood-opacity=".45"/></filter>
    <filter id="sd3-organic" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.04 0.06" numOctaves="2" seed="6" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.5"/></filter>
  </defs>
  <text x="170" y="15" fill="#fde68a" font-size="13" text-anchor="middle" font-weight="bold">De la bouche au sang</text>

  <!-- tube digestif (trajet) -->
  <path d="M50 52 L50 92 Q50 116 76 120" fill="none" stroke="url(#sd3-tube)" stroke-width="10" stroke-linecap="round" filter="url(#sd3-sh)"/>
  <path d="M98 140 Q112 152 128 158 L250 158" fill="none" stroke="url(#sd3-tube)" stroke-width="10" stroke-linecap="round" filter="url(#sd3-sh)"/>

  <!-- bouche + dents -->
  <ellipse cx="50" cy="46" rx="19" ry="12" fill="url(#sd3-tube)" stroke="#7c2d12" stroke-width="1.1" filter="url(#sd3-sh)"/>
  <path d="M38 42 h24" stroke="#fff" stroke-width="3" stroke-linecap="butt" opacity=".9"/>
  <text x="50" y="30" fill="#fdba74" font-size="10" text-anchor="middle">bouche</text>

  <!-- estomac (pulse = péristaltisme) -->
  <g filter="url(#sd3-organic)">
    <path d="M74 108 C96 104 116 118 116 140 C116 160 100 172 82 166 C100 160 106 148 100 138 C96 132 88 132 84 136 C92 126 92 116 84 110 C80 107 76 106 74 108 Z" fill="url(#sd3-sto)" stroke="#7a1f1c" stroke-width="1.1">
      <animateTransform attributeName="transform" type="scale" values="1;1.05;0.97;1" dur="2.2s" repeatCount="indefinite" additive="sum"/>
    </path>
  </g>
  <text x="120" y="116" fill="#f0a49c" font-size="10">estomac</text>
  <text x="168" y="150" fill="#f0b57e" font-size="10">intestin</text>

  <!-- vaisseau sanguin -->
  <rect x="150" y="190" width="170" height="16" rx="8" fill="url(#sd3-blood)" stroke="#6e1522" stroke-width="1" filter="url(#sd3-sh)"/>
  <rect x="153" y="192" width="164" height="3.5" rx="1.75" fill="#fff" opacity=".35"/>
  <text x="238" y="184" fill="#fca5a5" font-size="10" text-anchor="middle">sang</text>

  <!-- ALIMENT : parcourt le tube et rétrécit (easing spline) -->
  <circle r="11" fill="url(#sd3-food)" filter="url(#sd3-sh)">
    <animateMotion dur="5.5s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.4 0 0.6 1"
      path="M50 52 L50 92 Q50 116 76 120 Q98 138 128 158 L246 158"/>
    <animate attributeName="r" dur="5.5s" repeatCount="indefinite" values="11;11;6;3.5" keyTimes="0;0.42;0.8;1"/>
    <animate attributeName="opacity" dur="5.5s" repeatCount="indefinite" values="1;1;1;0.2" keyTimes="0;0.8;0.95;1"/>
  </circle>

  <!-- NUTRIMENTS : billes vertes qui tombent dans le sang -->
  <circle cx="196" cy="160" r="5" fill="url(#sd3-nut)"><animateMotion dur="1.6s" begin="0s" repeatCount="indefinite" calcMode="spline" keySplines="0.5 0 0.7 1" path="M0 0 L0 30"/><animate attributeName="opacity" dur="1.6s" begin="0s" repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.2;0.8;1"/></circle>
  <circle cx="220" cy="160" r="5" fill="url(#sd3-nut)"><animateMotion dur="1.6s" begin="0.55s" repeatCount="indefinite" calcMode="spline" keySplines="0.5 0 0.7 1" path="M0 0 L0 30"/><animate attributeName="opacity" dur="1.6s" begin="0.55s" repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.2;0.8;1"/></circle>
  <circle cx="244" cy="160" r="5" fill="url(#sd3-nut)"><animateMotion dur="1.6s" begin="1.1s" repeatCount="indefinite" calcMode="spline" keySplines="0.5 0 0.7 1" path="M0 0 L0 30"/><animate attributeName="opacity" dur="1.6s" begin="1.1s" repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.2;0.8;1"/></circle>

  <text x="170" y="218" fill="#86efac" font-size="10" text-anchor="middle">aliment ⟶ nutriments ⟶ sang</text>
</svg>`;

/* --- carte mentale « LES ALIMENTS » : 5 familles de nutriments + leur rôle --- */
const schemaCarteAliments = `
<svg viewBox="0 0 300 210">
  <ellipse cx="150" cy="26" rx="76" ry="19" fill="none" stroke="#fde68a" stroke-width="2.4"/>
  <text x="150" y="31" fill="#fde68a" font-size="13" text-anchor="middle" font-weight="bold">LES ALIMENTS</text>
  <line x1="150" y1="45" x2="34"  y2="90" stroke="#94a3b8" stroke-width="1.4"/>
  <line x1="150" y1="45" x2="92"  y2="90" stroke="#94a3b8" stroke-width="1.4"/>
  <line x1="150" y1="45" x2="150" y2="90" stroke="#94a3b8" stroke-width="1.4"/>
  <line x1="150" y1="45" x2="208" y2="90" stroke="#94a3b8" stroke-width="1.4"/>
  <line x1="150" y1="45" x2="266" y2="90" stroke="#94a3b8" stroke-width="1.4"/>
  <g font-size="10.5" text-anchor="middle" font-weight="bold">
    <text x="34"  y="100" fill="#93c5fd">Eau</text>
    <text x="92"  y="100" fill="#fdba74">Glucides</text>
    <text x="150" y="100" fill="#fca5a5">Protides</text>
    <text x="208" y="100" fill="#fde68a">Lipides</text>
    <text x="266" y="100" fill="#86efac">Vitamines</text>
  </g>
  <g font-size="8.5" text-anchor="middle" fill="#e2e8f0">
    <text x="34"  y="126">Hydratation</text>
    <text x="92"  y="126">Énergie</text>
    <text x="150" y="126">Construction</text>
    <text x="208" y="126">Réserve</text>
    <text x="266" y="126">Protection</text>
  </g>
</svg>`;

/* --- aliment SIMPLE (1 seul constituant) vs aliment COMPOSÉ (plusieurs) --- */
const schemaSimpleCompose = `
<svg viewBox="0 0 320 210">
  <text x="160" y="16" fill="#fde68a" font-size="13" text-anchor="middle" font-weight="bold">Simple ou composé ?</text>
  <!-- ALIMENT SIMPLE : un seul constituant -->
  <g class="hot" data-name="Aliment simple" data-info="Un aliment simple ne contient qu'un seul constituant. Exemple : le sucre raffiné est constitué de 100 % de glucides ; l'huile de 100 % de lipides.">
    <title>Aliment simple — clique pour en savoir plus</title>
    <rect x="16" y="30" width="130" height="150" rx="12" fill="#0f2a1e" stroke="#34d399" stroke-width="2"/>
    <text x="81" y="50" fill="#86efac" font-size="11" text-anchor="middle" font-weight="bold">Aliment simple</text>
    <text x="81" y="66" fill="#e2e8f0" font-size="8.5" text-anchor="middle">un seul constituant</text>
    <circle cx="81" cy="112" r="30" fill="#f59e0b" opacity="0.85"/>
    <text x="81" y="116" fill="#1f1300" font-size="10" text-anchor="middle" font-weight="bold">Glucides</text>
    <text x="81" y="164" fill="#fbbf24" font-size="9" text-anchor="middle">🍬 sucre raffiné = 100 %</text>
  </g>
  <!-- ALIMENT COMPOSÉ : plusieurs constituants -->
  <g class="hot" data-name="Aliment composé" data-info="Un aliment composé contient plusieurs constituants à la fois. Exemple : le pain, le lait ou la viande apportent des glucides, des protides, des lipides et de l'eau.">
    <title>Aliment composé — clique pour en savoir plus</title>
    <rect x="174" y="30" width="130" height="150" rx="12" fill="#2a1e0f" stroke="#f59e0b" stroke-width="2"/>
    <text x="239" y="50" fill="#fdba74" font-size="11" text-anchor="middle" font-weight="bold">Aliment composé</text>
    <text x="239" y="66" fill="#e2e8f0" font-size="8.5" text-anchor="middle">plusieurs constituants</text>
    <circle cx="216" cy="100" r="17" fill="#f59e0b" opacity="0.85"/><text x="216" y="103" fill="#1f1300" font-size="7" text-anchor="middle" font-weight="bold">Gluc.</text>
    <circle cx="262" cy="100" r="17" fill="#f87171" opacity="0.85"/><text x="262" y="103" fill="#2a0000" font-size="7" text-anchor="middle" font-weight="bold">Prot.</text>
    <circle cx="216" cy="140" r="17" fill="#fde047" opacity="0.85"/><text x="216" y="143" fill="#1f1a00" font-size="7" text-anchor="middle" font-weight="bold">Lip.</text>
    <circle cx="262" cy="140" r="17" fill="#60a5fa" opacity="0.85"/><text x="262" y="143" fill="#001a2a" font-size="7" text-anchor="middle" font-weight="bold">Eau</text>
    <text x="239" y="170" fill="#fbbf24" font-size="9" text-anchor="middle">🍞 pain · 🥛 lait · 🥩 viande</text>
  </g>
</svg>`;

/* --- MODÈLE 3D réel (bibliothèque) : appareil digestif humain, un mesh par organe ---
   Chaque organe est un mesh nommé (mouth_0, stomach_0, liver_0, intestine_*, tongue_0…). Le moteur
   (schema3d-library.js) colore chaque organe (organColor), fait tourner le modèle (autoRotate) et
   l'illumine (glow ambre + pulse) quand le prof parle de l'objet (window.__cc3dSpeaking). */
const MODEL_TUBE_DIGESTIF = "models3d/tube-digestif/model.FBX";

/* ========================= LES CHAPITRES ========================= */
window.LECONS = [

/* ============== CHAPITRE : LA DIGESTION — SÉQUENCE 1 : LES ALIMENTS (Semestre 1) ==============
   Adapté de la fiche pédagogique fournie (compétence : identifier les constituants des aliments
   et leur rôle → alimentation équilibrée). Durée ~20 min.
   Les étapes « média » (board.media) réservent une place à une IMAGE ou une VIDÉO à générer plus
   tard : tant que `src` est vide, un cadre « à générer » s'affiche (avec parfois un emoji provisoire).
   L'étape « simulation » utilise board.match : tri interactif aliment → nutriment (✔/❌ immédiat). */
{
  id:"les-aliments", sem:1,
  titre:"La digestion (0/3) : les aliments et les nutriments",
  /* ÉVALUATION : 3 quiz À ÉNONCÉ. L'élève en voit UN SEUL à la fois (tiré au hasard),
     avec un bouton « 🔄 Changer de quiz » avant de commencer (voir renderQuizChooser / index.html).
     Chaque question porte un `enonce` (texte de contexte) ; certaines ont une image (`svg` inline
     ou `img:"/uploads/…"` + `imgCaption`). */
  quizSets:[
    /* ── QUIZ 1 · Aliments simples ou composés (avec un document illustré) ── */
    { label:"Quiz 1 · Aliments simples ou composés",
      intro:"Un document et des étiquettes d'aliments : sauras-tu distinguer un aliment simple d'un aliment composé ?",
      quiz:[
        {type:'qcm',
          enonce:"Le document ci-dessous compare la composition de trois aliments : le sucre, le pain et le lait.",
          svg:"<svg viewBox='0 0 520 210' xmlns='http://www.w3.org/2000/svg' font-family='Segoe UI,sans-serif'>"
            +"<style>.n{fill:#e2e8f0;font-size:15px;font-weight:700}.k{fill:#94a3b8;font-size:12px}</style>"
            +"<rect x='14' y='20' width='150' height='170' rx='12' fill='#0f172a' stroke='#334155'/>"
            +"<rect x='185' y='20' width='150' height='170' rx='12' fill='#0f172a' stroke='#334155'/>"
            +"<rect x='356' y='20' width='150' height='170' rx='12' fill='#0f172a' stroke='#334155'/>"
            +"<text x='89' y='45' text-anchor='middle' class='n'>🍬 Sucre</text>"
            +"<text x='260' y='45' text-anchor='middle' class='n'>🍞 Pain</text>"
            +"<text x='431' y='45' text-anchor='middle' class='n'>🥛 Lait</text>"
            +"<rect x='34' y='70' width='110' height='26' rx='6' fill='#38bdf8'/><text x='89' y='88' text-anchor='middle' class='k' fill='#082f49'>Glucides 100%</text>"
            +"<rect x='205' y='70' width='55' height='26' rx='6' fill='#38bdf8'/><rect x='262' y='70' width='30' height='26' rx='6' fill='#f472b6'/><rect x='294' y='70' width='26' height='26' rx='6' fill='#60a5fa'/>"
            +"<text x='260' y='118' text-anchor='middle' class='k'>Glucides + protides + eau</text>"
            +"<rect x='376' y='70' width='40' height='26' rx='6' fill='#38bdf8'/><rect x='418' y='70' width='30' height='26' rx='6' fill='#f472b6'/><rect x='450' y='70' width='24' height='26' rx='6' fill='#fbbf24'/><rect x='476' y='70' width='20' height='26' rx='6' fill='#60a5fa'/>"
            +"<text x='431' y='118' text-anchor='middle' class='k'>Glucides + protides +</text><text x='431' y='134' text-anchor='middle' class='k'>lipides + eau + calcium</text>"
            +"<text x='89' y='150' text-anchor='middle' class='k'>1 seul constituant</text>"
            +"<text x='260' y='160' text-anchor='middle' class='k'>plusieurs constituants</text>"
            +"<text x='431' y='160' text-anchor='middle' class='k'>plusieurs constituants</text></svg>",
          imgCaption:"Composition comparée de trois aliments.",
          q:"D'après le document, quel est le seul <b>aliment simple</b> ?",
          options:["Le sucre","Le pain","Le lait"], correct:0,
          fb:"Le sucre n'a qu'un seul constituant (les glucides) : c'est un aliment simple. Le pain et le lait en ont plusieurs : ce sont des aliments composés."},
        {type:'vf',
          enonce:"Un élève affirme : « Puisque le lait contient des glucides, des protides, des lipides, de l'eau et du calcium, c'est un aliment composé. »",
          q:"Cette affirmation est-elle correcte ?",
          correct:true, fb:"Vrai : un aliment qui réunit plusieurs constituants est un aliment composé, comme le lait."},
        {type:'libre',
          enonce:"On lit sur un paquet de biscuits : « Pour 100 g : glucides 62 g, lipides 20 g, protides 7 g. »",
          q:"Cet aliment est-il simple ou composé ? Écris ta réponse en un mot.",
          attendus:["composé","compose","composee"], reponse:"un aliment composé", fb:"Il a plusieurs constituants (glucides, lipides, protides) : c'est un aliment composé."},
        {type:'qcm',
          enonce:"On dit qu'un aliment est « simple » quand il ne contient qu'un seul constituant.",
          q:"Parmi ces aliments, lequel est le plus proche d'un aliment simple ?",
          options:["L'huile (≈ 100 % lipides)","Le pain","Le lait"], correct:0,
          fb:"L'huile est presque uniquement composée de lipides : c'est un aliment simple."}
      ]},
    /* ── QUIZ 2 · Les nutriments et leurs rôles ── */
    { label:"Quiz 2 · Les nutriments et leurs rôles",
      intro:"À partir de situations de la vie courante, retrouve le rôle de chaque nutriment.",
      quiz:[
        {type:'libre',
          enonce:"Les aliments sont formés de substances plus petites qui nourrissent le corps.",
          q:"Comment appelle-t-on ces substances qui composent les aliments ? (un mot)",
          attendus:["nutriment","nutriments"], reponse:"les nutriments", fb:"Ce sont les nutriments."},
        {type:'qcm',
          enonce:"Un sportif mange un grand bol de pâtes (riche en glucides) juste avant sa course.",
          q:"Pourquoi choisit-il surtout des glucides ?",
          options:["Pour avoir de l'énergie rapidement","Pour construire ses muscles","Pour se protéger des maladies"], correct:0,
          fb:"Les glucides sont la principale source d'énergie du corps."},
        {type:'qcm',
          enonce:"Un enfant en pleine croissance doit manger des aliments riches en protides (viande, œuf, lait).",
          q:"À quoi servent surtout les protides ?",
          options:["À construire et réparer le corps","À donner uniquement de l'énergie","À protéger contre le froid"], correct:0,
          fb:"Les protides servent à construire le corps (muscles, croissance) et à le réparer."},
        {type:'association',
          enonce:"Chaque nutriment a un rôle principal dans l'organisme.",
          q:"Associe chaque nutriment à son rôle :",
          pairs:[
            {l:"Glucides", r:"donner de l'énergie"},
            {l:"Protides", r:"construire le corps"},
            {l:"Lipides", r:"réserve d'énergie"},
            {l:"Vitamines", r:"protéger l'organisme"}
          ], fb:"Glucides = énergie, protides = construction, lipides = réserve, vitamines = protection."}
      ]},
    /* ── QUIZ 3 · La digestion dans la bouche ── */
    { label:"Quiz 3 · La digestion dans la bouche",
      intro:"Une expérience simple avec une mie de pain va te faire découvrir ce qui se passe dans la bouche.",
      quiz:[
        {type:'qcm',
          enonce:"Dans la bouche, l'aliment est coupé, broyé puis mélangé à la salive avant d'être avalé.",
          q:"La mastication est assurée surtout par…",
          options:["les dents et la langue","l'estomac","le pharynx"], correct:0,
          fb:"Les dents coupent et broient l'aliment, la langue le mélange à la salive."},
        {type:'qcm',
          enonce:"Tu mâches longuement une mie de pain sans l'avaler : au bout d'un moment, elle prend un goût sucré.",
          q:"Que s'est-il passé dans ta bouche ?",
          options:["La salive a transformé l'amidon en maltose","Les protéines sont devenues de l'amidon","Les lipides se sont transformés en eau"], correct:0,
          fb:"La salive change une partie de l'amidon en maltose, un sucre : c'est la digestion chimique."},
        {type:'vf',
          enonce:"Dans la bouche, deux types de transformations agissent en même temps sur l'aliment.",
          q:"L'aliment subit à la fois une transformation mécanique et une transformation chimique.",
          correct:true, fb:"Oui : la mastication (mécanique) et l'action de la salive sur l'amidon (chimique)."},
        {type:'libre',
          enonce:"Après la mastication, l'aliment forme une boulette molle et humide, prête à être avalée.",
          q:"Comment appelle-t-on cette boulette ? (deux mots)",
          attendus:["bol alimentaire","bol"], reponse:"le bol alimentaire", fb:"C'est le bol alimentaire, ensuite conduit vers l'estomac par la déglutition."}
      ]},
  ],
  etapes:[
    /* ── SITUATION DE DÉPART (intro sans texte) : avatar GRAND et CENTRÉ, il présente le
       chapitre et fait un petit rappel de ce que les élèves savent déjà. Aucun texte au
       tableau : seulement le professeur qui accueille et introduit le cours à la voix. ── */
    { intro:true,
      say:"Bonjour à toutes et à tous, et bienvenue ! Aujourd'hui, on commence ensemble un nouveau chapitre : les aliments et la digestion. Avant de démarrer, faisons un petit rappel de ce que vous savez déjà. Chaque jour, vous mangez et vous buvez : tout ce que l'on mange ou boit, ce sont les aliments. Et vous le savez bien : sans manger, on manque vite d'énergie pour jouer, courir ou réfléchir. Gardez ça en tête, car dans ce cours nous allons découvrir ce que contiennent vraiment les aliments, et comment notre corps les transforme pour se nourrir. Vous êtes prêts ? Alors, c'est parti !",
      board:{ title:"", lines:[] } },

    /* ── PHASE 1 · SITUATION-PROBLÈME (2 min) : le petit déjeuner d'Ahmed et Sara ── */
    { phase:"situation",
      say:"Bonjour ! Regarde ce petit déjeuner. Ahmed mange seulement du pain. Sara, elle, mange du pain, un œuf, un verre de lait et une pomme. À ton avis, qui a choisi le meilleur repas, et surtout : pourquoi ? Dis-moi ce que tu en penses.",
      board:{title:"Le petit déjeuner d'Ahmed et de Sara 🍽️",
        // les lignes ne s'écrivent au tableau qu'APRÈS l'explication orale de l'avatar
        // (l'élève écoute d'abord la situation, puis découvre le récapitulatif écrit).
        linesAfterSpeech:true,
        probleme:"Tous les aliments sont-ils identiques ? Qui a le repas le plus complet : Ahmed (pain seul) ou Sara (pain + œuf + lait + pomme) ?",
        media:{ type:'image', emoji:"🍞🥛🥚🍎", desc:"Image d'accroche : deux petits déjeuners (Ahmed : pain seul / Sara : pain, œuf, lait, pomme)." },
        lines:[
        {t:"👦 <span class='o'>Ahmed</span> se contente d'un seul aliment : du <span class='o'>pain</span>.",cls:""},
        {t:"👧 <span class='g'>Sara</span> compose un repas varié : du pain, un <span class='g'>œuf</span>, un verre de <span class='g'>lait</span> et une <span class='g'>pomme</span>.",cls:""},
        {t:"🤔 Selon toi, lequel a fait le <span class='b'>meilleur choix</span> — et surtout, <span class='b'>pourquoi</span> ?",cls:"sub"} ] },
      redire:{ say:"Autrement dit : si tu ne mangeais qu'une seule sorte d'aliment toute ta vie, penses-tu que ton corps aurait tout ce qu'il lui faut ? C'est toute la question : est-ce que tous les aliments apportent la même chose ?",
        lines:[ {t:"Question de départ : <span class='o'>tous les aliments</span> se valent-ils ?",cls:"def"} ] } },

    /* ── PHASE 2 · VIDÉO (2 min) : SEULEMENT la vidéo, sans donner la réponse (l'élève observe) ── */
    { phase:"hypothese",
      say:"Regardons cette vidéo pour observer la diversité des aliments. On voit par exemple du sucre, de l'huile, de la glace, de l'eau, du sel, des pâtes, de la viande et d'autres aliments. Ils n'ont pas tous le même aspect, ni la même origine, ni la même composition. Certains aliments sont très simples : ils contiennent surtout un seul élément. D'autres sont composés : ils contiennent plusieurs éléments mélangés. Pour l'instant, observe bien cette diversité ; juste après, on expliquera clairement la différence entre aliment simple et aliment composé.",
      board:{title:"Vidéo : observons différents aliments 🎬",
        media:{ type:'video' },
        lines:[
        {t:"👀 Observe la <span class='o'>diversité</span> des aliments : sucre, huile, glace, eau, sel, pâtes, viande…",cls:"sub"},
        {t:"💡 Certains aliments sont <span class='b'>simples</span>, d'autres sont <span class='g'>composés</span>.",cls:"def"},
        {t:"➡️ On va expliquer cette différence juste après.",cls:"sub"} ] } },

    /* ── PHASE 3 · DÉCOUVERTE (5 min) : l'élève COMPLÈTE le tableau lui-même, puis conclusion ── */
    { phase:"concept",
      say:"À toi de compléter le tableau ! Pour chaque aliment, choisis son constituant principal. Réfléchis bien au pain, à la viande, à l'huile et à l'orange. Quand tu auras tout trouvé, on écrira la conclusion ensemble.",
      board:{title:"Complète le tableau : chaque aliment et son constituant 📋",
        fillTable:{
          headers:["Aliment","Constituant principal"],
          rows:[
            {cells:["🍞 Pain",   null], answer:"Amidon",     options:["Amidon","Protéines","Lipides","Vitamines"]},
            {cells:["🥩 Viande", null], answer:"Protéines",  options:["Amidon","Protéines","Lipides","Vitamines"]},
            {cells:["🫒 Huile",  null], answer:"Lipides",    options:["Amidon","Protéines","Lipides","Vitamines"]},
            {cells:["🍊 Orange", null], answer:"Vitamines",  options:["Amidon","Protéines","Lipides","Vitamines"]}
          ],
          conclusion:"Les aliments sont constitués de substances appelées nutriments." },
        lines:[ {t:"👉 Choisis le bon <span class='o'>constituant</span> pour chaque aliment.",cls:"sub"} ] } },

    /* ── PHASE 4 · EXPÉRIENCE 1 (amidon) : VIDÉO IA (< 8 s) ──
       La simulation 3D est remplacée par une courte vidéo générée par IA montrant la découverte
       de l'amidon : l'eau iodée déposée sur le pain vire au bleu-noir. */
    { phase:"concept",
      say:"Première expérience : cherchons l'amidon. Regarde bien cette petite vidéo, on teste le pain avec de l'eau iodée. Observe attentivement ce qui arrive à la couleur…",
      board:{title:"Expérience : test de l'amidon 🧪",
        media:{ type:'video', src:"/uploads/1783598086385-2axcv0.mp4",
          desc:"Test à l'eau iodée sur le pain.",
          explain:"Alors, tu as bien observé ? Au contact de l'eau iodée, le pain a changé de couleur : il est devenu bleu-noir.",
          conclusion:"Le pain devient bleu-noir avec l'eau iodée : il contient donc de l'amidon." },
        lines:[
          {t:"👉 Regarde bien la vidéo <span class='o'>jusqu'au bout</span> et observe la couleur.",cls:"sub"}
        ] } },

    /* ── EXPÉRIENCE 2 (protéines) : VIDÉO IA (< 8 s) ──
       La simulation 3D est remplacée par une courte vidéo générée par IA montrant la découverte
       des protéines dans le blanc d'œuf grâce au réactif de Biuret (virage au violet). */
    { phase:"concept",
      say:"Deuxième expérience : cherchons les protéines. Dans la vidéo, on verse le réactif de Biuret sur le blanc d'œuf. Observe bien ce qui se passe avec la couleur…",
      board:{title:"Expérience 2 : détecter les protéines 🥚",
        media:{ type:'video', src:"/uploads/1783598643283-arbl6t.mp4",
          desc:"Réactif de Biuret sur le blanc d'œuf.",
          explain:"Tu as vu ? En ajoutant le réactif de Biuret, le blanc d'œuf a pris une belle couleur violette.",
          conclusion:"Le blanc d'œuf devient violet avec le réactif de Biuret : il contient des protéines." },
        lines:[
          {t:"👉 Regarde bien la vidéo <span class='o'>jusqu'au bout</span> et observe la couleur.",cls:"sub"}
        ] } },

    /* ── EXPÉRIENCE 3 (lipides) : VIDÉO IA (< 8 s) ──
       La simulation 3D est remplacée par une courte vidéo générée par IA montrant la découverte
       des lipides : l'huile déposée sur une feuille de filtration y laisse une tache translucide. */
    { phase:"concept",
      say:"Troisième expérience : cherchons les lipides. Dans la vidéo, on dépose de l'huile sur une feuille de filtration. Observe bien ce qui apparaît sur le papier…",
      board:{title:"Expérience 3 : détecter les lipides 🫒",
        media:{ type:'video', src:"/uploads/1783598684639-dat337.mp4",
          desc:"Huile déposée sur la feuille de filtration.",
          explain:"Tu as remarqué ? À l'endroit où l'huile a touché la feuille de filtration, une tache translucide est apparue.",
          conclusion:"Une tache translucide reste sur la feuille de filtration : l'huile contient des lipides." },
        lines:[
          {t:"👉 Regarde bien la vidéo <span class='o'>jusqu'au bout</span> et observe le papier.",cls:"sub"}
        ] } },

    /* ── SIMULATION IA (3 min) : tri interactif aliment → nutriment (✔/❌ immédiat) ── */
    { phase:"concept",
      say:"À toi de jouer ! Associe chaque aliment à son nutriment principal. Choisis un aliment à gauche, puis clique sur le bon nutriment à droite. Je te dis tout de suite si c'est correct !",
      board:{title:"Activité : relie chaque aliment à son nutriment 🎯",
        match:{ consigne:"Choisis un aliment, puis son nutriment principal :", pairs:[
          {a:"Pain",   b:"Glucides"},
          {a:"Viande", b:"Protides"},
          {a:"Huile",  b:"Lipides"},
          {a:"Orange", b:"Vitamines"},
          {a:"Lait",   b:"Calcium"} ] },
        lines:[ {t:"👉 À gauche l'aliment, à droite le <span class='o'>nutriment</span> principal.",cls:"sub"} ] } },

    /* ── PHASE 4bis · COMPOSITION CHIMIQUE (Doc.1) : aliment SIMPLE vs aliment COMPOSÉ ──
       Adapté de la fiche : le sucre raffiné (100 % glucides) est un aliment simple, alors que
       le pain et le lait, qui réunissent plusieurs constituants, sont des aliments composés. */
    { phase:"concept",
      say:"Observe le sucre raffiné. Lors du raffinage, on retire du sucre brun ses vitamines et ses sels minéraux : il ne reste plus qu'un seul constituant, les glucides, à 100 %. On dit alors que le sucre raffiné est un aliment simple. À l'inverse, le pain ou le lait réunissent plusieurs constituants : ce sont des aliments composés. Clique sur chaque cadre pour bien voir la différence.",
      board:{title:"Aliment simple ou aliment composé ? 🍬",
        media:{ type:'image', emoji:"🟫 ➜ ⬜", desc:"Doc.1 : du sucre brun (avec vitamines et sels minéraux) au sucre raffiné (100 % glucides) après le raffinage." },
        lines:[
        {t:"🍬 <span class='o'>Aliment simple</span> = un <span class='b'>seul</span> constituant (sucre raffiné = 100 % glucides).",cls:"def"},
        {t:"🍞 <span class='o'>Aliment composé</span> = <span class='b'>plusieurs</span> constituants (pain, lait, viande…).",cls:""},
        {t:"🔎 La <span class='g'>composition chimique</span>, c'est la liste des constituants d'un aliment.",cls:"sub"} ], schema:schemaSimpleCompose },
      redire:{ say:"Retiens la différence : un aliment simple n'apporte qu'un seul constituant, comme le sucre raffiné qui n'est que du glucide. Un aliment composé en apporte plusieurs en même temps, comme le pain ou le lait.",
        lines:[ {t:"Simple = <span class='b'>1</span> constituant &nbsp;·&nbsp; Composé = <span class='b'>plusieurs</span> constituants.",cls:"def"} ], schema:schemaSimpleCompose } },

    /* ── PHASE 4ter · ANALYSE QUANTITATIVE (Doc.2) : l'élève lit la composition et classe ──
       Tableau des % de constituants (glucides, protides, lipides, eau) de quelques aliments.
       Les cases valeurs sont pré-remplies ; l'élève complète la colonne « Nature ? » (✔/❌). */
    { phase:"concept",
      say:"Voici l'analyse quantitative de quelques aliments : pour chacun, on donne le pourcentage de glucides, de protides, de lipides et d'eau. À toi de jouer : si un aliment n'a qu'un seul constituant, c'est un aliment simple ; s'il en a plusieurs, c'est un aliment composé. Complète la dernière colonne !",
      board:{title:"Analyse quantitative : simple ou composé ? 📊",
        fillTable:{
          headers:["Aliment","Glucides","Protides","Lipides","Eau","Nature ?"],
          rows:[
            {cells:["🍬 Sucre raffiné","100","0","0","0",null],     answer:"Aliment simple",  options:["Aliment simple","Aliment composé"]},
            {cells:["🫒 Huile","0","0","100","0",null],             answer:"Aliment simple",  options:["Aliment simple","Aliment composé"]},
            {cells:["🍞 Pain complet","50","8,1","1,2","37,2",null], answer:"Aliment composé", options:["Aliment simple","Aliment composé"]},
            {cells:["🥛 Lait entier","4,9","3,5","3,9","87",null],   answer:"Aliment composé", options:["Aliment simple","Aliment composé"]},
            {cells:["🥩 Viande de bœuf","0","18","11","60",null],    answer:"Aliment composé", options:["Aliment simple","Aliment composé"]},
            {cells:["🍌 Banane","23,1","1,2","0,2","75",null],       answer:"Aliment composé", options:["Aliment simple","Aliment composé"]}
          ],
          conclusion:"Le sucre raffiné et l'huile n'ont qu'un seul constituant : ce sont des aliments simples. Le pain, le lait, la viande et la banane en ont plusieurs : ce sont des aliments composés. Les glucides, les protides et les lipides sont des matières organiques." },
        lines:[
          {t:"📊 Valeurs en <span class='o'>%</span> ; les sels minéraux et vitamines (quantités minimes) ne sont pas indiqués.",cls:"sub"},
          {t:"👉 Un seul constituant → <span class='g'>simple</span> ; plusieurs → <span class='g'>composé</span>.",cls:"def"}
        ] } },

    /* ── PHASE 5 · SYNTHÈSE (2 min) : carte mentale des familles de nutriments ── */
    { phase:"structuration",
      // Le texte parlé nomme chaque famille PUIS son rôle, dans l'ordre du schéma (gauche→droite),
      // en reprenant EXACTEMENT les mots des étiquettes (Eau/Hydratation, Glucides/Énergie,
      // Protides/Construction, Lipides/Réserve, Vitamines/Protection) : ainsi le moteur d'allumage
      // (scheduleHighlights) fait clignoter chaque étiquette pile au moment où l'avatar la prononce.
      say:"Faisons la synthèse avec cette carte mentale. Les aliments nous apportent cinq grandes familles de nutriments. D'abord, l'eau : elle sert à l'hydratation. Ensuite, les glucides : ils donnent de l'énergie. Puis les protides : ils servent à la construction du corps. Viennent ensuite les lipides : ils forment une réserve d'énergie. Et enfin les vitamines : elles assurent la protection de l'organisme.",
      board:{title:"Synthèse : les familles de nutriments 🧠", lines:[
        {t:"💧 <span class='b'>Eau</span> → hydratation &nbsp;·&nbsp; 🍞 <span class='o'>Glucides</span> → énergie",cls:""},
        {t:"🥩 <span class='r'>Protides</span> → construction &nbsp;·&nbsp; 🫒 <span class='y'>Lipides</span> → réserve &nbsp;·&nbsp; 🍊 <span class='g'>Vitamines</span> → protection",cls:"def"} ], schema:schemaCarteAliments },
      redire:{ say:"Retiens bien les cinq familles avec leur rôle. L'eau, pour l'hydratation. Les glucides, pour l'énergie. Les protides, pour la construction du corps. Les lipides, comme réserve d'énergie. Et les vitamines, pour la protection de l'organisme. Un bon repas contient un peu de chacune.",
        lines:[ {t:"Eau • Glucides • Protides • Lipides • Vitamines = un repas <span class='g'>équilibré</span>.",cls:"def"} ], schema:schemaCarteAliments } },

    /* ── OUVERTURE 3D : « c'est quoi le tube digestif » (vue d'ensemble générale) ──
       Placée dans la leçon ALIMENTS (0/3) : présente en général le tube digestif AVANT le
       voyage détaillé (leçon 1/3). Tour de zoom guidé synchronisé à la voix (bouche → estomac
       → grêle → gros) ; PAS de bol alimentaire ici (il n'apparaît qu'à la mastication, leçon 1/3). */
    { phase:"concept",
      say:"Avant de terminer, découvrons en général où vont voyager tous ces aliments : le tube digestif, en trois dimensions. C'est un long tuyau qui traverse tout le corps, de haut en bas. Je vais te présenter chaque organe, un par un, en zoomant dessus. Commençons tout en haut : voici la bouche, c'est par là que les aliments entrent. Ils descendent ensuite par l'œsophage et arrivent dans l'estomac, une poche qui les brasse et les mélange. Puis ils avancent lentement dans l'intestin grêle, un très long tube enroulé sur lui-même. Et ils terminent enfin leur voyage dans le gros intestin. Tu peux faire pivoter le modèle avec ta souris. C'est ce long chemin que les aliments vont suivre pour être transformés en nutriments.",
      board:{title:"Le tube digestif en 3D 🫁",
        schema3d:{ title:"L'appareil digestif — les organes", model:MODEL_TUBE_DIGESTIF, autoRotate:false, zoom:0.82, highlight:false, labels:['bouche','oesophage','estomac','grele','gros'] },
        lines:[
        {t:"🫁 Le <span class='o'>tube digestif</span> = un long tuyau qui traverse le corps.",cls:"def"},
        {t:"🏷️ Les <span class='o'>organes</span> dans l'ordre : bouche <span class='w'>⟶</span> œsophage <span class='w'>⟶</span> <span class='r'>estomac</span> <span class='w'>⟶</span> <span class='o'>intestin grêle</span> <span class='w'>⟶</span> gros intestin.",cls:""},
        {t:"🖱️ Clique-glisse pour tourner le modèle.",cls:"sub"} ] },
      redire:{ say:"Retiens simplement : le tube digestif est un seul long chemin. Les aliments entrent par la bouche, descendent par l'œsophage jusqu'à l'estomac, avancent dans l'intestin grêle, et finissent dans le gros intestin. C'est ce voyage qu'on suivra en détail à la prochaine séance.",
        lines:[ {t:"👉 Un seul chemin : <span class='o'>bouche</span> <span class='w'>⟶</span> œsophage <span class='w'>⟶</span> <span class='r'>estomac</span> <span class='w'>⟶</span> <span class='o'>intestin grêle</span> <span class='w'>⟶</span> gros intestin.",cls:"def"} ],
        schema3d:{ title:"L'appareil digestif — les organes", model:MODEL_TUBE_DIGESTIF, autoRotate:false, zoom:0.82, highlight:false, labels:['bouche','oesophage','estomac','grele','gros'] } } },

    /* ── PHASE 6 · BILAN : on répond au problème de départ + ouverture ──
       Fin de l'ACTIVITÉ 1 : on propose l'ÉVALUATION (bouton distinct) AVANT de passer à
       la 2ᵉ activité (evalHere). L'élève peut évaluer ses acquis, puis « Continuer ». */
    { phase:"bilan", evalHere:true,
      say:"Revenons à Ahmed et Sara. Ahmed n'a mangé que du pain : surtout des glucides. Sara a mangé du pain, un œuf, du lait et une pomme : elle a des glucides, des protides, du calcium et des vitamines. C'est donc Sara qui a le repas le plus équilibré ! Avant de passer à la suite, tu peux faire une petite évaluation pour vérifier ce que tu as compris. Ensuite, une question : une fois dans la bouche, que deviennent vraiment ces aliments ? Ce sera notre prochaine activité.",
      board:{title:"Bilan : bien manger, c'est varier ✅", lines:[
        {t:"👦 Ahmed (pain seul) → surtout des <span class='o'>glucides</span>.",cls:""},
        {t:"👧 Sara (pain, œuf, lait, pomme) → glucides + <span class='r'>protides</span> + calcium + <span class='g'>vitamines</span> = <span class='g'>équilibré</span> !",cls:"def"},
        {t:"➡️ <span class='o'>Et maintenant</span> : comment la <span class='b'>bouche</span> transforme-t-elle ces aliments ?",cls:"sub"} ] } },

    /* ══════════════ ACTIVITÉ 2 · LA DIGESTION DES ALIMENTS AU NIVEAU DE LA BOUCHE ══════════════
       Ajoutée après le tube digestif. On identifie les transformations MÉCANIQUES (mastication →
       bol alimentaire → déglutition) grâce à une VIDÉO 3D d'anatomie (passage vers l'estomac),
       puis les transformations CHIMIQUES (la salive change une partie de l'amidon en maltose).
       Se termine par un bilan + une ÉVALUATION (3 exemples ; le prof peut y ajouter des documents). */

    /* ── A2 · JE ME RAPPELLE ET JE M'INTERROGE (situation-problème) ── */
    { phase:"probleme",
      say:"Passons à une nouvelle activité : la digestion dans la bouche. Dans la bouche, les aliments sont coupés, déchirés et broyés par les dents, puis imbibés de salive. Mais quelles transformations subissent-ils vraiment au niveau de la bouche ? C'est ce que nous allons découvrir ensemble.",
      board:{title:"Activité 2 : la digestion des aliments dans la bouche 👄",
        probleme:"Quelles sont les transformations que subissent les aliments au niveau de la bouche ?",
        lines:[
          {t:"🎯 <span class='o'>Objectifs</span> de l'activité :",cls:"sub"},
          {t:"• Identifier les transformations <span class='b'>mécaniques</span> des aliments dans la bouche.",cls:""},
          {t:"• Proposer une <span class='o'>hypothèse</span> sur les transformations <span class='g'>chimiques</span> des aliments.",cls:""},
          {t:"• Réaliser des manipulations sur l'action de la <span class='b'>salive</span> sur l'<span class='o'>amidon</span>.",cls:""} ] } },

    /* ── A2 · DOCUMENT 1 : LA DIGESTION MÉCANIQUE (vidéo 3D : anatomie + passage vers l'estomac) ── */
    { phase:"concept",
      say:"Document 1 : la digestion mécanique. Regarde cette vidéo en trois dimensions : elle montre les organes de la bouche et le passage de l'aliment jusqu'à l'estomac. Observe bien comment les dents et la langue agissent…",
      board:{title:"Document 1 : la digestion mécanique 👄",
        media:{ type:'video', src:"/uploads/1783600351038-e3vowo.mp4",
          desc:"Anatomie de la bouche et passage du bol alimentaire vers l'estomac.",
          // NARRATION SYNCHRONISÉE : l'avatar commente le passage AU MOMENT où il apparaît dans la vidéo
          // (durée ≈ 35 s). `at` en % de la durée → reste valable même si la vidéo est remplacée.
          cues:[
            {at:"58%", say:"Regarde bien maintenant : la mastication est finie, l'aliment est devenu une boulette molle, le bol alimentaire. On l'avale : c'est la déglutition."},
            {at:"78%", say:"Le bol alimentaire descend par l'œsophage, ce long tube derrière la gorge…"},
            {at:"92%", say:"… et il arrive enfin dans l'estomac, où la digestion va se poursuivre."}
          ],
          explain:"Tu as bien suivi ? Dans la bouche, les dents écrasent et coupent l'aliment en petits morceaux, et la langue le mélange à la salive : cela forme une boulette molle, le bol alimentaire. Par la déglutition, il descend ensuite par l'œsophage jusqu'à l'estomac.",
          conclusion:"Dans la bouche, la mastication (dents + langue) découpe l'aliment et le mélange à la salive : c'est la transformation mécanique. Le bol alimentaire est ensuite avalé (déglutition) et poussé vers l'estomac." },
        lines:[
          {t:"👉 Regarde bien la vidéo <span class='o'>jusqu'au bout</span> : observe les dents, la langue et le trajet de l'aliment.",cls:"sub"} ] } },

    /* ── A2 · DOCUMENT 2 : TRANSFORMATIONS DE LA MIE DE PAIN (action de la salive : amidon → maltose) ── */
    { phase:"concept",
      say:"Document 2 : une petite manipulation. Mets une mie de pain dans ta bouche et mâche-la longuement, puis goûte de nouveau : elle devient sucrée ! Pourquoi ? Complète le tableau : compare la mie de pain avant et après la mastication, et trouve ce qui a changé.",
      board:{title:"Document 2 : que devient la mie de pain ? 🍞",
        fillTable:{
          headers:["Dans la mie de pain","Après la mastication ?"],
          rows:[
            {cells:["Amidon", null],    answer:"Amidon + Maltose",       options:["Amidon + Maltose","Amidon seul","Plus rien"]},
            {cells:["Protéines", null], answer:"Protéines (inchangées)", options:["Protéines (inchangées)","Maltose","Lipides"]},
            {cells:["— (rien)", null],  answer:"Salive",                 options:["Salive","Eau","Vitamines"]}
          ],
          conclusion:"Après la mastication, une partie de l'amidon a été transformée en maltose (un sucre) grâce à la salive : c'est la transformation chimique. C'est pour cela que le pain mâché devient sucré. L'eau, les sels minéraux, les protéines, les lipides et les vitamines, eux, ne changent pas." },
        lines:[
          {t:"😋 En mâchant longtemps, la mie de pain devient <span class='o'>sucrée</span> : quelque chose a changé !",cls:"sub"},
          {t:"👉 Complète la colonne <span class='o'>« après la mastication »</span> pour le découvrir.",cls:""} ] } },

    /* ── A2 · BILAN DE L'ACTIVITÉ + OUVERTURE ── */
    { phase:"bilan",
      say:"Faisons le bilan de cette activité. Dans la bouche, l'aliment subit deux transformations en même temps. Une transformation mécanique : les dents et la langue le découpent et le mélangent à la salive pour former le bol alimentaire. Et une transformation chimique : la salive change une partie de l'amidon en maltose, un sucre. Le bol alimentaire est ensuite avalé et descend vers l'estomac, où la digestion continuera avec d'autres sucs digestifs.",
      board:{title:"Bilan : la digestion dans la bouche ✅", lines:[
        {t:"🦷 Transformation <span class='b'>mécanique</span> : mastication (dents + langue) → <span class='o'>bol alimentaire</span>.",cls:""},
        {t:"🧪 Transformation <span class='g'>chimique</span> : la <span class='b'>salive</span> change l'<span class='o'>amidon</span> en <span class='o'>maltose</span> (sucre).",cls:"def"},
        {t:"➡️ <span class='o'>Ensuite</span> : le bol alimentaire descend vers l'<span class='r'>estomac</span>, où la digestion se poursuit.",cls:"sub"} ] } },
  ]
},

/* ============== CHAPITRE : LA DIGESTION DES ALIMENTS — SÉANCE 1/3 (Semestre 1) ==============
   Programme officiel (Guide pédagogique SVT, Unité 5 « Les fonctions de nutrition ») :
   « La digestion (mécanique et chimique) » = 2h · « L'absorption » = 1h.
   Cette leçon ne couvre que la 1re séquence (≈ 1h) : le voyage des aliments dans le
   tube digestif et leur transformation en nutriments. Les sucs/enzymes (digestion
   chimique) et l'absorption intestinale feront l'objet des séances suivantes. */
{
  id:"digestion", sem:1,
  titre:"La digestion (1/3) : le voyage des aliments",
  quiz:[
    {type:'qcm', q:"À quoi sert la digestion ?", options:["À transformer les aliments en nutriments","À fabriquer du sang","À respirer"], correct:0, fb:"La digestion transforme les gros aliments en petits nutriments."},
    {type:'qcm', q:"Par quel organe commence le tube digestif ?", options:["L'estomac","La bouche","L'intestin grêle"], correct:1, fb:"Le tube digestif commence par la bouche."},
    {type:'vf', q:"Un aliment est trop gros pour passer directement dans le sang.", correct:true, fb:"Oui : il doit d'abord être transformé en tout petits nutriments."},
    {type:'libre', q:"Comment s'appellent les petits éléments issus des aliments ?", attendus:["nutriment","nutriments"], reponse:"les nutriments", fb:"Ce sont les nutriments."},
    {type:'association', q:"Remets le trajet des aliments dans l'ordre :", pairs:[
      {l:"① Entrée", r:"la bouche"},
      {l:"② Tuyau", r:"l'œsophage"},
      {l:"③ Poche qui brasse", r:"l'estomac"},
      {l:"④ Long tuyau replié", r:"l'intestin grêle"}
    ], fb:"bouche → œsophage → estomac → intestin grêle → gros intestin."}
  ],
  etapes:[
    /* ── PHASE 1 · MISE EN SITUATION (accroche concrète) ── */
    { phase:"situation",
      say:"Bonjour ! Ce matin, tu as mangé du pain. Ce soir, il a disparu : tu ne le retrouves nulle part dans ton corps ! Où est-il passé ? Aujourd'hui, on mène l'enquête : que deviennent vraiment les aliments que tu manges ?",
      board:{title:"Que deviennent les aliments ? 🍞", lines:[
        {t:"🎬 Le matin tu manges… le soir l'aliment a <span class='r'>disparu</span>. Où est-il passé ?",cls:"sub"},
        {t:"🎯 <span class='o'>Objectif</span> : comprendre comment les <span class='o'>aliments</span> deviennent des <span class='g'>nutriments</span> utiles au corps.",cls:""} ] },
      redire:{ say:"Je reformule simplement : quand tu manges une pomme, ton corps doit la couper en tout petits morceaux pour s'en servir. Comprendre comment il fait, c'est notre enquête d'aujourd'hui.",
        lines:[ {t:"🎯 <span class='o'>Objectif</span> : découvrir le <span class='b'>voyage de la nourriture</span> dans ton corps.",cls:""},
                {t:"En une phrase : <span class='o'>aliment</span> <span class='w'>⟶</span> <span class='g'>petits nutriments</span> <span class='w'>⟶</span> le corps.",cls:"def"} ] } },

    /* ── PHASE 2 · RAPPEL DES PRÉREQUIS (ce que l'élève sait déjà) ── */
    { phase:"rappel",
      say:"Avant de commencer, rappelons ce que tu sais déjà. Un aliment, c'est tout ce que tu manges. Ton corps a besoin d'énergie pour bouger et grandir. Et ton sang circule partout, dans chaque organe, pour le nourrir.",
      board:{title:"Ce que tu sais déjà 🔁", lines:[
        {t:"• Un <span class='o'>aliment</span> = tout ce que tu manges (pain, pomme…).",cls:""},
        {t:"• Ton corps a besoin d'<span class='g'>énergie</span> pour bouger et grandir.",cls:""},
        {t:"• Le <span class='r'>sang</span> circule <span class='w'>partout</span> et nourrit chaque organe.",cls:""} ] },
      redire:{ say:"En bref : tu manges des aliments, ton corps a besoin d'énergie, et c'est le sang qui transporte cette énergie partout. Garde bien ces trois idées, on va s'en servir tout de suite.",
        lines:[ {t:"aliment 🍎 &nbsp; + &nbsp; besoin d'<span class='g'>énergie</span> ⚡ &nbsp; + &nbsp; <span class='r'>sang</span> qui livre 🚚",cls:"def"} ] } },

    /* ── PHASE 3 · SITUATION-PROBLÈME (le conflit qui crée le besoin d'apprendre) ── */
    { phase:"probleme",
      say:"Voici le problème. Un morceau de pain est bien trop gros pour entrer dans un vaisseau de sang. Et pourtant, c'est grâce au sang que le pain va nourrir ton corps. Alors, comment un gros aliment peut-il finir dans ton sang ?",
      board:{title:"Le problème à résoudre",
        probleme:"Comment un gros aliment, bien trop grand pour le sang, réussit-il quand même à nourrir tout le corps ?",
        lines:[
        {t:"L'aliment est <span class='r'>trop gros</span> 🍞 &nbsp;≠&nbsp; le sang ne prend que du <span class='g'>très petit</span> 🩸.",cls:"sub"},
        {t:"Il manque donc une <span class='o'>étape</span> entre l'assiette et le sang… laquelle ?",cls:""} ] },
      redire:{ say:"Autrement dit : imagine une grosse valise que tu veux faire passer sous une porte minuscule. Impossible telle quelle ! Il faut d'abord la transformer. Le pain, c'est pareil face au sang. Quelle transformation lui arrive-t-il ?",
        lines:[ {t:"🧳 Grosse valise ≠ petite porte : il faut d'abord la <span class='o'>transformer</span>.",cls:"def"} ] } },

    /* ── PHASE 4 · HYPOTHÈSES (l'élève imagine avant de vérifier) ── */
    { phase:"hypothese",
      say:"À ton avis, que fait ton corps de cet aliment ? Peut-être qu'il le coupe en tout petits morceaux ? Ou qu'il le fait fondre comme du sucre dans l'eau ? Garde tes idées en tête : on va les vérifier ensemble, étape par étape.",
      board:{title:"Tes hypothèses 💡", lines:[
        {t:"Quelques pistes possibles :",cls:"sub"},
        {t:"① Le corps <span class='b'>coupe</span> l'aliment en petits morceaux ?",cls:""},
        {t:"② Le corps le <span class='g'>fait fondre</span> comme du sucre dans l'eau ?",cls:""},
        {t:"③ Un peu des deux à la fois ?",cls:""},
        {t:"👉 On va <span class='o'>vérifier</span> chaque idée dans la suite du cours.",cls:"def"} ] },
      redire:{ say:"Ne t'inquiète pas si tu hésites : une hypothèse, c'est juste une idée à tester. On va justement observer ce qui se passe vraiment, du début à la fin.",
        lines:[ {t:"💡 Une <span class='o'>hypothèse</span> = une idée qu'on va tester, pas encore la réponse.",cls:"def"} ] } },

    /* ── PHASE 5 · CONCEPTUALISATION (on construit la notion, schémas + simulation) ── */
    { phase:"concept",
      say:"Les aliments que tu manges sont trop gros pour entrer dans ton sang. La digestion sert à les couper en tout petits éléments, appelés nutriments. Regarde le schéma : un gros aliment devient plein de petits nutriments.",
      board:{title:"À quoi sert la digestion ?", lines:[
        {t:"Un aliment est <span class='r'>trop gros</span> pour passer dans le <span class='r'>sang</span>.",cls:"sub"},
        {t:"La <span class='o'>digestion</span> = transformer l'aliment en <span class='g'>petits nutriments</span>.",cls:"def"},
        {t:"Ces <span class='g'>nutriments</span> pourront ensuite passer dans le <span class='r'>sang</span>.",cls:""} ], schema:schemaTransfoAliment },
      redire:{ say:"Autrement dit : imagine des grosses briques de Lego collées ensemble. Elles ne passent pas dans un petit trou. La digestion, c'est séparer les briques une par une. Chaque petite brique, c'est un nutriment, et là il peut passer.",
        lines:[ {t:"🧱 Aliment = <span class='o'>grosses briques collées</span> (trop grosses).",cls:""},
                {t:"Digérer = <span class='b'>séparer</span> les briques une par une.",cls:"def"},
                {t:"Une petite brique = un <span class='g'>nutriment</span> qui passe dans le sang.",cls:""} ], schema:schemaTransfoAliment } },

    { phase:"concept",
      say:"Les aliments suivent un long chemin : c'est le tube digestif. Ils passent par la bouche, l'œsophage, l'estomac, l'intestin grêle, puis le gros intestin. Suis le trajet au tableau.",
      board:{title:"Le tube digestif", lines:[
        {t:"Le <span class='o'>tube digestif</span> = le long chemin des aliments.",cls:"def"},
        {t:"<span class='o'>bouche</span> <span class='w'>⟶</span> œsophage <span class='w'>⟶</span> <span class='r'>estomac</span> <span class='w'>⟶</span> <span class='o'>intestin grêle</span> <span class='w'>⟶</span> gros intestin.",cls:""} ], schema:schemaTubeDigestif },
      redire:{ say:"Reprenons doucement comme un toboggan : la nourriture entre par la bouche, glisse dans un tuyau, l'œsophage, tombe dans l'estomac, avance dans l'intestin grêle, et finit dans le gros intestin. Un seul chemin, du début à la fin.",
        lines:[ {t:"🛝 Un seul <span class='b'>chemin</span>, de l'entrée à la sortie :",cls:"sub"},
                {t:"① <span class='o'>bouche</span> → ② œsophage → ③ <span class='r'>estomac</span> → ④ <span class='o'>intestin grêle</span> → ⑤ gros intestin.",cls:"def"} ], schema:schemaTubeDigestif } },

    /* ── ENTRÉE DANS LA MASTICATION : zoom sur la bouche, script synchronisé au modèle 3D ──
       Le script NOMME les organes dans l'ordre (bouche → glandes salivaires → estomac) : la caméra
       zoome automatiquement sur chacun au moment où le prof en parle (schedule3DTour + __cc3d). */
    { phase:"concept",
      say:"Entrons maintenant dans la première étape de la digestion : la mastication, dans la bouche. Observe bien. D'abord, les dents broient l'aliment et le coupent en tout petits morceaux : c'est l'action mécanique. La langue, elle, mélange les morceaux et les déplace. En même temps, les glandes salivaires versent la salive : elle ramollit l'aliment et commence déjà à le transformer, c'est l'action chimique. Petit à petit, l'aliment mâché devient une boule molle et humide : c'est le bol alimentaire, tout prêt à descendre vers l'estomac.",
      board:{title:"La mastication dans la bouche 👄🦷",
        schema3d:{ title:"La bouche — la mastication", model:MODEL_TUBE_DIGESTIF, focus:[0,1,0], zoom:1.7, autoRotate:false, labels:['bouche','salivaires'] },
        lines:[
        {t:"🦷 Les <span class='o'>dents</span> broient l'aliment : action <span class='b'>mécanique</span>.",cls:"def"},
        {t:"👅 La <span class='y'>langue</span> mélange et déplace les morceaux.",cls:""},
        {t:"💧 Les <span class='g'>glandes salivaires</span> versent la salive : action <span class='r'>chimique</span>.",cls:""},
        {t:"➡️ L'aliment mâché devient le <span class='o'>bol alimentaire</span>, prêt à avaler.",cls:"sub"} ] },
      redire:{ say:"Je résume la mastication : dans la bouche, deux actions se passent en même temps. Les dents coupent l'aliment, c'est mécanique ; la salive le ramollit et le transforme, c'est chimique. À la fin, l'aliment est devenu une petite boule molle, le bol alimentaire, prête à descendre vers l'estomac.",
        lines:[ {t:"Mastication = <span class='b'>dents</span> (mécanique) + <span class='r'>salive</span> (chimique) <span class='w'>⟶</span> <span class='o'>bol alimentaire</span>.",cls:"def"} ],
        schema3d:{ title:"La bouche — la mastication", model:MODEL_TUBE_DIGESTIF, focus:[0,1,0], zoom:1.7, autoRotate:false, labels:['bouche','salivaires'] } } },

    /* étape avec SIMULATION ANIMÉE : on voit l'aliment voyager et se transformer en direct */
    { phase:"concept",
      say:"Regarde bien cette animation : l'aliment part de la bouche, descend jusqu'à l'estomac, puis avance dans l'intestin. Pendant le trajet, il rétrécit de plus en plus, jusqu'à devenir de tout petits nutriments qui passent enfin dans le sang. C'est tout le voyage résumé en une image !",
      board:{title:"Simulation : le voyage de l'aliment 🎞️", sim:true, lines:[
        {t:"L'<span class='o'>aliment</span> avance dans le tube et <span class='r'>rétrécit</span> peu à peu.",cls:"def"},
        {t:"Arrivé petit, il devient des <span class='g'>nutriments</span> qui passent dans le <span class='r'>sang</span>.",cls:""},
        {t:"👉 C'est la réponse à notre <span class='o'>problème</span> de départ !",cls:"sub"} ], schema:simDigestion },
      redire:{ say:"Suis juste la bille orange : elle entre par la bouche, traverse tout le tube et devient de plus en plus petite. À la fin, les billes vertes, ce sont les nutriments, et tu les vois glisser dans le sang. Voilà comment un gros aliment finit par nourrir ton corps.",
        lines:[ {t:"🟠 bille orange = l'aliment qui voyage et rétrécit.",cls:""},
                {t:"🟢 billes vertes = les <span class='g'>nutriments</span> qui entrent dans le <span class='r'>sang</span>.",cls:"def"} ], schema:simDigestion } },

    /* ── PHASE 6 · STRUCTURATION (la trace écrite, le savoir à retenir) ── */
    { phase:"structuration",
      say:"On écrit l'essentiel de cette première séance. Les aliments suivent un seul chemin, le tube digestif : la bouche, l'œsophage, l'estomac, l'intestin grêle, puis le gros intestin. Tout au long de ce trajet, l'aliment est transformé et devient de plus en plus petit, jusqu'à donner des nutriments.",
      board:{title:"L'essentiel à retenir 📌", lines:[
        {t:"• Le <span class='o'>tube digestif</span> = un seul chemin : bouche <span class='w'>⟶</span> œsophage <span class='w'>⟶</span> estomac <span class='w'>⟶</span> intestin grêle <span class='w'>⟶</span> gros intestin.",cls:""},
        {t:"• Le long du trajet, l'<span class='o'>aliment</span> se transforme et <span class='r'>rétrécit</span> peu à peu.",cls:""},
        {t:"• Il devient de tout petits <span class='g'>nutriments</span> (exemple : le glucose).",cls:""} ] },
      redire:{ say:"Retiens la chaîne simple de cette séance : l'aliment entre par la bouche, descend dans le tube digestif, et se transforme peu à peu en nutriments. Comment il est découpé exactement, et où il passe dans le sang, ce sera pour la prochaine séance.",
        lines:[ {t:"aliment 🍞 <span class='w'>⟶</span> <span class='b'>tube digestif</span> <span class='w'>⟶</span> se transforme <span class='w'>⟶</span> <span class='g'>nutriments</span>.",cls:"def"} ] } },

    /* ── PHASE 7 · BILAN (on répond au problème de départ + ouverture vers la séance 2) ── */
    { phase:"bilan",
      say:"Revenons à notre énigme du début : où est passé le pain ? Pendant son voyage dans le tube digestif, il a été transformé en tout petits nutriments. Il n'a pas disparu : il a changé de forme ! La prochaine fois, on découvrira comment le corps le découpe grâce aux sucs digestifs, et où exactement les nutriments passent dans le sang.",
      board:{title:"Bilan de la séance 1 ✅", lines:[
        {t:"🔎 Le pain n'a pas disparu : il s'est <span class='o'>transformé</span> en <span class='g'>nutriments</span> le long du tube digestif.",cls:"sub"},
        {t:"Gros aliment <span class='w'>⟶</span> voyage dans le <span class='b'>tube digestif</span> <span class='w'>⟶</span> <span class='g'>petits nutriments</span>.",cls:"def"},
        {t:"➡️ <span class='o'>Prochaine séance</span> : les <span class='g'>sucs digestifs</span> et le passage dans le <span class='r'>sang</span> (l'absorption).",cls:""} ] } },
  ]
},

/* ============== CHAPITRE 1 : LE SYSTÈME NERVEUX ============== */
{
  id:"systeme-nerveux", sem:2,
  titre:"Le système nerveux",
  quiz:[
    {type:'qcm', q:"Quel centre commande l'acte réflexe ?", options:["Le cerveau","La moelle épinière","Le cœur"], correct:1, fb:"La moelle épinière commande le réflexe : c'est pour ça qu'il est si rapide."},
    {type:'qcm', q:"La cellule de base du système nerveux s'appelle :", options:["Le neurone","Le nerf","Le muscle"], correct:0, fb:"C'est le neurone."},
    {type:'vf', q:"Un acte volontaire est commandé par le cerveau.", correct:true, fb:"Oui : il est conscient et commandé par le cerveau."},
    {type:'vf', q:"Les nerfs moteurs portent l'information des sens vers le cerveau.", correct:false, fb:"Non : ce sont les nerfs sensitifs ; les nerfs moteurs vont vers les muscles."},
    {type:'libre', q:"Cite une règle d'hygiène du système nerveux.", attendus:["sommeil","dormir","alcool","tabac","drogue","repos"], reponse:"bien dormir, éviter alcool/tabac/drogues", fb:"Le sommeil et éviter les drogues protègent le système nerveux."},
    {type:'association', q:"Relie chaque élément à son rôle :", pairs:[
      {l:"Nerf sensitif", r:"organes des sens → centres"},
      {l:"Nerf moteur", r:"centres → muscles"},
      {l:"Acte volontaire", r:"commandé par le cerveau"},
      {l:"Acte réflexe", r:"commandé par la moelle épinière"}
    ], fb:"Sensitif = vers les centres ; moteur = vers les muscles ; volontaire = cerveau ; réflexe = moelle."}
  ],
  etapes:[
    { say:"Bonjour ! Aujourd'hui nous découvrons le système nerveux, le grand chef d'orchestre du corps : c'est lui qui reçoit les informations et commande nos mouvements.",
      board:{title:"Le système nerveux", lines:[ {t:"🎯 <span class='o'>Objectif</span> : comprendre comment le corps <span class='b'>reçoit l'information</span> et <span class='g'>commande les mouvements</span>.",cls:""} ] } },
    { say:"Le système nerveux est formé de deux parties : les centres nerveux, c'est-à-dire l'encéphale et la moelle épinière, et les nerfs qui parcourent tout le corps.",
      board:{title:"De quoi est-il formé ?", lines:[
        {t:"Il est formé de <span class='r'>2 parties</span> :",cls:"sub"},
        {t:"① <span class='o box'>Centres nerveux</span> : encéphale (cerveau, cervelet, bulbe) + moelle épinière.",cls:""},
        {t:"② <span class='g box'>Nerfs</span> : ils relient les centres à <span class='w'>tout le corps</span>.",cls:""} ], schema:schemaSysteme } },
    { say:"La cellule de base du système nerveux s'appelle le neurone. Regarde le schéma : il a un corps cellulaire, des dendrites qui reçoivent l'information, et un axone qui la transmet.",
      board:{title:"Le neurone", lines:[
        {t:"Le <span class='o'>neurone</span> = cellule de base qui conduit le <span class='r'>message nerveux</span>.",cls:"def"},
        {t:"<span class='b'>dendrites</span> <span class='w'>⟶</span> <span class='o'>corps cellulaire</span> <span class='w'>⟶</span> <span class='g'>axone</span>.",cls:""} ], schema:schemaNeurone } },
    { say:"Et voici le neurone en trois dimensions ! Tu peux le faire tourner avec la souris pour bien voir son corps cellulaire au centre, ses dendrites en bleu et son long axone entouré de myéline verte.",
      board:{title:"Le neurone en 3D", lines:[
        {t:"🧊 Un vrai <span class='o'>modèle 3D</span> : tu peux le faire <span class='b'>tourner</span> à la souris.",cls:"sub"},
        {t:"<span class='b'>dendrites</span> (bleu) · <span class='o'>corps</span> (orange) · <span class='g'>axone + myéline</span> (vert).",cls:"def"} ], schema3d:"neurone" } },
    { say:"Il existe deux types de nerfs. Les nerfs sensitifs apportent l'information des organes des sens vers les centres. Les nerfs moteurs portent l'ordre des centres jusqu'aux muscles.",
      board:{title:"Le trajet du message", lines:[
        {t:"Il existe <span class='r'>2 types de nerfs</span> :",cls:"sub"},
        {t:"<span class='b'>➡ Nerfs sensitifs</span> : organes des sens <span class='b'>⟶</span> centres nerveux.",cls:""},
        {t:"<span class='g'>⬅ Nerfs moteurs</span> : centres nerveux <span class='g'>⟶</span> muscles.",cls:""} ] } },
    { say:"Quand tu décides de lever la main, c'est un acte volontaire commandé par le cerveau. Mais si tu touches un objet brûlant, ta main se retire toute seule, très vite : c'est un acte réflexe, commandé par la moelle épinière. Regarde son trajet au tableau.",
      board:{title:"Acte volontaire / acte réflexe", lines:[
        {t:"<span class='b box'>Acte volontaire</span> : <span class='b'>conscient</span>, commandé par le <span class='b'>cerveau</span>.",cls:""},
        {t:"<span class='r box'>Acte réflexe</span> : <span class='r'>rapide</span>, involontaire, commandé par la <span class='r'>moelle épinière</span>.",cls:""} ], schema:schemaArcReflexe } },
    { say:"Petite vérification : quel centre commande l'acte réflexe ? Prends le temps de réfléchir avant de regarder la réponse.",
      board:{title:"Vérifions ✅", lines:[
        {t:"❓ Quel centre commande l'acte <span class='r'>réflexe</span> ?",cls:""} ] },
      reveal:{ say:"C'est la moelle épinière ! C'est pour ça que la réaction est si rapide. Bravo.",
        lines:[ {t:"➡️ La <span class='r'>moelle épinière</span> (réaction très rapide).",cls:"def"} ] } },
    { say:"En résumé : le système nerveux relie les organes des sens aux muscles grâce aux nerfs et aux neurones. Pour en prendre soin : dors bien et évite alcool, tabac et drogues. Bravo !",
      board:{title:"L'essentiel à retenir 📌", lines:[
        {t:"• <span class='o'>Centres</span> + <span class='g'>nerfs</span> + <span class='o'>neurones</span> = le système nerveux.",cls:""},
        {t:"• <span class='b'>Volontaire</span> = cerveau ; <span class='r'>réflexe</span> = moelle épinière.",cls:""},
        {t:"• <span class='g'>Hygiène</span> : bien dormir 😴, pas d'alcool/tabac/drogues.",cls:""} ] } },
  ]
},

/* ============== CHAPITRE 2 : LE SYSTÈME MUSCULAIRE ============== */
{
  id:"systeme-musculaire", sem:2,
  titre:"Le système musculaire",
  quiz:[
    {type:'qcm', q:"Les muscles sont attachés aux os par :", options:["Les tendons","Les nerfs","Les veines"], correct:0, fb:"Par les tendons."},
    {type:'vf', q:"Quand le biceps se contracte, le triceps se relâche.", correct:true, fb:"Oui : ce sont des muscles antagonistes."},
    {type:'qcm', q:"Qu'est-ce qui déclenche la contraction d'un muscle ?", options:["Un message nerveux","La lumière","La digestion"], correct:0, fb:"Le message nerveux (nerf moteur)."},
    {type:'vf', q:"Un muscle peut se contracter sans système nerveux.", correct:false, fb:"Non : il faut un ordre nerveux."},
    {type:'libre', q:"Que produit un muscle quand il se contracte ?", attendus:["mouvement","bouge","tire","os"], reponse:"un mouvement (il tire sur l'os)", fb:"Il se raccourcit et produit le mouvement."},
    {type:'association', q:"Relie chaque terme à sa définition :", pairs:[
      {l:"Tendon", r:"attache le muscle à l'os"},
      {l:"Biceps", r:"se contracte pour plier le bras"},
      {l:"Triceps", r:"se relâche pendant la flexion"},
      {l:"Contraction", r:"le muscle se raccourcit et gonfle"}
    ], fb:"Le tendon relie muscle et os ; biceps/triceps sont antagonistes ; la contraction raccourcit le muscle."}
  ],
  etapes:[
    { say:"Bonjour ! Comment fais-tu pour bouger ton bras ou marcher ? Grâce à tes muscles. C'est le sujet du jour : le système musculaire.",
      board:{title:"Le système musculaire", lines:[ {t:"🎯 <span class='o'>Objectif</span> : comprendre comment les <span class='r'>muscles</span> produisent le <span class='g'>mouvement</span>.",cls:""} ] } },
    { say:"Les muscles qui te font bouger sont les muscles striés squelettiques. Ils sont attachés aux os par des tendons.",
      board:{title:"Les muscles du mouvement", lines:[
        {t:"Les <span class='r'>muscles striés squelettiques</span> font bouger le corps.",cls:"def"},
        {t:"Ils sont attachés aux <span class='w'>os</span> par des <span class='o'>tendons</span>.",cls:""} ] } },
    { say:"Comment un muscle agit-il ? Il se contracte, c'est-à-dire qu'il se raccourcit et se gonfle, puis il se relâche. En se contractant, il tire sur l'os et produit le mouvement.",
      board:{title:"Contraction et mouvement", lines:[
        {t:"Le muscle se <span class='r'>contracte</span> (se raccourcit + gonfle) puis se <span class='b'>relâche</span>.",cls:"def"},
        {t:"En se contractant il <span class='o'>tire sur l'os</span> <span class='w'>⟶</span> <span class='g'>mouvement</span>.",cls:""} ] } },
    { say:"Les muscles travaillent souvent par paires opposées. Regarde le schéma : pour plier le bras, le biceps se contracte pendant que le triceps se relâche. On dit qu'ils sont antagonistes.",
      board:{title:"Des muscles antagonistes", lines:[
        {t:"Ils travaillent par <span class='o'>paires opposées</span> :",cls:"sub"},
        {t:"<span class='r'>biceps</span> se contracte ⟷ <span class='b'>triceps</span> se relâche <span class='w'>⟶</span> flexion.",cls:"def"} ], schema:schemaMuscle } },
    { say:"Important : un muscle ne se contracte que s'il reçoit un message nerveux. Le système nerveux et les muscles travaillent donc ensemble. Et si l'effort dure trop longtemps, le muscle se fatigue.",
      board:{title:"Muscles, nerfs et fatigue", lines:[
        {t:"Un muscle ne bouge que sur <span class='g'>ordre nerveux</span> (nerf moteur).",cls:"def"},
        {t:"Effort trop long <span class='w'>⟶</span> <span class='r'>fatigue musculaire</span>.",cls:""} ] } },
    { say:"Petite vérification : qu'est-ce qui déclenche la contraction d'un muscle ? Prends le temps de réfléchir.",
      board:{title:"Vérifions ✅", lines:[
        {t:"❓ Qu'est-ce qui déclenche la contraction ?",cls:""} ] },
      reveal:{ say:"C'est le message nerveux, apporté par le nerf moteur ! Exactement.",
        lines:[ {t:"➡️ Le <span class='g'>message nerveux</span> (nerf moteur).",cls:"def"} ] } },
    { say:"En résumé : les muscles, attachés aux os, produisent le mouvement en se contractant sur ordre du système nerveux. Pour les garder en forme : du sport, un échauffement et du repos. Bravo !",
      board:{title:"L'essentiel à retenir 📌", lines:[
        {t:"• Les <span class='r'>muscles</span> tirent sur les <span class='w'>os</span> <span class='w'>⟶</span> mouvement.",cls:""},
        {t:"• Ils agissent par <span class='o'>paires antagonistes</span>, sur <span class='g'>ordre nerveux</span>.",cls:""},
        {t:"• <span class='g'>Hygiène</span> : sport, échauffement, repos.",cls:""} ] } },
  ]
},

/* ============== CHAPITRE 3 : LES MICROBES ============== */
{
  id:"microbes", sem:2,
  titre:"Les microbes",
  quiz:[
    {type:'qcm', q:"Lequel n'est PAS un microbe ?", options:["Une bactérie","Un virus","Un tendon"], correct:2, fb:"Le tendon n'est pas un microbe."},
    {type:'vf', q:"Tous les microbes sont dangereux.", correct:false, fb:"Non : certains sont utiles (yaourt, pain, flore intestinale)."},
    {type:'qcm', q:"L'entrée des microbes dans le corps s'appelle :", options:["La contamination","L'infection","L'immunité"], correct:0, fb:"La contamination ; l'infection est leur multiplication."},
    {type:'vf', q:"L'asepsie consiste à empêcher la contamination.", correct:true, fb:"Oui : propreté, stérilisation."},
    {type:'libre', q:"Cite un microbe utile ou son usage.", attendus:["yaourt","pain","fromage","flore"], reponse:"les microbes du yaourt ou du pain", fb:"Ex : les bactéries qui fabriquent le yaourt."},
    {type:'association', q:"Relie chaque mot à sa signification :", pairs:[
      {l:"Contamination", r:"entrée des microbes"},
      {l:"Infection", r:"multiplication des microbes"},
      {l:"Asepsie", r:"empêcher la contamination"},
      {l:"Antisepsie", r:"détruire les microbes présents"}
    ], fb:"Contamination = entrée ; infection = multiplication ; asepsie = empêcher ; antisepsie = détruire."}
  ],
  etapes:[
    { say:"Bonjour ! Autour de nous vivent des êtres minuscules, invisibles à l'œil nu : les microbes. Découvrons-les aujourd'hui.",
      board:{title:"Les microbes", lines:[ {t:"🎯 <span class='o'>Objectif</span> : connaître les <span class='g'>microbes</span>, leurs types et comment s'en <span class='b'>protéger</span>.",cls:""} ] } },
    { say:"Un microbe est un être vivant si petit qu'on ne le voit qu'au microscope. Regarde le schéma : il en existe plusieurs types, les bactéries, les virus, les champignons microscopiques et les protozoaires.",
      board:{title:"Qu'est-ce qu'un microbe ?", lines:[
        {t:"Un <span class='g'>microbe</span> = être vivant <span class='r'>invisible à l'œil nu</span> (microscope).",cls:"def"},
        {t:"4 types : <span class='g'>bactéries</span>, <span class='r'>virus</span>, <span class='o'>champignons</span>, <span class='b'>protozoaires</span>.",cls:""} ], schema:schemaMicrobes } },
    { say:"Regarde de plus près : voici un virus en trois dimensions. Fais-le tourner avec la souris. On voit bien sa coque à facettes et ses pointes qui lui servent à s'accrocher à nos cellules.",
      board:{title:"Un virus en 3D", lines:[
        {t:"🧊 Un vrai <span class='r'>modèle 3D</span> : fais-le <span class='b'>tourner</span> à la souris.",cls:"sub"},
        {t:"La <span class='r'>coque</span> à facettes et les <span class='o'>pointes</span> pour s'accrocher aux cellules.",cls:"def"} ], schema3d:"virus" } },
    { say:"Attention : tous les microbes ne sont pas dangereux ! Certains sont très utiles, comme ceux qui fabriquent le yaourt ou le pain. D'autres, les microbes pathogènes, provoquent des maladies.",
      board:{title:"Utiles ou dangereux ?", lines:[
        {t:"<span class='g box'>Utiles</span> : yaourt, pain, fromage, flore intestinale. 🧀",cls:""},
        {t:"<span class='r box'>Pathogènes</span> : ils provoquent des <span class='r'>maladies</span>.",cls:""} ] } },
    { say:"Comment tombe-t-on malade ? D'abord la contamination : les microbes entrent dans le corps, par l'air, l'eau, les aliments ou une blessure. Puis l'infection : ils se multiplient et déclenchent la maladie.",
      board:{title:"Contamination et infection", lines:[
        {t:"<span class='b'>Contamination</span> : <span class='b'>entrée</span> des microbes (air, eau, aliments, blessure).",cls:"def"},
        {t:"<span class='r'>Infection</span> : <span class='r'>multiplication</span> des microbes <span class='w'>⟶</span> maladie.",cls:"def"} ], schema:schemaContamination } },
    { say:"Pour se protéger, il y a deux moyens. L'asepsie : empêcher les microbes d'arriver, grâce à la propreté et à la stérilisation. L'antisepsie : détruire les microbes déjà présents avec des antiseptiques.",
      board:{title:"Se protéger des microbes", lines:[
        {t:"<span class='b box'>Asepsie</span> : <span class='b'>empêcher</span> la contamination (propreté, stérilisation).",cls:"def"},
        {t:"<span class='g box'>Antisepsie</span> : <span class='g'>détruire</span> les microbes (antiseptiques).",cls:"def"} ] } },
    { say:"Petite vérification : quelle est la différence entre contamination et infection ? Réfléchis avant de regarder la réponse.",
      board:{title:"Vérifions ✅", lines:[
        {t:"❓ Contamination ou infection ?",cls:""} ] },
      reveal:{ say:"La contamination, c'est l'entrée des microbes ; l'infection, c'est leur multiplication dans le corps. Très bien !",
        lines:[ {t:"➡️ <span class='b'>Entrée</span> = contamination ; <span class='r'>multiplication</span> = infection.",cls:"def"} ] } },
    { say:"En résumé : les microbes sont des êtres vivants invisibles, parfois utiles, parfois pathogènes. On s'en protège par l'asepsie et l'antisepsie, et par une bonne hygiène. Bravo !",
      board:{title:"L'essentiel à retenir 📌", lines:[
        {t:"• <span class='g'>Microbes</span> : bactéries, virus, champignons, protozoaires.",cls:""},
        {t:"• <span class='b'>Contamination</span> <span class='w'>⟶</span> <span class='r'>infection</span> <span class='w'>⟶</span> maladie.",cls:""},
        {t:"• Protection : <span class='b'>asepsie</span> + <span class='g'>antisepsie</span> + hygiène.",cls:""} ] } },
  ]
},

/* ============== CHAPITRE 4 : LE SYSTÈME IMMUNITAIRE ============== */
{
  id:"systeme-immunitaire", sem:2,
  titre:"Le système immunitaire",
  quiz:[
    {type:'qcm', q:"Quelle est la première défense du corps ?", options:["Les barrières naturelles","Les anticorps","La vaccination"], correct:0, fb:"La peau et les muqueuses (barrières naturelles)."},
    {type:'qcm', q:"Les cellules qui fabriquent les anticorps sont :", options:["Les lymphocytes","Les neurones","Les tendons"], correct:0, fb:"Les lymphocytes."},
    {type:'vf', q:"La phagocytose détruit les microbes.", correct:true, fb:"Oui : les phagocytes englobent et détruisent les microbes."},
    {type:'vf', q:"Un anticorps neutralise n'importe quel microbe.", correct:false, fb:"Non : chaque anticorps est spécifique d'un antigène précis."},
    {type:'libre', q:"Comment s'appelle l'élément étranger reconnu par le corps ?", attendus:["antigène","antigene"], reponse:"l'antigène", fb:"C'est l'antigène."},
    {type:'association', q:"Relie chaque défense à sa description :", pairs:[
      {l:"Barrières naturelles", r:"peau et muqueuses"},
      {l:"Phagocytose", r:"globules blancs qui englobent les microbes"},
      {l:"Anticorps", r:"fabriqués par les lymphocytes"},
      {l:"Antigène", r:"le microbe reconnu (la serrure)"}
    ], fb:"Barrières = peau ; phagocytose = englober ; anticorps = lymphocytes ; antigène = le microbe ciblé."}
  ],
  etapes:[
    { say:"Bonjour ! Les microbes essaient sans cesse d'entrer dans notre corps. Heureusement, nous avons une armée de défense : le système immunitaire. Voyons comment il nous protège.",
      board:{title:"Le système immunitaire", lines:[ {t:"🎯 <span class='o'>Objectif</span> : comprendre comment le corps se <span class='g'>défend</span> contre les <span class='r'>microbes</span>.",cls:""} ] } },
    { say:"La première défense, ce sont les barrières naturelles : la peau, les muqueuses, et des sécrétions comme les larmes ou la salive. Elles empêchent beaucoup de microbes d'entrer.",
      board:{title:"La première défense", lines:[
        {t:"<span class='b box'>Barrières naturelles</span> = 1ʳᵉ défense.",cls:"sub"},
        {t:"<span class='b'>Peau</span>, <span class='b'>muqueuses</span>, larmes, salive <span class='w'>⟶</span> empêchent l'entrée des microbes.",cls:"def"} ] } },
    { say:"Si un microbe entre quand même, des globules blancs appelés phagocytes l'englobent et le détruisent. Regarde les trois étapes au tableau : cette opération s'appelle la phagocytose.",
      board:{title:"La phagocytose", lines:[
        {t:"Les <span class='b'>phagocytes</span> (globules blancs) <span class='r'>englobent</span> et <span class='g'>détruisent</span> les microbes.",cls:"def"},
        {t:"Cette opération = la <span class='o'>phagocytose</span>.",cls:""} ], schema:schemaPhagocytose } },
    { say:"Il existe une défense plus précise : d'autres globules blancs, les lymphocytes, fabriquent des anticorps. Chaque anticorps neutralise un microbe précis, qu'on appelle l'antigène.",
      board:{title:"Anticorps et antigènes", lines:[
        {t:"Les <span class='g'>lymphocytes</span> fabriquent des <span class='g'>anticorps</span>.",cls:"def"},
        {t:"<span class='g'>anticorps</span> = clé 🔑 / <span class='r'>antigène</span> = serrure 🔒 (spécifique !).",cls:"def"} ], schema:schemaCleSerrure } },
    { say:"Et il y a un bonus : après avoir combattu un microbe, le corps garde une mémoire. La fois suivante, il se défend beaucoup plus vite. C'est ce qu'on appelle l'immunité.",
      board:{title:"La mémoire immunitaire", lines:[
        {t:"<span class='o'>Immunité</span> : capacité du corps à se défendre.",cls:"def"},
        {t:"Après un 1ᵉʳ combat, le corps garde une <span class='p'>mémoire</span> <span class='w'>⟶</span> défense + rapide.",cls:""} ] } },
    { say:"Petite vérification : comment s'appellent les cellules qui fabriquent les anticorps ? Prends le temps de réfléchir.",
      board:{title:"Vérifions ✅", lines:[
        {t:"❓ Qui fabrique les anticorps ?",cls:""} ] },
      reveal:{ say:"Ce sont les lymphocytes ! Parfait.",
        lines:[ {t:"➡️ Les <span class='g'>lymphocytes</span>.",cls:"def"} ] } },
    { say:"En résumé : le corps se défend par des barrières naturelles, la phagocytose, et les anticorps fabriqués par les lymphocytes. Cette capacité de défense, c'est l'immunité. Bravo !",
      board:{title:"L'essentiel à retenir 📌", lines:[
        {t:"• Défenses : <span class='b'>barrières</span>, <span class='o'>phagocytose</span>, <span class='g'>anticorps</span>.",cls:""},
        {t:"• <span class='g'>Lymphocytes</span> <span class='w'>⟶</span> anticorps contre les <span class='r'>antigènes</span>.",cls:""},
        {t:"• La défense globale = l'<span class='o'>immunité</span>.",cls:""} ] } },
  ]
},

/* ============== CHAPITRE 5 : DYSFONCTIONNEMENT IMMUNITAIRE ============== */
{
  id:"dysfonctionnement-immunitaire", sem:2,
  titre:"Dysfonctionnement du système immunitaire",
  quiz:[
    {type:'qcm', q:"Une réaction excessive à une substance inoffensive est :", options:["Une allergie","Une vaccination","La phagocytose"], correct:0, fb:"C'est une allergie (la substance = un allergène)."},
    {type:'qcm', q:"Le virus du SIDA (VIH) détruit :", options:["Les lymphocytes","Les os","Les neurones"], correct:0, fb:"Il détruit les lymphocytes → défense affaiblie."},
    {type:'vf', q:"La vaccination est un traitement préventif.", correct:true, fb:"Oui : avant d'être malade, le corps fabrique anticorps + mémoire."},
    {type:'vf', q:"La sérothérapie consiste à fabriquer soi-même ses anticorps.", correct:false, fb:"Non : on injecte des anticorps déjà prêts (curatif, rapide)."},
    {type:'libre', q:"Le vaccin est préventif ; la sérothérapie est… ?", attendus:["curati","rapide","soigne","malade"], reponse:"curative (action rapide)", fb:"La sérothérapie est curative."},
    {type:'association', q:"Relie chaque notion à sa définition :", pairs:[
      {l:"Allergie", r:"réaction excessive à une substance inoffensive"},
      {l:"SIDA (VIH)", r:"détruit les lymphocytes"},
      {l:"Vaccination", r:"préventive : anticorps + mémoire"},
      {l:"Sérothérapie", r:"curative : anticorps déjà prêts"}
    ], fb:"Allergie = réaction excessive ; VIH = détruit les lymphocytes ; vaccin = préventif ; sérum = curatif."}
  ],
  etapes:[
    { say:"Bonjour ! Le système immunitaire nous protège, mais parfois il fonctionne mal. Voyons quand, et comment on peut l'aider.",
      board:{title:"Dysfonctionnement immunitaire", lines:[ {t:"🎯 <span class='o'>Objectif</span> : connaître les <span class='r'>problèmes d'immunité</span> et les moyens d'<span class='g'>aider le corps</span>.",cls:""} ] } },
    { say:"Parfois, le système immunitaire réagit trop fort à une substance pourtant inoffensive, comme le pollen ou la poussière. C'est l'allergie, et la substance s'appelle un allergène.",
      board:{title:"L'allergie", lines:[
        {t:"<span class='r'>Allergie</span> : réaction <span class='r'>excessive</span> à une substance <span class='b'>inoffensive</span>.",cls:"def"},
        {t:"La substance responsable = un <span class='o'>allergène</span> (pollen, poussière…).",cls:""} ], schema:schemaAllergie } },
    { say:"D'autres fois, le système immunitaire est affaibli. C'est le cas du SIDA, causé par le virus VIH, qui détruit les lymphocytes. Le corps ne peut alors plus se défendre contre les microbes.",
      board:{title:"Les déficiences immunitaires", lines:[
        {t:"<span class='r'>Déficience</span> : le système de défense est <span class='r'>affaibli</span>.",cls:"def"},
        {t:"Ex : le <span class='r'>SIDA</span> (virus <span class='r'>VIH</span>) détruit les <span class='g'>lymphocytes</span>.",cls:""} ] } },
    { say:"Pour aider le corps, il y a la vaccination. Regarde le schéma : on injecte un microbe affaibli ou mort, le corps fabrique des anticorps et garde la mémoire. C'est une protection préventive, avant d'être malade.",
      board:{title:"La vaccination (préventive)", lines:[
        {t:"<span class='o'>Vaccination</span> : on injecte un microbe <span class='b'>affaibli/mort</span>.",cls:"def"},
        {t:"Le corps fabrique <span class='g'>anticorps + mémoire</span> <span class='w'>⟶</span> <span class='g'>protégé à l'avance</span>.",cls:""} ], schema:schemaVaccination } },
    { say:"Quand la maladie est déjà là et qu'il faut agir vite, on utilise la sérothérapie : on injecte directement des anticorps déjà prêts. C'est un traitement curatif et rapide.",
      board:{title:"La sérothérapie (curative)", lines:[
        {t:"<span class='g'>Sérothérapie</span> : on injecte des <span class='g'>anticorps déjà prêts</span> (sérum).",cls:"def"},
        {t:"Action <span class='r'>rapide</span>, quand la maladie est <span class='r'>déjà là</span>.",cls:""} ], schema:schemaSerum } },
    { say:"Petite vérification : quelle est la différence entre vaccination et sérothérapie ? Réfléchis avant de regarder la réponse.",
      board:{title:"Vérifions ✅", lines:[
        {t:"❓ Vaccination ou sérothérapie ?",cls:""} ] },
      reveal:{ say:"Le vaccin est préventif : on fabrique nos propres anticorps. La sérothérapie est curative : on reçoit des anticorps tout prêts. Très bien !",
        lines:[ {t:"➡️ <span class='o'>Vaccin</span> = préventif ; <span class='g'>sérum</span> = curatif (rapide).",cls:"def"} ] } },
    { say:"En résumé : le système immunitaire peut réagir trop fort (allergie) ou être affaibli (SIDA). On l'aide par la vaccination, préventive, et la sérothérapie, curative. Bravo, le chapitre est terminé !",
      board:{title:"L'essentiel à retenir 📌", lines:[
        {t:"• Problèmes : <span class='r'>allergie</span> (trop forte) & <span class='r'>déficience</span> (trop faible, ex. SIDA).",cls:""},
        {t:"• <span class='o'>Vaccination</span> = préventive ; <span class='g'>sérothérapie</span> = curative.",cls:""} ] } },
  ]
},

/* ============== COURS : LE SON [M] ET LA LETTRE M ============== */
{
  id:"son-m-nouveau", sem:3,
  subjectLabel:"Français", gradeLabel:"Grande Section / CP", categoryLabel:"Phonologie",
  /* CIBLE EXACTE : sans ce champ, le tuteur IA retombe sur le prompt SVT/collège par défaut
     (il répondrait « système nerveux », « digestion »…). Ici : Français, GS/CP → le tuteur
     reste sur la lettre M et adapte son langage au primaire. */
  targetContext:{subjectName:"Français", gradeLevelName:"Grande Section / CP"},
    titre:"Cours M 1",
  /* Élèves de GS/CP : toute l'évaluation s'affiche en TRÈS GRAND (images XXL, gros boutons). */
  quizBigVisuals:true,
  /* ÉVALUATION : 3 tests illustrés. L'élève en voit UN SEUL, tiré au hasard, et le professeur
     peut en choisir un autre avant de commencer (« 🔄 Changer de quiz » + pastilles 1·2·3).
     Chaque question s'appuie sur une IMAGE : soit une image de la question (img + imgCaption),
     soit des boutons-images (optionImgs / optionSvgs), soit des vignettes à relier (lImg). */
  quizSets:[
    /* ── TEST 1 · J'entends [m] ? (boutons-images) ── */
    {label:"Test 1 · J'entends le son [m] ?",
     intro:"Regarde bien les images, dis le mot dans ta tête et écoute : est-ce qu'il y a « mmmm » ?",
     quiz:[
      {type:'qcm',
        enonce:"Regarde cette image et dis son nom à voix haute : mouton.",
        img:"son-m-nouveau/images/mouton.webp", imgCaption:"Un mouton",
        q:"Entends-tu le son <b>[m]</b> dans mouton ?",
        options:["Oui, j'entends mmmm","Non, je n'entends pas mmmm"], correct:0,
        fb:"Bravo ! mouton commence par mmmm."},
      {type:'qcm',
        enonce:"Voici deux images. Dis leur nom : moto … table.",
        q:"Clique sur l'image où tu entends le son <b>[m]</b>.",
        options:["moto","table"],
        optionImgs:["son-m-nouveau/images/moto.webp","son-m-nouveau/images/table.webp"], correct:0,
        fb:"Oui : moto commence par mmmm. Dans table, il n'y a pas de son [m]."},
      {type:'qcm',
        enonce:"Trois images, un seul mot cache le son [m] : singe … pyjama … ballon.",
        q:"Où se cache le son <b>[m]</b> ?",
        options:["singe","pyjama","ballon"],
        optionImgs:["son-m-nouveau/images/singe.webp","son-m-nouveau/images/pyjama.webp","son-m-nouveau/images/ballon.webp"], correct:1,
        fb:"C'est pyjama : on entend mmmm au milieu. singe et ballon n'ont pas le son mmmm."},
      {type:'vf',
        enonce:"Écoute bien ce mot : table.",
        img:"son-m-nouveau/images/table.webp", imgCaption:"Une table",
        q:"Dans table, on entend le son <b>[m]</b>.",
        correct:false, fb:"Non ! Dans table il n'y a pas de mmmm. Attention à ne pas confondre avec la lettre B."},
      {type:'qcm',
        enonce:"Le détective range les images qui chantent mmmm dans son panier.",
        img:"son-m-nouveau/images/scene-panier.webp", imgCaption:"Le panier du son [m]",
        q:"Quelle image va dans le panier ?",
        options:["plume","ballon"],
        optionImgs:["son-m-nouveau/images/plume.webp","son-m-nouveau/images/ballon.webp"], correct:0,
        fb:"plume finit par mmmm. Elle va dans le panier !"}
    ]},
    /* ── TEST 2 · Où se cache le son [m] ? (début / milieu / fin) ── */
    {label:"Test 2 · Où se cache le son [m] ?",
     intro:"Le son [m] se cache au début, au milieu ou à la fin du mot. À toi de le retrouver !",
     quiz:[
      {type:'qcm',
        enonce:"Observe les trois cartes : moto, plume, pyjama.",
        img:"son-m-nouveau/images/cartes-position-son-m.webp", imgCaption:"Les cartes du son [m]",
        q:"Dans <b>moto</b>, où entends-tu le son [m] ?",
        options:["Au début","Au milieu","À la fin"], correct:0,
        fb:"Dans moto, on entend mmmm tout au début du mot."},
      {type:'qcm',
        enonce:"Dis le mot lentement : py-ja-ma.",
        img:"son-m-nouveau/images/pyjama.webp", imgCaption:"Un pyjama",
        q:"Où entends-tu le son <b>[m]</b> dans pyjama ?",
        options:["Au début","Au milieu","À la fin"], correct:1,
        fb:"Dans pyjama, on entend mmmm au milieu."},
      {type:'qcm',
        enonce:"Dis le mot lentement : plu-me.",
        img:"son-m-nouveau/images/plume.webp", imgCaption:"Une plume",
        q:"Où entends-tu le son <b>[m]</b> dans plume ?",
        options:["Au début","Au milieu","À la fin"], correct:2,
        fb:"Dans plume, on entend mmmm à la fin."},
      {type:'association',
        enonce:"Chaque image cache le son [m] à un endroit différent.",
        q:"Relie chaque image à la place du son <b>[m]</b> :",
        pairs:[
          {l:"mouton", lImg:"son-m-nouveau/images/mouton.webp", r:"au début"},
          {l:"pyjama", lImg:"son-m-nouveau/images/pyjama.webp", r:"au milieu"},
          {l:"plume",  lImg:"son-m-nouveau/images/plume.webp",  r:"à la fin"}
        ],
        fb:"mouton : au début · pyjama : au milieu · plume : à la fin."},
      {type:'vf',
        enonce:"Regarde la moto et écoute : mmmm, comme au début de moto.",
        img:"son-m-nouveau/images/moto.webp", imgCaption:"Une moto",
        q:"Le son [m] est à la <b>fin</b> du mot moto.",
        correct:false, fb:"Non : dans moto, le son [m] est au début du mot."}
    ]},
    /* ── TEST 3 · Je reconnais la lettre M (les trois écritures) ── */
    {label:"Test 3 · Je reconnais la lettre M",
     intro:"Le monstre ne mange que la lettre M. Sauras-tu reconnaître M, m et 𝓂 sans te tromper ?",
     quiz:[
      {type:'qcm',
        enonce:"Le monstre a très faim, mais il ne mange que la lettre M en majuscule.",
        img:"son-m-nouveau/images/scene-monstre.webp", imgCaption:"Le monstre mangeur de lettres",
        q:"Quelle lettre peut-il avaler ?",
        options:["M","N","W"],
        optionSvgs:[LETTRE_SVG('M'),LETTRE_SVG('N'),LETTRE_SVG('W')], correct:0,
        fb:"C'est bien M : elle a trois jambes et deux pointes vers le bas."},
      {type:'qcm',
        enonce:"Voici la même lettre écrite en petit (script).",
        q:"Quelle est la lettre <b>m</b> minuscule ?",
        options:["m","n","u"],
        optionSvgs:[LETTRE_SVG('m'),LETTRE_SVG('n'),LETTRE_SVG('u')], correct:0,
        fb:"Le m minuscule a trois jambes ; le n n'en a que deux."},
      {type:'qcm',
        enonce:"Et maintenant l'écriture attachée (cursive), celle du cahier.",
        q:"Quelle écriture est le <b>m</b> cursif ?",
        options:["𝓂","𝓃","𝒾"],
        optionSvgs:[LETTRE_SVG('𝓂'),LETTRE_SVG('𝓃'),LETTRE_SVG('𝒾')], correct:0,
        fb:"Bravo : 𝓂 est le m attaché, avec ses trois ponts."},
      {type:'vf',
        enonce:"Pour faire le son [m], on ferme les deux lèvres, l'air passe par le nez et la gorge vibre.",
        img:"son-m-nouveau/images/articulation-son-m.webp", imgCaption:"Le geste du son [m]",
        q:"La lettre M fait un son continu : <b>mmmm</b>.",
        correct:true, fb:"Oui ! On peut prolonger le son : mmmm. On ne dit pas « émé » pour lire M."},
      {type:'qcm',
        enonce:"Les trois écritures de la même lettre sont affichées au tableau.",
        img:"son-m-nouveau/images/scene-mission-detective.webp", imgCaption:"La mission du détective M",
        q:"Combien d'écritures a la lettre M ?",
        options:["3 : M, m et 𝓂","1 seule","2 seulement"], correct:0,
        fb:"Trois écritures : la majuscule M, la minuscule m et la cursive 𝓂."}
    ]}
  ],
  /* ANCRAGE (règle primaire, cf. index.html) : après chaque explication, le prof redit la
     phrase clé deux fois, lentement, en laissant un blanc pour que la classe répète avec lui.
     Les phrases sont volontairement TRÈS courtes et prononçables d'un souffle par un CP. */
  etapes:[
    {ancrage:"Aujourd'hui, nous apprenons le son de la lettre M.",
     intro:true,say:"Bonjour les détectives ! Aujourd'hui, nous découvrons la lettre M. Nous allons écouter un son. Nous allons le chercher dans des mots. Et nous allons apprendre à l'écrire. Prêts ? On commence !",board:{title:"Cours M 1",media:{type:'image',src:'son-m-nouveau/images/scene-mission-detective.webp',desc:"Le détective de la lettre M"},lines:[{t:"<span class='o'>Cours M 1</span> : découvrir le son <span class='b'>[m]</span> et la lettre <span class='g'>M</span>.",cls:"def"}]}},
    {ancrage:"Le son peut durer : mmmm.",
     phase:"concept",say:"Voici notre son. La lettre M chante le son [m]. Je ferme mes deux lèvres. L'air passe par le nez. Ma gorge vibre. Écoute bien : le son peut durer : mmmm. On ne dit pas « émé ». On entend ce son dans le mot maison. On l'entend dans camion. On l'entend dans pomme. Écoute encore : le son peut durer : mmmm.",board:{title:"Règle phonétique : M fait [m]",media:{type:'image',src:'son-m-nouveau/images/articulation-son-m.webp',desc:"Articulation du son [m]"},lines:[{t:"<span class='b'>M = [m]</span> : deux lèvres fermées, air par le nez, gorge qui vibre.",cls:"def"},{t:"<span class='g'>Son continu</span> : mmmm — pas « émé ».",cls:"imp"},{t:"<span class='o'>MAISON</span> : début · <span class='o'>CAMION</span> : milieu · <span class='o'>POMME</span> : fin.",cls:"ex"}]}},
    {ancrage:"Je ferme les lèvres. Le son peut durer : mmmm.",
     phase:"concept",say:"Regarde bien l'enfant. Il ferme les lèvres. Il pose une main sur sa gorge. Il pose l'autre main sur son ventre. Fais comme lui. Prolonge le son : mmmm. Sens ta gorge qui vibre.",board:{title:"Produire le son [m]",media:{type:'image',src:'son-m-nouveau/images/articulation-son-m.webp',desc:"Geste pour produire le son [m]"},lines:[{t:"Fermer les <span class='b'>lèvres</span>.",cls:"def"},{t:"Une main sur la <span class='o'>gorge</span>, une main sur le <span class='o'>ventre</span>.",cls:""},{t:"M fait <span class='g'>mmmm</span> : un son continu.",cls:"def"}]}},
    {ancrage:"J'écoute bien le mot. Est-ce que j'entends le son de la lettre M ?",
     phase:"simulation",say:"Maintenant, qui veut venir au tableau ? À toi de jouer ! Écoute bien chaque mot. Cherche le son de la lettre M. Le son peut durer : mmmm. Si tu entends ce son, pose l'image dans le panier. Si non, laisse-la en haut. Vas-y, je t'écoute.",board:{title:"",media:{type:'simulation',src:'son-m-nouveau/sim-01-panier-nouveau.html',desc:"Classer les mots selon la présence du son [m]"},lines:[]}},
    {ancrage:"Au début, au milieu, ou à la fin ?",
     phase:"simulation",say:"À qui le tour de venir au tableau ? Viens, je t'aide. Dis le mot tout doucement. Cherche le son de la lettre M. Le son peut durer : mmmm. Où se cache-t-il ? Au début ? Au milieu ? À la fin ? Trouve sa place pour chaque image.",board:{title:"",media:{type:'simulation',src:'son-m-nouveau/sim-02-position-nouveau.html',desc:"Localiser le son [m] dans un mot"},lines:[]}},
    {ancrage:"Je reconnais la lettre M.",
     phase:"simulation",say:"Qui veut nourrir le monstre au tableau ? À toi ! Le monstre a très faim. Mais il ne mange que la lettre M. Attention ! Certaines lettres lui ressemblent. Choisis bien les M.",board:{title:"",media:{type:'simulation',src:'son-m-nouveau/sim-03-monstre-nouveau.html',desc:"Trier les écritures de la lettre M"},lines:[]}},
    {ancrage:"Lèvres fermées. Le son peut durer : mmmm.",
     phase:"simulation",say:"À ton tour de venir fabriquer le son ! Ferme bien tes lèvres. Touche ta gorge, tout doucement. Touche ton ventre. Et fais le son : le son peut durer : mmmm. Bravo, tu fabriques le son [m] !",board:{title:"",media:{type:'simulation',src:'son-m-nouveau/sim-04-fabrique-nouveau.html',desc:"Reproduire le geste et prolonger le son [m]"},lines:[]}},
    {ancrage:"J'écris M, m et 𝓂.",
     phase:"simulation",say:"Pour finir, qui vient écrire au tableau ? Regarde les trois lettres. Prends bien ton temps. Commence en haut. Descends. Remonte. Redescends. Trace M, puis m, puis m attaché.",board:{title:"",media:{type:'simulation',src:'son-m-nouveau/sim-05-ecritures-nouveau.html',desc:"Tracer les trois écritures de la lettre M"},lines:[]}},
    {ancrage:"Le son de la lettre M peut durer : mmmm.",
     say:"Bravo les détectives ! Tu connais le son de la lettre M. Tu sais où il se cache dans les mots. Tu reconnais M, m et m attaché. Souviens-toi : le son peut durer : mmmm.",board:{title:"Trace finale",media:{type:'image',src:'son-m-nouveau/images/scene-enfant-gateau.webp',desc:"Le son [m] avec le gâteau"},lines:[{t:"<span class='b'>M fait [m]</span> : <span class='g'>mmmm</span>.",cls:"def"},{t:"Je ferme les lèvres et je prolonge le son.",cls:""},{t:"Je reconnais <span class='b'>M</span>, <span class='g'>m</span> et <span class='o'>𝓂</span>.",cls:""}]}}
  ]
},

];

})();   // fin IIFE
