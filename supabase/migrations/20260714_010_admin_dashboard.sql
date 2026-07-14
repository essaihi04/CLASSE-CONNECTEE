-- Tableau de bord administrateur.
-- À exécuter après 20260713_009_teacher_course_privacy.sql.
--
-- Le rôle admin existe déjà (profiles.role + is_platform_admin(), migration 001) et les
-- politiques RLS des cours/blocs/sources/imports laissent déjà passer l'administrateur.
-- Cette migration ajoute ce qui manque : la lecture des médias des autres professeurs
-- (pour ouvrir n'importe quel cours avec l'avatar) et l'annuaire des professeurs avec
-- leur e-mail (auth.users n'est pas lisible depuis le navigateur).

-- Le déclencheur de la migration 001 interdisait tout changement de rôle, même depuis
-- le SQL Editor, ce qui rendait la promotion d'un administrateur impossible. On ne bloque
-- désormais que les requêtes du navigateur (auth.uid() renseigné, hors service_role) :
-- un professeur connecté ne peut toujours pas modifier son propre rôle.
create or replace function public.protect_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and auth.role() <> 'service_role'
     and (new.id <> old.id or new.role <> old.role) then
    raise exception 'Le rôle et l''identifiant du profil ne peuvent pas être modifiés.';
  end if;
  return new;
end;
$$;

drop policy if exists "Admins read all course media" on storage.objects;
create policy "Admins read all course media" on storage.objects
for select to authenticated
using (bucket_id = 'course-media' and public.is_platform_admin());

-- Annuaire réservé à l'administrateur : renvoie une liste vide pour tout autre compte.
create or replace function public.admin_list_teachers()
returns table (
  id uuid,
  email text,
  first_name text,
  last_name text,
  school_name text,
  role public.user_role,
  legacy_access boolean,
  onboarding_complete boolean,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select p.id, u.email::text, p.first_name, p.last_name, p.school_name,
         p.role, p.legacy_access, p.onboarding_complete, p.created_at, u.last_sign_in_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_platform_admin()
  order by p.created_at desc;
$$;
revoke all on function public.admin_list_teachers() from public, anon;
grant execute on function public.admin_list_teachers() to authenticated;

-- PROMOTION DU COMPTE ADMINISTRATEUR (à faire une fois, avec votre e-mail) :
-- update public.profiles p
-- set role = 'admin', onboarding_complete = true
-- from auth.users u
-- where p.id = u.id and lower(u.email) = lower('VOTRE_EMAIL_ADMIN@exemple.ma');
