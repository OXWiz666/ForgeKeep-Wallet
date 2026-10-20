create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_account_id uuid references public.game_accounts(id) on delete cascade,
  character_id uuid references public.characters(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  period_start date not null,
  period_end date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start)
);

create index budgets_owner_period_idx on public.budgets (user_id, period_start, period_end);

create table public.financial_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_account_id uuid references public.game_accounts(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  recorded_cash_costs_minor bigint not null check (recorded_cash_costs_minor >= 0),
  previously_recovered_cash_minor bigint not null check (previously_recovered_cash_minor >= 0),
  expected_sale_price_minor bigint not null check (expected_sale_price_minor >= 0),
  sale_fee_basis_points bigint not null check (sale_fee_basis_points between 0 and 10000),
  fixed_fees_minor bigint not null check (fixed_fees_minor >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index financial_scenarios_owner_idx on public.financial_scenarios (user_id, created_at desc);

alter table public.budgets enable row level security;
alter table public.financial_scenarios enable row level security;

grant select, insert, update, delete on public.budgets, public.financial_scenarios to authenticated;
create policy "budgets owner" on public.budgets for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "scenarios owner" on public.financial_scenarios for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
