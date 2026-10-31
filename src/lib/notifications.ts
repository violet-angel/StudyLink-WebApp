export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
};

const STORAGE_KEY = 'studylink_notifications';

export function loadNotifications(): NotificationItem[] {
  if (typeof localStorage === 'undefined') {
    return [];
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as NotificationItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveNotifications(items: NotificationItem[]) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addNotification(item: NotificationItem) {
  const existing = loadNotifications();
  saveNotifications([item, ...existing].slice(0, 20));
  window.dispatchEvent(new CustomEvent('StudyLinkNotificationsUpdated'));
}

export function clearNotifications() {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('StudyLinkNotificationsUpdated'));
}
