-- 004_academic_seed.sql
-- Seed sample academic hierarchy for development/testing

INSERT INTO schools (name, short_code) VALUES
('University of Example', 'UEX'),
('Metropolitan Tech', 'MT');

-- Programs
INSERT INTO programs (school_id, name, code)
SELECT s.id, v.name, v.code FROM (VALUES
('Computer Science','CS'),
('Information Systems','IS')
) AS v(name, code)
JOIN schools s ON s.short_code = 'UEX'
LIMIT 2;

-- Years (1..3) for the first program
INSERT INTO years (program_id, year_number)
SELECT p.id, y.year_number FROM programs p, (VALUES (1),(2),(3)) AS y(year_number)
WHERE p.code = 'CS'
LIMIT 3;

-- Semester for year 1
INSERT INTO semesters (year_id, name, starts_at, ends_at)
SELECT y.id, 'Semester 1', NOW(), NOW() + INTERVAL '3 months' FROM years y
JOIN programs p ON p.id = y.program_id
WHERE p.code = 'CS' AND y.year_number = 1
LIMIT 1;

-- Courses for CS program
INSERT INTO courses (program_id, semester_id, code, category, title, description, created_by_user_id)
SELECT p.id,
  (SELECT s.id FROM semesters s JOIN years y ON y.id = s.year_id WHERE y.program_id = p.id LIMIT 1),
  v.code, 'Core', v.title, v.description, NULL
FROM programs p
JOIN (VALUES
  ('CS101','Introduction to Programming','Learn programming fundamentals'),
  ('CS102','Data Structures','Core data structures'),
  ('CS201','Databases','Intro to relational databases')
) AS v(code, title, description) ON p.code = 'CS'
WHERE p.code = 'CS' ON CONFLICT DO NOTHING;

-- Add a sample resource for CS101 (if course exists)
INSERT INTO course_resources (course_id, title, url, resource_type, created_by_user_id)
SELECT c.id, 'Syllabus', '/uploads/sample-syllabus.pdf', 'pdf', NULL
FROM courses c WHERE c.code = 'CS101' LIMIT 1 ON CONFLICT DO NOTHING;

-- Mark the sample resource as saved in resource_enrollments for user id 1 if exists
INSERT INTO resources (title, resource_type, url, created_by_user_id)
SELECT 'Sample Public Syllabus', 'pdf', '/uploads/sample-syllabus.pdf', NULL
WHERE NOT EXISTS (SELECT 1 FROM resources WHERE url = '/uploads/sample-syllabus.pdf')
ON CONFLICT DO NOTHING;

-- Optionally, create a saved link for user 1 if a user exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM users LIMIT 1) THEN
    INSERT INTO resource_enrollments (resource_id, user_id, accessed_at)
    SELECT r.id, (SELECT id FROM users LIMIT 1), NOW() FROM resources r WHERE r.url = '/uploads/sample-syllabus.pdf' LIMIT 1
    ON CONFLICT DO NOTHING;
  END IF;
END$$;
