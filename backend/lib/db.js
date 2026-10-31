import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, '..', 'data.json');

const databaseUrl = process.env.DATABASE_URL;
let useLocalStore = !databaseUrl;

const defaultCourses = [
  {
    id: 1,
    code: 'APT3065',
    category: 'Applied Technology',
    title: 'Mid-Term Project',
    description: 'Collaborative project planning, research methods, and presentation preparation.',
    image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
    level: 'Year 3',
    delivery_mode: 'Project Studio',
  },
  {
    id: 2,
    code: 'BUS101',
    category: 'Business',
    title: 'Introduction to Business',
    description: 'Understand entrepreneurship, operations, and strategic decision-making.',
    image_url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80',
    level: 'Year 1',
    delivery_mode: 'Blended',
  },
  {
    id: 3,
    code: 'CS101',
    category: 'Computer Science',
    title: 'Introduction to Computer Science',
    description: 'Build a strong foundation in programming logic, problem solving, and algorithms.',
    image_url: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80',
    level: 'Year 1',
    delivery_mode: 'Hybrid',
  },
  {
    id: 4,
    code: 'CS201',
    category: 'Computer Science',
    title: 'Data Structures & Algorithms',
    description: 'Explore efficient data handling, sorting, and optimization techniques.',
    image_url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80',
    level: 'Year 2',
    delivery_mode: 'In-Person',
  },
  {
    id: 5,
    code: 'CS301',
    category: 'Computer Science',
    title: 'Database Systems',
    description: 'Learn data modeling, SQL, and database design for modern applications.',
    image_url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=900&q=80',
    level: 'Year 3',
    delivery_mode: 'Lab + Lecture',
  },
  {
    id: 6,
    code: 'CS401',
    category: 'Computer Science',
    title: 'Software Engineering',
    description: 'Practice team-based development, software architecture, and quality assurance.',
    image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    level: 'Year 4',
    delivery_mode: 'Studio',
  },
  {
    id: 7,
    code: 'ENG201',
    category: 'Communication',
    title: 'Academic Writing',
    description: 'Strengthen essay drafting, research, editing, and formal communication skills.',
    image_url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80',
    level: 'Year 2',
    delivery_mode: 'Workshop',
  },
  {
    id: 8,
    code: 'MATH101',
    category: 'Mathematics',
    title: 'Calculus I',
    description: 'Review limits, derivatives, and real-world applications in science.',
    image_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=900&q=80',
    level: 'Year 1',
    delivery_mode: 'Lecture',
  },
];

