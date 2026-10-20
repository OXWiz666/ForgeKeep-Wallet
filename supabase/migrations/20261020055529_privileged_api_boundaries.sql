-- Durable RevenueCat inbox. SQL migrations own the schema; Prisma maps it for server access.
create table public.subscription_events (
  id varchar(255) primary key check (char_length(id) > 0),
  event_type varchar(100) not null check (char_length(event_type) > 0),
  payload jsonb not null,
  received_at timestamptz not null default now()
);

alter table public.subscription_events enable row level security;
revoke all on public.subscription_events from public, anon, authenticated;
grant select, insert on public.subscription_events to service_role;

-- Signed upload URLs bypass caller authentication. Storage must enforce upload limits too.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 10485760, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Clients can read their own receipts. Upload tokens are issued only by the authenticated API.
create policy "receipt objects owner read" on storage.objects
  for select to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);
