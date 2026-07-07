-- ============================================================
-- Migration: Fix column names after refactor (Session 20)
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Rename exercise_id → case_id
ALTER TABLE exercise_assignments RENAME COLUMN exercise_id TO case_id;

-- 2. Drop unused columns
ALTER TABLE exercise_assignments DROP COLUMN IF EXISTS module_id;
ALTER TABLE exercise_assignments DROP COLUMN IF EXISTS due_date;
ALTER TABLE exercises DROP COLUMN IF EXISTS module_id;

-- 3. Change exercises.content from TEXT to JSONB (drop default first to avoid cast error)
ALTER TABLE exercises ALTER COLUMN content DROP DEFAULT;
ALTER TABLE exercises ALTER COLUMN content TYPE JSONB USING CASE WHEN content = '' THEN '{}'::jsonb ELSE content::jsonb END;
ALTER TABLE exercises ALTER COLUMN content SET DEFAULT '{}'::jsonb;
