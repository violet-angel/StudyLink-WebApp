import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Modal from '../components/Modal';
import { apiFetch } from '../lib/apiClient';
import { addNotification } from '../lib/notifications';

function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingJoinGroup, setPendingJoinGroup] = useState<any | null>(null);
  const [acceptedRequirements, setAcceptedRequirements] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [joinedGroup, setJoinedGroup] = useState(false);
  const [requestPending, setRequestPending] = useState(false);
  const [membershipRequests, setMembershipRequests] = useState<any[]>([]);
  const [canReviewRequests, setCanReviewRequests] = useState(false);
  const [groupResources, setGroupResources] = useState<any[]>([]);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [uploadingResource, setUploadingResource] = useState(false);
  const [resourceStatus, setResourceStatus] = useState('');
  const [showResourceUpload, setShowResourceUpload] = useState(false);
  const [resourceInputKey, setResourceInputKey] = useState(0);

  const [resourcePreview, setResourcePreview] = useState<{
    url: string;
    title: string;
    type: string;
  } | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    apiFetch(`/api/groups/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Not found');
        }
        return response.json();
      })
      .then((data) => setGroup(data.group))
      .catch(() => setGroup(null))
      .finally(() => setLoading(false));
  }, [id]);


const loadMembershipRequests = async () => {
  if (!id) return;

  try {
    const response = await apiFetch(`/api/groups/${id}/requests`);

    if (!response.ok) {
      setCanReviewRequests(false);
      return;
    }

    const data = await response.json();
    setCanReviewRequests(true);
    setMembershipRequests(data.requests || []);
  } catch (error) {
    console.error('Failed to load membership requests:', error);
  }
};

useEffect(() => {
  loadMembershipRequests();
}, [id]);

const reviewMembershipRequest = async (
  requestId: number,
  status: 'approved' | 'rejected'
) => {
  try {
    const response = await apiFetch(
      `/api/groups/${id}/requests/${requestId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'Unable to review request.');
    }

    await loadMembershipRequests();

    const groupResponse = await apiFetch(`/api/groups/${id}`);
    if (groupResponse.ok) {
      const groupData = await groupResponse.json();
      setGroup(groupData.group);
    }
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : 'Unable to review membership request.'
    );
  }
};

