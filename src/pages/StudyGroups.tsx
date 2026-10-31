import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../components/Modal';
import { apiFetch } from '../lib/apiClient';
import { addNotification } from '../lib/notifications';
import { getStoredUser } from '../lib/session';

interface StudyGroup {
  id: number;
  name: string;
  course: string;
  courseCode: string;
  meetingType: 'In-Person' | 'Online' | 'Hybrid';
  members: number;
  image: string;
  description?: string;
  joinRequirements?: string[];
  groupRules?: string[];
  memberBenefits?: string[];
  newMemberSteps?: string[];
  whoCanJoin?: string;
  communicationChannel?: string;
  whatsappLink?: string;
  scheduleNotes?: string;
  sessionCount?: number;
}

type StudyGroupsProps = {
  initialShowForm?: boolean;
};

function StudyGroups({ initialShowForm = false }: StudyGroupsProps) {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('All courses');
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [showGroupForm, setShowGroupForm] = useState(initialShowForm);
  const [loading, setLoading] = useState(true);
  const [pendingJoinGroup, setPendingJoinGroup] = useState<StudyGroup | null>(null);
  const [acceptedRequirements, setAcceptedRequirements] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joiningGroupIds, setJoiningGroupIds] = useState<number[]>([]);
  const [joinedGroupIds, setJoinedGroupIds] = useState<number[]>([]);
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    courseName: '',
    courseCode: '',
    meetingType: 'Hybrid',
    imageUrl: '',
    whoCanJoin: '',
    joinRequirements: '',
    groupRules: '',
    memberBenefits: '',
    newMemberSteps: '',
    communicationChannel: '',
    whatsappLink: '',
    scheduleNotes: '',
  });
  const currentUser = getStoredUser();

  const loadGroups = async () => {
    try {
      const response = await apiFetch('/api/groups');
      const data = await response.json();
      setGroups(data.groups || []);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    setShowGroupForm(initialShowForm);
  }, [initialShowForm]);

  const filterOptions = useMemo(
    () => ['All courses', ...Array.from(new Set(groups.map((group) => group.courseCode).filter(Boolean)))],
    [groups],
  );

  const filteredGroups = selectedFilter === 'All courses'
    ? groups
    : groups.filter((group) => group.courseCode === selectedFilter);

  const resetGroupForm = () => {
    setEditingGroupId(null);
    setShowGroupForm(false);
    setGroupForm({
      name: '',
      description: '',
      courseName: '',
      courseCode: '',
      meetingType: 'Hybrid',
      imageUrl: '',
      whoCanJoin: '',
      joinRequirements: '',
      groupRules: '',
      memberBenefits: '',
      newMemberSteps: '',
      communicationChannel: '',
      whatsappLink: '',
      scheduleNotes: '',
    });
  };

  const loadGroupIntoForm = (group: StudyGroup) => {
    try {
      // ensure UI opens immediately
      setEditingGroupId(group.id);
      setShowGroupForm(true);
      setGroupForm({
        name: group.name || '',
        description: group.description || '',
        courseName: group.course || '',
        courseCode: group.courseCode || '',
        meetingType: group.meetingType || 'Hybrid',
        imageUrl: group.image || '',
        whoCanJoin: group.whoCanJoin || '',
        joinRequirements: (group.joinRequirements || []).join('\n'),
        groupRules: (group.groupRules || []).join('\n'),
        memberBenefits: (group.memberBenefits || []).join('\n'),
        newMemberSteps: (group.newMemberSteps || []).join('\n'),
        communicationChannel: group.communicationChannel || '',
        whatsappLink: (group as any).whatsappLink || '',
        scheduleNotes: group.scheduleNotes || '',
      });
      // debug log to help diagnose client-side issues
      // eslint-disable-next-line no-console
      console.log('Loaded group into edit form', group.id, group.name);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error loading group into form', err);
      // show user-friendly alert so we can capture the message
      alert('Failed to open edit form. Check console for details.');
      // still attempt to open the form with minimal fields
      setEditingGroupId(group.id || null);
      setShowGroupForm(true);
    }
  };

  const saveGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      name: groupForm.name,
      description: groupForm.description,
      courseName: groupForm.courseName,
      courseCode: groupForm.courseCode,
      meetingType: groupForm.meetingType,
      imageUrl: groupForm.imageUrl,
      whoCanJoin: groupForm.whoCanJoin,
      joinRequirements: groupForm.joinRequirements.split('\n').map((value) => value.trim()).filter(Boolean),
      groupRules: groupForm.groupRules.split('\n').map((value) => value.trim()).filter(Boolean),
      memberBenefits: groupForm.memberBenefits.split('\n').map((value) => value.trim()).filter(Boolean),
      newMemberSteps: groupForm.newMemberSteps.split('\n').map((value) => value.trim()).filter(Boolean),
      communicationChannel: groupForm.communicationChannel,
      whatsappLink: groupForm.whatsappLink,
      scheduleNotes: groupForm.scheduleNotes,
    };

    try {
      const response = await apiFetch(editingGroupId ? `/api/groups/${editingGroupId}` : '/api/groups', {
        method: editingGroupId ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message = data?.message || 'Unable to save group.';
        throw new Error(message);
      }

      // If the server returned the created/updated group, apply it to local state
      if (data?.group) {
        const updatedGroup = data.group;
        setGroups((current) => {
          if (editingGroupId) {
            return current.map((g) => (g.id === updatedGroup.id ? updatedGroup : g));
          }
          return [updatedGroup, ...current];
        });
        addNotification({
          id: `group-saved-${Date.now()}`,
          title: editingGroupId ? 'Group updated' : 'Group created',
          message: `${updatedGroup.name} saved successfully.`,
          createdAt: new Date().toISOString(),
        });
      } else {
        // fallback: reload the list
        await loadGroups();
      }

      resetGroupForm();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      alert(error instanceof Error ? error.message : 'Could not save the group. Please try again.');
    }
  };

  const deleteGroup = async (groupId: number) => {
    if (!window.confirm('Delete this study group?')) {
      return;
    }

    try {
      const response = await apiFetch(`/api/groups/${groupId}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) {
        throw new Error('Unable to delete group');
      }

      await loadGroups();
      if (editingGroupId === groupId) {
        resetGroupForm();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      alert('Could not delete the group.');
    }
  };

  const joinGroup = async (group: StudyGroup) => {
    setJoiningGroupIds((current) => Array.from(new Set([...current, group.id])));

    try {
      const response = await apiFetch(`/api/groups/${group.id}/enroll`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        const message = response.status === 403
          ? 'You do not meet this group’s access requirements.'
          : data?.message || 'Join failed. Please try again later.';
        throw new Error(message);
      }

      setJoinedGroupIds((current) => Array.from(new Set([...current, group.id])));
      await loadGroups();
      addNotification({
        id: `join-${group.id}-${Date.now()}`,
        title: 'Joined group',
        message: `You are now enrolled in ${group.name}.`,
        createdAt: new Date().toISOString(),
      });
      setPendingJoinGroup(null);
      setAcceptedRequirements(false);
      setJoinError('');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      setJoinError(error instanceof Error ? error.message : 'Failed to join this group.');
    } finally {
      setJoiningGroupIds((current) => current.filter((groupId) => groupId !== group.id));
    }
  };

  const handleJoinGroup = (group: StudyGroup) => {
    if (group.joinRequirements && group.joinRequirements.length > 0) {
      setPendingJoinGroup(group);
      setAcceptedRequirements(false);
      setJoinError('');
      return;
    }

    joinGroup(group);
  };

  const confirmJoinGroup = async () => {
    if (!pendingJoinGroup) {
      return;
    }

    if (pendingJoinGroup.joinRequirements && pendingJoinGroup.joinRequirements.length > 0 && !acceptedRequirements) {
      setJoinError('Please confirm that you meet the join requirements.');
      return;
    }

    await joinGroup(pendingJoinGroup);
  };

  const closeJoinModal = () => {
    setPendingJoinGroup(null);
    setAcceptedRequirements(false);
    setJoinError('');
  };

  return (
    <section className="groups-page workspace-page">
      <div className="container workspace-stack">
        <section className="workspace-hero workspace-hero-groups">
          <div>
            <p className="workspace-eyebrow">Study Groups</p>
            <h1>Build structured learning circles with saved members, rules, and session plans.</h1>
            {/* hero lead removed per request */}
          </div>
          <div className="hero-stat-grid">
            <article className="hero-stat-card">
              <span className="hero-stat-value">{groups.length}</span>
              <span className="hero-stat-label">Active groups</span>
            </article>
            <article className="hero-stat-card">
              <span className="hero-stat-value">{groups.reduce((sum, group) => sum + group.members, 0)}</span>
              <span className="hero-stat-label">Saved memberships</span>
            </article>
          </div>
        </section>

        <div className="groups-header">
          <div className="page-header">
            <h2>Create or manage groups</h2>
            <p className="page-description">Keep your study structure professional with requirements, rules, and scheduling notes.</p>
          </div>
          <Link to="/groups/new" className="button button-primary">New group</Link>
        </div>

        {showGroupForm ? (
          <div className="management-panel">
            <div className="section-header">
              <h2>{editingGroupId ? 'Edit Group' : 'Create Group'}</h2>
              <button className="text-button" onClick={resetGroupForm}>{editingGroupId ? 'Cancel editing' : 'Close form'}</button>
            </div>

          <form className="management-form" onSubmit={saveGroup}>
            <div className="form-grid form-grid-two">
              <label>
                <span>Group name</span>
                <input value={groupForm.name} onChange={(event) => setGroupForm((current) => ({ ...current, name: event.target.value }))} required />
              </label>
              <label>
                <span>Course code</span>
                <input value={groupForm.courseCode} onChange={(event) => setGroupForm((current) => ({ ...current, courseCode: event.target.value }))} />
              </label>
            </div>

            <label>
              <span>Description</span>
              <textarea value={groupForm.description} onChange={(event) => setGroupForm((current) => ({ ...current, description: event.target.value }))} rows={3} />
            </label>

            <div className="form-grid form-grid-two">
              <label>
                <span>Course name</span>
                <input value={groupForm.courseName} onChange={(event) => setGroupForm((current) => ({ ...current, courseName: event.target.value }))} />
              </label>
              <label>
                <span>Meeting type</span>
                <select value={groupForm.meetingType} onChange={(event) => setGroupForm((current) => ({ ...current, meetingType: event.target.value }))}>
                  <option>Hybrid</option>
                  <option>In-Person</option>
                  <option>Online</option>
                </select>
              </label>
            </div>

            <div className="form-grid form-grid-two">
              <label>
                <span>Image URL</span>
                <input value={groupForm.imageUrl} onChange={(event) => setGroupForm((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="https://example.com/group-artwork.png" />
              </label>
              <label>
                <span>Who can join</span>
                <input value={groupForm.whoCanJoin} onChange={(event) => setGroupForm((current) => ({ ...current, whoCanJoin: event.target.value }))} />
              </label>
            </div>
            {groupForm.imageUrl ? (
              <div className="image-preview-card">
                <strong>Artwork preview</strong>
                <img
                  className="image-preview"
                  src={groupForm.imageUrl}
                  alt="Group artwork preview"
                  onError={(event) => { (event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80'; }}
                />
              </div>
            ) : null}

            <div className="form-grid form-grid-two">
              <label>
                <span>Join requirements</span>
                <textarea value={groupForm.joinRequirements} onChange={(event) => setGroupForm((current) => ({ ...current, joinRequirements: event.target.value }))} rows={3} placeholder="One requirement per line" />
              </label>
              <label>
                <span>Group rules</span>
                <textarea value={groupForm.groupRules} onChange={(event) => setGroupForm((current) => ({ ...current, groupRules: event.target.value }))} rows={3} placeholder="One rule per line" />
              </label>
            </div>

            <div className="form-grid form-grid-two">
              <label>
                <span>Member benefits</span>
                <textarea value={groupForm.memberBenefits} onChange={(event) => setGroupForm((current) => ({ ...current, memberBenefits: event.target.value }))} rows={3} placeholder="One benefit per line" />
              </label>
              <label>
                <span>New member steps</span>
                <textarea value={groupForm.newMemberSteps} onChange={(event) => setGroupForm((current) => ({ ...current, newMemberSteps: event.target.value }))} rows={3} placeholder="One step per line" />
              </label>
            </div>

            <div className="form-grid form-grid-two">
              <label>
                <span>Communication channel</span>
                <input value={groupForm.communicationChannel} onChange={(event) => setGroupForm((current) => ({ ...current, communicationChannel: event.target.value }))} placeholder="e.g. WhatsApp, Zoom chat, Discord" />
              </label>
              <label>
                <span>WhatsApp / chat link</span>
                <input value={groupForm.whatsappLink} onChange={(event) => setGroupForm((current) => ({ ...current, whatsappLink: event.target.value }))} placeholder="https://chat.whatsapp.com/..." />
              </label>
            </div>
            <div className="form-grid form-grid-two">
              <label>
                <span>Schedule notes</span>
                <input value={groupForm.scheduleNotes} onChange={(event) => setGroupForm((current) => ({ ...current, scheduleNotes: event.target.value }))} />
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="button button-primary">{editingGroupId ? 'Update group' : 'Create group'}</button>
              {editingGroupId ? <button type="button" className="button button-secondary" onClick={resetGroupForm}>Reset</button> : null}
            </div>
          </form>
        </div>
        ) : null}

        <section className="workspace-toolbar">
          <div>
            <h2>Member-ready group spaces</h2>
            <p>Open any group to inspect full rosters, requirements, and linked sessions.</p>
          </div>
          <select value={selectedFilter} onChange={(event) => setSelectedFilter(event.target.value)} className="filter-select">
            {filterOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </section>

        {loading ? (
          <div className="workspace-loading-card">
            <p>Loading study groups...</p>
          </div>
        ) : (
          <div className="groups-grid elevated-groups-grid">
            {filteredGroups.map((group) => (
              <article key={group.id} className="group-card polished-group-card" style={{ position: 'relative' }}>
                
                {group.image ? (
                  <img className="group-image" src={group.image} alt={group.name} loading="lazy" />
                ) : (
                  <div className="group-image-placeholder">No image yet</div>
                )}
                <div className="group-header-content">
                  <div className="group-title">
                    <h3>{group.name}</h3>
                    <p className="group-course">{group.courseCode} · {group.course}</p>
                  </div>
                  <span className={`meeting-badge ${group.meetingType.toLowerCase()}`}>
                    {group.meetingType}
                  </span>
                </div>
                <p className="group-description">{group.description}</p>
                <div className="group-meta-snippet">
                  <p><strong>Join:</strong> {group.whoCanJoin || 'Students connected to the course or approved by the moderator.'}</p>
                  <p><strong>Sessions:</strong> {group.sessionCount || 0} planned</p>
                  <p><strong>Members:</strong> {group.members}</p>
                  {group.whatsappLink ? (
                    <p><strong>Chat:</strong> <a href={group.whatsappLink} target="_blank" rel="noreferrer">WhatsApp</a></p>
                  ) : null}
                </div>
                <div className="group-footer">
                  <div className="group-actions">
                    <Link to={`/groups/${group.id}`} className="action-link">View details</Link>
                    <button
                      type="button"
                      className="action-link"
                      onClick={() => loadGroupIntoForm(group)}
                      onMouseDown={() => loadGroupIntoForm(group)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { loadGroupIntoForm(group); } }}
                      style={{ pointerEvents: 'auto' }}
                    >
                      Edit
                    </button>
                    <button type="button" className="action-link action-danger" onClick={() => deleteGroup(group.id)}>Delete</button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleJoinGroup(group)}
                    className="button button-primary button-sm"
                    disabled={joiningGroupIds.includes(group.id) || joinedGroupIds.includes(group.id)}
                  >
                    {joinedGroupIds.includes(group.id)
                      ? 'Joined'
                      : joiningGroupIds.includes(group.id)
                        ? 'Joining…'
                        : group.joinRequirements && group.joinRequirements.length > 0
                          ? 'Review requirements'
                          : 'Join group'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(pendingJoinGroup)}
        title="Confirm group join"
        secondaryActionLabel="Cancel"
        onClose={closeJoinModal}
        onSecondaryAction={closeJoinModal}
      >
        <div className="modal-note">
          Before joining, please confirm you meet the listed requirements for this study group.
        </div>
        {pendingJoinGroup?.joinRequirements && pendingJoinGroup.joinRequirements.length > 0 ? (
          <ul className="detail-list compact-list">
            {pendingJoinGroup.joinRequirements.map((requirement) => (
              <li key={requirement}>{requirement}</li>
            ))}
          </ul>
        ) : (
          <p>No special requirements are configured for this group.</p>
        )}
        <label className="checkbox-control">
          <input
            type="checkbox"
            checked={acceptedRequirements}
            onChange={(event) => { setAcceptedRequirements(event.target.checked); setJoinError(''); }}
          />
          I confirm I meet the join requirements.
        </label>
        {joinError ? <p className="form-error">{joinError}</p> : null}
        <button type="button" className="button button-primary" onClick={confirmJoinGroup}>
          Confirm and join
        </button>
      </Modal>
    </section>
  );
}

export default StudyGroups;
