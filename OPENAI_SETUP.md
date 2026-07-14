# Configuration OpenAI

La plateforme utilise OpenAI pour quatre fonctions : analyser le PDF, structurer le cours et ses évaluations, générer les illustrations utiles, piloter les simulations et produire la voix.

## 1. Sécuriser la clé

Une clé copiée dans un message, une capture, un fichier ou un commit doit être considérée comme compromise. Révoquez-la dans le tableau de bord OpenAI et créez-en une nouvelle. Le serveur n'accepte la clé que par la variable d'environnement `OPENAI_API_KEY` ; aucun fichier `openai.key` n'est lu.

Pour une session PowerShell locale :

```powershell
$env:OPENAI_API_KEY = "votre-nouvelle-cle"
npm start
```

Sur l'hébergeur, ajoutez `OPENAI_API_KEY` dans les variables d'environnement privées, puis redéployez. Ne la préfixez jamais par `PUBLIC_` et ne l'envoyez jamais au navigateur.

## 2. Modèles et coûts

Les valeurs par défaut sont documentées dans [.env.example](.env.example). Le nombre d'images dépend uniquement des blocs jugés utiles par l'analyse pédagogique ; le navigateur limite la génération automatique à quatre images de cours par import, en plus d'une éventuelle illustration intégrée à une simulation.

## 3. Protection des élèves

- Le PDF et les instructions doivent contenir du contenu pédagogique, pas de données personnelles d'élèves.
- Les questions envoyées au tuteur ne doivent pas demander le nom, l'adresse, le téléphone ou une autre identité de l'élève.
- La plateforme transmet uniquement la question, la cible du cours, un extrait validé du contenu et l'état technique de la simulation.
- La voix est explicitement présentée dans l'interface comme une voix générée par IA.

Avant une mise en production destinée aux enfants, configurez les mesures juridiques et techniques applicables à votre pays et à l'âge des élèves, notamment la conservation des données, la modération et le signalement.
