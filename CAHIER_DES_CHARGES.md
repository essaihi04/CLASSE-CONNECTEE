# Cahier des charges — « Classes Connectées »

> Plateforme d'enseignement où une **IA joue le rôle d'un professeur** qui explique
> les leçons, écrit au tableau interactif et répond aux questions des élèves.
> Programme **marocain**, niveau **collège**, en commençant par la **SVT**.

---

## 1. Vision du fondateur (synthèse de la discussion)

| Point clé | Ce qu'il veut |
|-----------|---------------|
| **Rôle de l'IA** | L'IA est un **prof**, pas un simple chatbot. Elle **explique** les leçons. |
| **Un prof par matière** | Un avatar/professeur distinct pour **Math**, **PC** (Physique-Chimie) et **SVT**. |
| **Matière pilote** | Commencer par la **SVT** (maîtrisée par l'équipe), pour valider le concept. |
| **Niveau pilote** | Une classe de **collège** : 1AC (C7), 2AC (C8) ou 3AC (C9) — à trancher. |
| **Programme** | **Officiel marocain**. |
| **Avatar** | Un **avatar visuel** qui interagit avec l'élève via un **tableau interactif** : il bouge, écrit, dessine le cours. |
| **Voix** | L'avatar **parle** si possible (à intégrer plus tard, jugé « facile »). |
| **Supports** | Affiche schémas / images d'explication **quand c'est nécessaire**. |
| **Questions** | L'élève pose une question → la réponse s'affiche **directement à l'écran**. |
| **Méthode** | **Structure de base d'abord**, puis on l'alimente selon les besoins. |
| **Duplication** | Si la SVT fonctionne → **dupliquer** le même moteur sur Math et PC. |
| **Échéance** | Un **premier jet ce week-end**, discussion **lundi**. |

**Idée directrice :** reproduire l'expérience d'un cours en classe — un prof devant un
tableau — mais personnalisé, disponible 24/7, et à l'écoute des questions de chaque élève.

---

## 2. Objectifs du produit

1. **Pédagogique** : faire comprendre une leçon comme le ferait un bon prof (explication
   progressive, vocabulaire, schémas, exemples, vérification de la compréhension).
2. **Engagement** : un avatar vivant + tableau animé + voix → l'élève « assiste à un cours »
   plutôt qu'il ne « lit un texte ».
3. **Interactivité** : l'élève peut interrompre, poser une question, demander de répéter
   ou de simplifier ; l'IA s'adapte.
4. **Scalabilité** : un **moteur unique** (avatar + tableau + IA) réutilisable pour toute
   matière / tout niveau, juste en changeant le **contenu** (programme) et la **personnalité**
   du prof.

---

## 3. Périmètre

### Inclus dans le prototype (V0 — pour lundi)
- 1 matière : **SVT**, 1 niveau collège, **1 leçon complète** de démonstration.
- 1 **avatar professeur** animé qui « parle » (synthèse vocale FR du navigateur, gratuite).
- **Tableau interactif** : le cours s'écrit / se dessine progressivement (titres, définitions, schéma).
- **Déroulé du cours** étape par étape (Précédent / Suivant / Rejouer).
- **Zone de questions** : l'élève écrit une question → réponse affichée + lue à l'écran.
- Sélecteur de matières (Math / PC affichées comme « Bientôt »).

### Hors prototype (versions suivantes)
- Comptes élèves / professeurs / parents, suivi de progression, notes.
- IA générative connectée en temps réel (API Claude) avec garde-fous pédagogiques.
- Exercices auto-corrigés, quiz notés, badges.
- Avatar 3D / synchronisation labiale avancée, voix premium.
- Tableau blanc où l'élève écrit aussi (reconnaissance d'écriture).
- Tableau de bord enseignant pour éditer le programme.

---

## 4. Acteurs

- **Élève** : suit les cours, pose des questions, fait les exercices.
- **Professeur / créateur de contenu** : alimente le programme (leçons, schémas, prompts).
- **Administrateur** : gère matières, niveaux, comptes (versions futures).

---

## 5. Fonctionnalités détaillées

### 5.1 Avatar professeur
- Représentation visuelle par matière (un prof SVT, un prof Math, un prof PC).
- États : *au repos*, *parle* (animation bouche/tête), *écrit au tableau*, *réfléchit*.
- Synthèse vocale en **français** (et possibilité **arabe / darija** plus tard).

### 5.2 Tableau interactif
- Affichage progressif du contenu synchronisé avec la parole de l'avatar.
- Éléments : titres, définitions surlignées, listes, **schémas SVG** (ex. appareil digestif),
  images/illustrations, mots-clés mis en évidence.
- Effet « craie / feutre » qui apparaît au fur et à mesure.

