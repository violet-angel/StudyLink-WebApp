import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiClient';
import { getInitials, setStoredAuth } from '../lib/session';

type ProfileResponse = {
  user: {
    id: number;
    name: string;
    email: string;
    university: string;
    major: string;
    yearOfStudy: string;
    bio: string;
    role: string;
  };
  summary: {
    courseCount: number;
    groupCount: number;
    sessionCount: number;
    resourceCount: number;
    classmateCount: number;
  };
  courses: Array<{ id: number; code: string; title: string }>;
  groups: Array<{ id: number; name: string; members: number }>;
  sessions: Array<{ id: number; title: string; startsAt: string | null }>;
  resources: Array<{ id: number; title: string }>;
};

function Profile() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    university: '',
    major: '',
    yearOfStudy: '',
    bio: '',
  });

  useEffect(() => {
    apiFetch('/api/profile')
      .then((response) => response.json())
      .then((data) => {
        setProfile(data);
        setForm({
          name: data.user?.name || '',
          university: data.user?.university || '',
          major: data.user?.major || '',
          yearOfStudy: data.user?.yearOfStudy || '',
          bio: data.user?.bio || '',
        });
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      const response = await apiFetch('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error('Update failed');
      }

      const data = await response.json();
      setProfile(data);
      setStoredAuth(data.user, localStorage.getItem('token') || '');
      setIsEditing(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      alert('Could not save your profile changes.');
    }
  };

  if (loading) {
    return (
      <section className="workspace-page">
        <div className="container workspace-loading-card">
          <p>Loading profile...</p>
        </div>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="workspace-page">
        <div className="container workspace-loading-card">
          <p>Profile could not be loaded.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="profile-page workspace-page">
      <div className="container workspace-stack">
        <section className="detail-hero-card profile-hero-card">
          <div className="profile-avatar profile-avatar-large">{getInitials(profile.user.name)}</div>
          <div className="detail-hero-copy">
            <p className="workspace-eyebrow">My Academic Profile</p>
            <h1>{profile.user.name}</h1>
            <p className="workspace-lead">
              {profile.user.bio || 'Complete your profile to help classmates understand how you study best.'}
            </p>
            <div className="detail-chip-row">
              <span className="detail-chip">{profile.user.university || 'University pending'}</span>
              <span className="detail-chip">{profile.user.major || 'Major pending'}</span>
              <span className="detail-chip">{profile.user.yearOfStudy || 'Year pending'}</span>
            </div>
          </div>
        </section>

        <div className="stats-grid profile-stats-grid">
          <article className="stat-card"><div className="stat-content"><p className="stat-label">Courses</p><p className="stat-value">{profile.summary.courseCount}</p></div></article>
          <article className="stat-card"><div className="stat-content"><p className="stat-label">Groups</p><p className="stat-value">{profile.summary.groupCount}</p></div></article>
          <article className="stat-card"><div className="stat-content"><p className="stat-label">Sessions</p><p className="stat-value">{profile.summary.sessionCount}</p></div></article>
          <article className="stat-card"><div className="stat-content"><p className="stat-label">Classmates</p><p className="stat-value">{profile.summary.classmateCount}</p></div></article>
        </div>

        <div className="detail-layout">
          <section className="detail-panel">
            <div className="section-header">
              <h2>Personal details</h2>
              <button type="button" className="button button-secondary" onClick={() => setIsEditing((current) => !current)}>
                {isEditing ? 'Cancel' : 'Edit profile'}
              </button>
            </div>

            {isEditing ? (
              <div className="management-form">
                <label>
                  <span>Full name</span>
                  <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                </label>
                <label>
                  <span>University</span>
                  <input value={form.university} onChange={(event) => setForm((current) => ({ ...current, university: event.target.value }))} />
                </label>
                <label>
                  <span>Major</span>
                  <input value={form.major} onChange={(event) => setForm((current) => ({ ...current, major: event.target.value }))} />
                </label>
                <label>
                  <span>Year of study</span>
                  <input value={form.yearOfStudy} onChange={(event) => setForm((current) => ({ ...current, yearOfStudy: event.target.value }))} />
                </label>
                <label>
                  <span>Bio</span>
                  <textarea rows={4} value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} />
                </label>
                <div className="form-actions">
                  <button type="button" className="button button-primary" onClick={handleSave}>Save profile</button>
                </div>
              </div>
            ) : (
              <div className="profile-details-grid">
                <div><span className="mini-label">Email</span><strong>{profile.user.email}</strong></div>
                <div><span className="mini-label">University</span><strong>{profile.user.university || 'Not set yet'}</strong></div>
                <div><span className="mini-label">Major</span><strong>{profile.user.major || 'Not set yet'}</strong></div>
                <div><span className="mini-label">Year</span><strong>{profile.user.yearOfStudy || 'Not set yet'}</strong></div>
              </div>
            )}
          </section>

          <section className="detail-panel">
            <div className="section-header">
              <h2>My learning footprint</h2>
              <span className="panel-pill">Saved to database</span>
            </div>
            <div className="detail-card-grid">
              {profile.courses.slice(0, 3).map((course) => (
                <article key={course.id} className="detail-summary-card">
                  <strong>{course.code}</strong>
                  <p>{course.title}</p>
                </article>
              ))}
              {profile.groups.slice(0, 3).map((group) => (
                <article key={group.id} className="detail-summary-card">
                  <strong>{group.name}</strong>
                  <p>{group.members} members</p>
                </article>
              ))}
              {profile.sessions.slice(0, 2).map((session) => (
                <article key={session.id} className="detail-summary-card">
                  <strong>{session.title}</strong>
                  <p>{session.startsAt ? new Date(session.startsAt).toLocaleString() : 'Time pending'}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

export default Profile;
