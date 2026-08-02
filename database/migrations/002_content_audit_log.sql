create table if not exists portfolio_content_audit_log (
  id uuid primary key default gen_random_uuid(),
  action text not null check (action in ('publish', 'rollback')),
  actor_github_id bigint check (actor_github_id is null or actor_github_id > 0),
  actor_login text not null check (length(actor_login) between 1 and 100),
  from_version_id uuid references portfolio_content_versions(id),
  to_version_id uuid not null references portfolio_content_versions(id),
  occurred_at timestamptz not null default now()
);

create index if not exists portfolio_content_audit_log_occurred_at_idx
  on portfolio_content_audit_log (occurred_at desc);

create index if not exists portfolio_content_audit_log_actor_idx
  on portfolio_content_audit_log (actor_github_id, occurred_at desc);

create or replace function reject_portfolio_content_audit_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'portfolio_content_audit_log is append-only';
end;
$$;

create trigger portfolio_content_audit_log_append_only
before update or delete on portfolio_content_audit_log
for each row execute function reject_portfolio_content_audit_mutation();