const defaultLocalState = {
  sessions: [
    { id: 1, group_id: 3, title: 'Intro to Recursion', starts_at: '2026-06-18T09:00:00.000Z', location: 'Science Block LT2', status: 'Upcoming', agenda: ['Recursion basics', 'Trace practice questions'], prep_notes: ['Revise function calls', 'Bring your notes'], attendance_rules: ['Arrive 10 minutes early'], enrollments: [] },
    { id: 2, group_id: 4, title: 'Binary Trees & Heaps Deep Dive', starts_at: '2026-06-19T15:30:00.000Z', location: 'Library Room 3A', status: 'Upcoming', agenda: ['Tree traversals', 'Heap exercises'], prep_notes: ['Attempt the worksheet first'], attendance_rules: ['Share at least one solved question'], enrollments: [] },
    { id: 3, group_id: 2, title: 'APT3065 Sprint Review', starts_at: '2026-06-20T14:00:00.000Z', location: 'Lab A', status: 'Upcoming', agenda: ['Sprint demo', 'Assign next actions'], prep_notes: ['Update your task board'], attendance_rules: ['Bring your progress update'], enrollments: [] },
    { id: 4, group_id: 1, title: 'Sprint Architecture Clinic', starts_at: '2026-06-21T16:30:00.000Z', location: 'Innovation Hub 2', status: 'Open', agenda: ['System diagrams', 'Testing checkpoints'], prep_notes: ['Review architecture notes'], attendance_rules: ['Stay for peer feedback'], enrollments: [] },
    { id: 5, group_id: 5, title: 'Case Study Breakdown', starts_at: '2026-06-22T11:00:00.000Z', location: 'Business School Seminar Room', status: 'Upcoming', agenda: ['Case review', 'Presentation structure'], prep_notes: ['Read the assigned case'], attendance_rules: ['Come ready to discuss'], enrollments: [] },
    { id: 6, group_id: 6, title: 'Calculus Revision Lab', starts_at: '2026-06-23T18:00:00.000Z', location: 'Virtual Classroom', status: 'Upcoming', agenda: ['Derivatives drill', 'Exam-style questions'], prep_notes: ['Attempt the quiz'], attendance_rules: ['Keep camera on if possible'], enrollments: [] },
  ],
  groups: [
    { id: 1, name: 'Software Engineering Squad', description: 'Weekly coding sessions and sprint preparation for software design projects.', course_name: 'Software Engineering', course_code: 'CS401', meeting_type: 'In-Person', image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80', who_can_join: 'Students enrolled in the course or approved by a group moderator.', join_requirements: ['Bring your course outline or module list.', 'Attend at least one orientation meeting.'], group_rules: ['Be respectful and keep discussions academic.', 'Participate in at least one session per week.'], member_benefits: ['Shared notes and revision materials.', 'Peer support for assignments and exams.'], new_member_steps: ['Introduce yourself in the group chat.', 'Review the session calendar.'], communication_channel: 'WhatsApp study circle plus weekly announcements on the dashboard.', schedule_notes: 'Weekly meetings on Mondays 6:00 PM to 8:00 PM.', owner_user_id: 1, enrollments: [] },
    { id: 2, name: 'APT3065 Project Team', description: 'Remote collaboration for planning, prototyping, and presenting the semester project.', course_name: 'Mid-Term Project', course_code: 'APT3065', meeting_type: 'Online', image_url: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80', who_can_join: 'Project team members, peer reviewers, and invited collaborators.', join_requirements: ['Confirm your team assignment.', 'Read the project brief before the first meeting.'], group_rules: ['Keep all progress updates honest and on time.', 'Attend sprint reviews unless you have prior notice.'], member_benefits: ['Clear sprint planning and task allocation.', 'Access to presentation drafts and review notes.'], new_member_steps: ['Read the project scope and milestones.', 'Claim one starter task.'], communication_channel: 'Google Meet for live sessions and task tracking for updates.', schedule_notes: 'Online reviews every Friday afternoon.', owner_user_id: 1, enrollments: [] },
    { id: 3, name: 'CS101 Beginners Group', description: 'Supportive study circle for beginners learning programming fundamentals.', course_name: 'Introduction to Computer Science', course_code: 'CS101', meeting_type: 'Hybrid', image_url: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=1200&q=80', who_can_join: 'First-year students and beginners who want a supportive start.', join_requirements: ['Be willing to ask questions.', 'Attend the welcome session.'], group_rules: ['Respect beginner pace and avoid gatekeeping.', 'No copying assignments from members.'], member_benefits: ['Beginner-friendly explanations.', 'Shared practice problems.'], new_member_steps: ['Attend the intro orientation.', 'Join one practice discussion in the first week.'], communication_channel: 'Hybrid meetings with updates posted in the group board.', schedule_notes: 'Mix of in-person and online meetings depending on topic difficulty.', owner_user_id: 1, enrollments: [] },
    { id: 4, name: 'Data Structures Study Circle', description: 'Focused revision and practice on arrays, trees, and problem solving.', course_name: 'Data Structures & Algorithms', course_code: 'CS201', meeting_type: 'In-Person', image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80', who_can_join: 'Students studying data structures or preparing for coding interviews.', join_requirements: ['Complete the weekly reading before meetings.', 'Bring questions you could not solve.'], group_rules: ['Discuss solutions after everyone has tried the problem.', 'Arrive on time for problem-solving sessions.'], member_benefits: ['Problem-solving practice.', 'Interview-style mock questions.'], new_member_steps: ['Check the reading list for the current topic.', 'Complete one warm-up challenge before your first meeting.'], communication_channel: 'Library room sessions with dashboard reminders for practice sets.', schedule_notes: 'Meetings are held in person after class hours.', owner_user_id: 1, enrollments: [] },
    { id: 5, name: 'Business Strategy Circle', description: 'Discuss case studies, assignments, and startup concepts with peers.', course_name: 'Introduction to Business', course_code: 'BUS101', meeting_type: 'Hybrid', image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80', who_can_join: 'Students interested in business fundamentals and presentation practice.', join_requirements: ['Show up ready to discuss case studies.'], group_rules: ['Stay focused on course-related discussions.', 'Support each member during presentations.'], member_benefits: ['Business concept breakdowns.', 'Assignment planning support.'], new_member_steps: ['Read the latest case study.', 'Join the presentation rotation.'], communication_channel: 'Hybrid discussion sessions with weekly online follow-ups.', schedule_notes: 'Useful for students balancing classwork and presentation prep.', owner_user_id: 1, enrollments: [] },
    { id: 6, name: 'Calculus Problem Solvers', description: 'Practice problem sets and share concepts for exam preparation.', course_name: 'Calculus I', course_code: 'MATH101', meeting_type: 'Online', image_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80', who_can_join: 'Students taking calculus or revising for math exams.', join_requirements: ['Attempt the problem set before the meeting.'], group_rules: ['Work through problems step by step.', 'Share methods, not just answers.'], member_benefits: ['Live problem-solving help.', 'Revision of core calculus methods.'], new_member_steps: ['Download the shared formula sheet.', 'Solve one warm-up problem with the group.'], communication_channel: 'Video meetings with posted summaries after every session.', schedule_notes: 'Online reviews are best for remote revision and short quiz practice.', owner_user_id: 1, enrollments: [] },
  ],
  resources: [
    { id: 1, title: 'Recursion Notes', resource_type: 'pdf', url: '/assets/recursion.pdf', description: 'Study notes for recursion concepts.', usage_notes: 'Use before the CS101 practice session.', audience: 'CS101 beginners', enrollments: [] },
    { id: 2, title: 'Binary Trees Slides', resource_type: 'ppt', url: '/assets/trees.pptx', description: 'Slides for tree traversal and heap concepts.', usage_notes: 'Useful for the CS201 workshop.', audience: 'CS201 students', enrollments: [] },
    { id: 3, title: 'Software Sprint Checklist', resource_type: 'doc', url: 'https://example.com/sprint-checklist', description: 'Team coordination checklist for sprint planning and reviews.', usage_notes: 'Best for CS401 team leads.', audience: 'CS401 project groups', enrollments: [] },
    { id: 4, title: 'Business Case Analysis Template', resource_type: 'doc', url: 'https://example.com/case-analysis-template', description: 'Reusable structure for business case presentations and group discussions.', usage_notes: 'Start here when preparing BUS101 presentations.', audience: 'BUS101 classmates', enrollments: [] },
  ],
  users: [
    { id: 1, email: 'demo@studylink.local', full_name: 'StudyLink Demo User', password_hash: '', university: 'USIU-Africa', role: 'student', major: 'Computer Science', year_of_study: 'Year 3', bio: 'Coordinates course projects and shares revision plans.' },
    { id: 2, email: 'violet@studylink.local', full_name: 'Talemwa Violet', password_hash: '', university: 'USIU-Africa', role: 'student', major: 'Computer Science', year_of_study: 'Year 2', bio: 'Enjoys collaborative problem solving and exam prep sessions.' },
    { id: 3, email: 'eugene@studylink.local', full_name: 'Eugene Juma', password_hash: '', university: 'USIU-Africa', role: 'student', major: 'Software Engineering', year_of_study: 'Year 3', bio: 'Focuses on project work, dashboards, and presentation planning.' },
    { id: 4, email: 'amina@studylink.local', full_name: 'Amina Hassan', password_hash: '', university: 'USIU-Africa', role: 'student', major: 'Applied Technology', year_of_study: 'Year 1', bio: 'Likes peer mentoring and joining new study circles.' },
  ],
  courses: defaultCourses,
  course_enrollments: [
    { course_id: 1, user_id: 1, enrolled_at: '2026-06-08T08:30:00.000Z' },
    { course_id: 1, user_id: 3, enrolled_at: '2026-06-10T11:00:00.000Z' },
    { course_id: 3, user_id: 1, enrolled_at: '2026-06-06T09:10:00.000Z' },
    { course_id: 3, user_id: 2, enrolled_at: '2026-06-11T13:20:00.000Z' },
    { course_id: 4, user_id: 2, enrolled_at: '2026-06-12T15:45:00.000Z' },
    { course_id: 4, user_id: 3, enrolled_at: '2026-06-13T10:05:00.000Z' },
    { course_id: 6, user_id: 1, enrolled_at: '2026-06-09T14:15:00.000Z' },
    { course_id: 6, user_id: 4, enrolled_at: '2026-06-14T07:50:00.000Z' },
    { course_id: 8, user_id: 4, enrolled_at: '2026-06-15T12:00:00.000Z' },
  ],
  contact_messages: [],
};

function normalizeLocalState(raw) {
  const state = {
    ...defaultLocalState,
    ...(raw || {}),
  };

  const existingUserEmails = new Set(
    (state.users || [])
      .map((user) => String(user.email || '').toLowerCase())
      .filter(Boolean),
  );

  state.users = [
    ...(state.users || []),
    ...defaultLocalState.users.filter(
      (user) => !existingUserEmails.has(String(user.email || '').toLowerCase()),
    ),
  ].map((user, index) => ({
    id: user.id || index + 1,
    email: user.email,
    full_name: user.full_name || user.name || user.email,
    password_hash: user.password_hash || '',
    university: user.university || '',
    role: user.role || 'student',
    major: user.major || '',
    year_of_study: user.year_of_study || '',
    bio: user.bio || '',
  }));

  state.groups = (state.groups || []).map((group, index) => ({
    enrollments: [],
    ...group,
    id: group.id || index + 1,
  }));

  state.sessions = (state.sessions || []).map((session, index) => ({
    enrollments: [],
    ...session,
    id: session.id || index + 1,
  }));

  state.resources = (state.resources || []).map((resource, index) => ({
    enrollments: [],
    ...resource,
    id: resource.id || index + 1,
  }));

  state.courses = (state.courses || defaultCourses).map((course, index) => ({
    ...defaultCourses.find((item) => Number(item.id) === Number(course.id) || item.code === course.code),
    ...course,
    id: course.id || index + 1,
    category: course.category || 'General',
    title: course.title || course.code || `Course ${index + 1}`,
    delivery_mode: course.delivery_mode || course.deliveryMode || 'Blended',
    image_url: course.image_url || course.image || '',
    level: course.level || 'Year 1',
  }));

  state.contact_messages = state.contact_messages || [];
  state.group_enrollments = state.group_enrollments || [];
  state.session_enrollments = state.session_enrollments || [];
  state.resource_enrollments = state.resource_enrollments || [];
  state.course_enrollments = state.course_enrollments || [];

  return state;
}

function loadLocalData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const raw = fs.readFileSync(DATA_PATH, 'utf-8');
      return normalizeLocalState(JSON.parse(raw));
    }
  } catch {
    // fall through to defaults
  }

  const initial = normalizeLocalState(defaultLocalState);
  saveLocalData(initial);
  return initial;
}

function saveLocalData(data) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // ignore local write failures in dev
  }
}

function nextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    university: user.university || '',
    role: user.role || 'student',
    major: user.major || '',
    year_of_study: user.year_of_study || '',
    bio: user.bio || '',
    password_hash: user.password_hash || '',
  };
}

