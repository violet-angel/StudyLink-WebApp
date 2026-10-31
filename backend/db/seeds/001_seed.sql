INSERT INTO users (id, email, full_name, password_hash, university, role)
VALUES
  (1, 'demo@studylink.local', 'StudyLink Demo User', NULL, 'USIU-Africa', 'student'),
  (2, 'violet@studylink.local', 'Talemwa Violet', NULL, 'USIU-Africa', 'student'),
  (3, 'eugene@studylink.local', 'Eugene Juma', NULL, 'USIU-Africa', 'student'),
  (4, 'amina@studylink.local', 'Amina Hassan', NULL, 'USIU-Africa', 'student')
ON CONFLICT (id) DO NOTHING;

INSERT INTO study_groups (id, name, description, course_name, course_code, meeting_type, owner_user_id)
VALUES
  (1, 'Software Engineering Squad', 'Weekly coding sessions and sprint preparation for software design projects.', 'Software Engineering', 'CS401', 'In-Person', 1),
  (2, 'APT3065 Project Team', 'Remote collaboration for planning, prototyping, and presenting the semester project.', 'Mid-Term Project', 'APT3065', 'Online', 1),
  (3, 'CS101 Beginners Group', 'Supportive study circle for beginners learning programming fundamentals.', 'Introduction to Computer Science', 'CS101', 'Hybrid', 1),
  (4, 'Data Structures Study Circle', 'Focused revision and practice on arrays, trees, and problem solving.', 'Data Structures & Algorithms', 'CS201', 'In-Person', 1),
  (5, 'Business Strategy Circle', 'Discuss case studies, assignments, and startup concepts with peers.', 'Introduction to Business', 'BUS101', 'Hybrid', 1),
  (6, 'Calculus Problem Solvers', 'Practice problem sets and share concepts for exam preparation.', 'Calculus I', 'MATH101', 'Online', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO sessions (id, group_id, title, starts_at, location, status, created_by_user_id)
VALUES
  (1, 3, 'Intro to Recursion', '2026-06-18 09:00:00+00', 'Science Block LT2', 'Upcoming', 1),
  (2, 4, 'Binary Trees & Heaps Deep Dive', '2026-06-19 15:30:00+00', 'Library Room 3A', 'Upcoming', 1),
  (3, 2, 'APT3065 Sprint Review', '2026-06-20 14:00:00+00', 'Lab A', 'Upcoming', 1),
  (4, 1, 'Sprint Architecture Clinic', '2026-06-21 16:30:00+00', 'Innovation Hub 2', 'Open', 1),
  (5, 5, 'Case Study Breakdown', '2026-06-22 11:00:00+00', 'Business School Seminar Room', 'Upcoming', 1),
  (6, 6, 'Calculus Revision Lab', '2026-06-23 18:00:00+00', 'Virtual Classroom', 'Upcoming', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO resources (id, title, resource_type, url, description, created_by_user_id)
VALUES
  (1, 'Recursion Notes', 'pdf', '/assets/recursion.pdf', 'Study notes for recursion concepts', 1),
  (2, 'Binary Trees Slides', 'ppt', '/assets/trees.pptx', 'Slides for tree traversal and heaps', 1),
  (3, 'Software Sprint Checklist', 'doc', 'https://example.com/sprint-checklist', 'Team coordination checklist for sprint planning and reviews.', 1),
  (4, 'Business Case Analysis Template', 'doc', 'https://example.com/case-analysis-template', 'Reusable structure for business case presentations and group discussions.', 1)
ON CONFLICT (id) DO NOTHING;
