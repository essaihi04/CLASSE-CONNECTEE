-- Niveaux scolaires complémentaires — à exécuter après les migrations précédentes.
insert into public.grade_levels (code, name, sort_order) values
  ('prescolaire', 'Préscolaire', 1),
  ('1apep', '1ère année primaire (1APEP)', 2),
  ('2apep', '2ème année primaire (2APEP)', 3),
  ('3apep', '3ème année primaire (3APEP)', 4),
  ('4apep', '4ème année primaire (4APEP)', 5),
  ('5apep', '5ème année primaire (5APEP)', 6),
  ('6apep', '6ème année primaire (6APEP)', 7)
on conflict (code) do update set name = excluded.name, sort_order = excluded.sort_order;
