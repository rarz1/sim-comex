-- Create app_texts table for editable application texts
CREATE TABLE IF NOT EXISTS app_texts (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL,
  value TEXT DEFAULT '',
  location TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_texts ENABLE ROW LEVEL SECURITY;

-- Policies: admins can write, all authenticated can read
CREATE POLICY "app_texts_select" ON app_texts FOR SELECT USING (true);
CREATE POLICY "app_texts_insert" ON app_texts FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "app_texts_update" ON app_texts FOR UPDATE USING (auth.role() = 'service_role' OR auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "app_texts_delete" ON app_texts FOR DELETE USING (auth.role() = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_app_texts_updated_at ON app_texts;
CREATE TRIGGER update_app_texts_updated_at
  BEFORE UPDATE ON app_texts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
