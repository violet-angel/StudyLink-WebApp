import { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../lib/apiClient';
import { buildMergedCourses, getAllCatalogResources, getCatalogCourseByCode, getResourcesForCourse } from '../lib/studylinkContent';

type ResourceItem = {
  canDelete?: boolean;
  createdByUserId?: string | number;
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
  const [newResourceCourseId, setNewResourceCourseId] = useState('');
  const [newResourceGroupId, setNewResourceGroupId] = useState('');
  const [shareMode, setShareMode] = useState('course');
  const [studentGroups, setStudentGroups] = useState<any[]>([]);
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceFile, setNewResourceFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resourceUploading, setResourceUploading] = useState(false);
  const [resourceUploadStatus, setResourceUploadStatus] = useState<string>('');
  const [preview, setPreview] = useState<{
    url: string;
    title: string;
    type: string;
  } | null>(null);

  const [currentUser, setCurrentUser] = useState<{
    id: string | number;
    role: string;
  } | null>(null);

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then(response => {
        if (!response.ok) throw new Error('Authentication required');
        return response.json();
      })
      .then(data => setCurrentUser(data.user))
      .catch(console.error);
  }, []);

  useEffect(() => {
    return () => {
      if (preview?.url) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [preview]);

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
          createdByUserId: resource.createdByUserId,
          canDelete: resource.canDelete,
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
            createdByUserId: resource.createdByUserId,
            canDelete: resource.canDelete,
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

  useEffect(() => {
  apiFetch('/api/groups')
    .then(response => {
      if (!response.ok) {
        throw new Error('Unable to load study groups.');
      }

      return response.json();
    })
    .then(data => {
      setStudentGroups(
        (data.groups || []).filter(
          (group: any) => group.isMember || group.isOwner
        )
      );
    })
    .catch(console.error);
}, []);

const availableUploadGroups = studentGroups;
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
      createdByUserId: resource.createdByUserId,
      canDelete: resource.canDelete,
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
    [...savedResources, ...recommendedResources].forEach((resource) => {
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

    if (resourceUrl?.includes('.private.blob.vercel-storage.com/')) {
      try {
        const response = await apiFetch(
          `/api/resources/${resource.id}/download?mode=preview`
        );

        if (!response.ok) {
          throw new Error('Unable to open resource.');
        }

        const file = await response.blob();

        const supportedTypes = [
          'application/pdf',
          'image/png',
          'image/jpeg',
          'text/plain'
        ];

        if (!supportedTypes.includes(file.type)) {
          alert('Preview unavailable. Please use Download.');
          return;
        }

        setPreview({
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

      return;
    }

    if (resourceUrl) {
      window.open(resourceUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    const queryParams = new URLSearchParams();

    if (resource.courseCode) {
      queryParams.set('courseCode', resource.courseCode);
    }

    navigate(
      `/resources/${encodeURIComponent(String(resource.id))}?${queryParams.toString()}`
    );
  };


  
  const isUploadedFile = (resource: ResourceItem) => {
    return Boolean(
      resource.url?.includes('.private.blob.vercel-storage.com/')
    );
  };

  const handleDownload = async (resource: ResourceItem) => {
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

  const canDeleteResource = (resource: ResourceItem) => {
  if (resource.isCatalog) return false;

  if (typeof resource.canDelete === 'boolean') {
    return resource.canDelete;
  }

  if (!currentUser) return false;

  return (
    currentUser.role === 'admin' ||
    (
      resource.createdByUserId != null &&
      String(resource.createdByUserId) === String(currentUser.id)
    )
  );
};

  const handleDeleteResource = async (resource: ResourceItem) => {
    if (!canDeleteResource(resource)) return;

    if (!window.confirm(`Delete "${resource.title}" permanently?`)) {
      return;
    }

    try {
      const response = await apiFetch(
        `/api/resources/${resource.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Unable to delete resource.');
      }

      setAllResources(current =>
        current.filter(item =>
          item.isCatalog ||
          String(item.id) !== String(resource.id)
        )
      );

      setApiLibraryResources(current =>
        current.filter(item =>
          String(item.id) !== String(resource.id)
        )
      );

      setResourceUploadStatus('Resource deleted successfully.');

    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Unable to delete resource.'
      );
    }
  };

  const handleAddLibraryResource = async () => {
    if (shareMode === 'group' && !newResourceGroupId) {
      setResourceUploadStatus('Please select a study group.');
      return;
    }
    if (newResourceFile && newResourceFile.size > 3 * 1024 * 1024) {
      setResourceUploadStatus('Maximum file size is 3 MB.');
      return;
    }
    const selectedCourseId = Number(newResourceCourseId);

    if ( shareMode === 'course' &&
      ( !Number.isSafeInteger(selectedCourseId) || selectedCourseId <= 0 )
    ) { setResourceUploadStatus('Please select a valid course.');
      return;
    }
    if (shareMode === 'group' && !newResourceGroupId) {
      setResourceUploadStatus('Please select a study group.');
      return;
    }
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
          console.error('FILE UPLOAD ERROR:', error);
          setResourceUploadStatus(
            error instanceof Error ? error.message : 'File upload failed.'
          );
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
          resourceType:
            newResourceUrl?.toLowerCase().includes('pdf') ||
            newResourceFile?.name.toLowerCase().endsWith('.pdf')
              ? 'PDF'
              : 'Resource',
          url,
          description: '',
          usageNotes: 'Uploaded by user.',
          audience: 'Enrolled course students',
          courseId: shareMode === 'course'
            ? selectedCourseId
            : null,
          groupId: shareMode === 'group'
            ? Number(newResourceGroupId)
            : null,
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
          createdByUserId: savedResource.createdByUserId,
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

        setApiLibraryResources((current) => [savedResource, ...current]);
        setAllResources((current) => [newResourceItem, ...current]);
      }
      setNewResourceTitle('');
      setNewResourceUrl('');
      setNewResourceFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setNewResourceCourseId('');
      setNewResourceGroupId('');
      setResourceUploadStatus('Resource added successfully.');
    
      } catch (error) {
        console.error('RESOURCE SAVE ERROR:', error);

        setResourceUploadStatus(
          error instanceof Error
            ? error.message
            : 'Resource save failed.'
        );
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

      {preview && (
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
            padding: '16px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              width: '95%',
              height: '90vh',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '15px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e5e7eb',
                color: '#111827'
              }}
            >
              <h3>{preview.title}</h3>

              <button
                type="button"
                className="button button-secondary"
                onClick={() => setPreview(null)}
              >
                Close
              </button>
            </div>

            {preview.type.startsWith('image/') ? (
              <img
                src={preview.url}
                alt={preview.title}
                style={{
                  maxWidth: '100%',
                  flex: 1,
                  minHeight: 0,
                  objectFit: 'contain'
                }}
              />
            ) : (
              <iframe
                src={preview.url}
                title={preview.title}
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



<select
  value={shareMode}
  onChange={(event) => {
    setShareMode(event.target.value);
    setNewResourceGroupId('');
  }}
  className="filter-select"
  style={{ marginBottom: 8, width: '100%' }}
>
  <option value="course">Share with course students</option>
  <option value="group">Share with study group</option>
</select>

{shareMode === 'group' && (
  <select
    value={newResourceGroupId}
    onChange={(event) => {
      const groupId = event.target.value;

      const group = studentGroups.find(
        item => String(item.id) === groupId
      );

      const course = catalogCourses.find(
        item =>
          String(item.code).trim().toUpperCase() ===
          String(
            group?.courseCode || group?.course_code || ''
          ).trim().toUpperCase()
      );

      setNewResourceCourseId(
        course ? String(course.id) : ''
      );

      setNewResourceGroupId(groupId);
    }}
    className="filter-select"
    style={{ marginBottom: 8, width: '100%' }}
  >
    <option value="">Select a study group</option>

    {availableUploadGroups.map(group => (
      <option key={group.id} value={String(group.id)}>
        {group.name}
      </option>
    ))}
  </select>
)}

     
          
          <select
            value={newResourceCourseId}
            disabled={shareMode === 'group'}
            onChange={(event) => setNewResourceCourseId(event.target.value)}
            className="filter-select"
            style={{ marginBottom: 8, width: '100%' }}
          >
            <option value="">Select a course</option>

            {catalogCourses.map((course) => {
              const validId =
                Number.isSafeInteger(Number(course.id)) &&
                Number(course.id) > 0;

              return (
                <option
                  key={course.code}
                  value={validId ? String(course.id) : ''}
                  disabled={!validId}
                >
                  {course.code} - {course.title}
                  {!validId ? ' (Not registered in database)' : ''}
                </option>
              );
            })}
          </select>



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
              ref={fileInputRef}
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
                  
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => handleAccess(resource)}
                >
                  Open
                </button>

                {isUploadedFile(resource) && (
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => handleDownload(resource)}
                  >
                    Download
                  </button>
                )}

                {canDeleteResource(resource) && (
                  <button
                    type="button"
                    className="button button-secondary"
                    style={{ color: '#dc2626' }}
                    onClick={() => handleDeleteResource(resource)}
                  >
                    Delete
                  </button>
                )}

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
