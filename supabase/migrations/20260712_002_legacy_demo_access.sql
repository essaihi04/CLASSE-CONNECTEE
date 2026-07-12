-- Isolation du contenu historique du prototype.
-- Exécutez cette migration APRÈS 20260712_001_teacher_portal.sql.

alter table public.profiles
  add column if not exists legacy_access boolean not null default false;

comment on column public.profiles.legacy_access is
  'Accès exceptionnel aux cours, modèles et fichiers créés avant la migration Supabase. À réserver au seul compte démo / propriétaire.';

-- Les contenus historiques locaux ne sont pas protégés par RLS. Ils ne doivent donc être
-- affichés qu’au compte démo. Tous les nouveaux cours sont stockés dans courses,
-- course_sections, course_assets et course_quizzes, déjà protégés par RLS.

-- APRÈS avoir créé ou identifié le compte démo, remplacez l’e-mail puis exécutez cette ligne :
-- update public.profiles p set legacy_access = true
-- from auth.users u where p.id = u.id and lower(u.email) = lower('demo@votre-etablissement.ma');
