-- Migration 004: record source tracking for dev analytics
-- Run this in Supabase SQL Editor
-- source: 'chat' = created via AI chat tools, 'manual' = created via app forms.
-- NULL = legacy row created before this migration (origin unknown — do NOT backfill).
-- Note: budgets uses upsert, so its source reflects the LAST writer, not the creator.

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS source text CHECK (source IN ('chat', 'manual'));
ALTER TABLE budgets      ADD COLUMN IF NOT EXISTS source text CHECK (source IN ('chat', 'manual'));
ALTER TABLE goals        ADD COLUMN IF NOT EXISTS source text CHECK (source IN ('chat', 'manual'));
ALTER TABLE debts        ADD COLUMN IF NOT EXISTS source text CHECK (source IN ('chat', 'manual'));
ALTER TABLE assets       ADD COLUMN IF NOT EXISTS source text CHECK (source IN ('chat', 'manual'));
