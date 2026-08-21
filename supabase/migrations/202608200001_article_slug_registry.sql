create table if not exists public.article_slug_registry (
  article_slug text primary key,
  created_at timestamptz not null default now()
);

alter table public.article_slug_registry enable row level security;

revoke all on table public.article_slug_registry from public, anon, authenticated;
grant select, insert, update, delete on table public.article_slug_registry to service_role;

insert into public.article_slug_registry (article_slug)
values
  ('cf1992g-solution'),
  ('nim-sprague-grundy-theorem'),
  ('probhub-verifiable-problemsetting-workflow'),
  ('deeptutor-chinese-ai-learning-workbench')
on conflict (article_slug) do nothing;

alter table public.article_views
  drop constraint if exists article_views_article_slug_fkey;

alter table public.article_views
  add constraint article_views_article_slug_fkey
  foreign key (article_slug)
  references public.article_slug_registry (article_slug)
  on delete cascade
  not valid;

create table if not exists public.article_view_rate_limits (
  article_slug text not null references public.article_slug_registry (article_slug) on delete cascade,
  client_hash text not null,
  bucket_start timestamptz not null,
  primary key (article_slug, client_hash, bucket_start)
);

alter table public.article_view_rate_limits enable row level security;
revoke all on table public.article_view_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table public.article_view_rate_limits to service_role;

create or replace function public.increment_article_view(target_slug text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_count bigint;
  request_headers jsonb := '{}'::jsonb;
  raw_headers text;
  client_hash text;
  current_bucket timestamptz;
begin
  if target_slug is null
     or target_slug <> btrim(target_slug)
     or length(target_slug) > 160
     or target_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Invalid article slug';
  end if;

  if not exists (
    select 1
    from public.article_slug_registry
    where article_slug = target_slug
  ) then
    raise exception 'Unknown article slug';
  end if;

  -- Keep only a one-way fingerprint of proxy headers; never persist raw IP data.
  raw_headers := current_setting('request.headers', true);
  begin
    request_headers := coalesce(nullif(raw_headers, ''), '{}')::jsonb;
  exception when others then
    request_headers := '{}'::jsonb;
  end;
  client_hash := md5(concat_ws(
    '|',
    coalesce(request_headers ->> 'x-forwarded-for', ''),
    coalesce(request_headers ->> 'x-real-ip', ''),
    coalesce(request_headers ->> 'user-agent', '')
  ));
  current_bucket := date_trunc('hour', now());

  delete from public.article_view_rate_limits
   where article_view_rate_limits.bucket_start < current_bucket - interval '24 hours';

  insert into public.article_view_rate_limits (article_slug, client_hash, bucket_start)
  values (target_slug, client_hash, current_bucket)
  on conflict do nothing;

  if not found then
    select coalesce(view_count, 0)
      into next_count
      from public.article_views
     where article_slug = target_slug;
    return coalesce(next_count, 0);
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
