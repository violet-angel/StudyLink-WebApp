-- 005_update_courses_for_academic.sql
-- Add academic linking columns to existing courses table created earlier

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS program_id INTEGER,
  ADD COLUMN IF NOT EXISTS semester_id INTEGER,
  ADD COLUMN IF NOT EXISTS created_by_user_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_courses_program_id ON courses(program_id);
