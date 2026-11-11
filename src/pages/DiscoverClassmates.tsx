import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/apiClient';

type Classmate = {
  id: number;
  name: string;
  email: string;
  initials: string;
  university: string;
  major: string;
  yearOfStudy: string;
  bio: string;
  courses: string[];
  sharedCourses: string[];
  section?: string;
};

function DiscoverClassmates() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] =
    useState('All courses');
  const [selectedSection, setSelectedSection] =
    useState('All sections');

  const [classmates, setClassmates] =
    useState<Classmate[]>([]);

  const [selectedStudent, setSelectedStudent] =
    useState<Classmate | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadClassmates = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/api/classmates');

      if (!response.ok) {
        throw new Error(
          `Unable to load classmates (${response.status}).`
        );
      }

      const data = await response.json();

      setClassmates(
        Array.isArray(data.classmates)
          ? data.classmates
          : []
      );

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load classmates.'
      );
      setClassmates([]);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadClassmates();
  }, []);

  const courseOptions = useMemo(
    () => [
      'All courses',
      ...Array.from(
        new Set(
          classmates.flatMap(
            student => student.courses || []
          )
        )
      ).sort()
    ],
    [classmates]
  );

  const sectionOptions = useMemo(
    () => [
      'All sections',
      ...Array.from(
        new Set(
          classmates
            .map(student => student.section)
            .filter((value): value is string => Boolean(value))
        )
      ).sort()
    ],
    [classmates]
  );

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return classmates.filter(student => {
      const matchesSearch = [
        student.name,
        student.university,
        student.major,
        ...(student.courses || [])
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);

      const matchesCourse =
        selectedCourse === 'All courses' ||
        (student.courses || []).includes(selectedCourse);

      const matchesSection =
        selectedSection === 'All sections' ||
        student.section === selectedSection;

      return matchesSearch &&
        matchesCourse &&
        matchesSection;
    });

  }, [
    classmates,
    searchTerm,
    selectedCourse,
    selectedSection
  ]);

  const sharedCourseMatches = classmates.filter(
    student => (student.sharedCourses || []).length > 0
  ).length;

  return (
    <section className="discover-page workspace-page">
      <div className="container workspace-stack">

        <section className="workspace-hero workspace-hero-discover">
          <div>
            <p className="workspace-eyebrow">
              Classmate Network
            </p>

            <h1>Discover Your Classmates</h1>

            <p>
              Find students enrolled in similar courses,
              discover study partners and build your
              academic network.
            </p>
          </div>

          <div className="hero-stat-grid">
            <article className="hero-stat-card">
              <span className="hero-stat-value">
                {classmates.length}
              </span>
              <span className="hero-stat-label">
                Classmates available
              </span>
            </article>

            <article className="hero-stat-card">
              <span className="hero-stat-value">
                {sharedCourseMatches}
              </span>
              <span className="hero-stat-label">
                Shared-course matches
              </span>
            </article>
          </div>
        </section>

        <section className="workspace-toolbar">
          <div>
            <h2>Find Your Study Partners</h2>
            <p>
              Search by name, university, major or course.
            </p>
          </div>

          <div className="toolbar-actions">
            <input
              type="search"
              placeholder="Search classmates..."
              value={searchTerm}
              onChange={event =>
                setSearchTerm(event.target.value)
              }
              className="search-input"
              aria-label="Search classmates"
            />

            <select
              value={selectedCourse}
              onChange={event => {
                setSelectedCourse(event.target.value);
                setSelectedSection('All sections');
              }}
              className="filter-select"
              aria-label="Filter by course"
            >
              {courseOptions.map(course => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>

            {sectionOptions.length > 1 && (
              <select
                value={selectedSection}
                onChange={event =>
                  setSelectedSection(event.target.value)
                }
                className="filter-select"
                aria-label="Filter by section"
              >
                {sectionOptions.map(section => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            )}
          </div>
        </section>

        {loading && (
          <div className="workspace-loading-card">
            <p>Loading classmates...</p>
          </div>
        )}

        {error && (
          <div className="workspace-loading-card" role="alert">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void loadClassmates()}
              className="button button-primary"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filteredStudents.length === 0 && (
          <div className="workspace-loading-card">
            <h3>No classmates found</h3>
            <p>
              Try changing your search term or course filter.
            </p>
          </div>
        )}

        {!loading && !error && (
          <div className="students-grid classmates-grid">
            {filteredStudents.map(student => (
              <article
                key={student.id}
                className="student-card network-card"
              >
                <div className="student-header">
                  <div className="student-avatar">
                    {student.initials}
                  </div>

                  <div className="student-info">
                    <h3 className="student-name">
                      {student.name}
                    </h3>

                    <p className="student-university">
                      {student.university}
                    </p>
                  </div>
                </div>

                <div className="network-meta">
                  <span>{student.major || 'Student'}</span>
                  <span>
                    {student.yearOfStudy || 'Active'}
                  </span>
                </div>

                {student.section && (
                  <p>Section: {student.section}</p>
                )}

                <p className="network-bio">
                  {student.bio || 'No bio shared yet.'}
                </p>

                <div className="student-courses">
                  {(student.courses || []).map(course => (
                    <span
                      key={course}
                      className={`course-badge ${
                        (student.sharedCourses || []).includes(course)
                          ? 'course-badge-shared'
                          : ''
                      }`}
                    >
                      {course}
                    </span>
                  ))}
                </div>

                <div className="network-footer">
                  <strong>
                    {(student.sharedCourses || []).length}
                    {' '}shared courses
                  </strong>
                </div>

                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => setSelectedStudent(student)}
                >
                  View Profile
                </button>

                {student.sharedCourses?.length > 0 && (
                  <Link
                    to={`/messages/${student.id}`}
                    className="button button-secondary"
                  >
                    Send Message
                  </Link>
                )}

              </article>
            ))}
          </div>
        )}

        {selectedStudent && (
          <div className="workspace-loading-card">
            <h2>{selectedStudent.name}</h2>

            <p>
              University: {selectedStudent.university}
            </p>

            <p>
              Major: {selectedStudent.major || 'Not specified'}
            </p>

            <p>
              Year: {selectedStudent.yearOfStudy ||
                'Not specified'}
            </p>

            {selectedStudent.section && (
              <p>Section: {selectedStudent.section}</p>
            )}

            <p>
              {selectedStudent.bio || 'No biography provided.'}
            </p>

            <h3>Courses</h3>

            <div className="student-courses">
              {(selectedStudent.courses || []).map(course => (
                <span key={course} className="course-badge">
                  {course}
                </span>
              ))}
            </div>

            <button
              type="button"
              className="button button-dark"
              onClick={() => setSelectedStudent(null)}
            >
              Close Profile
            </button>
          </div>
        )}

      </div>
    </section>
  );
}

export default DiscoverClassmates;
