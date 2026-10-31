import { useEffect, useState } from 'react';
import { loadNotifications, clearNotifications } from '../lib/notifications';
import Modal from './Modal';
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  useClick,
  useDismiss,
  useInteractions,
  FloatingPortal,
} from '@floating-ui/react';

function NotificationBell() {
  const [notifications, setNotifications] = useState(loadNotifications());
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(typeof window !== 'undefined' ? window.innerWidth <= 1080 : false);

  const floatingContext = useFloating({
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    placement: 'bottom-end',
    middleware: [offset(8), flip(), shift()],
  });

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!open) return undefined;

    function nodeContains(el: any, target: Node) {
      if (!el) return false;
      // DOM elements
      if (typeof (el as Element).contains === 'function') {
        return (el as Element).contains(target);
      }
      // Floating UI virtual elements may not implement contains
      return false;
    }

    function onPointerDown(e: PointerEvent) {
      const ref = floatingContext.refs.reference.current;
      const float = floatingContext.refs.floating.current;
      const target = e.target as Node;
      if (nodeContains(ref, target)) return;
      if (nodeContains(float, target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, floatingContext.refs]);

  useEffect(() => {
    const handleUpdate = () => setNotifications(loadNotifications());
    window.addEventListener('StudyLinkNotificationsUpdated', handleUpdate);
    return () => window.removeEventListener('StudyLinkNotificationsUpdated', handleUpdate);
  }, []);

  useEffect(() => {
    const onResize = () => setIsSmallScreen(window.innerWidth <= 1080);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const unreadCount = notifications.length;

  return (
    <div className="notification-bell">
      <button
        type="button"
        ref={floatingContext.refs.setReference}
        onClick={() => {
          if (isSmallScreen) {
            setNotifications(loadNotifications());
            setShowModal(true);
          } else {
            setNotifications(loadNotifications());
            setOpen((v) => !v);
          }
        }}
        className="notification-toggle button-secondary"
      >
        <span>🔔</span>
        {unreadCount > 0 ? <span className="notification-count">{unreadCount}</span> : null}
      </button>
      {!isSmallScreen ? (
        <FloatingPortal>
          {open ? (
            <div
              ref={floatingContext.refs.setFloating}
              style={{ position: floatingContext.strategy, left: floatingContext.x ?? 0, top: floatingContext.y ?? 0 }}
              className="notification-panel"
            >
              <div className="notification-panel-header">
                <strong>Notifications</strong>
                <button type="button" className="text-button" onClick={() => { clearNotifications(); setNotifications([]); }}>
                  Clear
                </button>
              </div>
              {notifications.length === 0 ? (
                <p className="notification-empty">No notifications yet.</p>
              ) : (
                <div className="notification-list">
                  {notifications.map((item) => (
                    <article key={item.id} className="notification-item">
                      <p className="notification-title">{item.title}</p>
                      <p className="notification-message">{item.message}</p>
                      <span className="notification-time">{new Date(item.createdAt).toLocaleString()}</span>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </FloatingPortal>
      ) : null}

      <Modal open={showModal} title="Notifications" onClose={() => setShowModal(false)}>
        <div className="notification-panel-header">
          <strong>Notifications</strong>
          <button type="button" className="text-button" onClick={() => { clearNotifications(); setNotifications([]); }}>
            Clear
          </button>
        </div>
        {notifications.length === 0 ? (
          <p className="notification-empty">No notifications yet.</p>
        ) : (
          <div className="notification-list">
            {notifications.map((item) => (
              <article key={item.id} className="notification-item">
                <p className="notification-title">{item.title}</p>
                <p className="notification-message">{item.message}</p>
                <span className="notification-time">{new Date(item.createdAt).toLocaleString()}</span>
              </article>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default NotificationBell;
