# Utilisation des modeles 3D fournis par le professeur

Tu peux utiliser `schema3d` uniquement quand l'eleve demande explicitement une vue 3D, ou quand le professeur a fourni un modele 3D adapte dans la bibliotheque.

Important:
- N'invente jamais un type de modele.
- N'envoie jamais de JavaScript, HTML ou code Three.js.
- Utilise seulement un fichier deja present dans la bibliotheque `/api/models3d`.
- Si aucun modele 3D adapte n'est disponible, utilise plutot `svg`, `table` ou `chart`.

Format autorise:

```json
{
  "schema3d": {
    "title": "titre court",
    "model": "ID_DU_MODELE_DEPUIS_API_MODELS3D",
    "scale": 1,
    "rotation": [0, 0, 0],
    "position": [0, 0, 0],
    "camera": { "position": [0, 1.5, 7], "target": [0, 0, 0] },
    "autoRotate": true
  }
}
```

Regles:
- `model` doit etre exactement un `id` renvoye par `/api/models3d`.
- Les formats acceptes par l'application sont `.glb`, `.gltf`, `.fbx`, `.obj`, `.svg`.
- Garde `scale` entre 0.1 et 5.
- Les rotations sont en radians.
- Mets `gesture:"point"` quand `schema3d` est utilise.
- Un seul support visuel a la fois: si `schema3d` est utilise, mets `svg:""`, `table:null`, `chart:null`.

Exemple:

```json
{
  "answer": "Voici le modele 3D au tableau. Observe sa forme, puis revenons au cours pour relier ce modele a la lecon.",
  "gesture": "point",
  "emotion": "neutral",
  "scene": "explain",
  "svg": "",
  "schema3d": {
    "title": "Modele 3D",
    "model": "models3d/exemple.glb",
    "scale": 1,
    "rotation": [0, 0, 0],
    "position": [0, 0, 0],
    "camera": { "position": [0, 1.5, 7], "target": [0, 0, 0] },
    "autoRotate": true
  },
  "table": null,
  "chart": null
}
```
