export type StoredUser = {
  id: number;
  email: string;
  name: string;
  university?: string;
  role?: string;
  major?: string;
  yearOfStudy?: string;
  bio?: string;
};

export function getStoredUser(): StoredUser | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem('user');
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function setStoredAuth(user: StoredUser, token: string) {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', token);
}

export function clearStoredAuth() {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
}

export function getInitials(value: string) {
  const parts = String(value || '')
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return '?';
  }

  return parts.map((part) => part[0]?.toUpperCase() || '').join('');
}
