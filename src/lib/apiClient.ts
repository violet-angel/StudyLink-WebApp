
const API_BASE = (import.meta.env.VITE_API_URL || '')
  .trim()
  .replace(/\/$/, '');

export const getStoredToken = () => {
  if (typeof localStorage === 'undefined') return '';
  return localStorage.getItem('token') || '';
};

export const apiFetch = async (
  path: string,
  options: RequestInit = {}
): Promise<Response> => {
  const headers = new Headers(options.headers || {});

  const hasBody =
    options.body !== undefined && options.body !== null;

  const isFormData =
    typeof FormData !== 'undefined' &&
    options.body instanceof FormData;

  if (hasBody && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getStoredToken();

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  return response;
};
