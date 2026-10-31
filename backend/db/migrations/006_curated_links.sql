-- 006_curated_links.sql
-- Create curated_links and curation_flags tables

CREATE TABLE IF NOT EXISTS curated_links (
  id SERIAL PRIMARY KEY,
  course_code TEXT NOT NULL,
  label TEXT,
  url TEXT,
  type TEXT,
  source TEXT,
  added_at TIMESTAMPTZ,
  added_by TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_curated_links_course_code ON curated_links(course_code);

CREATE TABLE IF NOT EXISTS curation_flags (
  id SERIAL PRIMARY KEY,
  course_code TEXT,
  url TEXT,
  reason TEXT,
  flagged_by TEXT,
  flagged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_curation_flags_course_code ON curation_flags(course_code);