function localRows(rows) {
  return Promise.resolve({ rows });
}

let localState = loadLocalData();

let pool = null;
if (!useLocalStore) {
  const ssl = process.env.PGSSLMODE === 'require' || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : undefined;

  pool = new Pool({
    connectionString: databaseUrl,
    ssl,
  });
}

function normalizeSql(text) {
  return String(text).replace(/\s+/g, ' ').trim().toLowerCase();
}

function findGroup(id) {
  return localState.groups.find((group) => Number(group.id) === Number(id)) || null;
}

function findSession(id) {
  return localState.sessions.find((session) => Number(session.id) === Number(id)) || null;
}

function findResource(id) {
  return localState.resources.find((resource) => Number(resource.id) === Number(id)) || null;
}

function findUser(id) {
  return localState.users.find((user) => Number(user.id) === Number(id)) || null;
}

function findUserByEmail(email) {
  return localState.users.find((user) => String(user.email).toLowerCase() === String(email).toLowerCase()) || null;
}

function findCourse(id) {
  return localState.courses.find((course) => Number(course.id) === Number(id)) || null;
}

function findCourseByCode(code) {
  return localState.courses.find((course) => String(course.code).toLowerCase() === String(code).toLowerCase()) || null;
}

function saveEnrollments() {
  saveLocalData(localState);
}

function getCourseEnrollmentEntries(courseId) {
  return localState.course_enrollments.filter((entry) => Number(entry.course_id) === Number(courseId));
}

function getUserCourseCodes(userId) {
  return localState.course_enrollments
    .filter((entry) => Number(entry.user_id) === Number(userId))
    .map((entry) => findCourse(entry.course_id)?.code)
    .filter(Boolean);
}

function toCourseRow(course, viewerUserId) {
  const enrolledStudents = getCourseEnrollmentEntries(course.id);

  return {
    ...course,
    enrolled_count: enrolledStudents.length,
    is_enrolled: viewerUserId
      ? enrolledStudents.some((entry) => Number(entry.user_id) === Number(viewerUserId))
      : false,
  };
}

function toLocalCourseStudent(entry) {
  const user = findUser(entry.user_id);
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    university: user.university || '',
    major: user.major || '',
    yearOfStudy: user.year_of_study || '',
    enrolledAt: entry.enrolled_at,
  };
}

function toLocalClassmate(user, viewerCourseCodes = []) {
  const courseCodes = getUserCourseCodes(user.id);
  const sharedCourses = courseCodes.filter((code) => viewerCourseCodes.includes(code));
  const initials = String(user.full_name || user.email || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    initials: initials || String(user.email || '?').charAt(0).toUpperCase(),
    university: user.university || '',
    major: user.major || '',
    yearOfStudy: user.year_of_study || '',
    bio: user.bio || '',
    courses: courseCodes,
    sharedCourses,
  };
}

function localDashboardActivity() {
  const courseRows = localState.course_enrollments.map((entry) => {
    const user = findUser(entry.user_id);
    const course = findCourse(entry.course_id);

    if (!user || !course) {
      return null;
    }

    return {
      id: `course-${course.id}-${user.id}-${entry.enrolled_at}`,
      type: 'course',
      title: `${user.full_name} enrolled in ${course.code}`,
      subtitle: `${course.title} · ${user.email}`,
      occurredAt: entry.enrolled_at,
      href: `/courses/${course.id}`,
    };
  });

  const groupRows = localState.groups.flatMap((group) =>
    (group.enrollments || []).map((entry) => ({
      id: `group-${group.id}-${entry.user_id}-${entry.joinedAt || entry.enrolledAt || Date.now()}`,
      type: 'group',
      title: `${entry.name || 'Student'} joined ${group.name}`,
      subtitle: `${group.course_code || ''} ${entry.email || ''}`.trim(),
      occurredAt: new Date(entry.joinedAt || entry.enrolledAt || Date.now()).toISOString(),
      href: `/groups/${group.id}`,
    })),
  );

  const sessionRows = localState.sessions.flatMap((session) =>
    (session.enrollments || []).map((entry) => ({
      id: `session-${session.id}-${entry.user_id}-${entry.enrolledAt || Date.now()}`,
      type: 'session',
      title: `${entry.name || 'Student'} enrolled in ${session.title}`,
      subtitle: `${session.location || 'Study session'} · ${entry.email || ''}`.trim(),
      occurredAt: new Date(entry.enrolledAt || Date.now()).toISOString(),
      href: '/sessions',
    })),
  );

  const resourceRows = localState.resources.flatMap((resource) =>
    (resource.enrollments || []).map((entry) => ({
      id: `resource-${resource.id}-${entry.user_id}-${entry.enrolledAt || Date.now()}`,
      type: 'resource',
      title: `${entry.name || 'Student'} opened ${resource.title}`,
      subtitle: `${resource.resource_type || resource.type || 'Resource'} · ${entry.email || ''}`.trim(),
      occurredAt: new Date(entry.enrolledAt || Date.now()).toISOString(),
      href: '/resources',
    })),
  );

  return [...courseRows, ...groupRows, ...sessionRows, ...resourceRows]
    .filter(Boolean)
    .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime());
}

