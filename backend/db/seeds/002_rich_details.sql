UPDATE study_groups
SET
  image_url = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
  course_name = 'Software Engineering',
  course_code = 'CS401',
  meeting_type = 'In-Person',
  who_can_join = 'Students enrolled in the course or approved by a group moderator.',
  join_requirements = '["Bring your course outline or module list.","Attend at least one orientation meeting.","Read the pinned group notes before joining discussions."]'::jsonb,
  group_rules = '["Be respectful and keep discussions academic.","No spam, ads, or off-topic posting.","Participate in at least one session per week.","If you miss two sessions in a row, confirm your status with the moderator."]'::jsonb,
  member_benefits = '["Shared notes and revision materials.","Group study reminders and session planning.","Peer support for assignments and exam prep.","Access to session recordings when available."]'::jsonb,
  new_member_steps = '["Introduce yourself in the group chat.","Confirm your course and semester.","Review the session calendar.","Pick one topic to contribute to in the next meeting."]'::jsonb,
  communication_channel = 'WhatsApp study circle plus weekly announcements on the dashboard.',
  schedule_notes = 'Weekly meetings on Mondays 6:00 PM to 8:00 PM. Bring a laptop and lecture notes.'
WHERE id = 1;

UPDATE study_groups
SET
  image_url = 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80',
  course_name = 'Mid-Term Project',
  course_code = 'APT3065',
  meeting_type = 'Online',
  who_can_join = 'Project team members, peer reviewers, and invited collaborators.',
  join_requirements = '["Confirm your team assignment.","Read the project brief before the first meeting.","Join the shared task board and update your status weekly."]'::jsonb,
  group_rules = '["Keep all progress updates honest and on time.","Use the agreed file naming and versioning rules.","Attend sprint reviews unless you have prior notice.","Do not overwrite another member''s deliverables without permission."]'::jsonb,
  member_benefits = '["Clear sprint planning and task allocation.","Access to team files and presentation drafts.","Real-time feedback on project milestones.","Exam-ready project documentation support."]'::jsonb,
  new_member_steps = '["Read the project scope and milestones.","Join the weekly sprint channel.","Claim one starter task.","Introduce your strengths to the team lead."]'::jsonb,
  communication_channel = 'Google Meet for live sessions and Git-style task tracking for updates.',
  schedule_notes = 'Online reviews every Friday afternoon. Attendance is mandatory unless excused.'
WHERE id = 2;

UPDATE study_groups
SET
  image_url = 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=1200&q=80',
  course_name = 'Introduction to Computer Science',
  course_code = 'CS101',
  meeting_type = 'Hybrid',
  who_can_join = 'First-year students and beginners who want a supportive start.',
  join_requirements = '["Be willing to ask questions.","Attend the welcome session.","Bring a notebook or laptop for practice."]'::jsonb,
  group_rules = '["Respect beginner pace and avoid gatekeeping.","Share resources that help everyone learn.","No copying assignments from members.","Notify the group if you cannot attend."]'::jsonb,
  member_benefits = '["Beginner-friendly explanations.","Shared practice problems.","Exam prep checklists.","Support from experienced peers."]'::jsonb,
  new_member_steps = '["Attend the intro orientation.","Introduce yourself and your goals.","Review the starter reading list.","Join one practice discussion within the first week."]'::jsonb,
  communication_channel = 'Hybrid meetings with updates posted in the group board.',
  schedule_notes = 'Mix of in-person and online meetings depending on topic difficulty.'
WHERE id = 3;

UPDATE study_groups
SET
  image_url = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  course_name = 'Data Structures & Algorithms',
  course_code = 'CS201',
  meeting_type = 'In-Person',
  who_can_join = 'Students studying data structures or preparing for coding interviews.',
  join_requirements = '["Complete the weekly reading before meetings.","Attempt the practice questions independently first.","Bring questions you could not solve."]'::jsonb,
  group_rules = '["Discuss solutions after everyone has tried the problem.","Keep explanations clear and respectful.","Do not share answer keys outside the group.","Arrive on time for problem-solving sessions."]'::jsonb,
  member_benefits = '["Problem-solving practice.","Interview-style mock questions.","Revision summaries for major topics.","Peer review of coding approaches."]'::jsonb,
  new_member_steps = '["Check the reading list for the current topic.","Join the practice rotation.","Complete one warm-up challenge before your first meeting.","Subscribe to session reminders."]'::jsonb,
  communication_channel = 'Library room sessions with dashboard reminders for practice sets.',
  schedule_notes = 'Meetings are held in person after class hours for deeper problem-solving.'
WHERE id = 4;

UPDATE study_groups
SET
  image_url = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
  course_name = 'Introduction to Business',
  course_code = 'BUS101',
  meeting_type = 'Hybrid',
  who_can_join = 'Students interested in business fundamentals, presentations, and startup ideas.',
  join_requirements = '["Show up ready to discuss case studies.","Prepare a short summary of each chapter.","Respect speaking turns during discussions."]'::jsonb,
  group_rules = '["Stay focused on course-related discussions.","No plagiarism in presentations or written work.","Support each member''s presentation practice.","Update the group if you are sharing external resources."]'::jsonb,
  member_benefits = '["Business concept breakdowns.","Presentation practice opportunities.","Assignment planning support.","Case study discussion points."]'::jsonb,
  new_member_steps = '["Read the latest case study.","Share one business example from class.","Join the presentation rotation.","Introduce yourself and your goals."]'::jsonb,
  communication_channel = 'Hybrid discussion sessions with weekly online follow-ups.',
  schedule_notes = 'Useful for students balancing classwork and presentation prep.'
WHERE id = 5;

UPDATE study_groups
SET
  image_url = 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
  course_name = 'Calculus I',
  course_code = 'MATH101',
  meeting_type = 'Online',
  who_can_join = 'Students taking calculus or revising for math exams.',
  join_requirements = '["Attempt the problem set before the meeting.","Bring at least one solved question.","Join the online call on time."]'::jsonb,
  group_rules = '["Work through problems step by step.","Do not dominate the discussion.","Be patient with different solving speeds.","Share working methods, not just answers."]'::jsonb,
  member_benefits = '["Live problem-solving help.","Revision of core calculus methods.","Exam trick summaries.","Group accountability for practice tasks."]'::jsonb,
  new_member_steps = '["Introduce yourself in the call.","Confirm the chapter you are on.","Download the shared formula sheet.","Solve one warm-up problem with the group."]'::jsonb,
  communication_channel = 'Video meetings with posted summaries after every session.',
  schedule_notes = 'Online reviews are best for remote revision and short quiz practice.'
WHERE id = 6;
