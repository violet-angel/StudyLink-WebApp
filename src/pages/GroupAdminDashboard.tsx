
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

type Group = {
  id: number;
  name: string;
  courseCode: string;
  members: number;
  resources: number;
  upcomingSessions: number;
};

type Trend = {
  label: string;
  members: number;
  activeMembers: number;
  messages: number;
  resources: number;
  sessions: number;
};

type DashboardData = {
  groups: Group[];
  managedGroups: Group[];
  summary: {
    totalGroups: number;
    totalMembers: number;
    activeMembers: number;
    upcomingSessions: number;
    totalResources: number;
    totalMessages: number;
  };
  trends: Trend[];
  upcomingSessions: {
    id: number;
    title: string;
    startsAt: string;
    groupId: number;
    groupName: string;
  }[];
};

export default function GroupAdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('groups');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const url = selectedGroup
          ? `/api/group-admin/dashboard?groupId=${encodeURIComponent(selectedGroup)}`
          : '/api/group-admin/dashboard';

        const response = await apiFetch(url);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Dashboard unavailable.');
        }

        if (active) setData(result);

      } catch (err) {
        if (active) {
          setData(null);
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load dashboard.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [selectedGroup]);

  const summary = data?.summary;

  return (
    <section className="student-dashboard workspace-page admin-dashboard">
      <div className="container student-dashboard-stack">

        <header className="sd-hero">
          <div>
            <p className="sd-eyebrow">StudyLink Management</p>
            <h1>Group Administrator Dashboard</h1>
            <p>Manage your groups, resources and member participation.</p>
          </div>

          <div className="sd-hero-actions">
            <Link
              to="/dashboard"
              className="button button-secondary button-sm"
            >
              Student Dashboard
            </Link>

            <Link
              to="/groups/new"
              className="button button-primary button-sm"
            >
              Create Group
            </Link>
          </div>
        </header>

        {loading && <p className="sd-banner">Loading dashboard…</p>}

        {error && (
          <div role="alert" className="sd-error">
            {error}
            <Link to="/groups"> Browse study groups</Link>
          </div>
        )}

        {data && !error && summary && (
          <>
            <div className="ad-toolbar">
              <label htmlFor="group-filter">
                Select study group
              </label>

              <select
                id="group-filter"
                value={selectedGroup}
                onChange={e => setSelectedGroup(e.target.value)}
                disabled={loading}
              >
                <option value="">All my groups</option>

                {data.groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>

              <span className="ad-period">Live database statistics</span>
            </div>

            <div className="sd-stats">
              {[
                ['Managed groups', summary.totalGroups],
                ['Members', summary.totalMembers],
                ['Messaging members · 7 days', summary.activeMembers],
                ['Upcoming sessions', summary.upcomingSessions],
                ['Shared resources', summary.totalResources],
                ['Group messages', summary.totalMessages]
              ].map(([label, value]) => (
                <div className="sd-stat" key={String(label)}>
                  <span>{label}</span>
                  <strong>{Number(value).toLocaleString()}</strong>
                </div>
              ))}
            </div>

            <div className="sd-panels">

              <section className="sd-panel">
                <h2>Membership and engagement</h2>
                <p>Current membership history and weekly messaging activity.</p>

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
                      <Legend wrapperStyle={{ fontSize: 11 }} />

                      <Line
                        type="monotone"
                        dataKey="members"
                        name="Members"
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />

                      <Line
                        type="monotone"
                        dataKey="activeMembers"
                        name="Messaging members"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="sd-panel">
                <h2>Group activity trends</h2>
                <p>Resources, messages and scheduled sessions by week.</p>

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
                      <Legend wrapperStyle={{ fontSize: 11 }} />

                      <Line
                        type="monotone"
                        dataKey="messages"
                        name="Messages"
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
                        dataKey="sessions"
                        name="Sessions"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>

            <section className="sd-panel">
              <div className="ad-tabs" role="group" aria-label="Management sections">
                {[
                  ['groups', 'Manage Groups'],
                  ['members', 'Members'],
                  ['sessions', 'Sessions'],
                  ['resources', 'Resources'],
                  ['discussions', 'Discussions']
                ].map(([key, label]) => (
                  <button
                    type="button"
                    key={key}
                    aria-pressed={tab === key}
                    className={tab === key ? 'ad-tab active' : 'ad-tab'}
                    onClick={() => setTab(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="ad-table-wrapper">

                {tab === 'sessions' ? (
                  <table className="ad-table">
                    <thead>
                      <tr>
                        <th>Session</th>
                        <th>Group</th>
                        <th>Scheduled time</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {data.upcomingSessions.map(session => (
                        <tr key={session.id}>
                          <td>{session.title}</td>
                          <td>{session.groupName}</td>
                          <td>{new Date(session.startsAt).toLocaleString()}</td>
                          <td>
                            <Link to={`/groups/${session.groupId}`}>
                              Manage
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="ad-table">
                    <thead>
                      <tr>
                        <th>Group name</th>
                        <th>Course</th>
                        <th>Members</th>
                        <th>Resources</th>
                        <th>Sessions</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {data.managedGroups.map(group => (
                        <tr key={group.id}>
                          <td>{group.name}</td>
                          <td>{group.courseCode || '—'}</td>
                          <td>{group.members}</td>
                          <td>{group.resources}</td>
                          <td>{group.upcomingSessions}</td>
                          <td>
                            <Link
                              to={
                                tab === 'discussions'
                                  ? `/groups/${group.id}/chat`
                                  : `/groups/${group.id}`
                              }
                            >
                              {tab === 'members'
                                ? 'Manage Members'
                                : tab === 'resources'
                                  ? 'Manage Resources'
                                  : tab === 'discussions'
                                    ? 'Open Chat'
                                    : 'Manage Group'}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {tab === 'sessions' &&
                  data.upcomingSessions.length === 0 && (
                    <p>No upcoming sessions.</p>
                  )}
              </div>
            </section>
          </>
        )}
      </div>
    </section>
  );
}
