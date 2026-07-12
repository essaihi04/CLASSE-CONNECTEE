# Supabase — espace professeur

## Installation

1. Dans Supabase, ouvrez **SQL Editor** et exécutez intégralement, dans cet ordre :
   - [20260712_001_teacher_portal.sql](supabase/migrations/20260712_001_teacher_portal.sql)
   - [20260712_002_legacy_demo_access.sql](supabase/migrations/20260712_002_legacy_demo_access.sql)
   - [20260712_003_assign_legacy_demo.sql](supabase/migrations/20260712_003_assign_legacy_demo.sql)
   - [20260712_004_complete_grade_levels.sql](supabase/migrations/20260712_004_complete_grade_levels.sql)
   - [20260712_005_high_school_streams.sql](supabase/migrations/20260712_005_high_school_streams.sql)
   - [20260712_006_complete_subjects.sql](supabase/migrations/20260712_006_complete_subjects.sql)
2. Dans **Authentication > URL Configuration**, ajoutez les URL de redirection :
   - `http://localhost:3000/login.html`
   - l’URL HTTPS de production suivie de `/login.html`
3. Dans **Authentication > Providers > Email**, activez la confirmation par e-mail si vous souhaitez vérifier les nouveaux comptes.
4. Dans [prototype/supabase-config.js](prototype/supabase-config.js), remplacez uniquement la valeur `anonKey` par la nouvelle clé **anon** ou **publishable** de votre projet.
5. Lancez l’application avec `npm start`, puis ouvrez `http://localhost:3000/login.html`.

## Sécurité importante

- La clé `service_role` ne doit jamais apparaître dans une page HTML, un fichier JavaScript livré au navigateur ou un dépôt Git.
- Après avoir été communiquée, une clé doit être régénérée dans **Settings > API**. Faites-le pour les clés déjà exposées.
- La migration active RLS : un professeur ne lit et ne modifie que son profil, ses attributions, ses cours, ses sections, ses supports, ses quiz et ses médias.
- Pour créer le premier administrateur, inscrivez-vous, récupérez l’UUID dans **Authentication > Users**, puis exécutez :

```sql
update public.profiles set role = 'admin' where id = '<UUID_DU_COMPTE_ADMIN>';
```

## Ce que la migration crée

- `profiles` : identité du professeur et rôle.
- `subjects` et `grade_levels` : catalogue matière/niveau.
- `teacher_assignments` : matière et niveau attribués à un professeur.
- `courses`, `course_sections`, `course_assets`, `course_quizzes` : contenu entièrement isolé par professeur.
- Le bucket privé `course-media` : chaque fichier est rangé sous `<uuid-professeur>/...`.

## Migration de l’ancien prototype

La page de connexion protège l’accès à `prof.html`. Par défaut, un nouveau professeur voit un espace vide et uniquement ses cours Supabase. Les cours, modèles et fichiers locaux créés avant la migration sont masqués.

Pour donner l’accès exceptionnel aux données historiques au compte démo, créez/identifiez ce compte puis exécutez la requête commentée dans `20260712_002_legacy_demo_access.sql`, en remplaçant l’e-mail. Ne donnez jamais `legacy_access = true` aux nouveaux professeurs.

Les anciennes routes JSON locales (`/api/content`, `/api/overrides`, etc.) restent utilisées uniquement par le compte démo du prototype : elles ne doivent pas être déployées en multi-professeurs.

La prochaine étape consiste à remplacer ces routes par les tables Supabase créées ici, en chargeant les cours via `courses`, `course_sections`, `course_assets` et `course_quizzes`. Ainsi, l’isolation RLS deviendra aussi effective sur les contenus existants.
