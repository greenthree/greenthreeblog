create table if not exists public.article_views (
  article_slug text primary key,
  view_count bigint not null default 0 check (view_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.article_views enable row level security;

drop policy if exists "Public can read article views" on public.article_views;
create policy "Public can read article views"
on public.article_views
for select
to anon
using (true);

revoke all on table public.article_views from public, anon;
grant select on table public.article_views to anon;

create or replace function public.increment_article_view(target_slug text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_count bigint;
begin
  if target_slug is null
     or target_slug <> btrim(target_slug)
     or length(target_slug) > 160
     or target_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Invalid article slug';
  end if;

  insert into public.article_views (article_slug, view_count, updated_at)
  values (target_slug, 1, now())
  on conflict (article_slug)
  do update set
    view_count = public.article_views.view_count + 1,
    updated_at = now()
  returning view_count into next_count;

  return next_count;
end;
$$;

revoke all on function public.increment_article_view(text) from public;
grant execute on function public.increment_article_view(text) to anon;
