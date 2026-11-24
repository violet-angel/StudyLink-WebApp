import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../lib/apiClient';
import * as mammoth from 'mammoth';
import DOMPurify from 'dompurify';
import { buildCourseContent, buildStudyLinkAiResponse } from '../lib/studylinkContent';
import { addNotification } from '../lib/notifications';
import '../styles/CourseHubDesign.css';

const hubTabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'shared', label: 'Shared Resources' },
  { key: 'notes', label: 'Notes' },
  { key: 'pdfs', label: 'PDFs' },
  { key: 'podcasts', label: 'Podcasts' },
  { key: 'videos', label: 'Videos' },
  { key: 'quizzes', label: 'MCQs' },
  { key: 'papers', label: 'Past papers' },
  { key: 'groups', label: 'Study groups' },
  { key: 'sessions', label: 'Live sessions' },
  { key: 'students', label: 'Students enrolled' },
  { key: 'ask', label: 'Ask StudyLink AI' },
];

function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [question, setQuestion] = useState('Give me notes and revision guidance for the hardest topic in this course.');
  const [submittedQuestion, setSubmittedQuestion] = useState(question);
  const [sharedResources, setSharedResources] = useState<any[]>([]);
  const [sharedResourceError, setSharedResourceError] = useState('');

  const [resourcePreview, setResourcePreview] = useState<{
    url: string;
    title: string;
    type: string;
    html?: string;
  } | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && hubTabs.some((tab) => tab.key === hash)) {
      setSelectedTab(hash);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;

    apiFetch(`/api/courses/${id}`)
      .then((response) => response.ok ? response.json() : { course: null })
      .then((data) => setCourse(buildCourseContent(data.course || { id })))
      .catch(() => setCourse(buildCourseContent({ id })))
      .finally(() => setLoading(false));
  }, [id]);


useEffect(() => {
  if (!course?.code) return;

  let active = true;

  setSharedResources([]);
  setSharedResourceError('');

  const loadSharedResources = async () => {
    try {
      const [coursesResponse, resourcesResponse] =
        await Promise.all([
          apiFetch('/api/courses'),
          apiFetch('/api/resources')
        ]);

      if (!coursesResponse.ok || !resourcesResponse.ok) {
        throw new Error('Unable to load shared resources.');
      }

      const coursesData = await coursesResponse.json();
      const resourcesData = await resourcesResponse.json();

      const matchedCourse = (coursesData.courses || []).find(
        (item: any) =>
          String(item.id) === String(course.id)
      ) || (coursesData.courses || []).find(
        (item: any) =>
          String(item.code).trim().toUpperCase() ===
          String(course.code).trim().toUpperCase()
      );

      if (!active) return;

      if (!matchedCourse) {
        setSharedResourceError(
          'This course is not registered in the database.'
        );
        return;
      }

      const items = (resourcesData.resources || []).filter(
        (resource: any) =>
          resource.groupId == null &&
          String(resource.courseId) === String(matchedCourse.id)
      );

      setSharedResources(items);

    } catch (error) {
      if (active) {
        setSharedResourceError(
          error instanceof Error
            ? error.message
            : 'Unable to load shared resources.'
        );
      }
    }
  };

  loadSharedResources();

  return () => {
    active = false;
  };
}, [course?.id, course?.code, course?.isEnrolled]);

