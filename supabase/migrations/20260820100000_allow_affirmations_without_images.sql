alter table public.affirmations
  alter column image_uri drop not null;

comment on column public.affirmations.image_uri is
  'Optional suggested image URI. The supporter app uses a published background when null.';
