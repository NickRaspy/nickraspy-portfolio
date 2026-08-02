create extension if not exists pgcrypto;

create table if not exists portfolio_content_versions (
  id uuid primary key default gen_random_uuid(),
  checksum text not null unique,
  source_filename text not null,
  content jsonb not null,
  created_by text not null default 'system',
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists portfolio_content_state (
  singleton boolean primary key default true check (singleton),
  active_version_id uuid references portfolio_content_versions(id)
);

insert into portfolio_content_state (singleton, active_version_id)
values (true, null)
on conflict (singleton) do nothing;

create index if not exists portfolio_content_versions_published_at_idx
  on portfolio_content_versions (published_at desc);