useEffect(() => {
  return () => {
    if (resourcePreview?.url) {
      URL.revokeObjectURL(resourcePreview.url);
    }
  };
}, [resourcePreview]);


  const resourcesByType = useMemo(() => {
    const resources = course?.resources || [];
    return {
      notes: resources.filter((resource: any) => resource.type === 'Note'),
      pdfs: resources.filter((resource: any) => resource.type === 'PDF' || resource.type === 'Guide'),
      podcasts: resources.filter((resource: any) => resource.type === 'Podcast'),
      videos: resources.filter((resource: any) => resource.type === 'Video'),
      quizzes: resources.filter((resource: any) => resource.type === 'MCQ'),
      papers: resources.filter((resource: any) => resource.type === 'Past Paper'),
    };
  }, [course]);

  const aiResponse = useMemo(
    () => buildStudyLinkAiResponse(submittedQuestion, course?.code),
    [course?.code, submittedQuestion],
  );

  const [curatedResults, setCuratedResults] = useState<any[]>([]);
  const [fetchingCurated, setFetchingCurated] = useState(false);
  const [audienceFilter, setAudienceFilter] = useState('all');

  useEffect(() => {
    if (!course?.code) return;
    apiFetch(`/api/ai/links?courseCode=${encodeURIComponent(course.code)}`)
      .then((resp) => (resp.ok ? resp.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.links)) {
          setCuratedResults((prev) => [...data.links, ...prev]);
        }
      })
      .catch(() => {
        // ignore
      });
  }, [course?.code]);

  async function fetchCuratedResults(topic?: string) {
    if (!course) return;
    setFetchingCurated(true);
    try {
      const response = await apiFetch('/api/ai/fetch', { method: 'POST', body: JSON.stringify({ courseCode: course.code, topic: topic || aiResponse.headline }) });
      if (response.ok) {
        const data = await response.json();
        setCuratedResults(data.results || []);
        addNotification({ id: `fetch-${course.code}-${Date.now()}`, title: 'Curated results', message: 'Curated results fetched.', createdAt: new Date().toISOString() });
      } else {
        addNotification({ id: `fetch-fail-${Date.now()}`, title: 'Fetch failed', message: 'Could not fetch curated results.', createdAt: new Date().toISOString() });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      addNotification({ id: `fetch-ex-${Date.now()}`, title: 'Fetch error', message: 'Error fetching curated results.', createdAt: new Date().toISOString() });
    } finally {
      setFetchingCurated(false);
    }
  }

  const handleEnroll = async () => {
  if (!course || course.isEnrolled) return;

  try {
    const response = await apiFetch(
      `/api/courses/${course.id}/enroll`,
      { method: 'POST' }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message || 'Unable to enroll in this course.'
      );
    }

    setCourse(buildCourseContent(data.course));

  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : 'Course enrollment failed.'
    );
  }
};


const isPrivateCourseFile = (resource: any) =>
  Boolean(
    resource.url?.includes(
      '.private.blob.vercel-storage.com/'
    )
  );


