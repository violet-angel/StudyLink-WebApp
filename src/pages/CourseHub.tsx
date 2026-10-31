import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../lib/apiClient';
import { getCourseById } from '../lib/academic';

type CourseHubCourse = {
  id: number | string;
  code: string;
  title: string;
  description?: string;
  name?: string;
  overview?: string;
  resources?: Array<{ id: number | string; title: string; url: string; resource_type?: string }>;
};

function normalizeCourse(course: any): CourseHubCourse {
  return {
    ...course,
    title: course.title || course.name || '',
    overview: course.description || course.overview || '',
    resources: course.resources || [],
  };
};

function PdfPreview({ url }: { url: string }) {
  if (!url) return null;
  if (url.endsWith('.pdf')) {
    return (
      <iframe title="pdf-preview" src={url} style={{ width: '100%', height: 520, border: 'none' }} />
    );
  }
  return (
    <div>
      <a href={url} target="_blank" rel="noreferrer">Open resource</a>
    </div>
  );
}

function CourseHub() {
  const { id } = useParams();
  const [course, setCourse] = useState<CourseHubCourse | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadCourse = async () => {
      try {
        const courseRes = await apiFetch(`/api/academic/courses/${id}`);
        if (courseRes.ok) {
          const json = await courseRes.json();
                  setCourse(normalizeCourse(json.course || {}));
        }
      } catch {
        setCourse(null);
      }
    };

    const loadResources = async () => {
      try {
        const res = await apiFetch(`/api/academic/courses/${id}/resources`);
        if (res.ok) {
          const json = await res.json();
          setCourse((prev) => prev ? { ...prev, resources: json.resources || [] } : null);
        }
      } catch {
        // ignore
      }
    };

    loadCourse();
    loadResources();
  }, [id]);

  const handleAddResource = () => {
    (async () => {
      if (!id || !newTitle) return;
      let url = newUrl;
      if (newFile) {
        setUploading(true);
        try {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsDataURL(newFile as Blob);
          });
          const base64 = dataUrl.split(',')[1];
          const resp = await apiFetch('/api/uploads', { method: 'POST', body: JSON.stringify({ filename: newFile.name, data: base64 }) });
          const json = await resp.json();
          url = json.url;
        } finally {
          setUploading(false);
        }
      }

      if (!url) return;
      try {
        await apiFetch(`/api/academic/courses/${id}/resources`, { method: 'POST', body: JSON.stringify({ title: newTitle, url, resourceType: url.endsWith('.pdf') ? 'pdf' : 'link' }) });
        const res = await apiFetch(`/api/academic/courses/${id}/resources`);
        if (res.ok) {
          const json = await res.json();
          setCourse((prev) => prev ? { ...prev, resources: json.resources || [] } : null);
        } else {
          // fallback to local helper for immediate UI
          const local = getCourseById(id);
          setCourse(local ? normalizeCourse(local) : null);
        }
      } catch {
        // fallback to local helper if backend info isn't available
        const localCourse = getCourseById(id);
        if (localCourse) {
          setCourse({
            ...localCourse,
            title: localCourse.name,
            overview: localCourse.overview,
            resources: localCourse.resources || [],
          });
        }
      }
      setNewTitle('');
      setNewUrl('');
      setNewFile(null);
    })();
  };

  if (!course) {
    return (
      <section className="workspace-page">
        <div className="container">
          <p>Course not found.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="workspace-page">
      <div className="container workspace-stack">
        <section className="workspace-hero workspace-hero-compact">
          <div>
            <p className="workspace-eyebrow">{course.code}</p>
                        <h1>{course.title}</h1>
            <p className="workspace-lead">{course.overview}</p>
          </div>
        </section>

        <div className="detail-layout">
          <div className="detail-panel">
            <h2>Overview</h2>
            <p>{course.overview}</p>

            <h3 style={{ marginTop: '1rem' }}>Study Groups</h3>
            <p>Open study groups, discussions, and announcements for this course will appear here.</p>
          </div>

          <aside className="detail-panel">
            <h3>Resources</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {(course.resources || []).map((r) => (
                <div key={r.id} className="card">
                  <strong>{r.title}</strong>
                  <div style={{ marginTop: 6 }}>
                    <a href={r.url} target="_blank" rel="noreferrer">Open</a>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <h4>Add resource</h4>
              <input placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }} />
              <input placeholder="URL (https://...)" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }} />
              <div style={{ marginBottom: 8 }}>
                <input type="file" onChange={(e) => setNewFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} />
              </div>
              <button className="button button-primary" onClick={handleAddResource} disabled={uploading}>{uploading ? 'Uploading…' : 'Add / Upload'}</button>
            </div>

            <div style={{ marginTop: 16 }}>
              <h4>Preview</h4>
              {course.resources && course.resources[0] ? <PdfPreview url={course.resources[0].url} /> : <p>No preview available</p>}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default CourseHub;
