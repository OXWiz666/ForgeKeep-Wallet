create extension if not exists pgcrypto;

create type public.transaction_type as enum ('expense', 'income', 'transfer', 'adjustment');
create type public.transaction_classification as enum ('cash_payment', 'cash_receipt', 'refund', 'reimbursement', 'asset_disposal', 'internal_transfer');
create type public.transaction_state as enum ('draft', 'posted', 'reversed');

create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_currency text not null default 'PHP' check (preferred_currency ~ '^[A-Z]{3}$'),
  locale text not null default 'en-PH',
  timezone text not null default 'Asia/Manila',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  region text,
  publisher text,
  created_at timestamptz not null default now(),
  unique nulls not distinct (owner_id, name, region)
);

create table public.game_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete restrict,
  server text,
  region text,
  display_name text not null check (char_length(trim(display_name)) between 1 and 120),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, game_id, display_name)
);

create table public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_account_id uuid not null references public.game_accounts(id) on delete restrict,
  ign text not null check (char_length(trim(ign)) between 1 and 120),
  ign_normalized text generated always as (lower(trim(ign))) stored,
  class_name text,
  level integer check (level >= 0),
  combat_power bigint check (combat_power >= 0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_account_id, ign_normalized)
);

create table public.transaction_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  transaction_type public.transaction_type not null,
  created_at timestamptz not null default now(),
  unique nulls not distinct (user_id, name, transaction_type)
);

create table public.financial_transactions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete restrict,
  game_account_id uuid not null references public.game_accounts(id) on delete restrict,
  character_id uuid references public.characters(id) on delete restrict,
  category_id uuid references public.transaction_categories(id) on delete restrict,
  transaction_type public.transaction_type not null,
  classification public.transaction_classification not null,
  state public.transaction_state not null default 'draft',
  amount_minor bigint not null check (amount_minor <> 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  transaction_date date not null,
  description text,
  reversal_of_id uuid unique references public.financial_transactions(id) on delete restrict,
  idempotency_key uuid not null,
  revision integer not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create index financial_transactions_user_date_idx on public.financial_transactions (user_id, transaction_date desc, id desc);
create index financial_transactions_account_date_idx on public.financial_transactions (user_id, game_account_id, transaction_date desc, id desc);
create index financial_transactions_character_date_idx on public.financial_transactions (user_id, character_id, transaction_date desc, id desc) where character_id is not null;

create table public.sync_mutations (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('financial_transaction')),
  entity_id uuid not null,
  client_revision integer not null check (client_revision >= 0),
  state text not null check (state in ('pending', 'applied', 'conflict', 'failed')),
  created_at timestamptz not null default now(),
  unique (user_id, id)
);

create table public.receipt_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id uuid not null references public.financial_transactions(id) on delete restrict,
  storage_path text not null unique check (storage_path like user_id::text || '/%'),
  content_type text not null check (content_type in ('image/jpeg', 'image/png', 'application/pdf')),
  byte_size integer not null check (byte_size > 0 and byte_size <= 10485760),
  created_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;
alter table public.games enable row level security;
alter table public.game_accounts enable row level security;
alter table public.characters enable row level security;
alter table public.transaction_categories enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.sync_mutations enable row level security;
alter table public.receipt_attachments enable row level security;

grant select, insert, update, delete on public.user_settings, public.games, public.game_accounts, public.characters, public.transaction_categories, public.financial_transactions, public.sync_mutations, public.receipt_attachments to authenticated;

create policy "settings owner" on public.user_settings for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "games visible to owner or everyone" on public.games for select to authenticated using (owner_id is null or (select auth.uid()) = owner_id);
create policy "games owner write" on public.games for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "accounts owner" on public.game_accounts for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "characters owner" on public.characters for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "categories owner or system" on public.transaction_categories for select to authenticated using (user_id is null or (select auth.uid()) = user_id);
create policy "categories owner write" on public.transaction_categories for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "transactions owner" on public.financial_transactions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "sync mutations owner" on public.sync_mutations for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "receipts owner" on public.receipt_attachments for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
