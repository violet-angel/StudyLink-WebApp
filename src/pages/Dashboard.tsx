import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/apiClient';

type ActivityItem = {
  id: string;
  title: string;
  meta: string;
  occurredAt: string;
  href: string;
};

const announcementList = [
  { id: 'a1', title: 'New course outline templates are available.', detail: 'Course outline PDFs and weekly plans will help you keep every module organized.' },
  { id: 'a2', title: 'Create or join a study group for your current course.', detail: 'Structured groups improve exam preparation and keep your study time focused.' },
  { id: 'a3', title: 'Learning Hub now groups notes, videos, podcasts, and past papers together.', detail: 'Open one merged study area and switch content views from the same workspace.' },
];

const fallbackCourses = [
  { id: 1, code: 'APT3060', category: 'Applied Computer Technology', title: 'Mobile Programming', description: 'Create polished mobile apps and learn practical software engineering workflows.', level: 'Year 4', deliveryMode: 'Blended', enrolledCount: 128, isEnrolled: true, relatedGroupCount: 2, upcomingSessionCount: 3 },
  { id: 2, code: 'APT3025', category: 'Applied Computer Technology', title: 'Machine Learning', description: 'Understand supervised learning, evaluation, and applied AI thinking.', level: 'Year 4', deliveryMode: 'Online', enrolledCount: 94, isEnrolled: true, relatedGroupCount: 1, upcomingSessionCount: 2 },
];

const fallbackSessions = [
  { id: 11, title: 'Retrofit & Room Review', group: 'Mobile Programming Study Circle', startsAt: new Date().toISOString(), time: 'Today, 14:00' },
  { id: 12, title: 'ML Concept Sprint', group: 'Machine Learning Group', startsAt: null, time: 'Tomorrow, 16:30' },
];

const fallbackGroups = [
  { id: 21, name: 'Mobile Programming Study Circle', courseCode: 'APT3060', description: 'A structured weekly group for questions, notes, and revision planning.' },
  { id: 22, name: 'ML Exam Prep', courseCode: 'APT3025', description: 'Share solved examples, notes, and exam-style questions.' },
];

const fallbackResources = [
  { id: 31, title: 'Course outline PDF', type: 'PDF', downloads: 5 },
  { id: 32, title: 'Revision notes', type: 'Notes', downloads: 8 },
];

const fallbackActivity: ActivityItem[] = [
  { id: 'fallback-course', title: 'Mobile Programming course hub is ready', meta: 'APT3060 - notes, PDFs, and quiz support', occurredAt: new Date().toISOString(), href: '/courses/1' },
  { id: 'fallback-group', title: 'Join a structured study group', meta: 'Academic collaboration and WhatsApp-style support', occurredAt: new Date().toISOString(), href: '/groups' },
];

async function readJsonOrNull(path: string) {
  const response = await apiFetch(path);
  if (!response.ok) {
    return null;
  }

  return response.json();
}

