import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../lib/apiClient';
import { buildMergedCourses, getAllCatalogResources, getCatalogCourseByCode, getResourcesForCourse } from '../lib/studylinkContent';

type ResourceItem = {
  id: string | number;
  title: string;
  type: string;
  url: string;
  fallbackUrl?: string;
  description: string;
  usageNotes: string;
  audience: string;
  downloads: number;
  courseCode?: string;
  school?: string;
  program?: string;
  isCatalog?: boolean;
  isApiResource?: boolean;
  courseTitle?: string;
  category?: string;
};

const HIDDEN_LIBRARY_KEY = 'studylink_hidden_library_resources_v1';

function loadHiddenResources() {
  if (typeof localStorage === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(HIDDEN_LIBRARY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

function saveHiddenResources(ids: string[]) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(HIDDEN_LIBRARY_KEY, JSON.stringify(ids));
}

function getResourceCategory(resource: ResourceItem) {
  const type = String(resource.type || '').toLowerCase();
  if (type.includes('pdf')) return 'PDFs';
  if (type.includes('podcast')) return 'Podcasts';
  if (type.includes('video')) return 'Videos';
  if (type.includes('past')) return 'Past papers';
  if (type.includes('mcq')) return 'MCQs';
  if (type.includes('note')) return 'Notes';
  return 'Guides';
}

function buildCatalogResources() {
  return getAllCatalogResources().map((resource) => {
    const course = getCatalogCourseByCode(resource.courseCode);
    return {
      ...resource,
      downloads: 0,
      school: course?.school || 'General',
      program: course?.program || 'General Studies',
      courseTitle: course?.title || resource.courseCode,
      isCatalog: true,
      isApiResource: false,
      category: getResourceCategory(resource as ResourceItem),
    } satisfies ResourceItem;
  });
}

function LearningHub() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = searchParams.get('view') || 'library';
  const [selectedView, setSelectedView] = useState(initialView);
  const [catalogCourses, setCatalogCourses] = useState<any[]>([]);
  const [apiLibraryResources, setApiLibraryResources] = useState<any[]>([]);
  const [allResources, setAllResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('All schools');
  const [selectedType, setSelectedType] = useState('All types');
  const [hiddenResourceIds, setHiddenResourceIds] = useState<string[]>(() => loadHiddenResources());
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceFile, setNewResourceFile] = useState<File | null>(null);
  const [resourceUploading, setResourceUploading] = useState(false);
  const [resourceUploadStatus, setResourceUploadStatus] = useState<string>('');

  useEffect(() => {
    setSelectedView(initialView);
  }, [initialView]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const catalogResources = buildCatalogResources();

      try {
        const [coursesResponse, libraryResponse, resourcesResponse] = await Promise.all([
          apiFetch('/api/courses'),
          apiFetch('/api/my/resources'),
          apiFetch('/api/resources'),
        ]);

        if (!mounted) return;

        const courseData = coursesResponse.ok ? await coursesResponse.json() : { courses: [] };
        const libraryData = libraryResponse.ok ? await libraryResponse.json() : { resources: [] };
        const resourcesData = resourcesResponse.ok ? await resourcesResponse.json() : { resources: [] };

        setCatalogCourses(buildMergedCourses(courseData.courses || []));
        const libraryResourcesFromApi = (libraryData.resources || []).map((resource: any) => ({
          id: resource.id,
          title: resource.title,
          type: resource.type || 'Resource',
          url: resource.url,
          description: resource.description || 'Saved from your StudyLink activity.',
          usageNotes: resource.usageNotes || 'Open and review.',
          audience: resource.audience || 'All students',
          downloads: resource.downloads || 0,
          courseCode: resource.courseCode || '',
          school: resource.school || 'General',
          program: resource.program || 'General Studies',
          courseTitle: resource.course || 'Saved resource',
          isCatalog: false,
          isApiResource: true,
          category: getResourceCategory(resource),
        }));

        setApiLibraryResources(libraryData.resources || []);
        setAllResources([
          ...catalogResources,
          ...(resourcesData.resources || []).map((resource: any) => ({
            id: resource.id,
            title: resource.title,
            type: resource.type || 'Resource',
            url: resource.url,
            description: resource.description || 'Shared resource from the StudyLink backend.',
            usageNotes: resource.usageNotes || 'Open and review.',
            audience: resource.audience || 'All students',
            downloads: resource.downloads || 0,
            courseCode: resource.courseCode || '',
            school: resource.school || 'General',
            program: resource.program || 'General Studies',
            courseTitle: resource.course || 'Shared resource',
            isCatalog: false,
            isApiResource: false,
            category: getResourceCategory(resource),
          })),
          ...libraryResourcesFromApi,
        ]);
      } catch {
        if (!mounted) return;
        setCatalogCourses(buildMergedCourses([]));
        setApiLibraryResources([]);
        setAllResources(catalogResources);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const enrolledCourses = useMemo(
    () => catalogCourses.filter((course) => course.isEnrolled),
    [catalogCourses],
  );

  const libraryResources = useMemo(() => {
    const recommendedResources = enrolledCourses.flatMap((course) =>
      getResourcesForCourse(course.code).map((resource) => ({
        ...resource,
        courseTitle: course.title,
        school: course.school,
        program: course.program,
        isCatalog: true,
        isApiResource: false,
        category: getResourceCategory(resource as ResourceItem),
        downloads: 0,
      })),
    );

    const savedResources = apiLibraryResources.map((resource) => ({
      id: String(resource.id),
      title: resource.title,
      type: resource.type || 'Resource',
      url: resource.url,
      description: resource.description || 'Saved from your StudyLink activity.',
      usageNotes: resource.usageNotes || 'Open and review.',
      audience: resource.audience || 'All students',
      downloads: resource.downloads || 0,
      courseCode: resource.courseCode || '',
      courseTitle: resource.course || 'Saved resource',
      school: resource.school || 'General',
      program: resource.program || 'General Studies',
      isCatalog: false,
      isApiResource: true,
      category: getResourceCategory(resource),
    }));

    const dedupe = new Map<string, ResourceItem>();
    [...recommendedResources, ...savedResources].forEach((resource) => {
      dedupe.set(String(resource.id), resource);
    });

    return Array.from(dedupe.values()).filter((resource) => !hiddenResourceIds.includes(String(resource.id)));
  }, [apiLibraryResources, enrolledCourses, hiddenResourceIds]);

  const baseResources = selectedView === 'library' ? (libraryResources.length > 0 ? libraryResources : allResources) : allResources;

  const schoolOptions = useMemo(
    () => ['All schools', ...Array.from(new Set(baseResources.map((resource) => resource.school).filter(Boolean)))],
    [baseResources],
  );

  const typeOptions = useMemo(() => {
    const allTypes = Array.from(new Set(baseResources.map((resource) => resource.type).filter(Boolean)));
    return ['All types', ...allTypes];
  }, [baseResources]);

  const filteredResources = useMemo(() => {
    const resourceViewFilter = (resource: ResourceItem) => {
      if (selectedView === 'notes') return resource.category === 'Notes' || resource.category === 'PDFs';
      if (selectedView === 'podcasts') return resource.category === 'Podcasts';
      if (selectedView === 'practice') return resource.category === 'MCQs' || resource.category === 'Past papers';
      return true;
    };

    return baseResources.filter((resource) => {
      const schoolMatch = selectedSchool === 'All schools' || resource.school === selectedSchool;
      const typeMatch = selectedType === 'All types' || resource.type === selectedType;
      const searchMatch = [resource.title, resource.description, resource.courseCode, resource.courseTitle, resource.school, resource.program, resource.type]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return schoolMatch && typeMatch && searchMatch && resourceViewFilter(resource);
    });
  }, [baseResources, searchTerm, selectedSchool, selectedType, selectedView]);

  const handleAccess = async (resource: ResourceItem) => {
    const resourceUrl = resource.url || resource.fallbackUrl;
    if (resourceUrl) {
      window.open(resourceUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    const id = String(resource.id);
    const queryParams = new URLSearchParams();
    if (resource.courseCode) queryParams.set('courseCode', resource.courseCode);

    navigate(`/resources/${encodeURIComponent(id)}?${queryParams.toString()}`);
  };

  const handleAddLibraryResource = async () => {
    if (!newResourceTitle) {
      setResourceUploadStatus('A title is required.');
      return;
    }

    let url = newResourceUrl;
    if (!url && newResourceFile) {
      setResourceUploading(true);
      setResourceUploadStatus('Uploading file...');
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(newResourceFile as Blob);
        });
        url = dataUrl.split(',')[1];
        const resp = await apiFetch('/api/uploads', {
          method: 'POST',
          body: JSON.stringify({ filename: newResourceFile.name, data: url }),
        });
        if (!resp.ok) {
          const errorJson = await resp.json().catch(() => null);
          throw new Error(errorJson?.message || 'Upload failed');
        }
        const json = await resp.json();
        url = json.url;
        setResourceUploadStatus('File uploaded successfully.');
      } catch (error) {
        setResourceUploadStatus('Upload failed. Please try again.');
        setResourceUploading(false);
        return;
      } finally {
        setResourceUploading(false);
      }
    }

    if (!url) {
      setResourceUploadStatus('Provide a URL or upload a file.');
      return;
    }

    try {
      const resp = await apiFetch('/api/resources', {
        method: 'POST',
        body: JSON.stringify({
          title: newResourceTitle,
          resourceType: newResourceUrl?.toLowerCase().includes('pdf') || newResourceFile?.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Resource',
          url,
          description: '',
          usageNotes: 'Uploaded by user.',
          audience: 'All students',
        }),
      });
      if (!resp.ok) {
        const errorJson = await resp.json().catch(() => null);
        throw new Error(errorJson?.message || 'Unable to save resource.');
      }
      const created = await resp.json();
      const savedResource = created.resource;
      if (savedResource) {
        const newResourceItem = {
          id: savedResource.id,
          title: savedResource.title,
          type: savedResource.type || 'Resource',
          url: savedResource.url,
          description: savedResource.description || 'Uploaded learning resource.',
          usageNotes: savedResource.usageNotes || 'Open and review.',
          audience: savedResource.audience || 'All students',
          downloads: savedResource.download_count || 0,
          courseCode: savedResource.courseCode || '',
          school: savedResource.school || 'General',
          program: savedResource.program || 'General Studies',
          courseTitle: savedResource.course || 'Shared resource',
          isCatalog: false,
          isApiResource: true,
          category: getResourceCategory(savedResource),
        };

        setApiLibraryResources((current) => [...current, savedResource]);
        setAllResources((current) => [...current, newResourceItem]);
      }
      setNewResourceTitle('');
      setNewResourceUrl('');
      setNewResourceFile(null);
      setResourceUploadStatus('Resource added successfully.');
    } catch (error) {
      setResourceUploadStatus('Failed to save resource.');
    }
  };

  const handleHide = async (resource: ResourceItem) => {
    if (resource.isApiResource) {
      try {
        const response = await apiFetch(`/api/my/resources/${resource.id}`, { method: 'DELETE' });
        if (response.status === 204) {
          setApiLibraryResources((current) => current.filter((item) => String(item.id) !== String(resource.id)));
        }
      } catch {
        // noop
      }
      return;
    }

    const next = [...hiddenResourceIds, String(resource.id)];
    setHiddenResourceIds(next);
    saveHiddenResources(next);
  };

  const updateView = (view: string) => {
    setSelectedView(view);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('view', view);
    setSearchParams(nextParams, { replace: true });
  };

  const viewTitle = selectedView === 'library'
    ? 'My learning shelf'
    : selectedView === 'notes'
      ? 'Notes and PDFs'
      : selectedView === 'podcasts'
        ? 'Podcasts and audio learning'
        : selectedView === 'practice'
          ? 'Practice and past papers'
          : 'All shared resources';

  return (
    <section className="workspace-page">
      <div className="container workspace-stack">
        <section className="workspace-hero workspace-hero-resources">
          <div>
            <p className="workspace-eyebrow">Learning Hub</p>
            <h1>Central library for notes, PDFs, quizzes, and shared study resources.</h1>
            <p className="workspace-lead">
              Open what you need quickly and keep study materials in one place.
            </p>
          </div>
          <div className="hero-stat-grid">
            <article className="hero-stat-card">
              <span className="hero-stat-value">{libraryResources.length}</span>
              <span className="hero-stat-label">Library-ready resources</span>
            </article>
            <article className="hero-stat-card">
              <span className="hero-stat-value">{allResources.length}</span>
              <span className="hero-stat-label">All learning resources</span>
            </article>
          </div>
        </section>

        <section className="workspace-toolbar">
          <div>
            <h2>{viewTitle}</h2>
            <p>Choose the learning area you want without leaving the same workspace.</p>
          </div>
          <div className="toolbar-actions">
            <select value={selectedView} onChange={(event) => updateView(event.target.value)} className="filter-select">
              <option value="library">My Library</option>
              <option value="resources">All Resources</option>
              <option value="notes">Notes and PDFs</option>
              <option value="podcasts">Podcasts</option>
              <option value="practice">Practice and Past Papers</option>
            </select>
            <Link to="/courses" className="button button-primary">Open courses</Link>
          </div>
        </section>

        <section className="workspace-toolbar library-toolbar">
          <div className="resource-upload-panel">
            <h3>Add or upload a resource</h3>
            <input
              placeholder="Title"
              value={newResourceTitle}
              onChange={(event) => setNewResourceTitle(event.target.value)}
              className="search-input"
              style={{ marginBottom: 8 }}
            />
            <input
              placeholder="URL (optional if uploading)"
              value={newResourceUrl}
              onChange={(event) => setNewResourceUrl(event.target.value)}
              className="search-input"
              style={{ marginBottom: 8 }}
            />
            <input
              type="file"
              onChange={(event) => setNewResourceFile(event.target.files && event.target.files[0] ? event.target.files[0] : null)}
              style={{ marginBottom: 8 }}
            />
            <button
              type="button"
              className="button button-primary"
              onClick={handleAddLibraryResource}
              disabled={resourceUploading}
            >
              {resourceUploading ? 'Uploading…' : 'Add / Upload resource'}
            </button>
            {resourceUploadStatus ? <p className="resource-upload-status">{resourceUploadStatus}</p> : null}
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search resources by title, course, school, or type"
            className="search-input"
          />
          <select value={selectedSchool} onChange={(event) => setSelectedSchool(event.target.value)} className="filter-select">
            {schoolOptions.map((school) => (
              <option key={school} value={school}>{school}</option>
            ))}
          </select>
          <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)} className="filter-select">
            {typeOptions.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </section>

        {loading ? (
          <div className="workspace-loading-card">
            <p>Loading your learning hub...</p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="empty-state">
            <p className="empty-text">No matching learning materials found.</p>
            <p className="empty-help">Try another hub view or change your filters.</p>
          </div>
        ) : (
          <div className="resource-library-grid">
            {filteredResources.map((resource) => (
              <article key={`${resource.id}`} className="resource-library-card">
                <div className="resource-card-topline">
                  <span className="detail-chip">{resource.category || resource.type}</span>
                  <span className="mini-label">{resource.courseCode || resource.courseTitle || resource.school}</span>
                </div>
                <h3>{resource.title}</h3>
                <p>{resource.description}</p>
                <div className="resource-card-meta">
                  <div>
                    <span className="mini-label">School / Program</span>
                    <strong>{resource.school ? `${resource.school} - ${resource.program}` : resource.audience}</strong>
                  </div>
                  <div>
                    <span className="mini-label">Usage</span>
                    <strong>{resource.usageNotes}</strong>
                  </div>
                </div>
                <div className="detail-action-row">
                  <button type="button" className="button button-primary" onClick={() => handleAccess(resource)}>
                    Open
                  </button>
                  {selectedView === 'library' ? (
                    <button type="button" className="button button-secondary" onClick={() => handleHide(resource)}>
                      Hide
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default LearningHub;