async function localQuery(text, params = []) {
  const sql = normalizeSql(text);

  if (sql === 'select 1 as ok') {
    return localRows([{ ok: 1 }]);
  }

  if (sql.includes('from users where lower(email) = lower($1) limit 1')) {
    const user = findUserByEmail(params[0]);
    return localRows(user ? [publicUser(user)] : []);
  }

  if (sql.includes('from users where id = $1 limit 1')) {
    const user = findUser(params[0]);
    return localRows(user ? [publicUser(user)] : []);
  }

  if (sql.startsWith('insert into users')) {
    const user = {
      id: nextId(localState.users),
      email: params[0],
      full_name: params[1],
      password_hash: params[2] || '',
      university: params[3] || '',
      role: 'student',
    };
    localState.users.push(user);
    saveEnrollments();
    return localRows([{ id: user.id, email: user.email, full_name: user.full_name, university: user.university, role: user.role }]);
  }

  if (sql.startsWith('insert into contact_messages')) {
    localState.contact_messages.push({
      id: nextId(localState.contact_messages),
      name: params[0],
      email: params[1],
      subject: params[2],
      message: params[3],
      status: 'new',
    });
    saveEnrollments();
    return localRows([]);
  }

  if (sql.includes('from study_groups g order by g.created_at desc, g.id desc')) {
    return localRows(localState.groups.map((group) => ({
      ...group,
      member_count: group.enrollments?.length || 0,
      session_count: localState.sessions.filter((session) => Number(session.group_id) === Number(group.id)).length,
    })));
  }

  if (sql.includes('from study_groups g where g.id = $1 limit 1')) {
    const group = findGroup(params[0]);
    return localRows(group ? [{
      ...group,
      member_count: group.enrollments?.length || 0,
      session_count: localState.sessions.filter((session) => Number(session.group_id) === Number(group.id)).length,
    }] : []);
  }

  if (sql.includes('from sessions s join study_groups g on g.id = s.group_id order by s.starts_at asc nulls last, s.id asc')) {
    return localRows(localState.sessions.map((session) => {
      const group = findGroup(session.group_id) || {};
      return {
        ...session,
        group_name: group.name || session.group || '',
        course_code: group.course_code || '',
        enrollment_count: session.enrollments?.length || 0,
      };
    }));
  }

  if (sql.includes('from sessions s join study_groups g on g.id = s.group_id where s.id = $1 limit 1')) {
    const session = findSession(params[0]);
    if (!session) {
      return localRows([]);
    }
    const group = findGroup(session.group_id) || {};
    return localRows([{ ...session, group_name: group.name || '', course_code: group.course_code || '', enrollment_count: session.enrollments?.length || 0 }]);
  }

  if (sql.includes('from group_enrollments ge join users u on u.id = ge.user_id where ge.group_id = $1 order by ge.joined_at asc')) {
    const group = findGroup(params[0]);
    const rows = (group?.enrollments || []).map((entry) => ({ email: entry.email, name: entry.name, enrolled_at: entry.enrolledAt || entry.joinedAt || Date.now() }));
    return localRows(rows);
  }

  if (sql.includes('from session_enrollments se join users u on u.id = se.user_id where se.session_id = $1 order by se.enrolled_at asc')) {
    const session = findSession(params[0]);
    const rows = (session?.enrollments || []).map((entry) => ({ email: entry.email, name: entry.name, enrolled_at: entry.enrolledAt || Date.now() }));
    return localRows(rows);
  }

  if (sql.includes('from resource_enrollments re join users u on u.id = re.user_id where re.resource_id = $1 order by re.accessed_at asc')) {
    const resource = findResource(params[0]);
    const rows = (resource?.enrollments || []).map((entry) => ({ email: entry.email, name: entry.name, enrolled_at: entry.enrolledAt || Date.now() }));
    return localRows(rows);
  }

  if (sql.startsWith('insert into study_groups')) {
    const group = {
      id: nextId(localState.groups),
      name: params[0],
      description: params[1],
      course_name: params[2],
      course_code: params[3],
      meeting_type: params[4] || 'Hybrid',
      image_url: params[5],
      who_can_join: params[6],
      join_requirements: JSON.parse(params[7] || '[]'),
      group_rules: JSON.parse(params[8] || '[]'),
      member_benefits: JSON.parse(params[9] || '[]'),
      new_member_steps: JSON.parse(params[10] || '[]'),
      communication_channel: params[11],
      schedule_notes: params[12],
      owner_user_id: params[13],
      enrollments: [],
    };
    localState.groups.push(group);
    saveEnrollments();
    return localRows([{ ...group }]);
  }

  if (sql.startsWith('update study_groups')) {
    const group = findGroup(params[13]);
    if (!group) return localRows([]);
    group.name = params[0] ?? group.name;
    group.description = params[1] ?? group.description;
    group.course_name = params[2] ?? group.course_name;
    group.course_code = params[3] ?? group.course_code;
    group.meeting_type = params[4] ?? group.meeting_type;
    group.image_url = params[5] ?? group.image_url;
    group.who_can_join = params[6] ?? group.who_can_join;
    group.join_requirements = params[7] ? JSON.parse(params[7]) : group.join_requirements;
    group.group_rules = params[8] ? JSON.parse(params[8]) : group.group_rules;
    group.member_benefits = params[9] ? JSON.parse(params[9]) : group.member_benefits;
    group.new_member_steps = params[10] ? JSON.parse(params[10]) : group.new_member_steps;
    group.communication_channel = params[11] ?? group.communication_channel;
    group.schedule_notes = params[12] ?? group.schedule_notes;
    saveEnrollments();
    return localRows([{ ...group }]);
  }

  if (sql.startsWith('delete from study_groups')) {
    localState.groups = localState.groups.filter((group) => Number(group.id) !== Number(params[0]));
    localState.sessions = localState.sessions.filter((session) => Number(session.group_id) !== Number(params[0]));
    saveEnrollments();
    return localRows([]);
  }

  if (sql.startsWith('insert into group_enrollments')) {
    const group = findGroup(params[0]);
    if (group) {
      group.enrollments = group.enrollments || [];
      if (!group.enrollments.some((entry) => Number(entry.user_id) === Number(params[1]))) {
        const user = findUser(params[1]);
        group.enrollments.push({ user_id: params[1], email: user?.email || '', name: user?.full_name || '', joinedAt: Date.now() });
      }
      saveEnrollments();
    }
    return localRows([]);
  }

  if (sql.startsWith('insert into sessions')) {
    const session = {
      id: nextId(localState.sessions),
      group_id: Number(params[0]),
      title: params[1],
      starts_at: params[2],
      location: params[3],
      status: params[4] || 'Upcoming',
      agenda: JSON.parse(params[5] || '[]'),
      prep_notes: JSON.parse(params[6] || '[]'),
      attendance_rules: JSON.parse(params[7] || '[]'),
      created_by_user_id: params[8],
      enrollments: [],
    };
    localState.sessions.push(session);
    saveEnrollments();
    return localRows([{ id: session.id }]);
  }

  if (sql.startsWith('update sessions')) {
    const session = findSession(params[8]);
    if (!session) return localRows([]);
    session.group_id = params[0] ?? session.group_id;
    session.title = params[1] ?? session.title;
    session.starts_at = params[2] ?? session.starts_at;
    session.location = params[3] ?? session.location;
    session.status = params[4] ?? session.status;
    session.agenda = params[5] ? JSON.parse(params[5]) : session.agenda;
    session.prep_notes = params[6] ? JSON.parse(params[6]) : session.prep_notes;
    session.attendance_rules = params[7] ? JSON.parse(params[7]) : session.attendance_rules;
    saveEnrollments();
    return localRows([{ ...session }]);
  }

  if (sql.startsWith('delete from sessions')) {
    localState.sessions = localState.sessions.filter((session) => Number(session.id) !== Number(params[0]));
    saveEnrollments();
    return localRows([]);
  }

  if (sql.startsWith('insert into session_enrollments')) {
    const session = findSession(params[0]);
    if (session) {
      session.enrollments = session.enrollments || [];
      if (!session.enrollments.some((entry) => Number(entry.user_id) === Number(params[1]))) {
        const user = findUser(params[1]);
        session.enrollments.push({ user_id: params[1], email: user?.email || '', name: user?.full_name || '', enrolledAt: Date.now() });
      }
      saveEnrollments();
    }
    return localRows([]);
  }

  if (sql.startsWith('insert into resources')) {
    const resource = {
      id: nextId(localState.resources),
      title: params[0],
      resource_type: params[1],
      url: params[2],
      description: params[3],
      usage_notes: params[4],
      audience: params[5],
      created_by_user_id: params[6],
      enrollments: [],
    };
    localState.resources.push(resource);
    saveEnrollments();
    return localRows([{ id: resource.id }]);
  }

  if (sql.startsWith('update resources')) {
    const resource = findResource(params[6]);
    if (!resource) return localRows([]);
    resource.title = params[0] ?? resource.title;
    resource.resource_type = params[1] ?? resource.resource_type;
    resource.url = params[2] ?? resource.url;
    resource.description = params[3] ?? resource.description;
    resource.usage_notes = params[4] ?? resource.usage_notes;
    resource.audience = params[5] ?? resource.audience;
    saveEnrollments();
    return localRows([{ ...resource }]);
  }

  if (sql.startsWith('delete from resources')) {
    localState.resources = localState.resources.filter((resource) => Number(resource.id) !== Number(params[0]));
    saveEnrollments();
    return localRows([]);
  }

  if (sql.startsWith('insert into resource_enrollments')) {
    const resource = findResource(params[0]);
    if (resource) {
      resource.enrollments = resource.enrollments || [];
      if (!resource.enrollments.some((entry) => Number(entry.user_id) === Number(params[1]))) {
        const user = findUser(params[1]);
        resource.enrollments.push({ user_id: params[1], email: user?.email || '', name: user?.full_name || '', enrolledAt: Date.now() });
      }
      saveEnrollments();
    }
    return localRows([]);
  }

  if (sql.includes('from resources r order by r.created_at desc, r.id desc')) {
    return localRows(localState.resources.map((resource) => ({
      ...resource,
      download_count: resource.enrollments?.length || 0,
    })));
  }

  if (sql.includes('from resources r where r.id = $1 limit 1')) {
    const resource = findResource(params[0]);
    return localRows(resource ? [{ ...resource, download_count: resource.enrollments?.length || 0 }] : []);
  }

  if (sql.includes('select owner_user_id from study_groups where id = $1 limit 1')) {
    const group = findGroup(params[0]);
    return localRows(group ? [{ owner_user_id: group.owner_user_id || null }] : []);
  }

  if (sql.includes('select created_by_user_id from resources where id = $1 limit 1')) {
    const resource = findResource(params[0]);
    return localRows(resource ? [{ created_by_user_id: resource.created_by_user_id || null }] : []);
  }

  return localRows([]);
}

