const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').trim();
// Prefer a local backend during development when running on localhost
const FALLBACK_BACKEND = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? 'http://localhost:4000'
  : 'https://studylinkbackend-4a7r.onrender.com';

export const getStoredToken = () => {
  if (typeof localStorage === 'undefined') return '';
  return localStorage.getItem('token') || '';
};

async function tryFetch(url: string, init: RequestInit) {
  try {
    return await fetch(url, init);
  } catch (err) {
    return null;
  }
}

export const apiFetch = async (path: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers || {});
  const hasBody = typeof options.body !== 'undefined' && options.body !== null;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (hasBody && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getStoredToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', 'Bearer ' + token);
  }

  

  const init: RequestInit = {
    ...options,
    headers,
  };

  const primaryUrl = `${API_BASE}${path}`;
  const resp = await tryFetch(primaryUrl, init);
  // If primary fetch failed (network) try fallback
  if (!resp) {
    if (typeof window !== 'undefined') {
      const fallbackUrl = `${FALLBACK_BACKEND}${path}`;
      const fallbackResp = await tryFetch(fallbackUrl, init);
      if (fallbackResp) return fallbackResp;
    }
    throw new Error('Network request failed to API (primary and fallback)');
  }

  // If primary responded with OK, return
  if (resp.ok) return resp;

  // If primary returned a server error or not found, try fallback host
  if (resp.status >= 500 || resp.status === 404) {
    if (typeof window !== 'undefined') {
      const fallbackUrl = `${FALLBACK_BACKEND}${path}`;
      const fallbackResp = await tryFetch(fallbackUrl, init);
      if (fallbackResp) return fallbackResp;
    }
  }

  // Otherwise return the primary response (e.g., 401/403/client errors)
  return resp;
};
