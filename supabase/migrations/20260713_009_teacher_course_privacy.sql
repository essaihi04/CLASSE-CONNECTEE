-- Les cours publiés restent consultables par les élèves non connectés,
-- mais un professeur authentifié ne doit jamais lire les cours d'un confrère.
-- Les politiques "Teachers manage own ..." des migrations 001 et 007 continuent
-- d'autoriser le propriétaire (et l'administrateur) sur ses propres données.

drop policy if exists "Anyone reads published courses" on public.courses;
drop policy if exists "Anyone reads blocks of published courses" on public.course_blocks;
drop policy if exists "Anyone reads sources of published courses" on public.course_sources;
drop policy if exists "Anyone reads imports of published courses" on public.course_imports;
drop policy if exists "Anyone reads media of published courses" on storage.objects;

create policy "Anonymous reads published courses" on public.courses
for select to anon
using (status = 'published');

create policy "Anonymous reads blocks of published courses" on public.course_blocks
for select to anon
using (exists (
  select 1 from public.courses c
  where c.id = course_blocks.course_id and c.status = 'published'
));

create policy "Anonymous reads sources of published courses" on public.course_sources
for select to anon
using (exists (
  select 1 from public.courses c
  where c.id = course_sources.course_id and c.status = 'published'
));

create policy "Anonymous reads imports of published courses" on public.course_imports
for select to anon
using (exists (
  select 1 from public.courses c
  where c.id = course_imports.course_id and c.status = 'published'
));

-- Chemin attendu : <teacher-id>/courses/<course-id>/<dossier>/<fichier>.
create policy "Anonymous reads media of published courses" on storage.objects
for select to anon
using (
  bucket_id = 'course-media'
  and (storage.foldername(name))[2] = 'courses'
  and exists (
    select 1 from public.courses c
    where c.id::text = (storage.foldername(name))[3]
      and c.status = 'published'
  )
);