function formatCourseSummary(course, viewerUserId) {
  const enrolledStudents = getCourseEnrollmentEntries(course.id);
  const relatedGroups = localState.groups.filter((group) => String(group.course_code || '').toLowerCase() === String(course.code).toLowerCase());
  const upcomingSessions = localState.sessions.filter((session) => {
    const group = findGroup(session.group_id);
    return String(group?.course_code || '').toLowerCase() === String(course.code).toLowerCase();
  });

  return {
    id: course.id,
    code: course.code,
    category: course.category || 'General',
    title: course.title,
    description: course.description || '',
    image: course.image_url || '',
    level: course.level || 'Year 1',
    deliveryMode: course.delivery_mode || 'Blended',
    enrolledCount: enrolledStudents.length,
    isEnrolled: viewerUserId ? enrolledStudents.some((entry) => Number(entry.user_id) === Number(viewerUserId)) : false,
    relatedGroupCount: relatedGroups.length,
    upcomingSessionCount: upcomingSessions.length,
  };
}

function formatLocalGroupPreview(group) {
  return {
    id: group.id,
    name: group.name,
    course: group.course_name || '',
    courseCode: group.course_code || '',
    meetingType: group.meeting_type || 'Hybrid',
    members: group.enrollments?.length || 0,
    image: group.image_url || '',
    description: group.description || '',
    sessionCount: localState.sessions.filter((session) => Number(session.group_id) === Number(group.id)).length,
  };
}

