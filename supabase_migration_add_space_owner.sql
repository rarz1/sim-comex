-- ============================================================
-- Migration: Add space & owner_id columns for personal/repository
-- Run in Supabase SQL Editor after supabase_migration.sql
-- ============================================================

-- 1. exercise_folders: add space, owner_id
ALTER TABLE exercise_folders ADD COLUMN IF NOT EXISTS space TEXT DEFAULT 'repository' CHECK (space IN ('repository', 'personal'));
ALTER TABLE exercise_folders ADD COLUMN IF NOT EXISTS owner_id TEXT;

-- 2. exercises: add space, owner_id
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS space TEXT DEFAULT 'repository' CHECK (space IN ('repository', 'personal'));
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS owner_id TEXT;

-- 3. exercise_assignments: add assigned_by if missing
ALTER TABLE exercise_assignments ADD COLUMN IF NOT EXISTS assigned_by TEXT;