### 5.3 Déroulé pédagogique d'une leçon
Structure type d'une leçon (réutilisable pour toute matière) :
1. **Accueil / objectif** — « Aujourd'hui on va comprendre… »
2. **Découverte** — question de départ, observation, situation concrète.
3. **Explication** — notions expliquées pas à pas + schéma au tableau.
4. **Vocabulaire clé** — définitions à retenir.
5. **Vérification** — 1 à 2 questions à l'élève.
6. **Résumé / bilan** — l'essentiel à retenir.

### 5.4 Questions de l'élève (Q&R)
- Champ de saisie « Pose ta question au prof ».
- Réponse affichée à l'écran **et** lue à voix haute.
- (V1) Réponses générées par l'IA, **cadrées** sur le niveau et le programme.

### 5.5 Navigation
- Choix matière → niveau → leçon.
- Dans la leçon : Précédent / Suivant / Rejouer / Activer-couper la voix.

---

## 6. Architecture technique proposée

**Principe : un moteur, du contenu interchangeable.**

```
┌─────────────────────────────────────────────┐
│                 INTERFACE                     │
│  Avatar prof  │  Tableau interactif  │ Q&R    │
└─────────────────────────────────────────────┘
                      │
┌─────────────────────────────────────────────┐
│              MOTEUR DE COURS                  │
│  Lecteur de leçons (étapes) │ Voix (TTS)      │
│  Animation tableau │ Routage des questions    │
└─────────────────────────────────────────────┘
                      │
┌──────────────────────┐   ┌────────────────────┐
│   CONTENU / PROGRAMME │   │   IA (V1)          │
│  Leçons SVT/Math/PC    │   │  API Claude        │
│  (JSON : texte+schéma) │   │  prompt « prof »   │
└──────────────────────┘   └────────────────────┘
```

- **Prototype (V0)** : 100 % front-end (HTML/CSS/JS), aucune dépendance, aucun coût.
  Voix = **Web Speech API** du navigateur. Le contenu d'une leçon est un objet JSON
  (`étapes` = {parole, action tableau}). → fiable pour une démo, fonctionne hors-ligne.
- **V1 (production)** : ajouter l'**API Claude** comme cerveau du prof (génération
  d'explications et réponses), un back-end léger (Node) pour cacher la clé API et stocker
  le programme, puis comptes + progression.
- **Pourquoi ce choix** : on valide d'abord l'**expérience** (avatar + tableau + voix) sans
  dépendre d'une connexion IA en direct le jour de la démo ; l'IA réelle se branche ensuite
  sur la **même** structure de leçon.

---

## 7. Contenu pilote — SVT collège

- **Niveau retenu pour la démo** : 1ère année collège (1AC / C7) — *à confirmer lundi*.
- **Leçon de démonstration** : « La digestion des aliments chez l'Homme »
  (riche en schéma → idéale pour montrer le tableau interactif).
- Source : **programme officiel marocain** de SVT.

> Une fois la SVT validée, le **même gabarit de leçon** est rempli pour Math et PC :
> seuls le texte, les schémas et la « personnalité » du prof changent.

---

## 8. Critères d'acceptation du prototype (V0)

- [ ] L'avatar apparaît et **parle en français** une leçon de SVT.
- [ ] Le **tableau se remplit progressivement** (titre → explications → schéma → résumé).
- [ ] Navigation **Précédent / Suivant / Rejouer** fonctionnelle.
- [ ] L'élève peut **poser une question** et obtenir une réponse affichée + lue.
- [ ] Matières Math / PC visibles (« Bientôt »).
- [ ] Fonctionne dans un navigateur, **sans installation**, pour la démo de lundi.

---

## 9. Suites proposées (feuille de route)

| Version | Contenu | Délai indicatif |
|---------|---------|-----------------|
| **V0 — Prototype** | Démo SVT 1 leçon, avatar + tableau + voix (ce week-end) | ✅ ce week-end |
| **V1 — IA réelle** | Branchement API Claude (prof génératif), 3-4 leçons SVT | 2–3 semaines |
| **V2 — Comptes & suivi** | Élèves/profs, progression, quiz notés | 1 mois |
| **V3 — Multi-matières** | Duplication Math + PC, multi-niveaux | selon validation |

---

## 10. Questions à trancher avec le fondateur (lundi)

1. **Niveau exact** de la démo : 1AC, 2AC ou 3AC ?
2. **Langue** des explications : français seul, ou français + **arabe/darija** ?
3. **Avatar** : style « réaliste », illustré/cartoon, ou simple personnage animé ?
4. **Voix** : voix navigateur (gratuite) pour la démo, ou voix premium dès V1 ?
5. **Modèle économique** : abonnement élève, vente aux écoles, freemium ?
6. **Hébergement / marque** : nom de domaine, identité visuelle, couleurs de l'école.
