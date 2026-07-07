-- ============================================================
-- SIM 1 - Migración Completa de Esquema Supabase
-- Ejecutar en: Supabase SQL Editor (https://supabase.com)
-- ============================================================

-- 1. TABLA profiles (extiende auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
  full_name TEXT,
  avatar_url TEXT,
  group_ids JSONB DEFAULT '[]'::jsonb,
  document_type TEXT CHECK (document_type IN ('CC', 'TI', 'CE', 'PASSPORT')),
  document_number TEXT,
  can_create_users BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. TABLA catalogs
CREATE TABLE IF NOT EXISTS catalogs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'simple',
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE catalogs ENABLE ROW LEVEL SECURITY;

-- 3. TABLA groups
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  teacher_id TEXT,
  module_id TEXT,
  members JSONB DEFAULT '[]'::jsonb,
  start_date TEXT,
  end_date TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- 4. TABLA modules
CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  teacher_id TEXT,
  group_ids JSONB DEFAULT '[]'::jsonb,
  sections JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- 5. TABLA templates (formularios dinámicos)
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  module_id TEXT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  pdf_url TEXT DEFAULT '',
  schema JSONB DEFAULT '{"sections":[]}'::jsonb,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- 6. TABLA drafts (borradores con sync)
CREATE TABLE IF NOT EXISTS drafts (
  id SERIAL PRIMARY KEY,
  document_id TEXT NOT NULL,
  module_id TEXT,
  group_id TEXT,
  user_id TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  last_updated BIGINT DEFAULT extract(epoch from now()) * 1000,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(document_id, user_id, group_id)
);

ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;

-- 7. TABLA exercise_folders (carpetas de casos)
CREATE TABLE IF NOT EXISTS exercise_folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE exercise_folders ENABLE ROW LEVEL SECURITY;

-- 8. TABLA exercises (casos)
CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  folder_id TEXT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  content JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- 9. TABLA exercise_assignments
CREATE TABLE IF NOT EXISTS exercise_assignments (
  id TEXT PRIMARY KEY,
  case_id TEXT,
  student_id TEXT,
  group_id TEXT,
  assigned_by TEXT,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE exercise_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_groups_teacher ON groups(teacher_id);
CREATE INDEX IF NOT EXISTS idx_modules_teacher ON modules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_templates_module ON templates(module_id);
CREATE INDEX IF NOT EXISTS idx_drafts_user ON drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_module ON drafts(module_id);
CREATE INDEX IF NOT EXISTS idx_drafts_group ON drafts(group_id);
CREATE INDEX IF NOT EXISTS idx_drafts_sync ON drafts(document_id, user_id, group_id);
CREATE INDEX IF NOT EXISTS idx_exercises_folder ON exercises(folder_id);
CREATE INDEX IF NOT EXISTS idx_exercise_assignments_student ON exercise_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_exercise_assignments_case ON exercise_assignments(case_id);

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY['profiles', 'catalogs', 'groups', 'modules', 'templates', 'exercise_folders', 'exercises', 'exercise_assignments'];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_%s_updated_at ON %s; CREATE TRIGGER set_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================================

-- profiles: cada usuario ve/edita su propio perfil; admins ven todo
DROP POLICY IF EXISTS "Users view own profile" ON profiles;
CREATE POLICY "Users view own profile" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- catalogs: lectura para todos autenticados
DROP POLICY IF EXISTS "Authenticated users read catalogs" ON catalogs;
CREATE POLICY "Authenticated users read catalogs" ON catalogs
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins all catalogs" ON catalogs;
CREATE POLICY "Admins all catalogs" ON catalogs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- groups: lectura para todos, escritura para teachers/admins
DROP POLICY IF EXISTS "Authenticated users read groups" ON groups;
CREATE POLICY "Authenticated users read groups" ON groups
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers insert groups" ON groups;
CREATE POLICY "Teachers insert groups" ON groups
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers update groups" ON groups;
CREATE POLICY "Teachers update groups" ON groups
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers delete groups" ON groups;
CREATE POLICY "Teachers delete groups" ON groups
  FOR DELETE USING (auth.role() = 'authenticated');

-- modules: similar a groups
DROP POLICY IF EXISTS "Authenticated users read modules" ON modules;
CREATE POLICY "Authenticated users read modules" ON modules
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers insert modules" ON modules;
CREATE POLICY "Teachers insert modules" ON modules
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers update modules" ON modules;
CREATE POLICY "Teachers update modules" ON modules
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers delete modules" ON modules;
CREATE POLICY "Teachers delete modules" ON modules
  FOR DELETE USING (auth.role() = 'authenticated');

-- templates
DROP POLICY IF EXISTS "Authenticated users read templates" ON templates;
CREATE POLICY "Authenticated users read templates" ON templates
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers insert templates" ON templates;
CREATE POLICY "Teachers insert templates" ON templates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers update templates" ON templates;
CREATE POLICY "Teachers update templates" ON templates
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers delete templates" ON templates;
CREATE POLICY "Teachers delete templates" ON templates
  FOR DELETE USING (auth.role() = 'authenticated');

-- drafts: cada usuario ve/edita sus propios drafts
DROP POLICY IF EXISTS "Users view own drafts" ON drafts;
CREATE POLICY "Users view own drafts" ON drafts
  FOR SELECT USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users insert own drafts" ON drafts;
CREATE POLICY "Users insert own drafts" ON drafts
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users update own drafts" ON drafts;
CREATE POLICY "Users update own drafts" ON drafts
  FOR UPDATE USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users delete own drafts" ON drafts;
CREATE POLICY "Users delete own drafts" ON drafts
  FOR DELETE USING (user_id = auth.uid()::text);

-- exercise_folders
DROP POLICY IF EXISTS "Authenticated users read exercise_folders" ON exercise_folders;
CREATE POLICY "Authenticated users read exercise_folders" ON exercise_folders
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers insert exercise_folders" ON exercise_folders;
CREATE POLICY "Teachers insert exercise_folders" ON exercise_folders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers update exercise_folders" ON exercise_folders;
CREATE POLICY "Teachers update exercise_folders" ON exercise_folders
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers delete exercise_folders" ON exercise_folders;
CREATE POLICY "Teachers delete exercise_folders" ON exercise_folders
  FOR DELETE USING (auth.role() = 'authenticated');

-- exercises
DROP POLICY IF EXISTS "Authenticated users read exercises" ON exercises;
CREATE POLICY "Authenticated users read exercises" ON exercises
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers insert exercises" ON exercises;
CREATE POLICY "Teachers insert exercises" ON exercises
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers update exercises" ON exercises;
CREATE POLICY "Teachers update exercises" ON exercises
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers delete exercises" ON exercises;
CREATE POLICY "Teachers delete exercises" ON exercises
  FOR DELETE USING (auth.role() = 'authenticated');

-- exercise_assignments
DROP POLICY IF EXISTS "Authenticated users read exercise_assignments" ON exercise_assignments;
CREATE POLICY "Authenticated users read exercise_assignments" ON exercise_assignments
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers insert exercise_assignments" ON exercise_assignments;
CREATE POLICY "Teachers insert exercise_assignments" ON exercise_assignments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers update exercise_assignments" ON exercise_assignments;
CREATE POLICY "Teachers update exercise_assignments" ON exercise_assignments
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers delete exercise_assignments" ON exercise_assignments;
CREATE POLICY "Teachers delete exercise_assignments" ON exercise_assignments
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- TRIGGER: crear profile automáticamente al registrar usuario
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