const handleOpenSharedResource = async (resource: any) => {
  try {
    if (!isPrivateCourseFile(resource)) {
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

    const filename = decodeURIComponent(
      new URL(resource.url).pathname
    ).toLowerCase();

    const isDocx =
      filename.endsWith('.docx') ||
      file.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (isDocx) {
      const arrayBuffer = await file.arrayBuffer();

      const result = await mammoth.convertToHtml({
        arrayBuffer
      });

      const safeHtml = DOMPurify.sanitize(result.value);

      setResourcePreview({
        url: '',
        title: resource.title,
        type: 'text/html',
        html: safeHtml
      });

      return;
    }

    const supportedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'text/plain'
    ];

    if (!supportedTypes.includes(file.type)) {
      throw new Error(
        'Preview unavailable for this format. Please use Download.'
      );
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


const handleDownloadSharedResource = async (resource: any) => {
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

const handleDeleteSharedResource = async (resource: any) => {
  if (!resource.canDelete) return;

  if (!window.confirm(`Delete "${resource.title}" permanently?`)) {
    return;
  }

  try {
    const response = await apiFetch(
      `/api/resources/${resource.id}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      throw new Error('Unable to delete resource.');
    }

    setSharedResources(current =>
      current.filter(
        item => String(item.id) !== String(resource.id)
      )
    );

  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : 'Unable to delete resource.'
    );
  }
};

  
const renderResourceGrid = (items: any[], buttonLabel: string) => (
  <div className="detail-card-grid">
    {items.map((item) => {
      const itemUrl = item.url || item.fallbackUrl;

      const downloadableUrl =
        typeof item.fallbackUrl === 'string' &&
        item.fallbackUrl.startsWith('data:')
          ? item.fallbackUrl
          : typeof item.url === 'string' &&
            item.url.startsWith('data:')
            ? item.url
            : null;

      const handleLocalDownload = async () => {
        if (!downloadableUrl) return;

        try {
          const response = await fetch(downloadableUrl);
          const file = await response.blob();

          const extensionMap: Record<string, string> = {
            'text/html': 'html',
            'text/plain': 'txt',
            'application/pdf': 'pdf',
            'image/png': 'png',
            'image/jpeg': 'jpg'
          };

          const mimeType = file.type.split(';')[0];

          const extension =
            extensionMap[mimeType] || 'bin';

          const filename = String(item.title || 'resource')
            .replace(/[^a-zA-Z0-9 _-]/g, '_');

          const objectUrl = URL.createObjectURL(file);

          const link = document.createElement('a');

          link.href = objectUrl;
          link.download = `${filename}.${extension}`;

          document.body.appendChild(link);
          link.click();
          link.remove();

          setTimeout(
            () => URL.revokeObjectURL(objectUrl),
            1000
          );

        } catch (error) {
          console.error(error);
          alert('Unable to download resource.');
        }
      };

      return (
        <article
          key={item.id}
          className="detail-summary-card"
        >
          <strong>{item.title}</strong>
          <p>{item.description}</p>
          <span>{item.audience}</span>

          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              marginTop: '0.75rem',
              flexWrap: 'wrap'
            }}
          >
            {itemUrl && (
              <a
                href={itemUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-secondary button-sm"
              >
                {buttonLabel}
              </a>
            )}

            {item.fallbackUrl && item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-tertiary button-sm"
              >
                Open external
              </a>
            )}

            {downloadableUrl && (
              <button
                type="button"
                className="button button-primary button-sm"
                onClick={handleLocalDownload}
              >
                Download in App
              </button>
            )}
          </div>
        </article>
      );
    })}
  </div>
);


  function filterByAudience(items: any[]) {
    if (!audienceFilter || audienceFilter === 'all') return items;
    return items.filter((it) => String(it.audience || '').toLowerCase().includes(String(audienceFilter).toLowerCase()));
  }

  const renderEmptyCategory = (label: string) => (
    <div className="empty-state">
      <p className="empty-text">No {label.toLowerCase()} are available for this course right now.</p>
      <p className="empty-help">Try the AI guide or the Learning Hub to find related notes, videos, or practice resources.</p>
      <div className="detail-action-row" style={{ gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
        <Link to={`/ask-ai?course=${encodeURIComponent(course?.code || '')}`} className="button button-primary button-sm">
          Ask StudyLink AI
        </Link>
        <Link to="/learning?view=library" className="button button-secondary button-sm">
          Open Learning Hub
        </Link>
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (!course) {
      return <p>Course data is unavailable.</p>;
    }

    switch (selectedTab) {
      case 'overview':
        return (
          <div className="hub-section-grid">
            <div className="detail-panel">
              <h3>Course support summary</h3>
              <p>{course.description}</p>
              <ul className="detail-list compact-list">
                <li>{course.school}</li>
                <li>{course.program}</li>
                <li>{course.level} · {course.deliveryMode}</li>
                <li>{course.resources.length} learning resources inside this hub</li>
                <li>{course.supportFocus}</li>
              </ul>
            </div>
            <div className="detail-panel">
              <h3>Why this hub matters</h3>
              <ul className="detail-list compact-list">
                {course.objectives.map((objective: string) => (
                  <li key={objective}>{objective}</li>
                ))}
              </ul>
            </div>
          </div>
        );
        
      case 'shared':
        return (
          <div className="detail-panel">
            <div className="section-header">
              <h3>Shared Course Resources</h3>

              <span className="panel-pill">
                {sharedResources.length} resources
              </span>
            </div>

            <p>
              Academic materials shared by students enrolled
              in this course.
            </p>

            <Link
              to="/learning?view=resources"
              className="button button-primary"
            >
              Share Resource
            </Link>

            {sharedResourceError && (
              <p className="form-error">{sharedResourceError}</p>
            )}

            {sharedResources.length === 0 ? (
              <p>No resources have been shared yet.</p>
            ) : (
              <div
                className="detail-card-grid"
                style={{ marginTop: 16 }}
              >
                {sharedResources.map(resource => (
                  <article
                    key={resource.id}
                    className="detail-summary-card"
                  >
                    <span className="detail-chip">
                      {resource.type}
                    </span>

                    <h3>{resource.title}</h3>
                    <p>{resource.description}</p>

                    {resource.createdAt && (
                      <p>
                        Shared on{' '}
                        {new Date(resource.createdAt)
                          .toLocaleDateString()}
                      </p>
                    )}

                    <div className="detail-action-row">
                      <button
                        type="button"
                        className="button button-primary"
                        onClick={() =>
                          handleOpenSharedResource(resource)
                        }
                      >
                        Open
                      </button>

                      {isPrivateCourseFile(resource) && (
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() =>
                            handleDownloadSharedResource(resource)
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
                            handleDeleteSharedResource(resource)
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
          </div>
        );

      case 'notes': {
        const items = filterByAudience(resourcesByType.notes);
        return (
          <div className="detail-panel">
            <div className="section-header">
              <h3>Course notes</h3>
              <span className="panel-pill">{resourcesByType.notes.length}</span>
            </div>
            {items.length ? renderResourceGrid(items, 'Open note') : renderEmptyCategory('Notes')}
          </div>
        );
      }
      case 'pdfs': {
        const items = filterByAudience(resourcesByType.pdfs);
        return (
          <div className="detail-panel">
            <div className="section-header">
              <h3>PDFs and guides</h3>
              <span className="panel-pill">{resourcesByType.pdfs.length}</span>
            </div>
            {items.length ? renderResourceGrid(items, 'Open PDF') : renderEmptyCategory('PDFs')}
          </div>
        );
      }
      case 'podcasts': {
        const items = filterByAudience(resourcesByType.podcasts);
        return (
          <div className="detail-panel">
            <div className="section-header">
              <h3>Learning podcasts</h3>
              <span className="panel-pill">{resourcesByType.podcasts.length}</span>
            </div>
            {items.length ? renderResourceGrid(items, 'Open podcast guide') : renderEmptyCategory('Podcasts')}
          </div>
        );
      }
      case 'videos': {
        const items = filterByAudience(resourcesByType.videos);
        return (
          <div className="detail-panel">
            <div className="section-header">
              <h3>Video companions</h3>
              <span className="panel-pill">{resourcesByType.videos.length}</span>
            </div>
            {items.length ? renderResourceGrid(items, 'Open video guide') : renderEmptyCategory('Videos')}
          </div>
        );
      }
      case 'quizzes': {
        const items = filterByAudience(resourcesByType.quizzes);
        return (
          <div className="detail-panel">
            <div className="section-header">
              <h3>MCQs and quiz drills</h3>
              <span className="panel-pill">{resourcesByType.quizzes.length}</span>
            </div>
            {items.length ? renderResourceGrid(items, 'Open MCQ drill') : renderEmptyCategory('MCQs')}
          </div>
        );
      }
      case 'papers': {
        const items = filterByAudience(resourcesByType.papers);
        return (
          <div className="detail-panel">
            <div className="section-header">
              <h3>Past papers</h3>
              <span className="panel-pill">{resourcesByType.papers.length}</span>
            </div>
            {items.length ? renderResourceGrid(items, 'Open paper') : renderEmptyCategory('Past papers')}
          </div>
        );
      }
      case 'groups':
        return (
          <div className="detail-panel">
            <h3>Study groups</h3>
            {course.groups.length === 0 ? (
              <p>Use the course resources first, then create or join a study group to discuss difficult topics together.</p>
            ) : (
              <div className="detail-card-grid">
                {course.groups.map((group: any) => (
                  <Link key={group.id} to={`/groups/${group.id}`} className="detail-summary-card">
                    <strong>{group.name}</strong>
                    <p>{group.description}</p>
                    <span>{group.members} members · {group.sessionCount} sessions</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      case 'sessions':
        return (
          <div className="detail-panel">
            <h3>Live sessions</h3>
            {course.sessions.length === 0 ? (
              <p>No live sessions are scheduled yet. Use StudyLink AI and the course resources while your study group plans the next review.</p>
            ) : (
              <div className="detail-card-grid">
                {course.sessions.map((session: any) => (
                  <article key={session.id} className="detail-summary-card">
                    <strong>{session.title}</strong>
                    <p>{session.group || 'Study session'}</p>
                    <span>{session.startsAt ? new Date(session.startsAt).toLocaleString() : 'Time pending'}</span>
                  </article>
                ))}
              </div>
            )}
          </div>
        );
      case 'students':
        return (
          <div className="detail-panel">
            <h3>Students enrolled</h3>
            {course.students.length === 0 ? (
              <p>This course hub is ready for learners. Enroll and start the peer-support cycle.</p>
            ) : (
              <div className="member-list">
                {course.students.map((student: any) => (
                  <article key={student.id} className="member-list-card">
                    <div>
                      <strong>{student.name}</strong>
                      <p>{student.major || 'Student'} · {student.yearOfStudy || 'Active learner'}</p>
                    </div>
                    <div className="member-list-meta">
                      <span>{student.email}</span>
                      <span>{student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString() : 'Recently enrolled'}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        );
      case 'ask':
        return (
          <div className="detail-panel">
            <div className="section-header">
              <h3>Ask StudyLink AI</h3>
              <Link to={`/ask-ai?course=${encodeURIComponent(course.code)}`} className="button button-secondary button-sm">
                Open full AI workspace
              </Link>
            </div>
            <p>Ask for notes, explanations, revision plans, MCQs, or what to study next in this course.</p>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask StudyLink AI about this course..."
              className="studylink-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  setSubmittedQuestion(question);
                  // also fetch curated results immediately
                  fetchCuratedResults(question);
                }
              }}
            />
            <div className="detail-action-row" style={{ marginTop: '1rem' }}>
              <button type="button" className="button button-primary" onClick={() => setSubmittedQuestion(question)}>
                Get academic guidance
              </button>
            </div>
            <div className="detail-panel" style={{ marginTop: '1rem' }}>
              <strong>{aiResponse.headline}</strong>
              <p style={{ marginTop: '0.75rem' }}>{aiResponse.explanation}</p>
              <ul className="detail-list compact-list">
                {aiResponse.nextSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
            <div className="detail-card-grid" style={{ marginTop: '1rem' }}>
              {aiResponse.recommendedResources.map((resource) => (
                <article key={resource.id} className="detail-summary-card">
                  <strong>{resource.title}</strong>
                  <p>{resource.description}</p>
                  <button type="button" className="button button-secondary button-sm" onClick={() => window.open(resource.url, '_blank', 'noopener,noreferrer')}>
                    Open resource
                  </button>
                </article>
              ))}
            </div>
          </div>
        );
      default:
        return <p>Select a section to explore.</p>;
    }
  };

  if (loading) {
    return (
      <section className="workspace-page">
        <div className="container workspace-loading-card">
          <p>Loading course details...</p>
        </div>
      </section>
    );
  }

  if (!course) {
    return (
      <section className="workspace-page">
        <div className="container workspace-loading-card">
          <p>Course not found.</p>
        </div>
      </section>
    );
  }

  return (
  <section className="workspace-page course-hub-page">
    <div className="container workspace-stack">

        {resourcePreview && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Resource preview"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.65)',
              zIndex: 9999,
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
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
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

              
{resourcePreview.type === 'text/html' ? (
  <iframe
    title={resourcePreview.title}
    sandbox=""
    srcDoc={`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta
            http-equiv="Content-Security-Policy"
            content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"
          />
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #1f2937;
              padding: 24px;
              max-width: 900px;
              margin: auto;
              overflow-wrap: anywhere;
            }

            img { max-width: 100%; }

            table {
              border-collapse: collapse;
              width: 100%;
            }

            td, th {
              border: 1px solid #cbd5e1;
              padding: 8px;
            }
          </style>
        </head>
        <body>${resourcePreview.html || ''}</body>
      </html>
    `}
    style={{
      width: '100%',
      flex: 1,
      border: 'none'
    }}
  />
) : resourcePreview.type.startsWith('image/') ? (
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

        <section className="hub-hero-card">
          <div>
            <p className="workspace-eyebrow">{course.school}</p>
            <h1>{course.code}: {course.title}</h1>
            <p className="workspace-lead">{course.description}</p>
            <div className="detail-chip-row">
              <span className="detail-chip">{course.level}</span>
              <span className="detail-chip">{course.deliveryMode}</span>
              <span className="detail-chip">{course.resources.length} resources</span>
            </div>
          </div>
          <div className="detail-action-row">
            <button type="button" className="button button-primary" onClick={handleEnroll}>
              {course.isEnrolled ? 'Enrolled' : 'Enroll in course'}
            </button>
            <Link to={`/ask-ai?course=${encodeURIComponent(course.code)}`} className="button button-secondary">
              Ask StudyLink AI
            </Link>
            <Link to="/courses" className="button button-secondary">Back to courses</Link>
          </div>
        </section>

        <div className="hub-tab-bar">
          {hubTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`hub-tab-button ${selectedTab === tab.key ? 'hub-tab-active' : ''}`}
              onClick={() => setSelectedTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="hub-section" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 320px)', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.6rem' }}>
              <label className="mini-label" style={{ marginRight: '0.5rem' }}>Audience:</label>
              <select value={audienceFilter} onChange={(e) => setAudienceFilter(e.target.value)} style={{ padding: '0.45rem 0.6rem', borderRadius: 8 }}>
                <option value="all">All</option>
                <option value="All enrolled students">All enrolled students</option>
                <option value="Students revising beyond class hours">Students revising beyond class hours</option>
                <option value="Visual learners">Visual learners</option>
                <option value="Students preparing for exams">Students preparing for exams</option>
              </select>
              <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.9rem' }}>{course?.resources.length} total resources</div>
            </div>

            {renderTabContent()}
          </div>

          <aside className="detail-panel" style={{ alignSelf: 'start' }}>
            <div className="section-header">
              <h3>StudyLink AI — Quick research</h3>
              <button
                type="button"
                className="text-button"
                onClick={() => setSubmittedQuestion(question)}
              >
                Refresh
              </button>
            </div>

            <p style={{ marginTop: 0 }}>{aiResponse.explanation}</p>

            <div style={{ marginTop: '1rem' }}>
              <strong>Recommended next steps</strong>
              <ul className="detail-list compact-list">
                {aiResponse.nextSteps.map((step) => <li key={step}>{step}</li>)}
              </ul>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <strong>Recommended resources</strong>
              <div className="detail-card-grid" style={{ marginTop: '0.5rem' }}>
                {aiResponse.recommendedResources.map((resource) => {
                  const isExternal = typeof resource.url === 'string' && /^https?:\/\//i.test(resource.url);
                  return (
                    <article key={resource.id} className="detail-summary-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <strong style={{ fontSize: '0.95rem' }}>{resource.title}</strong>
                        {isExternal ? <span className="badge">External</span> : null}
                      </div>
                      <p style={{ marginTop: '0.35rem' }}>{resource.description}</p>
                      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                        <button type="button" className="button button-secondary button-sm" onClick={() => window.open(resource.url, '_blank', 'noopener,noreferrer')}>{isExternal ? 'Open external' : 'Open'}</button>
                        {resource.fallbackUrl ? (
                          <button type="button" className="button button-tertiary button-sm" onClick={() => window.open(resource.fallbackUrl, '_blank', 'noopener,noreferrer')}>Open in-app</button>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

              {curatedResults.length > 0 ? (
                <div style={{ marginTop: '1rem' }}>
                  <strong>Curated results</strong>
                  <div className="detail-card-grid" style={{ marginTop: '0.5rem' }}>
                    {curatedResults.map((r: any, idx: number) => (
                      <article key={`${r.url}-${idx}`} className="detail-summary-card">
                        <strong style={{ fontSize: '0.95rem' }}>{r.label}</strong>
                        <p style={{ marginTop: '0.35rem' }}>{r.source} · {r.type}</p>
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                          <a className="button button-secondary button-sm" href={r.url} target="_blank" rel="noreferrer">Open</a>
                          <button
                            type="button"
                            className="button button-primary button-sm"
                            onClick={async () => {
                              try {
                                const resp = await apiFetch('/api/ai/accept', { method: 'POST', body: JSON.stringify({ courseCode: course?.code, resource: r }) });
                                if (resp.ok) {
                                    addNotification({ id: `accept-${Date.now()}`, title: 'Saved', message: 'Curated link saved to backend.', createdAt: new Date().toISOString() });
                                    // Refresh persisted curated links
                                    try {
                                      const linksResp = await apiFetch(`/api/ai/links?courseCode=${encodeURIComponent(course?.code)}`);
                                      if (linksResp.ok) {
                                        const linksData = await linksResp.json();
                                        setCuratedResults((prev) => [...(linksData.links || []), ...prev]);
                                      }
                                    } catch {
                                      // ignore
                                    }
                                } else {
                                  addNotification({ id: `accept-fail-${Date.now()}`, title: 'Save failed', message: 'Could not save curated link.', createdAt: new Date().toISOString() });
                                }
                              } catch (err) {
                                // eslint-disable-next-line no-console
                                console.error(err);
                                addNotification({ id: `accept-ex-${Date.now()}`, title: 'Save error', message: 'Error saving curated link.', createdAt: new Date().toISOString() });
                              }
                            }}
                          >
                            Add to course
                          </button>
                          <button
                            type="button"
                            className="button button-tertiary button-sm"
                            onClick={async () => {
                              try {
                                const resp = await apiFetch('/api/ai/flag', { method: 'POST', body: JSON.stringify({ courseCode: course?.code, resource: r, reason: 'user_report' }) });
                                if (resp.ok) {
                                  addNotification({ id: `flag-${Date.now()}`, title: 'Flagged', message: 'This resource was flagged for review.', createdAt: new Date().toISOString() });
                                } else {
                                  addNotification({ id: `flag-fail-${Date.now()}`, title: 'Flag failed', message: 'Could not flag the resource.', createdAt: new Date().toISOString() });
                                }
                              } catch (err) {
                                // eslint-disable-next-line no-console
                                console.error(err);
                                addNotification({ id: `flag-ex-${Date.now()}`, title: 'Flag error', message: 'Error flagging resource.', createdAt: new Date().toISOString() });
                              }
                            }}
                          >
                            Flag
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}

            <div style={{ marginTop: '1rem' }}>
              <strong>Research mode</strong>
              <p style={{ marginTop: 0 }}>Ask StudyLink AI to fetch curated external notes, PDFs, MCQs and past papers. Use the question box at the bottom of the hub to refine your request.</p>
              <div style={{ marginTop: '0.5rem' }}>
                <button type="button" className="button button-primary button-sm" disabled={fetchingCurated} onClick={() => fetchCuratedResults(aiResponse.headline)}>
                  {fetchingCurated ? 'Fetching…' : 'Fetch curated results'}
                </button>
              </div>
            </div>
            {aiResponse.externalLinks && aiResponse.externalLinks.length > 0 ? (
              <div style={{ marginTop: '1rem' }}>
                <strong>Quick searches</strong>
                <ul className="detail-list compact-list" style={{ marginTop: '0.5rem' }}>
                  {aiResponse.externalLinks.map((link) => (
                    <li key={link.url}><a href={link.url} target="_blank" rel="noreferrer">{link.label}</a></li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}

export default CourseDetail;