useEffect(() => {
  if (!id) return;

  let active = true;

  setRequestPending(false);

  apiFetch(`/api/groups/${id}/my-request`)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('Unable to load membership request.');
      }
      return response.json();
    })
    .then((data) => {
      if (!active) return;

      setRequestPending(data.status === 'pending');

      if (data.status === 'approved') {
        setJoinedGroup(true);
      }
    })
    .catch((error) => {
      console.error('Membership status check failed:', error);
    });

  return () => {
    active = false;
  };
}, [id]);


  const joinGroup = async (targetGroup: any) => {
    setJoiningGroup(true);

    try {
      const requiresApproval = Boolean(targetGroup.requiresApproval);

      const response = await apiFetch(
        requiresApproval
          ? `/api/groups/${targetGroup.id}/request-join`
          : `/api/groups/${targetGroup.id}/enroll`,
        { method: 'POST' }
      );
      const data = await response.json();
      if (!response.ok) {
        const message = response.status === 403
          ? 'You do not meet the access requirements for this group.'
          : data?.message || 'Unable to join the group right now.';
        throw new Error(message);
      }

      if (requiresApproval) {
        setRequestPending(true);
        setPendingJoinGroup(null);
        setAcceptedRequirements(false);
        setJoinError('');
        return;
      }

      const refreshed = await apiFetch(`/api/groups/${targetGroup.id}`);
      const refreshedData = await refreshed.json();
      setGroup(refreshedData.group);
      setJoinedGroup(true);
      addNotification({
        id: `join-detail-${targetGroup.id}-${Date.now()}`,
        title: 'Group joined',
        message: `You successfully joined ${targetGroup.name}.`,
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
      setJoiningGroup(false);
    }
  };


const loadGroupResources = async () => {
  if (!id) return;

  try {
    const response = await apiFetch('/api/resources');

    if (!response.ok) {
      throw new Error('Unable to load group resources.');
    }

    const data = await response.json();

    setGroupResources(
      (data.resources || []).filter(
        (resource: any) =>
          String(resource.groupId) === String(id)
      )
    );
  } catch (error) {
    console.error(error);
    setResourceStatus('Unable to load group resources.');
  }
};

useEffect(() => {
  setGroupResources([]);

  if (group?.isMember || group?.isOwner || joinedGroup) {
    loadGroupResources();
  }
}, [id, group, joinedGroup]);

useEffect(() => {
  return () => {
    if (resourcePreview?.url) {
      URL.revokeObjectURL(resourcePreview.url);
    }
  };
}, [resourcePreview]);

const handleGroupResourceUpload = async () => {
  if (uploadingResource) return;

  if (!resourceTitle.trim() || !resourceFile) {
    setResourceStatus('Enter a title and select a file.');
    return;
  }

  if (resourceFile.size > 3 * 1024 * 1024) {
    setResourceStatus('Maximum file size is 3 MB.');
    return;
  }

  setUploadingResource(true);
  setResourceStatus('Uploading resource...');

  try {
    const coursesResponse = await apiFetch('/api/courses');

    if (!coursesResponse.ok) {
      throw new Error('Unable to load courses.');
    }

    const coursesData = await coursesResponse.json();

    const course = (coursesData.courses || []).find(
      (item: any) =>
        String(item.code || '').trim().toUpperCase() ===
        String(group.courseCode || '').trim().toUpperCase()
    );

    if (!course) {
      throw new Error('The group course was not found.');
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;

      reader.readAsDataURL(resourceFile);
    });

    const uploadResponse = await apiFetch('/api/uploads', {
      method: 'POST',
      body: JSON.stringify({
        filename: resourceFile.name,
        data: dataUrl.split(',')[1]
      })
    });

    const uploaded = await uploadResponse.json();

    if (!uploadResponse.ok) {
      throw new Error(uploaded.message || 'File upload failed.');
    }

    const saveResponse = await apiFetch('/api/resources', {
      method: 'POST',
      body: JSON.stringify({
        title: resourceTitle.trim(),
        resourceType: resourceFile.name.toLowerCase().endsWith('.pdf')
          ? 'PDF'
          : 'Resource',
        url: uploaded.url,
        description: 'Shared in ' + group.name,
        usageNotes: 'Shared study material.',
        audience: 'Study group members',
        courseId: Number(course.id),
        groupId: Number(id)
      })
    });

    const saved = await saveResponse.json();

    if (!saveResponse.ok) {
      throw new Error(saved.message || 'Unable to save resource.');
    }

    setResourceTitle('');
    setResourceFile(null);
    setResourceInputKey(current => current + 1);
    setShowResourceUpload(false);

    setResourceStatus('Resource uploaded successfully.');

    await loadGroupResources();

  } catch (error) {
    setResourceStatus(
      error instanceof Error
        ? error.message
        : 'Resource upload failed.'
    );
  } finally {
    setUploadingResource(false);
  }
};

const handleOpenGroupResource = async (resource: any) => {
  try {
    if (!resource.url?.includes('.private.blob.vercel-storage.com/')) {
      const url = new URL(resource.url);

      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid resource URL.');
      }

      window.open(url.href, '_blank', 'noopener,noreferrer');
      return;
    }

    const response = await apiFetch(
      `/api/resources/${resource.id}/download?mode=preview`
    );

    if (!response.ok) {
      throw new Error('Unable to open resource.');
    }

    const file = await response.blob();

    const supportedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'text/plain'
    ];

    if (!supportedTypes.includes(file.type)) {
      throw new Error('Preview unavailable. Please use Download.');
    }

    setResourcePreview({
      url: URL.createObjectURL(file),
      title: resource.title,
      type: file.type
    });

  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : 'Unable to open resource.'
    );
  }
};

