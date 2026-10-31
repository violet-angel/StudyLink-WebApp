import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../lib/apiClient';
import { buildMergedCourses, saveSupplementalEnrollmentCode } from '../lib/studylinkContent';

function Courses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState(searchParams.get('school') || 'All schools');
  const [selectedProgram, setSelectedProgram] = useState(searchParams.get('program') || 'All programs');

  useEffect(() => {
    apiFetch('/api/courses')
      .then((response) => response.ok ? response.json() : { courses: [] })
      .then((data) => setCourses(buildMergedCourses(data.courses || [])))
      .catch(() => setCourses(buildMergedCourses([])))
      .finally(() => setLoading(false));
  }, []);

  const schools = useMemo(
    () => ['All schools', ...Array.from(new Set(courses.map((course) => course.school).filter(Boolean)))],
    [courses],
  );
  const programs = useMemo(() => {
    const filtered = selectedSchool === 'All schools'
      ? courses
      : courses.filter((course) => course.school === selectedSchool);
    return ['All programs', ...Array.from(new Set(filtered.map((course) => course.program).filter(Boolean)))];
  }, [courses, selectedSchool]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const schoolMatch = selectedSchool === 'All schools' || course.school === selectedSchool;
      const programMatch = selectedProgram === 'All programs' || course.program === selectedProgram;
      const searchMatch = [course.code, course.title, course.category, course.school, course.program, course.description]
        .join(' ')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return schoolMatch && programMatch && searchMatch;
    });
  }, [courses, searchTerm, selectedProgram, selectedSchool]);

  const handleEnroll = async (course: any) => {
    try {
      const response = await apiFetch(`/api/courses/${course.id}/enroll`, { method: 'POST' });
      if (!response.ok) {
        throw new Error('Fallback to local enrollment');
      }

      const data = await response.json();
      const updatedCourse = data.course;
      setCourses((current) => current.map((item) => (
        String(item.code).toLowerCase() === String(updatedCourse.code).toLowerCase()
          ? { ...item, ...updatedCourse, isEnrolled: true }
          : item
      )));
    } catch {
      saveSupplementalEnrollmentCode(course.code);
      setCourses((current) => current.map((item) => (
        item.code === course.code
          ? { ...item, isEnrolled: true, enrolledCount: Number(item.enrolledCount || 0) + 1 }
          : item
      )));
    }
  };

  const enrolledCount = courses.filter((course) => course.isEnrolled).length;

  return (
    <section className="courses-page workspace-page">
      <div className="container workspace-stack">
        <section className="workspace-hero workspace-hero-courses">
          <div>
            <p className="workspace-eyebrow">Course Directory</p>
            <h1>Every enrolled class should give the learner notes, PDFs, podcasts, MCQs, and past-paper support.</h1>
            <p className="workspace-lead">
              StudyLink now treats every course as a full study hub so students can move from confusion to revision,
              peer support, and guided AI help without leaving the platform.
            </p>
          </div>
          <div className="hero-stat-grid">
            <article className="hero-stat-card">
              <span className="hero-stat-value">{courses.length}</span>
              <span className="hero-stat-label">Course hubs</span>
            </article>
            <article className="hero-stat-card">
              <span className="hero-stat-value">{enrolledCount}</span>
              <span className="hero-stat-label">My enrolled courses</span>
            </article>
            <article className="hero-stat-card">
              <span className="hero-stat-value">{courses.reduce((sum, course) => sum + (course.podcastCount || 0), 0)}</span>
              <span className="hero-stat-label">Podcast supports</span>
            </article>
          </div>
        </section>

        <section className="workspace-toolbar library-toolbar">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by course, school, program, or support topic"
            className="search-input"
          />
          <select value={selectedSchool} onChange={(event) => {
            setSelectedSchool(event.target.value);
            setSelectedProgram('All programs');
          }} className="filter-select">
            {schools.map((school) => (
              <option key={school} value={school}>{school}</option>
            ))}
          </select>
          <select value={selectedProgram} onChange={(event) => setSelectedProgram(event.target.value)} className="filter-select">
            {programs.map((program) => (
              <option key={program} value={program}>{program}</option>
            ))}
          </select>
        </section>

        {loading ? (
          <div className="workspace-loading-card">
            <p>Loading course catalog...</p>
          </div>
        ) : (
          <div className="course-showcase-grid">
            {filteredCourses.map((course) => (
              <article key={`${course.code}-${course.id}`} className="course-showcase-card">
                <img className="course-image" src={course.image} alt={course.title} loading="lazy" />
                <div className="course-card-body">
                  <div className="course-card-topline">
                    <div>
                      <p className="course-code">{course.code}</p>
                      <p className="course-category">{course.school}</p>
                    </div>
                    <span className="course-level-badge">{course.level}</span>
                  </div>

                  <div>
                    <h3 className="course-title">{course.title}</h3>
                    <p className="course-description">{course.description}</p>
                  </div>

                  <div className="course-meta-grid">
                    <div>
                      <span className="mini-label">Program</span>
                      <strong>{course.program}</strong>
                    </div>
                    <div>
                      <span className="mini-label">Support focus</span>
                      <strong>{course.supportFocus}</strong>
                    </div>
                    <div>
                      <span className="mini-label">PDFs & Notes</span>
                      <strong>{(course.pdfCount || 0) + (course.noteCount || 0)}</strong>
                    </div>
                    <div>
                      <span className="mini-label">Podcasts</span>
                      <strong>{course.podcastCount || 0}</strong>
                    </div>
                  </div>

                  <div className="course-card-actions">
                    <Link to={`/courses/${course.id}`} className="button button-secondary">
                      Open course hub
                    </Link>
                    <Link to={`/ask-ai?course=${encodeURIComponent(course.code)}`} className="button button-secondary">
                      Ask StudyLink AI
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleEnroll(course)}
                      className={`button ${course.isEnrolled ? 'button-dark' : 'button-primary'}`}
                    >
                      {course.isEnrolled ? 'Enrolled' : 'Enroll now'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Courses;
