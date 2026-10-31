UPDATE users
SET
  major = data.major,
  year_of_study = data.year_of_study,
  bio = data.bio
FROM (
  VALUES
    (1, 'Computer Science', 'Year 3', 'Coordinates project work, sprint planning, and revision check-ins.'),
    (2, 'Computer Science', 'Year 2', 'Enjoys collaborative coding practice and peer learning groups.'),
    (3, 'Software Engineering', 'Year 3', 'Builds polished coursework projects and leads structured study sessions.'),
    (4, 'Applied Technology', 'Year 1', 'Likes joining beginner-friendly study circles and asking thoughtful questions.')
) AS data(id, major, year_of_study, bio)
WHERE users.id = data.id;

INSERT INTO courses (id, code, category, title, description, image_url, level, delivery_mode)
VALUES
  (1, 'APT3065', 'Applied Technology', 'Mid-Term Project', 'Collaborative project planning, research methods, and presentation preparation.', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80', 'Year 3', 'Project Studio'),
  (2, 'BUS101', 'Business', 'Introduction to Business', 'Understand entrepreneurship, operations, and strategic decision-making.', 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80', 'Year 1', 'Blended'),
  (3, 'CS101', 'Computer Science', 'Introduction to Computer Science', 'Build a strong foundation in programming logic, problem solving, and algorithms.', 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80', 'Year 1', 'Hybrid'),
  (4, 'CS201', 'Computer Science', 'Data Structures & Algorithms', 'Explore efficient data handling, sorting, and optimization techniques.', 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80', 'Year 2', 'In-Person'),
  (5, 'CS301', 'Computer Science', 'Database Systems', 'Learn data modeling, SQL, and database design for modern applications.', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=900&q=80', 'Year 3', 'Lab + Lecture'),
  (6, 'CS401', 'Computer Science', 'Software Engineering', 'Practice team-based development, software architecture, and quality assurance.', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80', 'Year 4', 'Studio'),
  (7, 'ENG201', 'Communication', 'Academic Writing', 'Strengthen essay drafting, research, editing, and formal communication skills.', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80', 'Year 2', 'Workshop'),
  (8, 'MATH101', 'Mathematics', 'Calculus I', 'Review limits, derivatives, and real-world applications in science.', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=900&q=80', 'Year 1', 'Lecture')
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_enrollments (course_id, user_id, enrolled_at)
VALUES
  (1, 1, '2026-06-08 08:30:00+00'),
  (1, 3, '2026-06-10 11:00:00+00'),
  (2, 4, '2026-06-09 15:45:00+00'),
  (3, 1, '2026-06-06 09:10:00+00'),
  (3, 2, '2026-06-11 13:20:00+00'),
  (4, 2, '2026-06-12 15:45:00+00'),
  (4, 3, '2026-06-13 10:05:00+00'),
  (5, 1, '2026-06-09 16:30:00+00'),
  (6, 1, '2026-06-09 14:15:00+00'),
  (6, 4, '2026-06-14 07:50:00+00'),
  (8, 4, '2026-06-15 12:00:00+00')
ON CONFLICT (course_id, user_id) DO NOTHING;

INSERT INTO group_enrollments (group_id, user_id, joined_at)
VALUES
  (1, 1, '2026-06-12 09:00:00+00'),
  (1, 3, '2026-06-13 10:00:00+00'),
  (2, 1, '2026-06-14 11:30:00+00'),
  (2, 3, '2026-06-15 09:15:00+00'),
  (3, 2, '2026-06-12 12:00:00+00'),
  (4, 2, '2026-06-13 14:45:00+00'),
  (4, 3, '2026-06-14 16:20:00+00'),
  (5, 4, '2026-06-15 10:35:00+00'),
  (6, 4, '2026-06-16 08:50:00+00')
ON CONFLICT (group_id, user_id) DO NOTHING;

INSERT INTO session_enrollments (session_id, user_id, enrolled_at)
VALUES
  (1, 2, '2026-06-16 09:00:00+00'),
  (2, 2, '2026-06-16 09:30:00+00'),
  (2, 3, '2026-06-16 09:45:00+00'),
  (3, 1, '2026-06-16 10:00:00+00'),
  (3, 3, '2026-06-16 10:15:00+00'),
  (4, 1, '2026-06-16 10:30:00+00'),
  (5, 4, '2026-06-16 10:45:00+00'),
  (6, 4, '2026-06-16 11:00:00+00')
ON CONFLICT (session_id, user_id) DO NOTHING;

INSERT INTO resource_enrollments (resource_id, user_id, accessed_at)
VALUES
  (1, 2, '2026-06-16 12:00:00+00'),
  (2, 3, '2026-06-16 12:10:00+00'),
  (3, 1, '2026-06-16 12:20:00+00'),
  (4, 4, '2026-06-16 12:30:00+00')
ON CONFLICT (resource_id, user_id) DO NOTHING;