function formatLocalSessionPreview(session) {
  const group = findGroup(session.group_id);
  return {
    id: session.id,
    title: session.title,
    startsAt: session.starts_at || null,
    location: session.location || '',
    group: group?.name || session.group || '',
    groupId: session.group_id,
    courseCode: group?.course_code || '',
    status: session.status || 'Upcoming',
    agenda: session.agenda || [],
    prepNotes: session.prep_notes || [],
    attendanceRules: session.attendance_rules || [],
    enrolledCount: session.enrollments?.length || 0,
  };
}

function formatLocalResourcePreview(resource) {
  return {
    id: resource.id,
    title: resource.title,
    type: resource.resource_type || resource.type || 'resource',
    url: resource.url,
    description: resource.description || '',
    usageNotes: resource.usage_notes || '',
    audience: resource.audience || '',
    downloads: resource.enrollments?.length || 0,
  };
}

export async function listCourses(viewerUserId = null) {
  if (useLocalStore) {
    return localState.courses
      .map((course) => formatCourseSummary(course, viewerUserId))
      .sort((left, right) => String(left.code).localeCompare(String(right.code)));
  }

  const result = await pool.query(
    `SELECT
      c.*,
      COALESCE(ec.enrolled_count, 0) AS enrolled_count,
      COALESCE(gc.group_count, 0) AS group_count,
      COALESCE(sc.session_count, 0) AS session_count,
      EXISTS(
        SELECT 1
        FROM course_enrollments current_enrollment
        WHERE current_enrollment.course_id = c.id
          AND current_enrollment.user_id = $1
      ) AS is_enrolled
     FROM courses c
     LEFT JOIN (
       SELECT course_id, COUNT(*) AS enrolled_count
       FROM course_enrollments
       GROUP BY course_id
     ) ec ON ec.course_id = c.id
     LEFT JOIN (
       SELECT course_code, COUNT(*) AS group_count
       FROM study_groups
       GROUP BY course_code
     ) gc ON gc.course_code = c.code
     LEFT JOIN (
       SELECT g.course_code, COUNT(*) AS session_count
       FROM sessions s
       JOIN study_groups g ON g.id = s.group_id
       GROUP BY g.course_code
     ) sc ON sc.course_code = c.code
     ORDER BY c.code ASC;`,
    [viewerUserId || 0],
  );

  return result.rows.map((row) => ({
    id: row.id,
    code: row.code,
    category: row.category || 'General',
    title: row.title,
    description: row.description || '',
    image: row.image_url || '',
    level: row.level || 'Year 1',
    deliveryMode: row.delivery_mode || 'Blended',
    enrolledCount: Number(row.enrolled_count) || 0,
    isEnrolled: Boolean(row.is_enrolled),
    relatedGroupCount: Number(row.group_count) || 0,
    upcomingSessionCount: Number(row.session_count) || 0,
  }));
}

export async function loadCourseDetails(identifier, viewerUserId = null) {
  if (useLocalStore) {
    const course = Number.isFinite(Number(identifier)) ? findCourse(identifier) : findCourseByCode(identifier);
    if (!course) {
      return null;
    }

    const students = getCourseEnrollmentEntries(course.id)
      .map(toLocalCourseStudent)
      .filter(Boolean)
      .sort((left, right) => new Date(right.enrolledAt).getTime() - new Date(left.enrolledAt).getTime());

    const groups = localState.groups
      .filter((group) => String(group.course_code || '').toLowerCase() === String(course.code).toLowerCase())
      .map(formatLocalGroupPreview);

    const sessions = localState.sessions
      .filter((session) => {
        const group = findGroup(session.group_id);
        return String(group?.course_code || '').toLowerCase() === String(course.code).toLowerCase();
      })
      .map(formatLocalSessionPreview);

    return {
      ...formatCourseSummary(course, viewerUserId),
      students,
      groups,
      sessions,
    };
  }

  const courseResult = await pool.query(
    `SELECT
      c.*,
      COALESCE(ec.enrolled_count, 0) AS enrolled_count,
      COALESCE(gc.group_count, 0) AS group_count,
      COALESCE(sc.session_count, 0) AS session_count,
      EXISTS(
        SELECT 1
        FROM course_enrollments current_enrollment
        WHERE current_enrollment.course_id = c.id
          AND current_enrollment.user_id = $3
      ) AS is_enrolled
     FROM courses c
     LEFT JOIN (
       SELECT course_id, COUNT(*) AS enrolled_count
       FROM course_enrollments
       GROUP BY course_id
     ) ec ON ec.course_id = c.id
     LEFT JOIN (
       SELECT course_code, COUNT(*) AS group_count
       FROM study_groups
       GROUP BY course_code
     ) gc ON gc.course_code = c.code
     LEFT JOIN (
       SELECT g.course_code, COUNT(*) AS session_count
       FROM sessions s
       JOIN study_groups g ON g.id = s.group_id
       GROUP BY g.course_code
     ) sc ON sc.course_code = c.code
     WHERE c.id = $1 OR lower(c.code) = lower($2)
     LIMIT 1;`,
    [Number(identifier) || 0, String(identifier), viewerUserId || 0],
  );

  const course = courseResult.rows[0];
  if (!course) {
    return null;
  }

  const [studentsResult, groupsResult, sessionsResult] = await Promise.all([
    pool.query(
      `SELECT
        u.id,
        u.full_name,
        u.email,
        u.university,
        u.major,
        u.year_of_study,
        ce.enrolled_at
       FROM course_enrollments ce
       JOIN users u ON u.id = ce.user_id
       WHERE ce.course_id = $1
       ORDER BY ce.enrolled_at DESC;`,
      [course.id],
    ),
    pool.query(
      `SELECT
        g.*,
        (SELECT COUNT(*) FROM group_enrollments ge WHERE ge.group_id = g.id) AS member_count,
        (SELECT COUNT(*) FROM sessions s WHERE s.group_id = g.id) AS session_count
       FROM study_groups g
       WHERE lower(g.course_code) = lower($1)
       ORDER BY g.created_at DESC, g.id DESC;`,
      [course.code],
    ),
    pool.query(
      `SELECT
        s.*,
        g.name AS group_name,
        g.course_code AS course_code,
        (SELECT COUNT(*) FROM session_enrollments se WHERE se.session_id = s.id) AS enrollment_count
       FROM sessions s
       JOIN study_groups g ON g.id = s.group_id
       WHERE lower(g.course_code) = lower($1)
       ORDER BY s.starts_at ASC NULLS LAST, s.id ASC;`,
      [course.code],
    ),
  ]);

  return {
    id: course.id,
    code: course.code,
    category: course.category || 'General',
    title: course.title,
    description: course.description || '',
    image: course.image_url || '',
    level: course.level || 'Year 1',
    deliveryMode: course.delivery_mode || 'Blended',
    enrolledCount: Number(course.enrolled_count) || 0,
    isEnrolled: Boolean(course.is_enrolled),
    relatedGroupCount: Number(course.group_count) || 0,
    upcomingSessionCount: Number(course.session_count) || 0,
    students: studentsResult.rows.map((row) => ({
      id: row.id,
      name: row.full_name,
      email: row.email,
      university: row.university || '',
      major: row.major || '',
      yearOfStudy: row.year_of_study || '',
      enrolledAt: row.enrolled_at,
    })),
    groups: groupsResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      course: row.course_name || '',
      courseCode: row.course_code || '',
      meetingType: row.meeting_type || 'Hybrid',
      members: Number(row.member_count) || 0,
      image: row.image_url || '',
      description: row.description || '',
      sessionCount: Number(row.session_count) || 0,
    })),
    sessions: sessionsResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      startsAt: row.starts_at || null,
      location: row.location || '',
      group: row.group_name || '',
      groupId: row.group_id,
      courseCode: row.course_code || '',
      status: row.status || 'Upcoming',
      agenda: Array.isArray(row.agenda) ? row.agenda : [],
      prepNotes: Array.isArray(row.prep_notes) ? row.prep_notes : [],
      attendanceRules: Array.isArray(row.attendance_rules) ? row.attendance_rules : [],
      enrolledCount: Number(row.enrollment_count) || 0,
    })),
  };
}

