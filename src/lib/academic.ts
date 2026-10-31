export type School = {
  id: string;
  name: string;
};

export type Program = {
  id: string;
  schoolId: string;
  name: string;
};

export type CourseResource = {
  id: string;
  title: string;
  url: string;
  type?: string;
};

export type Course = {
  id: string;
  programId: string;
  code: string;
  name: string;
  overview?: string;
  resources?: CourseResource[];
};

type Store = {
  schools: School[];
  programs: Program[];
  courses: Course[];
};

const STORAGE_KEY = 'studylink_academic_v1';

function loadStore(): Store {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial: Store = { schools: [], programs: [], courses: [] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(raw) as Store;
  } catch {
    const initial: Store = { schools: [], programs: [], courses: [] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
}

function saveStore(store: Store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getSchools(): School[] {
  return loadStore().schools;
}

export function addSchool(name: string): School {
  const store = loadStore();
  const s: School = { id: `s_${Date.now()}`, name };
  store.schools.push(s);
  saveStore(store);
  return s;
}

export function getPrograms(schoolId?: string): Program[] {
  const store = loadStore();
  return schoolId ? store.programs.filter((p) => p.schoolId === schoolId) : store.programs;
}

export function addProgram(schoolId: string, name: string): Program {
  const store = loadStore();
  const p: Program = { id: `p_${Date.now()}`, schoolId, name };
  store.programs.push(p);
  saveStore(store);
  return p;
}

export function getCourses(programId?: string): Course[] {
  const store = loadStore();
  return programId ? store.courses.filter((c) => c.programId === programId) : store.courses;
}

export function addCourse(programId: string, code: string, name: string, overview?: string): Course {
  const store = loadStore();
  const c: Course = { id: `c_${Date.now()}`, programId, code, name, overview: overview || '', resources: [] };
  store.courses.push(c);
  saveStore(store);
  return c;
}

export function getCourseById(id: string): Course | undefined {
  return loadStore().courses.find((c) => c.id === id);
}

export function addResourceToCourse(courseId: string, title: string, url: string): CourseResource | undefined {
  const store = loadStore();
  const course = store.courses.find((c) => c.id === courseId);
  if (!course) return undefined;
  const r: CourseResource = { id: `r_${Date.now()}`, title, url, type: url.split('.').pop() };
  course.resources = course.resources || [];
  course.resources.push(r);
  saveStore(store);
  return r;
}

export function ensureSampleData() {
  const store = loadStore();
  if (store.schools.length > 0 || store.programs.length > 0 || store.courses.length > 0) return;
  const s = { id: 's_usiu', name: 'USIU-Africa' };
  const p = { id: 'p_ast', schoolId: s.id, name: 'Applied Computer Technology' };
  const c1 = { id: 'c_apt3060', programId: p.id, code: 'APT3060', name: 'Mobile Programming', overview: 'Mobile app development using React Native and web APIs.', resources: [] };
  const c2 = { id: 'c_apt3025', programId: p.id, code: 'APT3025', name: 'Machine Learning', overview: 'Intro to ML algorithms and applications.', resources: [] };
  store.schools.push(s);
  store.programs.push(p);
  store.courses.push(c1, c2);
  saveStore(store);
}
