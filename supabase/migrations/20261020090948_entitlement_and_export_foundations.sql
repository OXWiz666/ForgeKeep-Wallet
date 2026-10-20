create table public.entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  entitlement_id text not null,
  status text not null check (status in ('active', 'expired', 'revoked')),
  expires_at timestamptz,
  source_event_id varchar(255) not null references public.subscription_events(id) on delete restrict,
  updated_at timestamptz not null default now()
);

create table public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  format text not null check (format in ('csv', 'json')),
  status text not null check (status in ('queued', 'running', 'completed', 'failed')) default 'queued',
  storage_path text check (storage_path is null or storage_path like user_id::text || '/%'),
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.entitlements enable row level security;
alter table public.export_jobs enable row level security;
grant select on public.entitlements to authenticated;
grant select on public.export_jobs to authenticated;
create policy "entitlements owner read" on public.entitlements for select to authenticated using ((select auth.uid()) = user_id);
create policy "exports owner read" on public.export_jobs for select to authenticated using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.entitlements from public, anon, authenticated;
revoke insert, update, delete on public.export_jobs from public, anon, authenticated;
grant select, insert, update on public.entitlements, public.export_jobs to service_role;
