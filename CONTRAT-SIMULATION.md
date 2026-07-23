# Contrat d'affichage des simulations et des médias

Règle unique, valable pour **toute** simulation ajoutée au tableau, qu'elle soit écrite à la
main, produite par une IA externe ou déposée telle quelle dans le dossier.

**Elle s'applique toute seule.** Le serveur injecte `prototype/cc-sim-contract.js` dans chaque
page de simulation qu'il sert (`server.js`, section « CONTRAT D'AFFICHAGE DES SIMULATIONS »).
Rien à ajouter dans une nouvelle simulation : elle est conforme d'office.

Pourquoi au serveur et pas dans le navigateur ? L'iframe du tableau est en **sandbox sans
`allow-same-origin`** : le parent ne peut pas modifier la page après coup. La normalisation
doit donc avoir lieu au moment où le fichier est servi.

Le script est **défensif** : il n'écrase jamais une simulation déjà conforme (si la page
expose son propre `window.CourseSimulation` avec sa vraie logique de jeu, il la laisse intacte
et se contente du silence et de la mise à l'échelle).

`test/simulation-affichage.test.js` vérifie cette chaîne à chaque `npm test`.

## Pourquoi cette règle existe

Sur le cours M 1, une simulation s'affichait dans un cadre de 1220 × 152 px alors que sa
scène est en 16:9. Résultat : la scène ne faisait que 270 px de large et **78 % de la largeur
était perdue** en bandes bleues. Trois causes cumulées, toutes évitables :

1. le tableau n'étirait pas la simulation (un div intermédiaire gardait sa hauteur auto) ;
2. la page de simulation avait un fond opaque, qui peignait les bandes en bleu ;
3. l'étape affichait un titre et une ligne de texte qui volaient la hauteur.

## Les 4 points du contrat

### 1. La scène a un format fixe et s'y tient
La page ne défile **jamais** et sa scène garde son format en s'adaptant au cadre :

```css
html,body{height:100%;margin:0;overflow:hidden}
.scene{max-width:calc(100vh * L / H); max-height:calc(100vw * H / L); aspect-ratio:L/H;margin:auto}
```

`L/H` = les dimensions réelles de l'image de fond (ex. 1672/941). Le rectangle affiché
coïncide alors exactement avec l'image : **un pourcentage à l'écran = le même pourcentage
dans le jeu**, donc le glisser-déposer reste précis quelle que soit la forme du cadre.

### 2. Le fond est transparent
`body{background:transparent}`. Un fond opaque dessine des bandes colorées autour de la
scène. Transparent, c'est le tableau qu'on voit, et la simulation s'y fond.

### 3. La simulation EST le tableau
Une étape dont le média est une simulation a `title:""` et `lines:[]`. La consigne est
**dite** par l'avatar (`say`), jamais écrite à côté : elle prendrait la place de la scène.

### 4. Elle est muette et pilotable
- Muette : chaque mot part vers l'avatar via `postMessage({type:'cc-sim-voice', kind, text})`.
  L'avatar est la seule voix du cours.
- **Jamais un caractère seul dans `text`.** Le moteur TTS devine la langue d'après le texte
  reçu : « n », « W », « u » n'ont aucun indice de français et se font lire en ANGLAIS.
  Toujours une phrase française complète — `'la lettre W majuscule'`, pas `'W'`.
- Pilotable : la page expose `window.CourseSimulation` (`getState`, `getCapabilities`,
  `dispatch`) et écoute `{type:'cc-sim', action}` — `demo`, `reset`, `place`, `finish`.

## Côté tableau (déjà en place dans `index.html`)

Le tableau étire la simulation quelle que soit la profondeur d'emboîtement :

```css
.board:has(.simulation-embedded){display:flex;flex-direction:column;overflow:hidden}
.board:has(.simulation-embedded) .content{flex:1 1 auto;min-height:0;display:flex;flex-direction:column}
.board:has(.simulation-embedded) .content>*{flex:0 0 auto;min-height:0}
.board:has(.simulation-embedded) .content>*:has(.simulation-embedded){flex:1 1 auto;display:flex;flex-direction:column}
.lesson-media.simulation-embedded iframe{background:transparent;border:0}
```

## Poids des images

Une image affichée en 200 px n'a pas besoin de faire 800 Ko. Cible : **largeur d'affichage
× 2 au maximum, en WebP**. Sur M 1, cela ramène 5,52 Mo à 0,22 Mo (96 % de moins) sans perte
visible.
