import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiClient';

function AdminAcademic() {
  const [schools, setSchools] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  const [schoolName, setSchoolName] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [programName, setProgramName] = useState('');
  const [programId, setProgramId] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [resTitle, setResTitle] = useState('');
  const [resUrl, setResUrl] = useState('');
  const [resFile, setResFile] = useState<File | null>(null);
  const [resUploading, setResUploading] = useState(false);
  const [courseResources, setCourseResources] = useState<any[]>([]);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    try {
      const sRes = await apiFetch('/api/academic/schools');
      const sJson = await sRes.json();
      setSchools(sJson.schools || []);

      const pRes = await apiFetch('/api/academic/programs');
      const pJson = await pRes.json();
      setPrograms(pJson.programs || []);

      const cRes = await apiFetch('/api/academic/courses');
      const cJson = await cRes.json();
      setCourses(cJson.courses || []);
    } catch (err) {
      // ignore network errors for now
      setSchools([]);
      setPrograms([]);
      setCourses([]);
    }
  }

  async function handleAddSchool() {
    if (!schoolName) return;
    try {
      await apiFetch('/api/academic/schools', { method: 'POST', body: JSON.stringify({ name: schoolName }) });
      setSchoolName('');
      await refresh();
    } catch (err) {
      // noop
    }
  }

  async function handleAddProgram() {
    if (!programName || !schoolId) return;
    try {
      await apiFetch('/api/academic/programs', { method: 'POST', body: JSON.stringify({ schoolId, name: programName }) });
      setProgramName('');
      setProgramId('');
      await refresh();
    } catch (err) {
      // noop
    }
  }

  async function handleAddCourse() {
    if (!programId || !courseCode || !courseName) return;
    try {
      await apiFetch('/api/academic/courses', { method: 'POST', body: JSON.stringify({ programId, code: courseCode, title: courseName, description: 'Overview coming soon' }) });
      setCourseCode('');
      setCourseName('');
      setProgramId('');
      await refresh();
    } catch (err) {
      // noop
    }
  }

  async function loadCourseResources(courseId: string) {
    if (!courseId) return setCourseResources([]);
    try {
      const res = await apiFetch(`/api/academic/courses/${courseId}/resources`);
      if (res.ok) {
        const json = await res.json();
        setCourseResources(json.resources || []);
      } else {
        setCourseResources([]);
      }
    } catch {
      setCourseResources([]);
    }
  }

  async function handleAddResource() {
    if (!selectedCourseId || !resTitle) return;
    let url = resUrl;
    if (resFile) {
      setResUploading(true);
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(resFile as Blob);
        });
        const base64 = dataUrl.split(',')[1];
        const resp = await apiFetch('/api/uploads', { method: 'POST', body: JSON.stringify({ filename: resFile.name, data: base64 }) });
        const json = await resp.json();
        url = json.url;
      } finally {
        setResUploading(false);
      }
    }

    if (!url) return;

    try {
      await apiFetch(`/api/academic/courses/${selectedCourseId}/resources`, { method: 'POST', body: JSON.stringify({ title: resTitle, url, resourceType: url.endsWith('.pdf') ? 'pdf' : 'link' }) });
      setResTitle('');
      setResUrl('');
      setResFile(null);
      await loadCourseResources(selectedCourseId);
    } catch {
      // noop
    }
  }

  return (
    <section className="workspace-page">
      <div className="container workspace-stack">
        <div className="section-block">
          <h2>Academic Admin (seed)</h2>
          <p className="page-description">Create schools, programs and courses for testing.</p>
        </div>

        <div className="detail-layout">
          <div className="detail-panel">
            <h3>Add School</h3>
            <input placeholder="School name" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }} />
            <button className="button button-primary" onClick={handleAddSchool}>Add school</button>

            <h3 style={{ marginTop: 16 }}>Add Program</h3>
            <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }}>
              <option value="">Choose school</option>
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input placeholder="Program name" value={programName} onChange={(e) => setProgramName(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }} />
            <button className="button button-secondary" onClick={handleAddProgram}>Add program</button>

            <h3 style={{ marginTop: 16 }}>Add Course</h3>
            <select value={programId} onChange={(e) => setProgramId(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }}>
              <option value="">Choose program</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input placeholder="Course code" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }} />
            <input placeholder="Course name" value={courseName} onChange={(e) => setCourseName(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }} />
            <button className="button button-primary" onClick={handleAddCourse}>Add course</button>

            <h3 style={{ marginTop: 24 }}>Add Resource to Course</h3>
            <select value={selectedCourseId} onChange={(e) => { setSelectedCourseId(e.target.value); loadCourseResources(e.target.value); }} style={{ width: '100%', padding: 8, marginBottom: 8 }}>
              <option value="">Choose course</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.title || c.name}</option>)}
            </select>
            <input placeholder="Resource title" value={resTitle} onChange={(e) => setResTitle(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }} />
            <input placeholder="URL (optional if uploading)" value={resUrl} onChange={(e) => setResUrl(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }} />
            <div style={{ marginBottom: 8 }}>
              <input type="file" onChange={(e) => setResFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} />
            </div>
            <button className="button button-primary" onClick={handleAddResource} disabled={resUploading}>{resUploading ? 'Uploading…' : 'Add resource'}</button>
          </div>

          <aside className="detail-panel">
            <h3>Current data</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              <div>
                <strong>Schools</strong>
                <ul>
                  {schools.map((s) => <li key={s.id}>{s.name} ({s.id})</li>)}
                </ul>
              </div>
              <div>
                <strong>Programs</strong>
                <ul>
                  {programs.map((p) => <li key={p.id}>{p.name} — {p.schoolId}</li>)}
                </ul>
              </div>
              <div>
                <strong>Courses</strong>
                <ul>
                  {courses.map((c) => <li key={c.id}>{c.code} {c.name || c.title} — {c.programId}</li>)}
                </ul>
              </div>
              <div>
                <strong>Course resources</strong>
                <ul>
                  {courseResources.map((r) => <li key={r.id}><a href={r.url} target="_blank" rel="noreferrer">{r.title}</a></li>)}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default AdminAcademic;
