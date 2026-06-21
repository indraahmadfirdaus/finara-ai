-- Migration 002: soft delete columns
-- Run this in Supabase SQL Editor

ALTER TABLE transactions  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE budgets        ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE goals          ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE assets         ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE chat_history   ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Indexes for fast filtering of non-deleted rows
CREATE INDEX IF NOT EXISTS idx_transactions_not_deleted ON transactions(user_id, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_goals_not_deleted        ON goals(user_id, deleted_at)        WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assets_not_deleted       ON assets(user_id, deleted_at)       WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_chat_not_deleted         ON chat_history(user_id, deleted_at) WHERE deleted_at IS NULL;
