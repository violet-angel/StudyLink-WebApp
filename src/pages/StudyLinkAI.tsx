import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { buildStudyLinkAiResponse, getAllCatalogCourses } from '../lib/studylinkContent';

function StudyLinkAI() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedCourseCode, setSelectedCourseCode] = useState(searchParams.get('course') || 'APT3060');
  const [question, setQuestion] = useState('Give me notes and revision guidance for this course.');
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [selectedTab, setSelectedTab] = useState<'guidance' | 'resources'>('guidance');
  const courses = getAllCatalogCourses();

  const response = useMemo(
    () => buildStudyLinkAiResponse(question, selectedCourseCode),
    [selectedCourseCode, question],
  );

  const activeCourse = courses.find((course) => course.code === selectedCourseCode) || courses[0];

  return (
    <section className="workspace-page">
      <div className="container workspace-stack">
        <section className="workspace-hero workspace-hero-dashboard">
          <div>
            <p className="workspace-eyebrow">StudyLink AI</p>
            <h1>Quick course guidance, notes, and revision steps without leaving the app.</h1>
            <p className="workspace-lead">
              Ask for summaries, study direction, and resource recommendations in one place.
            </p>
          </div>
          <div className="hero-stat-grid">
            <article className="hero-stat-card">
              <span className="hero-stat-value">{courses.length}</span>
              <span className="hero-stat-label">Courses in AI support catalog</span>
            </article>
            <article className="hero-stat-card">
              <span className="hero-stat-value">{activeCourse.resources.length}</span>
              <span className="hero-stat-label">Linked study resources</span>
            </article>
          </div>
        </section>

        <section className="detail-panel">
          <div className="section-header">
            <h2>Ask for what you need</h2>
            <span className="panel-pill">{selectedCourseCode}</span>
          </div>
          <div className="form-grid form-grid-two">
            <label>
              Course
              <select value={selectedCourseCode} onChange={(event) => setSelectedCourseCode(event.target.value)}>
                {courses.map((course) => (
                  <option key={course.code} value={course.code}>
                    {course.code} - {course.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Prompt idea
              <select value={question} onChange={(event) => setQuestion(event.target.value)}>
                {activeCourse.aiPrompts.map((prompt) => (
                  <option key={prompt} value={prompt}>{prompt}</option>
                ))}
              </select>
            </label>
          </div>

          <label style={{ display: 'grid', gap: '0.6rem' }}>
            Your question
            <textarea
              className="studylink-input"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask for notes, summaries, MCQs, explanations, or revision steps."
            />
          </label>

          <div className="detail-action-row">
            <span className="panel-pill" style={{ fontSize: '0.9rem' }}>
              Guidance updates live as you type.
            </span>
          </div>
        </section>

        <section className="detail-panel">
          <div className="hub-tab-bar">
            {['guidance', 'resources'].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`hub-tab-button ${selectedTab === tab ? 'hub-tab-active' : ''}`}
                onClick={() => setSelectedTab(tab as 'guidance' | 'resources')}
              >
                {tab === 'guidance' ? 'AI guidance' : 'AI resources'}
              </button>
            ))}
          </div>
        </section>

        {selectedTab === 'guidance' ? (
          <section className="detail-panel">
            <div className="section-header">
              <h2>{response.headline}</h2>
              <span className="panel-pill">AI study response</span>
            </div>
            <p>{response.explanation}</p>
            <div className="detail-panel" style={{ marginTop: '1rem' }}>
              <h3>Focus areas</h3>
              <ul className="detail-list compact-list">
                {response.focusAreas?.map((area) => (
                  <li key={area}>{area}</li>
                ))}
              </ul>
            </div>
            <div className="detail-panel" style={{ marginTop: '1rem' }}>
              <h3>Study tips</h3>
              <ul className="detail-list compact-list">
                {response.studyTips?.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
            <div className="detail-panel" style={{ marginTop: '1rem' }}>
              <h3>Action steps</h3>
              <ul className="detail-list compact-list">
                {response.nextSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
            <div className="modal-note">
              <strong>Peer advice</strong>
              <p style={{ margin: '0.5rem 0 0' }}>{response.peerAdvice}</p>
            </div>
          </section>
        ) : (
          <section className="detail-panel">
            <div className="section-header">
              <h2>Recommended resources</h2>
              <span className="panel-pill">{response.recommendedResources.length}</span>
            </div>
            <div className="detail-card-grid">
              {response.recommendedResources.map((resource) => {
                const resourceUrl = resource.url || resource.fallbackUrl;
                return (
                  <article key={resource.id} className="detail-summary-card">
                    <strong>{resource.title}</strong>
                    <p>{resource.description}</p>
                    <span>{resource.type} · {resource.audience}</span>
                    <div className="detail-action-row">
                      <button
                        type="button"
                        className="button button-secondary button-sm"
                        onClick={() => setSelectedResourceId(String(resource.id))}
                      >
                        Preview
                      </button>
                      {resourceUrl ? (
                        <a
                          href={resourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="button button-primary button-sm"
                        >
                          Open resource
                        </a>
                      ) : (
                        <button type="button" className="button button-primary button-sm" disabled>
                          No URL
                        </button>
                      )}
                      {/* in-app fallback button removed */}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {selectedTab === 'resources' && selectedResourceId ? (
          <section className="detail-panel">
            <div className="section-header">
              <h2>Resource preview</h2>
              <span className="panel-pill">Live preview</span>
            </div>
            {(() => {
              const selectedResource = response.recommendedResources.find((item) => String(item.id) === selectedResourceId);
              if (!selectedResource) {
                return <p>Selected resource could not be found.</p>;
              }

              const resourceUrl = selectedResource.url || selectedResource.fallbackUrl;
              const isDataPreview = typeof resourceUrl === 'string' && resourceUrl.startsWith('data:');

              return (
                <>
                  <p>{selectedResource.description}</p>
                  {isDataPreview ? (
                    <iframe
                      title={selectedResource.title}
                      src={resourceUrl}
                      className="resource-preview-frame"
                      sandbox="allow-same-origin allow-scripts allow-popups"
                    />
                  ) : resourceUrl ? (
                    <div className="detail-summary-card">
                      <p>This resource is available to open directly.</p>
                      <div className="detail-action-row">
                        <a
                          href={resourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="button button-primary button-sm"
                        >
                          Open resource
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="detail-summary-card">
                      <p>This resource has no URL to open.</p>
                    </div>
                  )}
                </>
              );
            })()}
          </section>
        ) : null}
      </div>
    </section>
  );
}

export default StudyLinkAI;
