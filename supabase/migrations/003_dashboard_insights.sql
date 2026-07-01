-- Migration 003: dashboard_insights
-- Persist AI-generated insight cards per user per month.
-- On re-login, the API reads the latest row for the current month
-- instead of calling DeepSeek again.

create table if not exists dashboard_insights (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users not null,
  month        text not null,                    -- 'YYYY-MM'
  insights     jsonb not null,                   -- InsightCard[]
  generated_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

alter table dashboard_insights enable row level security;

create policy "users own dashboard_insights" on dashboard_insights
  for all using (auth.uid() = user_id);

-- Only one row per user per month needed (latest wins)
create index if not exists idx_dashboard_insights_user_month
  on dashboard_insights(user_id, month, generated_at desc);
