-- Compte démo propriétaire des données créées avant Supabase.
-- Exécutez cette migration APRÈS 001 et 002.

do $$
declare
  demo_user_id uuid;
begin
  select id into demo_user_id
  from auth.users
  where lower(email) = lower('zouhairessaihi04@gmail.com')
  limit 1;

  if demo_user_id is null then
    raise exception 'Le compte démo zouhairessaihi04@gmail.com est introuvable dans Authentication > Users.';
  end if;

  -- Un seul compte voit les données historiques locales du prototype.
  update public.profiles set legacy_access = false where legacy_access = true;
  update public.profiles
  set legacy_access = true,
      first_name = 'Professeur',
      last_name = 'Démo',
      school_name = 'Compte de démonstration',
      onboarding_complete = true
  where id = demo_user_id;
end;
$$;
