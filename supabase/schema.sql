-- Finara Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- transactions
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  amount bigint not null,
  type text check (type in ('income', 'expense')) not null,
  category text not null,
  note text,
  date date not null default current_date,
  created_at timestamptz default now(),
  deleted_at timestamptz
);
alter table transactions enable row level security;
create policy "users own transactions" on transactions
  for all using (auth.uid() = user_id);

-- budgets
create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  category text not null,
  limit_amount bigint not null,
  month text not null,
  created_at timestamptz default now(),
  deleted_at timestamptz,
  unique(user_id, category, month)
);
alter table budgets enable row level security;
create policy "users own budgets" on budgets
  for all using (auth.uid() = user_id);

-- goals
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  target_amount bigint not null,
  current_amount bigint default 0,
  deadline date,
  created_at timestamptz default now(),
  deleted_at timestamptz
);
alter table goals enable row level security;
create policy "users own goals" on goals
  for all using (auth.uid() = user_id);

-- debts
create table if not exists debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  person text not null,
  amount bigint not null,
  type text check (type in ('owe', 'lent')) not null,
  note text,
  settled boolean default false,
  settled_at timestamptz,
  created_at timestamptz default now()
);
alter table debts enable row level security;
create policy "users own debts" on debts
  for all using (auth.uid() = user_id);

-- chat_history
create table if not exists chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  session_id uuid not null default gen_random_uuid(),
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  created_at timestamptz default now(),
  deleted_at timestamptz
);
alter table chat_history enable row level security;
create policy "users own chat_history" on chat_history
  for all using (auth.uid() = user_id);

-- Migration: add session_id to existing deployments
-- Run this separately in Supabase SQL Editor if table already exists:
-- ALTER TABLE chat_history ADD COLUMN IF NOT EXISTS session_id uuid NOT NULL DEFAULT gen_random_uuid();
-- CREATE INDEX IF NOT EXISTS idx_chat_history_session ON chat_history(user_id, session_id, created_at ASC);

-- assets
create table if not exists assets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  name        text not null,
  type        text not null check (type in ('bank', 'investment', 'property', 'vehicle', 'other')),
  institution text,
  value       bigint not null default 0,
  note        text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  deleted_at  timestamptz
);
alter table assets enable row level security;
create policy "users own assets" on assets
  for all using (auth.uid() = user_id);

-- asset_value_logs
create table if not exists asset_value_logs (
  id          uuid primary key default gen_random_uuid(),
  asset_id    uuid references assets(id) on delete cascade,
  user_id     uuid not null,
  old_value   bigint not null,
  new_value   bigint not null,
  note        text,
  created_at  timestamptz default now()
);
alter table asset_value_logs enable row level security;
create policy "users own asset_value_logs" on asset_value_logs
  for all using (auth.uid() = user_id);

-- dashboard_insights
create table if not exists dashboard_insights (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users not null,
  month        text not null,
  insights     jsonb not null,
  generated_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);
alter table dashboard_insights enable row level security;
create policy "users own dashboard_insights" on dashboard_insights
  for all using (auth.uid() = user_id);

-- Trigger: auto-update assets.updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger assets_updated_at
  before update on assets
  for each row execute function update_updated_at_column();

-- Indexes for performance
create index if not exists idx_transactions_user_date on transactions(user_id, date desc);
create index if not exists idx_transactions_user_type on transactions(user_id, type);
create index if not exists idx_budgets_user_month on budgets(user_id, month);
create index if not exists idx_goals_user on goals(user_id, created_at desc);
create index if not exists idx_debts_user_settled on debts(user_id, settled);
create index if not exists idx_chat_history_user on chat_history(user_id, created_at desc);
create index if not exists idx_chat_history_session on chat_history(user_id, session_id, created_at asc);
create index if not exists idx_assets_user on assets(user_id, type, name);
create index if not exists idx_asset_logs_asset on asset_value_logs(asset_id, created_at desc);
create index if not exists idx_dashboard_insights_user_month on dashboard_insights(user_id, month, generated_at desc);

-- Soft-delete partial indexes (migration 002)
create index if not exists idx_transactions_not_deleted on transactions(user_id, deleted_at) where deleted_at is null;
create index if not exists idx_goals_not_deleted        on goals(user_id, deleted_at)        where deleted_at is null;
create index if not exists idx_assets_not_deleted       on assets(user_id, deleted_at)       where deleted_at is null;
create index if not exists idx_chat_not_deleted         on chat_history(user_id, deleted_at) where deleted_at is null;
