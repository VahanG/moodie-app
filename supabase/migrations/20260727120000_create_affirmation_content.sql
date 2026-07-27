create table public.affirmation_topics (
  id text primary key,
  name text not null,
  image_uri text not null,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint affirmation_topics_id_format
    check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint affirmation_topics_name_not_blank
    check (btrim(name) <> ''),
  constraint affirmation_topics_image_uri_not_blank
    check (btrim(image_uri) <> ''),
  constraint affirmation_topics_sort_order_nonnegative
    check (sort_order >= 0)
);

create table public.affirmations (
  id uuid primary key default gen_random_uuid(),
  topic_id text not null
    references public.affirmation_topics (id) on delete cascade,
  text text not null,
  image_uri text not null,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint affirmations_text_not_blank
    check (btrim(text) <> ''),
  constraint affirmations_image_uri_not_blank
    check (btrim(image_uri) <> ''),
  constraint affirmations_sort_order_nonnegative
    check (sort_order >= 0)
);

create table public.affirmation_backgrounds (
  id text primary key,
  image_uri text not null,
  tags text[] not null,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint affirmation_backgrounds_id_format
    check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint affirmation_backgrounds_image_uri_not_blank
    check (btrim(image_uri) <> ''),
  constraint affirmation_backgrounds_tags_not_empty
    check (cardinality(tags) > 0),
  constraint affirmation_backgrounds_sort_order_nonnegative
    check (sort_order >= 0)
);

create index affirmation_topics_published_order_idx
  on public.affirmation_topics (sort_order, id)
  where is_published;

create index affirmations_topic_published_order_idx
  on public.affirmations (topic_id, sort_order, id)
  where is_published;

create index affirmation_backgrounds_published_order_idx
  on public.affirmation_backgrounds (sort_order, id)
  where is_published;

create or replace function public.set_content_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

revoke all on function public.set_content_updated_at() from public;
revoke all on function public.set_content_updated_at() from anon;
revoke all on function public.set_content_updated_at() from authenticated;

create trigger affirmation_topics_set_updated_at
before update on public.affirmation_topics
for each row execute function public.set_content_updated_at();

create trigger affirmations_set_updated_at
before update on public.affirmations
for each row execute function public.set_content_updated_at();

create trigger affirmation_backgrounds_set_updated_at
before update on public.affirmation_backgrounds
for each row execute function public.set_content_updated_at();

alter table public.affirmation_topics enable row level security;
alter table public.affirmations enable row level security;
alter table public.affirmation_backgrounds enable row level security;

revoke all on table public.affirmation_topics from public, anon, authenticated;
revoke all on table public.affirmations from public, anon, authenticated;
revoke all on table public.affirmation_backgrounds from public, anon, authenticated;

grant select on table public.affirmation_topics to anon, authenticated;
grant select on table public.affirmations to anon, authenticated;
grant select on table public.affirmation_backgrounds to anon, authenticated;

grant insert, update, delete on table public.affirmation_topics to authenticated;
grant insert, update, delete on table public.affirmations to authenticated;
grant insert, update, delete on table public.affirmation_backgrounds to authenticated;

create policy "published topics are readable"
on public.affirmation_topics
for select
to anon, authenticated
using (is_published);

create policy "admins manage topics"
on public.affirmation_topics
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "published affirmations are readable"
on public.affirmations
for select
to anon, authenticated
using (is_published);

create policy "admins manage affirmations"
on public.affirmations
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "published backgrounds are readable"
on public.affirmation_backgrounds
for select
to anon, authenticated
using (is_published);

create policy "admins manage backgrounds"
on public.affirmation_backgrounds
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

insert into public.affirmation_topics
  (id, name, image_uri, sort_order, is_published)
