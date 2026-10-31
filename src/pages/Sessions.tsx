import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/apiClient';
import { addNotification } from '../lib/notifications';

interface Session {
  id: number;
  title: string;
  startsAt?: string;
  time?: string;
  location?: string;
  group?: string;
  groupId?: number;
  courseCode?: string;
  date?: string;
  dayOfWeek?: string;
  month?: string;
  status?: 'Upcoming' | string;
  agenda?: string[];
  prepNotes?: string[];
  attendanceRules?: string[];
  enrolledCount?: number;
}

function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [enrollingSessionIds, setEnrollingSessionIds] = useState<number[]>([]);
  const [enrolledSessionIds, setEnrolledSessionIds] = useState<number[]>([]);
  const [sessionForm, setSessionForm] = useState({
    groupId: '',
    title: '',
    startsAt: '',
    location: '',
    status: 'Upcoming',
    agenda: '',
    prepNotes: '',
    attendanceRules: '',
  });

  const loadSessions = async () => {
    try {
      const [sessionsResponse, groupsResponse] = await Promise.all([
        apiFetch('/api/sessions').then((response) => response.json()),
        apiFetch('/api/groups').then((response) => response.json()),
      ]);
      setSessions(sessionsResponse.sessions || []);
      setGroups(groupsResponse.groups || []);
    } catch {
      setSessions([]);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const upcomingCount = useMemo(
    () => sessions.filter((session) => session.status !== 'Completed').length,
    [sessions],
  );

  const resetSessionForm = () => {
    setEditingSessionId(null);
    setShowSessionForm(false);
    setSessionForm({
      groupId: '',
      title: '',
      startsAt: '',
      location: '',
      status: 'Upcoming',
      agenda: '',
      prepNotes: '',
      attendanceRules: '',
    });
  };

  const loadSessionIntoForm = (session: Session) => {
    setEditingSessionId(session.id);
    setSessionForm({
      groupId: String(session.groupId || ''),
      title: session.title || '',
      startsAt: session.startsAt ? session.startsAt.slice(0, 16) : '',
      location: session.location || '',
      status: session.status || 'Upcoming',
      agenda: (session.agenda || []).join('\n'),
      prepNotes: (session.prepNotes || []).join('\n'),
      attendanceRules: (session.attendanceRules || []).join('\n'),
    });
  };

  const saveSession = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      groupId: sessionForm.groupId,
      title: sessionForm.title,
      startsAt: sessionForm.startsAt,
      location: sessionForm.location,
      status: sessionForm.status,
      agenda: sessionForm.agenda.split('\n').map((value) => value.trim()).filter(Boolean),
      prepNotes: sessionForm.prepNotes.split('\n').map((value) => value.trim()).filter(Boolean),
      attendanceRules: sessionForm.attendanceRules.split('\n').map((value) => value.trim()).filter(Boolean),
    };

    try {
      const response = await apiFetch(editingSessionId ? `/api/sessions/${editingSessionId}` : '/api/sessions', {
        method: editingSessionId ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Unable to save session');
      }

      await loadSessions();
      resetSessionForm();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      alert('Could not save the session. Please try again.');
    }
  };

  const deleteSession = async (sessionId: number) => {
    if (!window.confirm('Delete this session?')) {
      return;
    }

    try {
      const response = await apiFetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) {
        throw new Error('Unable to delete session');
      }

      await loadSessions();
      if (editingSessionId === sessionId) {
        resetSessionForm();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      alert('Could not delete the session.');
    }
  };

  const handleEnroll = async (id: number) => {
    setEnrollingSessionIds((current) => Array.from(new Set([...current, id])));

    try {
      const response = await apiFetch(`/api/sessions/${id}/enroll`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Enroll failed');
      }

      setEnrolledSessionIds((current) => Array.from(new Set([...current, id])));
      addNotification({
        id: `session-enroll-${id}-${Date.now()}`,
        title: 'Session enrolled',
        message: `You are now enrolled in the session "${data.session?.title || 'session'}".`,
        createdAt: new Date().toISOString(),
      });
      await loadSessions();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      alert(error instanceof Error ? error.message : 'Failed to enroll. Please try again.');
    } finally {
      setEnrollingSessionIds((current) => current.filter((sessionId) => sessionId !== id));
    }
  };

  return (
    <section className="sessions-page workspace-page">
      <div className="container workspace-stack">
        <section className="workspace-hero workspace-hero-sessions">
          <div>
            <p className="workspace-eyebrow">Study Sessions</p>
            <h1>Schedule sharper sessions with real attendance counts and better study context.</h1>
          </div>
          <div className="hero-stat-grid">
            <article className="hero-stat-card">
              <span className="hero-stat-value">{sessions.length}</span>
              <span className="hero-stat-label">Total sessions</span>
            </article>
            <article className="hero-stat-card">
              <span className="hero-stat-value">{upcomingCount}</span>
              <span className="hero-stat-label">Upcoming and open</span>
            </article>
            <article className="hero-stat-card">
              <span className="hero-stat-value">{sessions.reduce((sum, session) => sum + (session.enrolledCount || 0), 0)}</span>
              <span className="hero-stat-label">Saved enrollments</span>
            </article>
          </div>
        </section>

        <div className="groups-header">
          <div className="page-header">
            <h2>Schedule sessions</h2>
            <p className="page-description">Only open the session form when you're ready to create or edit a schedule.</p>
          </div>
          <button className="button button-primary" onClick={() => setShowSessionForm(true)}>
            {editingSessionId ? 'Edit session' : 'New session'}
          </button>
        </div>

        {showSessionForm ? (
          <div className="management-panel">
            <div className="section-header">
              <h2>{editingSessionId ? 'Edit Session' : 'Create Session'}</h2>
              <button className="text-button" onClick={resetSessionForm}>{editingSessionId ? 'Cancel editing' : 'Close form'}</button>
            </div>

            <form className="management-form" onSubmit={saveSession}>
            <div className="form-grid form-grid-two">
              <label>
                <span>Group</span>
                <select value={sessionForm.groupId} onChange={(event) => setSessionForm((current) => ({ ...current, groupId: event.target.value }))} required>
                  <option value="">Select a group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Status</span>
                <select value={sessionForm.status} onChange={(event) => setSessionForm((current) => ({ ...current, status: event.target.value }))}>
                  <option>Upcoming</option>
                  <option>Open</option>
                  <option>Full</option>
                  <option>Completed</option>
                </select>
              </label>
            </div>

            <div className="form-grid form-grid-two">
              <label>
                <span>Title</span>
                <input value={sessionForm.title} onChange={(event) => setSessionForm((current) => ({ ...current, title: event.target.value }))} required />
              </label>
              <label>
                <span>Start time</span>
                <input type="datetime-local" value={sessionForm.startsAt} onChange={(event) => setSessionForm((current) => ({ ...current, startsAt: event.target.value }))} required />
              </label>
            </div>

            <div className="form-grid form-grid-two">
              <label>
                <span>Location</span>
                <input value={sessionForm.location} onChange={(event) => setSessionForm((current) => ({ ...current, location: event.target.value }))} />
              </label>
              <label>
                <span>Agenda</span>
                <textarea value={sessionForm.agenda} onChange={(event) => setSessionForm((current) => ({ ...current, agenda: event.target.value }))} rows={3} placeholder="One agenda item per line" />
              </label>
            </div>

            <div className="form-grid form-grid-two">
              <label>
                <span>Prep notes</span>
                <textarea value={sessionForm.prepNotes} onChange={(event) => setSessionForm((current) => ({ ...current, prepNotes: event.target.value }))} rows={3} placeholder="One prep note per line" />
              </label>
              <label>
                <span>Attendance rules</span>
                <textarea value={sessionForm.attendanceRules} onChange={(event) => setSessionForm((current) => ({ ...current, attendanceRules: event.target.value }))} rows={3} placeholder="One rule per line" />
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="button button-primary">{editingSessionId ? 'Update session' : 'Create session'}</button>
              {editingSessionId ? <button type="button" className="button button-secondary" onClick={resetSessionForm}>Reset</button> : null}
            </div>
          </form>
        </div>
        ) : null}

        {loading ? (
          <div className="workspace-loading-card">
            <p>Loading sessions...</p>
          </div>
        ) : (
          <div className="sessions-list session-board">
            {sessions.map((session) => (
              <article key={session.id} className="session-card polished-session-card">
                <div className="session-date-block">
                  <p className="session-month">{session.month || new Date(session.startsAt || Date.now()).toLocaleDateString(undefined, { month: 'short' })}</p>
                  <p className="session-day">{session.date || new Date(session.startsAt || Date.now()).getDate()}</p>
                </div>

                <div className="session-content">
                  <div className="session-heading-row">
                    <div>
                      <p className="session-course-tag">{session.courseCode || 'Study Session'}</p>
                      <h3 className="session-title">{session.title}</h3>
                    </div>
                    <span className="session-status session-status-badge">{session.status}</span>
                  </div>

                  <div className="session-meta">
                    <span>{session.startsAt ? new Date(session.startsAt).toLocaleString() : session.time}</span>
                    <span>{session.location || 'Location pending'}</span>
                    <span>{session.group || 'Group pending'}</span>
                  </div>

                  <div className="session-detail-grid">
                    <article>
                      <span className="mini-label">Enrolled</span>
                      <strong>{session.enrolledCount ?? 0}</strong>
                    </article>
                    <article>
                      <span className="mini-label">Prep notes</span>
                      <strong>{session.prepNotes?.length || 0}</strong>
                    </article>
                    <article>
                      <span className="mini-label">Agenda items</span>
                      <strong>{session.agenda?.length || 0}</strong>
                    </article>
                  </div>

                  {session.prepNotes && session.prepNotes.length > 0 ? (
                    <div className="session-notes">
                      <strong>Prep notes</strong>
                      <ul>
                        {session.prepNotes.map((note) => <li key={note}>{note}</li>)}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <div className="session-actions session-actions-column">
                  <button
                    className="button button-primary"
                    type="button"
                    disabled={enrollingSessionIds.includes(session.id) || enrolledSessionIds.includes(session.id)}
                    onClick={() => handleEnroll(session.id)}
                  >
                    {enrolledSessionIds.includes(session.id)
                      ? 'Enrolled'
                      : enrollingSessionIds.includes(session.id)
                        ? 'Enrolling…'
                        : 'Enroll'}
                  </button>
                  <button type="button" className="button button-secondary" onClick={() => loadSessionIntoForm(session)}>Edit</button>
                  <button type="button" className="button button-secondary action-danger" onClick={() => deleteSession(session.id)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Sessions;
