-- Classes Connectées — portail professeur (Supabase)
-- À coller UNE FOIS dans Supabase > SQL Editor, avec un compte propriétaire du projet.
-- Ne mettez jamais une clé service_role dans le navigateur ou dans ce fichier.

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('teacher', 'admin');
exception when duplicate_object then null; end; $$;
do $$ begin
  create type public.assignment_status as enum ('active', 'suspended');
exception when duplicate_object then null; end; $$;
do $$ begin
  create type public.course_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null; end; $$;

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9_-]{2,40}$'),
  name text not null,
  color text not null default '#38bdf8' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.grade_levels (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9_-]{2,40}$'),
  name text not null,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

insert into public.subjects (code, name, color) values
  ('svt', 'Sciences de la vie et de la Terre', '#38bdf8'),
  ('maths', 'Mathématiques', '#a78bfa'),
  ('pc', 'Physique-Chimie', '#f59e0b'),
  ('arabe', 'Langue arabe', '#22c55e'),
  ('francais', 'Français', '#f472b6'),
  ('anglais', 'Anglais', '#fb7185'),
  ('histoire_geo', 'Histoire-Géographie', '#f97316'),
  ('informatique', 'Informatique', '#14b8a6')
on conflict (code) do update set name = excluded.name, color = excluded.color;

insert into public.grade_levels (code, name, sort_order) values
  ('1apic', '1ère année collège (1APIC)', 10),
  ('2apic', '2ème année collège (2APIC)', 20),
  ('3apic', '3ème année collège (3APIC)', 30),
  ('tc', 'Tronc commun', 40),
  ('1bac', '1ère année baccalauréat', 50),
  ('2bac', '2ème année baccalauréat', 60)
on conflict (code) do update set name = excluded.name, sort_order = excluded.sort_order;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'teacher',
  first_name text not null default '',
  last_name text not null default '',
  school_name text,
  avatar_url text,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_first_name_length check (char_length(first_name) <= 80),
  constraint profile_last_name_length check (char_length(last_name) <= 80),
  constraint profile_school_name_length check (school_name is null or char_length(school_name) <= 160)
);

create table if not exists public.teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  grade_level_id uuid not null references public.grade_levels(id) on delete restrict,
  status public.assignment_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (teacher_id, subject_id, grade_level_id)
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  assignment_id uuid references public.teacher_assignments(id) on delete set null,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  grade_level_id uuid not null references public.grade_levels(id) on delete restrict,
  title text not null check (char_length(title) between 2 and 180),
  description text not null default '' check (char_length(description) <= 1500),
  school_year text,
  status public.course_status not null default 'draft',
  cover_url text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists courses_teacher_id_idx on public.courses(teacher_id, updated_at desc);

create table if not exists public.course_sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  position integer not null check (position >= 0),
  phase text not null default 'concept' check (phase in ('situation','rappel','probleme','hypothese','concept','structuration','bilan','reveal')),
  title text not null default '' check (char_length(title) <= 220),
  board jsonb not null default '{}'::jsonb,
  layout jsonb not null default '{}'::jsonb,
  avatar jsonb not null default '{}'::jsonb,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, position)
);
create index if not exists course_sections_course_id_idx on public.course_sections(course_id, position);

create table if not exists public.course_assets (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  section_id uuid references public.course_sections(id) on delete cascade,
  kind text not null check (kind in ('text','link','image','video','audio','quiz','carousel','schema','simulation','document')),
  title text not null default '' check (char_length(title) <= 220),
  content jsonb not null default '{}'::jsonb,
  storage_path text,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists course_assets_course_id_idx on public.course_assets(course_id, section_id, position);

create table if not exists public.course_quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  section_id uuid references public.course_sections(id) on delete set null,
  title text not null default 'Évaluation' check (char_length(title) <= 180),
  placement text not null default 'end' check (placement in ('intermediate','end','support')),
  config jsonb not null default '{"questions":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists course_quizzes_course_id_idx on public.course_quizzes(course_id);

-- Fonctions internes d'autorisation. Elles évitent les politiques RLS dupliquées et ne
-- renvoient qu'un booléen, jamais de données appartenant à un autre professeur.
create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.owns_course(target_course_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.courses where id = target_course_id and teacher_id = auth.uid());
$$;

create or replace function public.has_active_assignment(target_subject_id uuid, target_level_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.teacher_assignments
    where teacher_id = auth.uid() and subject_id = target_subject_id
      and grade_level_id = target_level_id and status = 'active'
  );
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.protect_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.id <> old.id or new.role <> old.role then
    raise exception 'Le rôle et l''identifiant du profil ne peuvent pas être modifiés.';
  end if;
  return new;
end;
$$;

create or replace function public.check_course_assignment()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'service_role' then return new; end if;
  if new.teacher_id <> auth.uid() and not public.is_platform_admin() then
    raise exception 'Un cours doit appartenir au professeur connecté.';
  end if;
  if not public.is_platform_admin() and not public.has_active_assignment(new.subject_id, new.grade_level_id) then
    raise exception 'Cette matière et ce niveau ne sont pas attribués à ce professeur.';
  end if;
  if new.assignment_id is not null and not exists (
    select 1 from public.teacher_assignments a
    where a.id = new.assignment_id and a.teacher_id = new.teacher_id
      and a.subject_id = new.subject_id and a.grade_level_id = new.grade_level_id and a.status = 'active'
  ) then
    raise exception 'L''attribution sélectionnée ne correspond pas à ce cours.';
  end if;
  return new;
end;
$$;

-- Crée le profil dès l'inscription Supabase Auth et enregistre la matière/le niveau choisis.
-- Les valeurs attendues dans user_metadata sont : first_name, last_name, school_name,
-- subject_code et grade_level_code. Les listes dans la page empêchent les valeurs libres.
create or replace function public.handle_new_teacher()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  selected_subject uuid;
  selected_level uuid;
begin
  insert into public.profiles (id, first_name, last_name, school_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'first_name', ''), 80),
    left(coalesce(new.raw_user_meta_data ->> 'last_name', ''), 80),
    nullif(left(coalesce(new.raw_user_meta_data ->> 'school_name', ''), 160), '')
  ) on conflict (id) do nothing;

  select id into selected_subject from public.subjects where code = new.raw_user_meta_data ->> 'subject_code';
  select id into selected_level from public.grade_levels where code = new.raw_user_meta_data ->> 'grade_level_code';
  if selected_subject is not null and selected_level is not null then
    insert into public.teacher_assignments (teacher_id, subject_id, grade_level_id, status)
    values (new.id, selected_subject, selected_level, 'active')
    on conflict (teacher_id, subject_id, grade_level_id) do nothing;
    update public.profiles set onboarding_complete = true where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_teacher();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();
drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges before update on public.profiles
for each row execute procedure public.protect_profile_privileges();
drop trigger if exists teacher_assignments_updated_at on public.teacher_assignments;
create trigger teacher_assignments_updated_at before update on public.teacher_assignments
for each row execute procedure public.set_updated_at();
drop trigger if exists courses_updated_at on public.courses;
create trigger courses_updated_at before update on public.courses
for each row execute procedure public.set_updated_at();
drop trigger if exists check_course_assignment on public.courses;
create trigger check_course_assignment before insert or update on public.courses
for each row execute procedure public.check_course_assignment();
drop trigger if exists course_sections_updated_at on public.course_sections;
create trigger course_sections_updated_at before update on public.course_sections
for each row execute procedure public.set_updated_at();
drop trigger if exists course_assets_updated_at on public.course_assets;
create trigger course_assets_updated_at before update on public.course_assets
for each row execute procedure public.set_updated_at();
drop trigger if exists course_quizzes_updated_at on public.course_quizzes;
create trigger course_quizzes_updated_at before update on public.course_quizzes
for each row execute procedure public.set_updated_at();

alter table public.subjects enable row level security;
alter table public.grade_levels enable row level security;
alter table public.profiles enable row level security;
alter table public.teacher_assignments enable row level security;
alter table public.courses enable row level security;
alter table public.course_sections enable row level security;
alter table public.course_assets enable row level security;
alter table public.course_quizzes enable row level security;

-- Catalogue lisible avant inscription (nécessaire pour les listes matière/niveau de la page).
create policy "Public can read subjects" on public.subjects for select to anon, authenticated using (true);
create policy "Public can read levels" on public.grade_levels for select to anon, authenticated using (true);
create policy "Teachers read own profile" on public.profiles for select to authenticated using (id = auth.uid() or public.is_platform_admin());
create policy "Teachers update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "Teachers read own assignments" on public.teacher_assignments for select to authenticated using (teacher_id = auth.uid() or public.is_platform_admin());
create policy "Admins manage assignments" on public.teacher_assignments for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "Teachers manage own courses" on public.courses for all to authenticated using (teacher_id = auth.uid() or public.is_platform_admin()) with check (teacher_id = auth.uid() or public.is_platform_admin());
create policy "Teachers manage own sections" on public.course_sections for all to authenticated using (public.owns_course(course_id) or public.is_platform_admin()) with check (public.owns_course(course_id) or public.is_platform_admin());
create policy "Teachers manage own assets" on public.course_assets for all to authenticated using (public.owns_course(course_id) or public.is_platform_admin()) with check (public.owns_course(course_id) or public.is_platform_admin());
create policy "Teachers manage own quizzes" on public.course_quizzes for all to authenticated using (public.owns_course(course_id) or public.is_platform_admin()) with check (public.owns_course(course_id) or public.is_platform_admin());

-- Bucket privé : le chemin doit toujours commencer par l'UUID du professeur, par exemple
-- <auth.uid()>/courses/<course-id>/image.png. Utilisez supabase.storage.from('course-media').
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('course-media', 'course-media', false, 83886080,
  array['image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm','audio/mpeg','application/pdf'])
on conflict (id) do update set public = false;

create policy "Teachers read their course media" on storage.objects for select to authenticated
using (bucket_id = 'course-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Teachers upload their course media" on storage.objects for insert to authenticated
with check (bucket_id = 'course-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Teachers update their course media" on storage.objects for update to authenticated
using (bucket_id = 'course-media' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'course-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Teachers delete their course media" on storage.objects for delete to authenticated
using (bucket_id = 'course-media' and (storage.foldername(name))[1] = auth.uid()::text);

-- Après la première inscription, promouvez seulement votre compte administrateur depuis SQL Editor :
-- update public.profiles set role = 'admin' where id = '<UUID_AUTH_DU_COMPTE_ADMIN>';
