-- Migration 001: Assets & Asset Value Logs
-- Applied: 2026-06-20
-- Run in Supabase Dashboard → SQL Editor

-- Tabel assets
CREATE TABLE IF NOT EXISTS assets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users NOT NULL,
  name        text NOT NULL,
  type        text NOT NULL CHECK (type IN ('bank', 'investment', 'property', 'vehicle', 'other')),
  institution text,
  value       bigint NOT NULL DEFAULT 0,
  note        text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Tabel asset_value_logs
CREATE TABLE IF NOT EXISTS asset_value_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id    uuid REFERENCES assets(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL,
  old_value   bigint NOT NULL,
  new_value   bigint NOT NULL,
  note        text,
  created_at  timestamptz DEFAULT now()
);

-- Trigger: auto-update assets.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_value_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own assets"
  ON assets FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own asset logs"
  ON asset_value_logs FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assets_user ON assets(user_id, type, name);
CREATE INDEX IF NOT EXISTS idx_asset_logs_asset ON asset_value_logs(asset_id, created_at DESC);