function Dashboard() {
  const [courses, setCourses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        const [coursesResult, sessionsResult, groupsResult, resourcesResult] = await Promise.allSettled([
          readJsonOrNull('/api/courses'),
          readJsonOrNull('/api/sessions'),
          readJsonOrNull('/api/groups'),
          readJsonOrNull('/api/resources'),
        ]);

        if (!mounted) return;

        const coursesData = coursesResult.status === 'fulfilled' ? coursesResult.value : null;
        const sessionsData = sessionsResult.status === 'fulfilled' ? sessionsResult.value : null;
        const groupsData = groupsResult.status === 'fulfilled' ? groupsResult.value : null;
        const resourcesData = resourcesResult.status === 'fulfilled' ? resourcesResult.value : null;

        const courseList = Array.isArray(coursesData?.courses) && coursesData.courses.length > 0 ? coursesData.courses : fallbackCourses;
        const sessionList = Array.isArray(sessionsData?.sessions) && sessionsData.sessions.length > 0 ? sessionsData.sessions : fallbackSessions;
        const groupList = Array.isArray(groupsData?.groups) && groupsData.groups.length > 0 ? groupsData.groups : fallbackGroups;
        const resourceList = Array.isArray(resourcesData?.resources) && resourcesData.resources.length > 0 ? resourcesData.resources : fallbackResources;

        setCourses(courseList);
        setSessions(sessionList);
        setGroups(groupList);
        setResources(resourceList);

        const [courseDetails, groupDetails, sessionDetails, resourceDetails] = await Promise.all([
          Promise.all(courseList.slice(0, 4).map(async (course: any) => {
            const data = await readJsonOrNull(`/api/courses/${course.id}`);
            return data?.course || null;
          })),
          Promise.all(groupList.slice(0, 4).map(async (group: any) => {
            const data = await readJsonOrNull(`/api/groups/${group.id}`);
            return data?.group || null;
          })),
          Promise.all(sessionList.slice(0, 4).map(async (session: any) => {
            const data = await readJsonOrNull(`/api/sessions/${session.id}`);
            return data?.session || null;
          })),
          Promise.all(resourceList.slice(0, 4).map(async (resource: any) => {
            const data = await readJsonOrNull(`/api/resources/${resource.id}`);
            return data?.resource || null;
          })),
        ]);

        const courseActivity = courseDetails.flatMap((course: any) =>
          (course?.students || []).map((student: any) => ({
            id: `course-${course.id}-${student.id}-${student.enrolledAt}`,
            title: `${student.name} is active in ${course.code}`,
            meta: `${course.title} - ${student.email}`,
            occurredAt: student.enrolledAt,
            href: `/courses/${course.id}`,
          })),
        );

        const groupActivity = groupDetails.flatMap((group: any) =>
          (group?.membersList || []).map((member: any) => ({
            id: `group-${group.id}-${member.email}-${member.enrolledAt}`,
            title: `${member.name} joined ${group.name}`,
            meta: `${group.courseCode || 'Study Group'} - ${member.email}`,
            occurredAt: member.enrolledAt,
            href: `/groups/${group.id}`,
          })),
        );

        const sessionActivity = sessionDetails.flatMap((session: any) =>
          (session?.attendees || []).map((attendee: any) => ({
            id: `session-${session.id}-${attendee.email}-${attendee.enrolledAt}`,
            title: `${attendee.name} joined ${session.title}`,
            meta: `${session.group || 'Study Session'} - ${attendee.email}`,
            occurredAt: attendee.enrolledAt,
            href: '/sessions',
          })),
        );

        const resourceActivity = resourceDetails.flatMap((resource: any) =>
          (resource?.accesses || []).map((access: any) => ({
            id: `resource-${resource.id}-${access.email}-${access.enrolledAt}`,
            title: `${access.name} opened ${resource.title}`,
            meta: `${resource.type || 'Resource'} - ${access.email}`,
            occurredAt: access.enrolledAt,
            href: '/learning?view=resources',
          })),
        );

        const mergedActivity = [...courseActivity, ...groupActivity, ...sessionActivity, ...resourceActivity]
          .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
          .slice(0, 6);

        setActivity(mergedActivity.length > 0 ? mergedActivity : fallbackActivity);
      } catch {
        if (!mounted) return;
        setCourses(fallbackCourses);
        setSessions(fallbackSessions);
        setGroups(fallbackGroups);
        setResources(fallbackResources);
        setActivity(fallbackActivity);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = [
    { label: 'Courses enrolled', value: String(courses.filter((course) => course.isEnrolled).length), href: '/courses' },
    { label: 'Study groups', value: String(groups.length), href: '/groups' },
    { label: 'Upcoming sessions', value: String(sessions.length), href: '/sessions' },
    { label: 'Learning resources', value: String(resources.length), href: '/learning?view=library' },
  ];

  const upcomingSessions = sessions.slice(0, 4);
  const recentActivity = activity.slice(0, 4);

  return (
    <section className="dashboard-page workspace-page">
      <div className="container workspace-stack">
        <section className="dashboard-summary-card">
          <div>
            <p className="workspace-eyebrow">Welcome back</p>
            <h1>StudyLink keeps your academic ecosystem compact and productive.</h1>
            <p className="workspace-lead">A slimmer dashboard with quick stats, upcoming sessions, and direct access to courses, library, and groups.</p>
          </div>
          <div className="dashboard-summary-actions">
            <Link to="/courses" className="button button-primary">Continue learning</Link>
            <Link to="/courses/1#ask" className="button button-secondary">Ask StudyLink AI</Link>
            <Link to="/learning?view=library" className="button button-secondary">Open learning hub</Link>
          </div>
        </section>

        <div className="dashboard-stats-grid">
          {stats.map((stat) => (
            <Link key={stat.label} to={stat.href} className="stat-card stat-card-link compact-stat-card">
              <div className="stat-content">
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value">{stat.value}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="dashboard-layout">
          <section className="dashboard-section dashboard-primary-panel">
            <div className="section-header">
              <h2>Recent activity</h2>
              <span className="panel-pill">Latest updates</span>
            </div>
            {loading ? (
              <div className="workspace-loading-card"><p>Loading dashboard activity...</p></div>
            ) : recentActivity.length === 0 ? (
              <div className="empty-state">
                <p className="empty-text">No recent activity available yet.</p>
                <p className="empty-help">Enroll in a course or join a study group to start tracking your academic actions.</p>
              </div>
            ) : (
              <div className="activity-feed">
                {recentActivity.map((item) => (
                  <Link key={item.id} to={item.href} className="activity-card activity-card-link">
                    <div>
                      <p className="activity-title">{item.title}</p>
                      <p className="activity-meta">{item.meta}</p>
                    </div>
                    <span className="activity-time">{new Date(item.occurredAt).toLocaleString()}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-section">
            <div className="section-header">
              <h2>Upcoming sessions</h2>
              <Link to="/sessions" className="view-all-link">View sessions</Link>
            </div>
            {upcomingSessions.length === 0 ? (
              <div className="empty-state">
                <p className="empty-text">No upcoming sessions found.</p>
                <p className="empty-help">Create or join a study session to keep your calendar active.</p>
              </div>
            ) : (
              <div className="detail-card-grid">
                {upcomingSessions.map((session) => (
                  <article key={session.id} className="detail-summary-card">
                    <strong>{session.title}</strong>
                    <p>{session.group || 'Study session'}</p>
                    <span>{session.startsAt ? new Date(session.startsAt).toLocaleString() : session.time || 'Time pending'}</span>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="dashboard-layout">
          <section className="dashboard-section">
            <div className="section-header">
              <h2>Announcements</h2>
              <span className="panel-pill">Campus insights</span>
            </div>
            <div className="announcement-list">
              {announcementList.map((announcement) => (
                <article key={announcement.id} className="detail-summary-card">
                  <strong>{announcement.title}</strong>
                  <p>{announcement.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="dashboard-section">
            <div className="section-header">
              <h2>Quick shortcuts</h2>
              <span className="panel-pill">Navigate faster</span>
            </div>
            <div className="quick-actions quick-actions-grid">
              <Link to="/courses" className="quick-action-btn quick-action-card">
                <div>
                  <strong>Courses</strong>
                  <p>Open your enrolled and available course catalog.</p>
                </div>
                <span className="action-icon">-&gt;</span>
              </Link>
              <Link to="/learning?view=library" className="quick-action-btn quick-action-card">
                <div>
                  <strong>Learning Hub</strong>
                  <p>Find notes, PDFs, podcasts, quizzes, and curated resources in one place.</p>
                </div>
                <span className="action-icon">-&gt;</span>
              </Link>
              <Link to="/courses/1#ask" className="quick-action-btn quick-action-card">
                <div>
                  <strong>Ask StudyLink AI</strong>
                  <p>Open a course and ask the AI tutor for explanations, quizzes, and summaries.</p>
                </div>
                <span className="action-icon">-&gt;</span>
              </Link>
              <Link to="/groups" className="quick-action-btn quick-action-card">
                <div>
                  <strong>Study groups</strong>
                  <p>Review active groups and join collaborative sessions.</p>
                </div>
                <span className="action-icon">-&gt;</span>
              </Link>
              <Link to="/sessions" className="quick-action-btn quick-action-card">
                <div>
                  <strong>Sessions</strong>
                  <p>Check your upcoming sessions and join live review meetings.</p>
                </div>
                <span className="action-icon">-&gt;</span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