export async function enrollInCourse(courseId, userId) {
  if (useLocalStore) {
    const course = findCourse(courseId);
    if (!course) {
      return null;
    }

    const exists = localState.course_enrollments.some(
      (entry) => Number(entry.course_id) === Number(courseId) && Number(entry.user_id) === Number(userId),
    );

    if (!exists) {
      localState.course_enrollments.push({
        course_id: Number(courseId),
        user_id: Number(userId),
        enrolled_at: new Date().toISOString(),
      });
      saveEnrollments();
    }

    return loadCourseDetails(courseId, userId);
  }

  await pool.query(
    `INSERT INTO course_enrollments (course_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (course_id, user_id) DO NOTHING;`,
    [courseId, userId],
  );

  return loadCourseDetails(courseId, userId);
}

export async function listClassmates({ viewerUserId = null, search = '', courseCode = '' } = {}) {
  if (useLocalStore) {
    const normalizedSearch = String(search || '').trim().toLowerCase();
    const normalizedCourseCode = String(courseCode || '').trim().toLowerCase();
    const viewerCourseCodes = viewerUserId ? getUserCourseCodes(viewerUserId) : [];

    return localState.users
      .filter((user) => !viewerUserId || Number(user.id) !== Number(viewerUserId))
      .map((user) => toLocalClassmate(user, viewerCourseCodes))
      .filter((user) => user.courses.length > 0)
      .filter((user) => {
        if (!normalizedSearch) {
          return true;
        }

        return [user.name, user.university, user.major, user.email]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .filter((user) => !normalizedCourseCode || user.courses.some((code) => code.toLowerCase() === normalizedCourseCode))
      .sort((left, right) => {
        if (right.sharedCourses.length !== left.sharedCourses.length) {
          return right.sharedCourses.length - left.sharedCourses.length;
        }
        return left.name.localeCompare(right.name);
      });
  }

  const viewerCourseCodesResult = viewerUserId
    ? await pool.query(
      `SELECT c.code
       FROM course_enrollments ce
       JOIN courses c ON c.id = ce.course_id
       WHERE ce.user_id = $1;`,
      [viewerUserId],
    )
    : { rows: [] };

  const viewerCourseCodes = viewerCourseCodesResult.rows.map((row) => row.code);
  const classmatesResult = await pool.query(
    `SELECT
      u.id,
      u.email,
      u.full_name,
      u.university,
      u.major,
      u.year_of_study,
      u.bio,
      c.code AS course_code
     FROM users u
     LEFT JOIN course_enrollments ce ON ce.user_id = u.id
     LEFT JOIN courses c ON c.id = ce.course_id
     WHERE ($1::bigint = 0 OR u.id <> $1)
       AND (
         $2::text = ''
         OR lower(u.full_name) LIKE '%' || lower($2) || '%'
         OR lower(COALESCE(u.university, '')) LIKE '%' || lower($2) || '%'
         OR lower(COALESCE(u.major, '')) LIKE '%' || lower($2) || '%'
         OR lower(u.email) LIKE '%' || lower($2) || '%'
       )
     ORDER BY u.full_name ASC;`,
    [viewerUserId || 0, String(search || '').trim()],
  );

  const classmates = [];
  const classmatesMap = new Map();

  for (const row of classmatesResult.rows) {
    if (!classmatesMap.has(row.id)) {
      const nameParts = String(row.full_name || row.email || '?').split(' ').filter(Boolean);
      const initials = nameParts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || String(row.email || '?').charAt(0).toUpperCase();
      const classmate = {
        id: row.id,
        name: row.full_name,
        email: row.email,
        initials,
        university: row.university || '',
        major: row.major || '',
        yearOfStudy: row.year_of_study || '',
        bio: row.bio || '',
        courses: [],
        sharedCourses: [],
      };
      classmatesMap.set(row.id, classmate);
      classmates.push(classmate);
    }

    if (row.course_code) {
      const classmate = classmatesMap.get(row.id);
      if (!classmate.courses.includes(row.course_code)) {
        classmate.courses.push(row.course_code);
      }
    }
  }

  return classmates
    .map((classmate) => ({
      ...classmate,
      sharedCourses: classmate.courses.filter((code) => viewerCourseCodes.includes(code)),
    }))
    .filter((classmate) => classmate.courses.length > 0)
    .filter((classmate) => !courseCode || classmate.courses.some((code) => code.toLowerCase() === String(courseCode).toLowerCase()))
    .sort((left, right) => {
      if (right.sharedCourses.length !== left.sharedCourses.length) {
        return right.sharedCourses.length - left.sharedCourses.length;
      }
      return left.name.localeCompare(right.name);
    });
}

export async function loadUserProfile(userId) {
  if (useLocalStore) {
    const user = findUser(userId);
    if (!user) {
      return null;
    }

    const courses = localState.courses
      .filter((course) => getUserCourseCodes(userId).includes(course.code))
      .map((course) => formatCourseSummary(course, userId));
    const groups = localState.groups
      .filter((group) => (group.enrollments || []).some((entry) => Number(entry.user_id) === Number(userId)))
      .map(formatLocalGroupPreview);
    const sessions = localState.sessions
      .filter((session) => (session.enrollments || []).some((entry) => Number(entry.user_id) === Number(userId)))
      .map(formatLocalSessionPreview);
    const resources = localState.resources
      .filter((resource) => (resource.enrollments || []).some((entry) => Number(entry.user_id) === Number(userId)))
      .map(formatLocalResourcePreview);
    const classmates = await listClassmates({ viewerUserId: userId });

    return {
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        university: user.university || '',
        major: user.major || '',
        yearOfStudy: user.year_of_study || '',
        bio: user.bio || '',
        role: user.role || 'student',
      },
      summary: {
        courseCount: courses.length,
        groupCount: groups.length,
        sessionCount: sessions.length,
        resourceCount: resources.length,
        classmateCount: classmates.filter((classmate) => classmate.sharedCourses.length > 0).length,
      },
      courses,
      groups,
      sessions,
      resources,
    };
  }

  const [userResult, coursesResult, groupsResult, sessionsResult, resourcesResult, classmates] = await Promise.all([
    pool.query(
      `SELECT id, email, full_name, university, role, major, year_of_study, bio
       FROM users
       WHERE id = $1
       LIMIT 1;`,
      [userId],
    ),
    pool.query(
      `SELECT
        c.*,
        (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id) AS enrolled_count
       FROM course_enrollments current_user_courses
       JOIN courses c ON c.id = current_user_courses.course_id
       WHERE current_user_courses.user_id = $1
       ORDER BY c.code ASC;`,
      [userId],
    ),
    pool.query(
      `SELECT
        g.*,
        (SELECT COUNT(*) FROM group_enrollments ge WHERE ge.group_id = g.id) AS member_count,
        (SELECT COUNT(*) FROM sessions s WHERE s.group_id = g.id) AS session_count
       FROM group_enrollments ge
       JOIN study_groups g ON g.id = ge.group_id
       WHERE ge.user_id = $1
       ORDER BY ge.joined_at DESC;`,
      [userId],
    ),
    pool.query(
      `SELECT
        s.*,
        g.name AS group_name,
        g.course_code AS course_code,
        (SELECT COUNT(*) FROM session_enrollments se WHERE se.session_id = s.id) AS enrollment_count
       FROM session_enrollments se
       JOIN sessions s ON s.id = se.session_id
       JOIN study_groups g ON g.id = s.group_id
       WHERE se.user_id = $1
       ORDER BY s.starts_at ASC NULLS LAST, s.id ASC;`,
      [userId],
    ),
    pool.query(
      `SELECT
        r.*,
        (SELECT COUNT(*) FROM resource_enrollments re WHERE re.resource_id = r.id) AS download_count
       FROM resource_enrollments re
       JOIN resources r ON r.id = re.resource_id
       WHERE re.user_id = $1
       ORDER BY re.accessed_at DESC;`,
      [userId],
    ),
    listClassmates({ viewerUserId: userId }),
  ]);

  const user = userResult.rows[0];
  if (!user) {
    return null;
  }

  return {
    user: {
      id: user.id,
      name: user.full_name,
      email: user.email,
      university: user.university || '',
      major: user.major || '',
      yearOfStudy: user.year_of_study || '',
      bio: user.bio || '',
      role: user.role || 'student',
    },
    summary: {
      courseCount: coursesResult.rows.length,
      groupCount: groupsResult.rows.length,
      sessionCount: sessionsResult.rows.length,
      resourceCount: resourcesResult.rows.length,
      classmateCount: classmates.filter((classmate) => classmate.sharedCourses.length > 0).length,
    },
    courses: coursesResult.rows.map((row) => ({
      id: row.id,
      code: row.code,
      category: row.category || 'General',
      title: row.title,
      description: row.description || '',
      image: row.image_url || '',
      level: row.level || 'Year 1',
      deliveryMode: row.delivery_mode || 'Blended',
      enrolledCount: Number(row.enrolled_count) || 0,
      isEnrolled: true,
      relatedGroupCount: 0,
      upcomingSessionCount: 0,
    })),
    groups: groupsResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      course: row.course_name || '',
      courseCode: row.course_code || '',
      meetingType: row.meeting_type || 'Hybrid',
      members: Number(row.member_count) || 0,
      image: row.image_url || '',
      description: row.description || '',
      sessionCount: Number(row.session_count) || 0,
    })),
    sessions: sessionsResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      startsAt: row.starts_at || null,
      location: row.location || '',
      group: row.group_name || '',
      groupId: row.group_id,
      courseCode: row.course_code || '',
      status: row.status || 'Upcoming',
      agenda: Array.isArray(row.agenda) ? row.agenda : [],
      prepNotes: Array.isArray(row.prep_notes) ? row.prep_notes : [],
      attendanceRules: Array.isArray(row.attendance_rules) ? row.attendance_rules : [],
      enrolledCount: Number(row.enrollment_count) || 0,
    })),
    resources: resourcesResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      type: row.resource_type,
      url: row.url,
      description: row.description || '',
      usageNotes: row.usage_notes || '',
      audience: row.audience || '',
      downloads: Number(row.download_count) || 0,
    })),
  };
}

