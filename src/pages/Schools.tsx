import { Link, useSearchParams } from 'react-router-dom';
import { getCatalogSchools, getProgramsForSchool } from '../lib/studylinkContent';

function Schools() {
  const [searchParams] = useSearchParams();
  const selectedSchool = searchParams.get('school');
  const schools = getCatalogSchools();
  const programs = getProgramsForSchool(selectedSchool);

  return (
    <section className="schools-page workspace-page">
      <div className="container workspace-stack">
        <section className="workspace-hero workspace-hero-compact">
          <div>
            <p className="workspace-eyebrow">Academic Pathways</p>
            <h1>Every school should lead learners to relevant courses, notes, PDFs, podcasts, and revision support.</h1>
            <p className="workspace-lead">
              StudyLink now organizes content beyond one department so students from science, business, pharmacy, humanities,
              nursing, law, and psychology can find support in one serious academic platform.
            </p>
          </div>
          <div className="hero-stat-grid">
            <article className="hero-stat-card">
              <span className="hero-stat-value">{schools.length}</span>
              <span className="hero-stat-label">Schools represented</span>
            </article>
            <article className="hero-stat-card">
              <span className="hero-stat-value">{schools.reduce((sum, school) => sum + school.courseCount, 0)}</span>
              <span className="hero-stat-label">Supported courses</span>
            </article>
          </div>
        </section>

        <section className="workspace-toolbar">
          <div>
            <h2>Browse by school</h2>
            <p>Open a school to focus the course directory around the learner's real academic context.</p>
          </div>
          <Link to="/courses" className="button button-primary">Open full course directory</Link>
        </section>

        <div className="groups-grid">
          {schools.map((school) => (
            <article key={school.name} className="group-card polished-group-card">
              <h3>{school.name}</h3>
              <p className="group-course">{school.programCount} programs</p>
              <p>{school.courseCount} courses with notes, PDFs, podcasts, MCQs, and past-paper support.</p>
              <div className="group-actions">
                <Link to={`/courses?school=${encodeURIComponent(school.name)}`} className="button button-secondary button-sm">
                  View courses
                </Link>
              </div>
            </article>
          ))}
        </div>

        {selectedSchool ? (
          <section className="detail-panel">
            <div className="section-header">
              <h2>{selectedSchool}</h2>
              <Link to="/schools" className="button button-secondary button-sm">Clear filter</Link>
            </div>
            <div className="detail-card-grid">
              {programs.map((program) => (
                <article key={program.name} className="detail-summary-card">
                  <strong>{program.name}</strong>
                  <p>{program.courseCount} course hubs available.</p>
                  <Link to={`/courses?school=${encodeURIComponent(program.school)}&program=${encodeURIComponent(program.name)}`} className="button button-secondary button-sm">
                    Open program
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}

export default Schools;
