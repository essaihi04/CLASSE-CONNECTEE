// =====================================================================
//  BASE DE CONNAISSANCES — SVT 3ème année collège (3APIC), programme marocain
//  Sert de "contexte RAG" injecté dans le prompt système : l'IA (Pr. Yassine)
//  doit RESTER dans ce programme et refuser poliment ce qui en sort.
//  Source de la structure : programme officiel (cf. découpage en 2 semestres).
//  -> Modifiable librement : ajoute/précise des notions, l'IA s'y conformera.
// =====================================================================

const PROGRAMME_SVT_3AC = `
PROGRAMME OFFICIEL — SVT, 3ème année du collège (3APIC), Maroc.
Deux grands thèmes : (A) les fonctions de nutrition chez l'Homme, (B) les fonctions de communication et de défense.

=== SEMESTRE 1 : LES FONCTIONS DE NUTRITION CHEZ L'HOMME ===

1) LA DIGESTION DES ALIMENTS ET L'ABSORPTION INTESTINALE
   - Aliments simples / aliments composés ; les nutriments.
   - Le tube digestif (bouche, œsophage, estomac, intestin grêle, gros intestin, anus) et les glandes digestives (salivaires, foie, pancréas).
   - Digestion mécanique (mastication, brassage) et digestion chimique (enzymes/sucs digestifs).
   - Simplification des aliments en nutriments.
   - L'absorption intestinale au niveau de l'intestin grêle (villosités intestinales) : passage des nutriments dans le sang.

2) ÉDUCATION NUTRITIONNELLE ET HYGIÈNE DE L'APPAREIL DIGESTIF
   - Groupes d'aliments : énergétiques, bâtisseurs (constructeurs), fonctionnels (protecteurs).
   - Ration alimentaire équilibrée ; besoins selon l'âge, le sexe, l'activité.
   - Maladies liées à l'alimentation (malnutrition, carences, obésité) ; hygiène alimentaire et bucco-dentaire (caries).

3) LA RESPIRATION CHEZ L'HOMME
   - Appareil respiratoire : voies respiratoires (nez, trachée, bronches) et poumons (alvéoles pulmonaires).
   - Mouvements respiratoires : inspiration et expiration.
   - Échanges gazeux au niveau des alvéoles : absorption de dioxygène (O2), rejet de dioxyde de carbone (CO2).
   - Hygiène respiratoire (tabac, pollution, maladies respiratoires).

4) LE SANG ET LA CIRCULATION SANGUINE CHEZ L'HOMME
   - Composition du sang : plasma, globules rouges, globules blancs, plaquettes.
   - Appareil circulatoire : le cœur, les vaisseaux (artères, veines, capillaires).
   - La double circulation : grande circulation et petite circulation (pulmonaire).
   - Rôle du sang : transport des nutriments, des gaz et des déchets.

5) L'EXCRÉTION URINAIRE CHEZ L'HOMME
   - Appareil urinaire : reins, uretères, vessie, urètre.
   - Filtration du sang par les reins et formation de l'urine ; élimination des déchets (urée).
   - Hygiène de l'appareil urinaire.

=== SEMESTRE 2 : LES FONCTIONS DE COMMUNICATION ET DE DÉFENSE ===

6) LE SYSTÈME NERVEUX
   - Centres nerveux (cerveau, cervelet, moelle épinière) et nerfs ; le neurone.
   - Le message nerveux ; acte volontaire et acte réflexe.
   - Hygiène du système nerveux (sommeil, drogues, fatigue).

7) LE SYSTÈME MUSCULAIRE
   - Les muscles (muscles striés squelettiques) ; contraction musculaire.
   - Rôle des muscles dans le mouvement, en relation avec le système nerveux et le squelette.
   - Fatigue musculaire, hygiène.

8) LES MICROBES
   - Types de microbes : bactéries, virus, champignons, protozoaires.
   - Microbes utiles et microbes pathogènes ; contamination et infection ; voies de transmission.
   - Asepsie et antisepsie (lutte contre les microbes).

9) LE SYSTÈME IMMUNITAIRE
   - Défenses de l'organisme : barrières naturelles (peau, muqueuses).
   - Réaction immunitaire : phagocytose, réponse à anticorps (lymphocytes), antigène/anticorps.
   - Notion d'immunité.

10) DYSFONCTIONNEMENT DU SYSTÈME IMMUNITAIRE ET PROBLÈMES D'IMMUNITÉ
   - Allergies ; déficiences immunitaires (ex : VIH/SIDA).
   - Vaccination et sérothérapie ; notion de greffe et de rejet.
`;

module.exports = { PROGRAMME_SVT_3AC };
