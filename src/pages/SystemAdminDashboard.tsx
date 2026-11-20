
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

import { apiFetch } from '../lib/apiClient';
import '../styles/student-dashboard.css';
import '../styles/admin-dashboard.css';

type DashboardData = {
  summary: {
    totalStudents: number;
    totalGroups: number;
    totalCourses: number;
    totalResources: number;
    totalSessions: number;
    totalMessages: number;
  };

  trends: {
    label: string;
    students: number;
    activeStudents: number;
    groups: number;
    resources: number;
    messages: number;
  }[];

  recentUsers: {
    id: number;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }[];

  recentGroups: {
    id: number;
    name: string;
    courseCode: string;
    owner: string;
    members: number;
    resources: number;
  }[];
};

export default function SystemAdminDashboard() {

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('users');
  const [search, setSearch] = useState('');

  async function loadDashboard() {
    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/api/admin/dashboard');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || 'Unable to load administrator dashboard.'
        );
      }

      setData(result);

    } catch (err) {
      setData(null);
      setError(
        err instanceof Error
          ? err.message
          : 'Dashboard unavailable.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const summary = data?.summary;

  const filteredUsers = (data?.recentUsers || []).filter(user =>
    `${user.name} ${user.email} ${user.role}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const filteredGroups = (data?.recentGroups || []).filter(group =>
    `${group.name} ${group.courseCode} ${group.owner}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <section className="student-dashboard workspace-page admin-dashboard">
      <div className="container student-dashboard-stack">

        <header className="sd-hero">
          <div>
            <p className="sd-eyebrow">
              StudyLink System Management
            </p>

            <h1>System Administrator Dashboard</h1>

            <p>
              Monitor platform activity and manage academic operations.
            </p>
          </div>

          <div className="sd-hero-actions">
            <Link
              to="/admin/academic"
              className="button button-primary button-sm"
            >
              Academic Management
            </Link>

            <button
              type="button"
              className="button button-secondary button-sm"
              onClick={() => void loadDashboard()}
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        </header>

        {loading && (
          <p className="sd-banner">
            Loading system statistics…
          </p>
        )}

        {error && (
          <div className="sd-error" role="alert">
            {error}
          </div>
        )}

        {data && summary && !error && (
          <>
            <div className="sd-stats">
              {[
                ['Registered students', summary.totalStudents],
                ['Study groups', summary.totalGroups],
                ['Total courses', summary.totalCourses],
                ['Shared resources', summary.totalResources],
                ['Study sessions', summary.totalSessions],
                ['Group messages', summary.totalMessages]
              ].map(([label, value]) => (
                <div className="sd-stat" key={String(label)}>
                  <span>{label}</span>
                  <strong>
                    {Number(value).toLocaleString()}
                  </strong>
                </div>
              ))}
            </div>

            <div className="sd-panels">

              {/* Student registration and engagement */}

              <section className="sd-panel">
                <h2>Student registration and engagement</h2>

                <p>
                  Registered and participating students over six weeks.
                </p>

                <div className="sd-line-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trends}>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />

                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10 }}
                      />

                      <YAxis
                        width={32}
                        allowDecimals={false}
                        tick={{ fontSize: 10 }}
                      />

                      <Tooltip />

                      <Legend
                        wrapperStyle={{ fontSize: 11 }}
                      />

                      <Line
                        type="monotone"
                        dataKey="students"
                        name="Registered students"
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />

                      <Line
                        type="monotone"
                        dataKey="activeStudents"
                        name="Active students"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />

                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Platform activity */}

              <section className="sd-panel">
                <h2>Platform activity trends</h2>

                <p>
                  Weekly group creation, resource sharing and messages.
                </p>

                <div className="sd-line-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trends}>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />

                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10 }}
                      />

                      <YAxis
                        width={32}
                        allowDecimals={false}
                        tick={{ fontSize: 10 }}
                      />

                      <Tooltip />

                      <Legend
                        wrapperStyle={{ fontSize: 11 }}
                      />

                      <Line
                        type="monotone"
                        dataKey="groups"
                        name="New groups"
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />

                      <Line
                        type="monotone"
                        dataKey="resources"
                        name="Resources"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />

                      <Line
                        type="monotone"
                        dataKey="messages"
                        name="Messages"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />

                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

            </div>

            {/* Compact management workspace */}

            <section className="sd-panel">

              <div className="ad-tabs">

                {[
                  ['users', 'Users'],
                  ['groups', 'Study Groups'],
                  ['academic', 'Academic Management'],
                  ['resources', 'Resources'],
                  ['sessions', 'Sessions']
                ].map(([key, label]) => (
                  <button
                    type="button"
                    key={key}
                    className={
                      tab === key
                        ? 'ad-tab active'
                        : 'ad-tab'
                    }
                    aria-pressed={tab === key}
                    onClick={() => {
                      setTab(key);
                      setSearch('');
                    }}
                  >
                    {label}
                  </button>
                ))}

              </div>

              {(tab === 'users' || tab === 'groups') && (
                <div className="ad-toolbar ad-search-toolbar">

                  <strong>
                    {tab === 'users'
                      ? 'Recently registered users'
                      : 'Recently created groups'}
                  </strong>

                  <input
                    type="search"
                    placeholder={`Search recent ${tab}...`}
                    aria-label={`Search ${tab}`}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />

                </div>
              )}

              <div className="ad-table-wrapper">

                {tab === 'users' && (
                  <table className="ad-table">

                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Registered</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredUsers.map(user => (
                        <tr key={user.id}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>
                            <span className="ad-role">
                              {user.role === 'admin'
                                ? 'Administrator'
                                : user.role}
                            </span>
                          </td>
                          <td>
                            {new Date(user.createdAt)
                              .toLocaleDateString()}
                          </td>
                        </tr>
                      ))}

                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={4}>
                            No matching users.
                          </td>
                        </tr>
                      )}
                    </tbody>

                  </table>
                )}

                {tab === 'groups' && (
                  <table className="ad-table">

                    <thead>
                      <tr>
                        <th>Group</th>
                        <th>Course</th>
                        <th>Owner</th>
                        <th>Members</th>
                        <th>Resources</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredGroups.map(group => (
                        <tr key={group.id}>
                          <td>{group.name}</td>
                          <td>{group.courseCode || '—'}</td>
                          <td>{group.owner || '—'}</td>
                          <td>{group.members}</td>
                          <td>{group.resources}</td>
                          <td>
                            <Link to={`/groups/${group.id}`}>
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}

                      {filteredGroups.length === 0 && (
                        <tr>
                          <td colSpan={6}>
                            No matching study groups.
                          </td>
                        </tr>
                      )}
                    </tbody>

                  </table>
                )}

                {tab === 'academic' && (
                  <div className="ad-management-links">
                    <h3>Academic Management</h3>

                    <p>
                      Manage the institutional academic structure.
                    </p>

                    <Link
                      to="/admin/academic"
                      className="button button-primary button-sm"
                    >
                      Manage Academic Structure
                    </Link>

                    <Link
                      to="/courses"
                      className="button button-secondary button-sm"
                    >
                      View Courses
                    </Link>
                  </div>
                )}

                {tab === 'resources' && (
                  <div className="ad-management-links">
                    <h3>Resource Management</h3>

                    <p>
                      Total shared resources: {summary.totalResources}
                    </p>

                    <Link
                      to="/resources"
                      className="button button-primary button-sm"
                    >
                      View Resources
                    </Link>
                  </div>
                )}

                {tab === 'sessions' && (
                  <div className="ad-management-links">
                    <h3>Study Sessions</h3>

                    <p>
                      Total scheduled sessions: {summary.totalSessions}
                    </p>

                    <Link
                      to="/sessions"
                      className="button button-primary button-sm"
                    >
                      View Sessions
                    </Link>
                  </div>
                )}

              </div>
            </section>

          </>
        )}

      </div>
    </section>
  );
}
