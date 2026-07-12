-- Filières lycée — à exécuter après les migrations 001 à 004.

create table if not exists public.study_streams (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9_-]{2,40}$'),
  name text not null,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

insert into public.study_streams (code, name, sort_order) values
  ('general', 'Sans filière', 0),
  ('sciences_maths', 'Sciences mathématiques', 10),
  ('sciences_physiques', 'Sciences physiques', 20),
  ('sciences_svt', 'Sciences de la vie et de la Terre', 30),
  ('sciences_economiques', 'Sciences économiques', 40)
on conflict (code) do update set name = excluded.name, sort_order = excluded.sort_order;

alter table public.teacher_assignments
  add column if not exists stream_id uuid references public.study_streams(id) on delete restrict;
alter table public.courses
  add column if not exists stream_id uuid references public.study_streams(id) on delete restrict;

alter table public.teacher_assignments
  drop constraint if exists teacher_assignments_teacher_id_subject_id_grade_level_id_key;
create unique index if not exists teacher_assignments_unique_stream_idx
  on public.teacher_assignments (teacher_id, subject_id, grade_level_id, coalesce(stream_id, '00000000-0000-0000-0000-000000000000'::uuid));

create or replace function public.check_course_assignment()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'service_role' then return new; end if;
  if new.teacher_id <> auth.uid() and not public.is_platform_admin() then
    raise exception 'Un cours doit appartenir au professeur connecté.';
  end if;
  if not public.is_platform_admin() and not exists (
    select 1 from public.teacher_assignments a
    where a.teacher_id = auth.uid() and a.subject_id = new.subject_id
      and a.grade_level_id = new.grade_level_id
      and a.stream_id is not distinct from new.stream_id and a.status = 'active'
  ) then
    raise exception 'Cette matière, ce niveau ou cette filière ne sont pas attribués à ce professeur.';
  end if;
  if new.assignment_id is not null and not exists (
    select 1 from public.teacher_assignments a
    where a.id = new.assignment_id and a.teacher_id = new.teacher_id
      and a.subject_id = new.subject_id and a.grade_level_id = new.grade_level_id
      and a.stream_id is not distinct from new.stream_id and a.status = 'active'
  ) then
    raise exception 'L''attribution sélectionnée ne correspond pas à ce cours.';
  end if;
  return new;
end;
$$;

create or replace function public.handle_new_teacher()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  selected_subject uuid;
  selected_level uuid;
  selected_stream uuid;
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
  select id into selected_stream from public.study_streams where code = coalesce(new.raw_user_meta_data ->> 'stream_code', 'general');
  if selected_subject is not null and selected_level is not null then
    insert into public.teacher_assignments (teacher_id, subject_id, grade_level_id, stream_id, status)
    values (new.id, selected_subject, selected_level, selected_stream, 'active')
    on conflict do nothing;
    update public.profiles set onboarding_complete = true where id = new.id;
  end if;
  return new;
end;
$$;

alter table public.study_streams enable row level security;
drop policy if exists "Public can read streams" on public.study_streams;
create policy "Public can read streams" on public.study_streams for select to anon, authenticated using (true);
