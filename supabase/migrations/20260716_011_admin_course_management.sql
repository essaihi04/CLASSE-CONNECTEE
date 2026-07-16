-- Gestion complète des cours depuis le compte administrateur.
-- À exécuter après 20260714_010_admin_dashboard.sql.
--
-- Les politiques des tables public.* autorisent déjà l'administrateur à supprimer
-- n'importe quel cours. Il manquait le droit équivalent sur les objets du bucket privé,
-- ce qui laissait les PDF, images, simulations et voix du cours dans le stockage.

drop policy if exists "Admins delete all course media" on storage.objects;
create policy "Admins delete all course media" on storage.objects
for delete to authenticated
using (bucket_id = 'course-media' and public.is_platform_admin());