const handleDownloadGroupResource = async (resource: any) => {
  try {
    const response = await apiFetch(
      `/api/resources/${resource.id}/download`
    );

    if (!response.ok) {
      throw new Error('Unable to download resource.');
    }

    const file = await response.blob();
    const url = URL.createObjectURL(file);

    const link = document.createElement('a');

    link.href = url;
    link.download =
      new URL(resource.url).pathname.split('/').pop() ||
      resource.title;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : 'Download failed.'
    );
  }
};

const handleDeleteGroupResource = async (resource: any) => {
  if (!resource.canDelete) return;

  if (!window.confirm(`Permanently delete "${resource.title}"?`)) {
    return;
  }

  try {
    const response = await apiFetch(
      `/api/resources/${resource.id}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Unable to delete resource.');
    }

    setGroupResources(current =>
      current.filter(
        item => String(item.id) !== String(resource.id)
      )
    );

    setResourceStatus('Resource deleted successfully.');

  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : 'Unable to delete resource.'
    );
  }
};

  const handleJoin = () => {
    if (!group) {
      return;
    }

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

  if (loading) {
    return (
      <section className="workspace-page">
        <div className="container workspace-loading-card">
          <p>Loading group...</p>
        </div>
      </section>
    );
  }

  if (!group) {
    return (
      <section className="workspace-page">
        <div className="container workspace-loading-card">
          <p>Group not found.</p>
        </div>
      </section>
    );
  }

  const contactLink = group.whatsappLink || (group.communicationChannel?.toLowerCase().includes('whatsapp') ? group.communicationChannel : undefined);

  return (
    <section className="workspace-page">
      <div className="container workspace-stack">
        <section className="detail-hero-card">
          <img src={group.image || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80'} alt={group.name} className="detail-hero-image" />
          <div className="detail-hero-copy">
            <p className="workspace-eyebrow">{group.courseCode || 'Study Group'}</p>
            <h1>{group.name}</h1>
            <p className="workspace-lead">{group.description}</p>

            <div className="detail-chip-row">
              <span className="detail-chip">{group.meetingType || 'Hybrid'}</span>
              <span className="detail-chip">{group.members || group.membersList?.length || 0} members</span>
              <span className="detail-chip">{group.sessions?.length || 0} linked sessions</span>
            </div>

            <div className="detail-action-row">
              
            
            <button
              className="button button-primary"
              type="button"
              disabled={
                joiningGroup ||
                Boolean(group.isOwner) ||
                Boolean(group.isMember) ||
                requestPending ||
                group.requestStatus === 'pending'
              }
              onClick={handleJoin}
            >
              {group.isOwner
                ? 'Group Admin'
                : group.isMember || joinedGroup
                  ? 'Joined'
                  : requestPending || group.requestStatus === 'pending'
                    ? 'Request Pending'
                    : joiningGroup
                      ? 'Processing...'
                      : group.requiresApproval
                        ? 'Request to Join'
                        : group.joinRequirements?.length > 0
                          ? 'Review requirements'
                          : 'Join this group'}
            </button>


              {contactLink ? (
                <a href={contactLink} target="_blank" rel="noreferrer" className="button button-secondary">
                  Open WhatsApp chat
                </a>
              ) : null}
              {group.courseCode ? <Link to="/courses" className="button button-secondary">Open courses</Link> : null}
              {(group.isMember || group.isOwner || joinedGroup) && (
              <button
                type="button"
                className="button button-primary"
                onClick={() => setShowResourceUpload(true)}
              >
                Upload Resource
              </button>
            )}
            </div>
          </div>
        </section>

        <div className="detail-layout">
          <section className="detail-panel">
            <h2>How this group runs</h2>
            <div className="detail-copy-stack">
              <p><strong>Who can join:</strong> {group.whoCanJoin || 'Students enrolled in the related course or approved by a moderator.'}</p>
              {contactLink ? (
                <p>
                  <strong>Communication:</strong> <a href={contactLink} target="_blank" rel="noreferrer">WhatsApp group</a>
                </p>
              ) : (
                <p><strong>Communication:</strong> {group.communicationChannel || 'Dashboard announcements and a shared study chat.'}</p>
              )}
              <p><strong>Schedule notes:</strong> {group.scheduleNotes || 'Specific meeting times and participation expectations are posted by the group owner.'}</p>
            </div>
          </section>

          <section className="detail-panel">
            <h2>New member checklist</h2>
            <ul className="detail-list">
              {(group.newMemberSteps && group.newMemberSteps.length > 0
                ? group.newMemberSteps
                : ['Introduce yourself to the group.', 'Review the shared study plan.', 'Join the next live session.'])
                .map((item: string) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        </div>

        <div className="detail-layout">
          <section className="detail-panel">
            <h2>Requirements and rules</h2>
            <div className="detail-card-grid">
              <article className="detail-summary-card">
                <strong>Join requirements</strong>
                <ul className="detail-list compact-list">
                  {(group.joinRequirements && group.joinRequirements.length > 0 ? group.joinRequirements : ['Read the welcome notes and attend the intro session.'])
                    .map((item: string) => <li key={item}>{item}</li>)}
                </ul>
              </article>
              <article className="detail-summary-card">
                <strong>Group rules</strong>
                <ul className="detail-list compact-list">
                  {(group.groupRules && group.groupRules.length > 0 ? group.groupRules : ['Stay respectful and keep discussion academic.'])
                    .map((item: string) => <li key={item}>{item}</li>)}
                </ul>
              </article>
              <article className="detail-summary-card">
                <strong>Member benefits</strong>
                <ul className="detail-list compact-list">
                  {(group.memberBenefits && group.memberBenefits.length > 0 ? group.memberBenefits : ['Shared notes, peer support, and structured academic help.'])
                    .map((item: string) => <li key={item}>{item}</li>)}
                </ul>
              </article>
            </div>
          </section>

          <section className="detail-panel">
            <div className="section-header">
              <h2>Current members</h2>
              <span className="panel-pill">{group.membersList?.length || 0} saved</span>
            </div>
            {group.membersList && group.membersList.length > 0 ? (
              <div className="member-list">
                {group.membersList.map((member: any) => (
                  <article key={member.email} className="member-list-card">
                    <div>
                      <strong>{member.name}</strong>
                      <p>{member.email}</p>
                    </div>
                    <div className="member-list-meta">
                      <span>{new Date(member.enrolledAt).toLocaleString()}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p>No members yet. Be the first to join.</p>
            )}
          </section>
        </div>

        <section className="detail-panel">
          <div className="section-header">
            <h2>Related sessions</h2>
            <span className="panel-pill">{group.sessions?.length || 0} sessions</span>
          </div>

{canReviewRequests && (
  <section className="detail-panel">
    <h2>Membership Requests</h2>

    {membershipRequests.filter(
      (request) => request.status === 'pending'
    ).length === 0 ? (
      <p>No pending membership requests.</p>
    ) : (
      <div className="member-list">
        {membershipRequests
          .filter((request) => request.status === 'pending')
          .map((request) => (
            <article
              key={request.id}
              className="member-list-card"
            >
              <div>
                <strong>{request.studentName}</strong>
                <p>Request pending approval</p>
              </div>

              <div className="detail-action-row">
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() =>
                    reviewMembershipRequest(
                      request.id,
                      'approved'
                    )
                  }
                >
                  Approve
                </button>

                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() =>
                    reviewMembershipRequest(
                      request.id,
                      'rejected'
                    )
                  }
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
      </div>
    )}
  </section>
)}

          <div className="detail-card-grid">
            {(group.sessions || []).length > 0 ? (
              group.sessions.map((session: any) => (
                <article key={session.id} className="detail-summary-card">
                  <strong>{session.title}</strong>
                  <p>{session.startsAt ? new Date(session.startsAt).toLocaleString() : session.time || 'Time to be confirmed'}</p>
                  <span>{session.enrolledCount || 0} enrolled</span>
                </article>
              ))
            ) : (
              <p>No related sessions found.</p>
            )}
          </div>
        </section>
      </div>

      
{(group.isMember || group.isOwner || joinedGroup) && (
  <div
    className="container"
    style={{ marginTop: 20, marginBottom: 20 }}
  >
    <section className="detail-panel">
      <div className="section-header">
        <h2>Shared Resources</h2>

        <span className="panel-pill">
          {groupResources.length} resources
        </span>

        <button
          type="button"
          className="button button-primary"
          onClick={() => setShowResourceUpload(true)}
        >
          Upload Resource
        </button>
      </div>

      {resourceStatus && (
        <p className="resource-upload-status">
          {resourceStatus}
        </p>
      )}

      {groupResources.length === 0 ? (
        <p>No resources have been shared yet.</p>
      ) : (
        <div className="detail-card-grid">
          {groupResources.map(resource => (
            <article
              key={resource.id}
              className="detail-summary-card"
            >
              <span className="detail-chip">
                {resource.type || 'Resource'}
              </span>

              <h3>{resource.title}</h3>

              <p>{resource.description}</p>

              <div className="detail-action-row">
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => handleOpenGroupResource(resource)}
                >
                  Open
                </button>

                {resource.url?.includes(
                  '.private.blob.vercel-storage.com/'
                ) && (
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() =>
                      handleDownloadGroupResource(resource)
                    }
                  >
                    Download
                  </button>
                )}

                {resource.canDelete && (
                  <button
                    type="button"
                    className="button button-secondary"
                    style={{ color: '#dc2626' }}
                    onClick={() =>
                      handleDeleteGroupResource(resource)
                    }
                  >
                    Delete
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  </div>
)}
   
      
<Modal
  open={showResourceUpload}
  title="Upload Group Resource"
  secondaryActionLabel="Cancel"
  onClose={() => {
    if (!uploadingResource) setShowResourceUpload(false);
  }}
  onSecondaryAction={() => {
    if (!uploadingResource) setShowResourceUpload(false);
  }}
>
  <p>Share academic materials with {group.name}.</p>

  <label>Resource title</label>

  <input
    type="text"
    className="search-input"
    placeholder="Enter resource title"
    value={resourceTitle}
    onChange={event => setResourceTitle(event.target.value)}
    style={{ width: '100%', marginBottom: 12 }}
  />

  <label>Select a file</label>

  <input
    key={resourceInputKey}
    type="file"
    accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.txt,.jpg,.jpeg,.png"
    onChange={event =>
      setResourceFile(event.target.files?.[0] || null)
    }
    style={{ width: '100%', marginBottom: 12 }}
  />

  {resourceStatus && (
    <p className="resource-upload-status">
      {resourceStatus}
    </p>
  )}

  <button
    type="button"
    className="button button-primary"
    disabled={uploadingResource}
    onClick={handleGroupResourceUpload}
  >
    {uploadingResource ? 'Uploading...' : 'Upload Resource'}
  </button>
</Modal>
      
{resourcePreview && (
  <div
    role="dialog"
    aria-modal="true"
    aria-label="Resource preview"
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(0,0,0,0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }}
  >
    <div
      style={{
        background: '#fff',
        width: '95%',
        height: '90vh',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          padding: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#111827'
        }}
      >
        <h3>{resourcePreview.title}</h3>

        <button
          type="button"
          className="button button-secondary"
          onClick={() => setResourcePreview(null)}
        >
          Close
        </button>
      </div>

      {resourcePreview.type.startsWith('image/') ? (
        <img
          src={resourcePreview.url}
          alt={resourcePreview.title}
          style={{
            maxWidth: '100%',
            flex: 1,
            minHeight: 0,
            objectFit: 'contain'
          }}
        />
      ) : (
        <iframe
          src={resourcePreview.url}
          title={resourcePreview.title}
          style={{
            width: '100%',
            flex: 1,
            border: 'none'
          }}
        />
      )}
    </div>
  </div>
)}

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
            {pendingJoinGroup.joinRequirements.map((requirement: string) => (
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

export default GroupDetail;
