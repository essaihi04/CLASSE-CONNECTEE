-- Lecture publique strictement limitée aux cours publiés et à leurs ressources.
-- Les brouillons restent accessibles uniquement à leur professeur via les politiques existantes.

create policy "Anyone reads published courses" on public.courses
for select to anon, authenticated
using (status = 'published');

create policy "Anyone reads blocks of published courses" on public.course_blocks
for select to anon, authenticated
using (exists (
  select 1 from public.courses c
  where c.id = course_blocks.course_id and c.status = 'published'
));

create policy "Anyone reads sources of published courses" on public.course_sources
for select to anon, authenticated
using (exists (
  select 1 from public.courses c
  where c.id = course_sources.course_id and c.status = 'published'
));

create policy "Anyone reads imports of published courses" on public.course_imports
for select to anon, authenticated
using (exists (
  select 1 from public.courses c
  where c.id = course_imports.course_id and c.status = 'published'
));

-- Chemin attendu : <teacher-id>/courses/<course-id>/<dossier>/<fichier>.
create policy "Anyone reads media of published courses" on storage.objects
for select to anon, authenticated
using (
  bucket_id = 'course-media'
  and (storage.foldername(name))[2] = 'courses'
  and exists (
    select 1 from public.courses c
    where c.id::text = (storage.foldername(name))[3]
      and c.status = 'published'
  )
);