export async function updateUserProfile(userId, updates) {
  const name = String(updates.name || '').trim();
  const university = String(updates.university || '').trim();
  const major = String(updates.major || '').trim();
  const yearOfStudy = String(updates.yearOfStudy || '').trim();
  const bio = String(updates.bio || '').trim();

  if (useLocalStore) {
    const user = findUser(userId);
    if (!user) {
      return null;
    }

    user.full_name = name || user.full_name;
    user.university = university;
    user.major = major;
    user.year_of_study = yearOfStudy;
    user.bio = bio;
    saveEnrollments();
    return loadUserProfile(userId);
  }

  await pool.query(
    `UPDATE users
     SET
       full_name = $1,
       university = $2,
       major = $3,
       year_of_study = $4,
       bio = $5,
       updated_at = NOW()
     WHERE id = $6;`,
    [name, university, major, yearOfStudy, bio, userId],
  );

  return loadUserProfile(userId);
}

export async function query(text, params = []) {
  if (useLocalStore || !pool) {
    return localQuery(text, params);
  }

  try {
    return await pool.query(text, params);
  } catch (error) {
    console.warn('Postgres query failed, falling back to local store:', error?.message || error);
    useLocalStore = true;
    return localQuery(text, params);
  }
}

export async function healthcheck() {
  return query('SELECT 1 AS ok');
}

export function isLocalStore() {
  return useLocalStore;
}