values
  ('growth', 'Growth', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', 10, true),
  ('calm', 'Calm', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80', 20, true),
  ('gratitude', 'Gratitude', 'https://images.unsplash.com/photo-1482192597420-4818b0bdb5af?auto=format&fit=crop&w=800&q=80', 30, true),
  ('confidence', 'Confidence', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80', 40, true),
  ('focus', 'Focus', 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=800&q=80', 50, true),
  ('resilience', 'Resilience', 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=800&q=80', 60, true),
  ('joy', 'Joy', 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=800&q=80', 70, true),
  ('selflove', 'Self Love', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80', 80, true),
  ('motivation', 'Motivation', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80', 90, true)
on conflict (id) do nothing;

insert into public.affirmations
  (id, topic_id, text, image_uri, sort_order, is_published)
values
  ('10000000-0000-4000-8000-000000000001', 'growth', 'You are growing every day.', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', 10, true),
  ('10000000-0000-4000-8000-000000000002', 'growth', 'Small steps create big change.', 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80', 20, true),
  ('10000000-0000-4000-8000-000000000003', 'growth', 'Progress is built one brave choice at a time.', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80', 30, true),
  ('20000000-0000-4000-8000-000000000001', 'calm', 'Your calm is your strength.', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80', 10, true),
  ('20000000-0000-4000-8000-000000000002', 'calm', 'You can slow down and still move forward.', 'https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=800&q=80', 20, true),
  ('20000000-0000-4000-8000-000000000003', 'calm', 'A steady breath brings you back to center.', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', 30, true),
  ('30000000-0000-4000-8000-000000000001', 'gratitude', 'There is something good in this moment.', 'https://images.unsplash.com/photo-1482192597420-4818b0bdb5af?auto=format&fit=crop&w=800&q=80', 10, true),
  ('30000000-0000-4000-8000-000000000002', 'gratitude', 'Gratitude helps your day open up.', 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80', 20, true),
  ('30000000-0000-4000-8000-000000000003', 'gratitude', 'You have more support than you can see.', 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=800&q=80', 30, true),
  ('40000000-0000-4000-8000-000000000001', 'confidence', 'You trust yourself to handle what comes next.', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80', 10, true),
  ('40000000-0000-4000-8000-000000000002', 'confidence', 'Your voice and ideas deserve space.', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80', 20, true),
  ('40000000-0000-4000-8000-000000000003', 'confidence', 'You are enough exactly as you are.', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80', 30, true),
  ('50000000-0000-4000-8000-000000000001', 'focus', 'One clear step matters more than perfect plans.', 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=800&q=80', 10, true),
  ('50000000-0000-4000-8000-000000000002', 'focus', 'Your attention is powerful when you protect it.', 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=80', 20, true),
  ('50000000-0000-4000-8000-000000000003', 'focus', 'You can return to what matters at any moment.', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80', 30, true),
  ('60000000-0000-4000-8000-000000000001', 'resilience', 'You have overcome hard days before and you can again.', 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=800&q=80', 10, true),
  ('60000000-0000-4000-8000-000000000002', 'resilience', 'Setbacks are part of your path, not the end of it.', 'https://images.unsplash.com/photo-1473773508845-188df298d2d1?auto=format&fit=crop&w=800&q=80', 20, true),
  ('60000000-0000-4000-8000-000000000003', 'resilience', 'Your strength grows each time you keep going.', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', 30, true),
  ('70000000-0000-4000-8000-000000000001', 'joy', 'Joy can live in simple moments.', 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=800&q=80', 10, true),
  ('70000000-0000-4000-8000-000000000002', 'joy', 'You allow yourself to feel light and alive.', 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=800&q=80', 20, true),
  ('70000000-0000-4000-8000-000000000003', 'joy', 'Good energy belongs in your day today.', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80', 30, true),
  ('80000000-0000-4000-8000-000000000001', 'selflove', 'You speak to yourself with kindness.', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80', 10, true),
  ('80000000-0000-4000-8000-000000000002', 'selflove', 'Your needs are valid and worth honoring.', 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=800&q=80', 20, true),
  ('80000000-0000-4000-8000-000000000003', 'selflove', 'Caring for yourself supports everything you do.', 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80', 30, true),
  ('90000000-0000-4000-8000-000000000001', 'motivation', 'You are capable of starting right where you are.', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80', 10, true),
  ('90000000-0000-4000-8000-000000000002', 'motivation', 'Action creates momentum, and momentum creates change.', 'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=800&q=80', 20, true),
  ('90000000-0000-4000-8000-000000000003', 'motivation', 'You can do hard things one step at a time.', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80', 30, true)
on conflict (id) do nothing;

insert into public.affirmation_backgrounds
  (id, image_uri, tags, sort_order, is_published)
values
  ('sunrise-lake', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', array['nature', 'sunrise', 'calm'], 10, true),
  ('forest-path', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80', array['nature', 'forest', 'growth'], 20, true),
  ('mountain-horizon', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', array['mountain', 'focus', 'resilience'], 30, true),
  ('ocean-wave', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', array['ocean', 'calm', 'blue'], 40, true),
  ('city-glow', 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80', array['city', 'night', 'motivation'], 50, true),
  ('desert-dunes', 'https://images.unsplash.com/photo-1473773508845-188df298d2d1?auto=format&fit=crop&w=800&q=80', array['desert', 'warm', 'focus'], 60, true),
  ('golden-field', 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80', array['gratitude', 'warm', 'sunlight'], 70, true),
  ('cozy-home', 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=800&q=80', array['cozy', 'self-love', 'comfort'], 80, true),
  ('aurora-night', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80', array['night', 'confidence', 'sky'], 90, true)
on conflict (id) do nothing;
