import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../lib/apiClient';
import { buildCourseContent, buildStudyLinkAiResponse, saveSupplementalEnrollmentCode } from '../lib/studylinkContent';
import { addNotification } from '../lib/notifications';

const hubTabs = [
  { key: 'overview', label: 'Overview' },
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
    if (!course) return;
    try {
      const response = await apiFetch(`/api/courses/${course.id}/enroll`, { method: 'POST' });
      if (!response.ok) {
        throw new Error('Local enrollment fallback');
      }
      const data = await response.json();
      setCourse(buildCourseContent(data.course));
    } catch {
      saveSupplementalEnrollmentCode(course.code);
      setCourse((current: any) => current ? { ...current, isEnrolled: true, enrolledCount: Number(current.enrolledCount || 0) + 1 } : current);
    }
  };

  const renderResourceGrid = (items: any[], buttonLabel: string) => (
    <div className="detail-card-grid">
      {items.map((item) => {
        const itemUrl = item.url || item.fallbackUrl;
        const externalUrl = item.url;
        const isDataUrl = typeof item.url === 'string' && item.url.startsWith('data:');
        const isFallbackDataUrl = typeof item.fallbackUrl === 'string' && item.fallbackUrl.startsWith('data:');

        return (
          <article key={item.id} className="detail-summary-card">
            <strong>{item.title}</strong>
            <p>{item.description}</p>
            <span>{item.audience}</span>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              {itemUrl ? (
                <a
                  href={itemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button-secondary button-sm"
                >
                  {buttonLabel}
                </a>
              ) : null}
              {item.fallbackUrl && externalUrl ? (
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button-tertiary button-sm"
                >
                  Open external
                </a>
              ) : null}
              {isDataUrl ? (
                <button
                  type="button"
                  className="button button-primary button-sm"
                  onClick={async () => {
                    try {
                      const [, meta, body] = item.url.match(/^data:([^;]+);base64,(.*)$/) || [];
                      const ext = meta && meta.includes('html') ? 'html' : (meta && meta.split('/')[1]) || 'bin';
                      const filename = `${item.id || 'resource'}.${ext}`;
                      const resp = await apiFetch('/api/uploads', { method: 'POST', body: JSON.stringify({ filename, data: body }) });
                      if (resp.ok) {
                        const data = await resp.json();
                        window.open(data.url, '_blank', 'noopener,noreferrer');
                        addNotification({ id: `download-${Date.now()}`, title: 'Saved', message: 'Resource saved and opened.', createdAt: new Date().toISOString() });
                      } else {
                        addNotification({ id: `download-fail-${Date.now()}`, title: 'Save failed', message: 'Could not save resource.', createdAt: new Date().toISOString() });
                      }
                    } catch (err) {
                      // eslint-disable-next-line no-console
                      console.error(err);
                      addNotification({ id: `download-ex-${Date.now()}`, title: 'Error', message: 'Failed to save resource.', createdAt: new Date().toISOString() });
                    }
                  }}
                >
                  Download
                </button>
              ) : null}
              {isFallbackDataUrl ? (
                <button
                  type="button"
                  className="button button-primary button-sm"
                  onClick={async () => {
                    try {
                      const [, meta, body] = item.fallbackUrl.match(/^data:([^;]+);base64,(.*)$/) || [];
                      const ext = meta && meta.includes('html') ? 'html' : (meta && meta.split('/')[1]) || 'bin';
                      const filename = `${item.id || 'resource'}.${ext}`;
                      const resp = await apiFetch('/api/uploads', { method: 'POST', body: JSON.stringify({ filename, data: body }) });
                      if (resp.ok) {
                        const data = await resp.json();
                        window.open(data.url, '_blank', 'noopener,noreferrer');
                        addNotification({ id: `download-${Date.now()}`, title: 'Saved', message: 'Resource saved and opened.', createdAt: new Date().toISOString() });
                      } else {
                        addNotification({ id: `download-fail-${Date.now()}`, title: 'Save failed', message: 'Could not save resource.', createdAt: new Date().toISOString() });
                      }
                    } catch (err) {
                      // eslint-disable-next-line no-console
                      console.error(err);
                      addNotification({ id: `download-ex-${Date.now()}`, title: 'Error', message: 'Failed to save resource.', createdAt: new Date().toISOString() });
                    }
                  }}
                >
                  Download in-app
                </button>
              ) : null}
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
    <section className="workspace-page">
      <div className="container workspace-stack">
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
        <div className="hub-section" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem' }}>
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
