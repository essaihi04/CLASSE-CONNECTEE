-- Import PDF + ressources et génération de cours en blocs standardisés.
-- À exécuter après 20260712_006_complete_subjects.sql.

do $$ begin
  create type public.course_import_status as enum ('processing','ready','error');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.course_block_type as enum ('text','image','video','simulation','activity','question','summary','evaluation','schema');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.course_block_status as enum ('draft','validated');
exception when duplicate_object then null; end $$;

create table if not exists public.course_imports (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  status public.course_import_status not null default 'processing',
  source_pdf_path text not null,
  duration_minutes integer not null check (duration_minutes between 15 and 1440),
  analysis jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists course_imports_course_idx on public.course_imports(course_id,created_at desc);

create table if not exists public.course_sources (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  import_id uuid references public.course_imports(id) on delete set null,
  kind text not null check (kind in ('document','image','video','audio','simulation','schema','other')),
  file_name text not null check (char_length(file_name) between 1 and 220),
  mime_type text not null default 'application/octet-stream',
  storage_path text not null,
  pedagogical_objective text not null default '' check (char_length(pedagogical_objective) <= 400),
  ai_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists course_sources_course_idx on public.course_sources(course_id,import_id);

create table if not exists public.course_blocks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  import_id uuid references public.course_imports(id) on delete set null,
  session_position integer not null check (session_position >= 0),
  position integer not null check (position >= 0),
  block_type public.course_block_type not null,
  title text not null default '' check (char_length(title) <= 220),
  duration_minutes integer not null default 5 check (duration_minutes between 1 and 120),
  objective text not null default '' check (char_length(objective) <= 400),
  content jsonb not null default '{}'::jsonb,
  source_id uuid references public.course_sources(id) on delete set null,
  status public.course_block_status not null default 'draft',
  teacher_notes text not null default '' check (char_length(teacher_notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id,session_position,position)
);
create index if not exists course_blocks_course_idx on public.course_blocks(course_id,session_position,position);
create index if not exists course_blocks_source_idx on public.course_blocks(source_id) where source_id is not null;

drop trigger if exists course_imports_updated_at on public.course_imports;
create trigger course_imports_updated_at before update on public.course_imports
for each row execute procedure public.set_updated_at();
drop trigger if exists course_sources_updated_at on public.course_sources;
create trigger course_sources_updated_at before update on public.course_sources
for each row execute procedure public.set_updated_at();
drop trigger if exists course_blocks_updated_at on public.course_blocks;
create trigger course_blocks_updated_at before update on public.course_blocks
for each row execute procedure public.set_updated_at();

alter table public.course_imports enable row level security;
alter table public.course_sources enable row level security;
alter table public.course_blocks enable row level security;

create policy "Teachers manage own course imports" on public.course_imports for all to authenticated
using (public.owns_course(course_id) or public.is_platform_admin())
with check (public.owns_course(course_id) or public.is_platform_admin());
create policy "Teachers manage own course sources" on public.course_sources for all to authenticated
using (public.owns_course(course_id) or public.is_platform_admin())
with check (public.owns_course(course_id) or public.is_platform_admin());
create policy "Teachers manage own course blocks" on public.course_blocks for all to authenticated
using (public.owns_course(course_id) or public.is_platform_admin())
with check (public.owns_course(course_id) or public.is_platform_admin());

-- Les simulations peuvent être importées sous forme HTML, archive ou modèle 3D.
update storage.buckets
set public=false,
    file_size_limit=83886080,
    allowed_mime_types=array[
      'image/png','image/jpeg','image/webp','image/gif','image/svg+xml',
      'video/mp4','video/webm','video/quicktime','audio/mpeg','audio/wav',
      'application/pdf','application/zip','application/json','text/html',
      'model/gltf+json','model/gltf-binary','application/octet-stream'
    ]
where id='course-media';
