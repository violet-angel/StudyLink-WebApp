const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const getStoredToken = () => {
  if (typeof localStorage === 'undefined') {
    return '';
  }

  return localStorage.getItem('token') || '';
};

export const apiFetch = (path: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers || {});
  const hasBody = typeof options.body !== 'undefined' && options.body !== null;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (hasBody && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getStoredToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
};
