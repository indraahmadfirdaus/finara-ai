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
  created_at timestamptz default now()
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
  created_at timestamptz default now()
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
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  created_at timestamptz default now()
);
alter table chat_history enable row level security;
create policy "users own chat_history" on chat_history
  for all using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists idx_transactions_user_date on transactions(user_id, date desc);
create index if not exists idx_transactions_user_type on transactions(user_id, type);
create index if not exists idx_budgets_user_month on budgets(user_id, month);
create index if not exists idx_goals_user on goals(user_id, created_at desc);
create index if not exists idx_debts_user_settled on debts(user_id, settled);
create index if not exists idx_chat_history_user on chat_history(user_id, created_at desc);
