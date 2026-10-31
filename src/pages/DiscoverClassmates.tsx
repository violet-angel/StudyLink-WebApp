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
};

function DiscoverClassmates() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('All courses');
  const [classmates, setClassmates] = useState<Classmate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/classmates')
      .then((response) => response.json())
      .then((data) => setClassmates(data.classmates || []))
      .catch(() => setClassmates([]))
      .finally(() => setLoading(false));
  }, []);

  const courseOptions = useMemo(
    () => ['All courses', ...Array.from(new Set(classmates.flatMap((student) => student.courses)))],
    [classmates],
  );

  const filteredStudents = classmates.filter((student) => {
    const matchesSearch = [student.name, student.university, student.major, student.email]
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourse === 'All courses' || student.courses.includes(selectedCourse);
    return matchesSearch && matchesCourse;
  });

  return (
    <section className="discover-page workspace-page">
      <div className="container workspace-stack">
        <section className="workspace-hero workspace-hero-discover">
          <div>
            <p className="workspace-eyebrow">Classmate Network</p>
            <h1>Discover real classmates connected by actual course enrollments.</h1>
          </div>
          <div className="hero-stat-grid">
            <article className="hero-stat-card">
              <span className="hero-stat-value">{classmates.length}</span>
              <span className="hero-stat-label">Classmates available</span>
            </article>
            <article className="hero-stat-card">
              <span className="hero-stat-value">{classmates.filter((student) => student.sharedCourses.length > 0).length}</span>
              <span className="hero-stat-label">Shared-course matches</span>
            </article>
          </div>
        </section>

        <section className="workspace-toolbar">
          <div>
            <h2>Find your people</h2>
            <p>Search by name, university, or major, then narrow down by course code.</p>
          </div>
          <div className="toolbar-actions">
            <input
              type="text"
              placeholder="Search by name, university, or major"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="search-input"
            />
            <select
              value={selectedCourse}
              onChange={(event) => setSelectedCourse(event.target.value)}
              className="filter-select"
            >
              {courseOptions.map((course) => (
                <option key={course}>{course}</option>
              ))}
            </select>
          </div>
        </section>

        {loading ? (
          <div className="workspace-loading-card">
            <p>Loading classmates...</p>
          </div>
        ) : (
          <div className="students-grid classmates-grid">
            {filteredStudents.map((student) => (
              <article key={student.id} className="student-card network-card">
                <div className="student-header">
                  <div className="student-avatar">{student.initials}</div>
                  <div className="student-info">
                    <h3 className="student-name">{student.name}</h3>
                    <p className="student-university">{student.university}</p>
                  </div>
                </div>

                <div className="network-meta">
                  <span>{student.major || 'Student'}</span>
                  <span>{student.yearOfStudy || 'Active'}</span>
                </div>

                <p className="network-bio">{student.bio || 'No bio shared yet.'}</p>

                <div className="student-courses">
                  {student.courses.map((course) => (
                    <span
                      key={course}
                      className={`course-badge ${student.sharedCourses.includes(course) ? 'course-badge-shared' : ''}`}
                    >
                      {course}
                    </span>
                  ))}
                </div>

                <div className="network-footer">
                  <span>{student.email}</span>
                  <strong>{student.sharedCourses.length} shared courses</strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default DiscoverClassmates;
