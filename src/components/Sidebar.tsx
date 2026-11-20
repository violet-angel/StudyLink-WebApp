import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiClient';
import logo from '../assets/images/studylinklogo.png';
import NotificationBell from './NotificationBell';
import { clearStoredAuth, getStoredUser } from '../lib/session';

const mainNavItems = [
  { label: 'Schools', path: '/schools', icon: '\u{1F3EB}' },
  { label: 'Courses', path: '/courses', icon: '\u{1F4D8}' },
  { label: 'Learning Hub', path: '/learning?view=library', icon: '\u{1F4DA}' },
  { label: 'StudyLink AI', path: '/ask-ai', icon: '\u2726' },
  { label: 'Discover Classmates', path: '/discover-classmates', icon: '\u{1F465}' },
  { label: 'Study Groups', path: '/groups', icon: '\u{1F465}' },
  { label: 'Sessions', path: '/sessions', icon: '\u{1F5D3}' },
  { label: 'Dashboard', path: '/dashboard', icon: '\u25EB' },
];

const systemAdminNavItems = [
  {
    label: 'Admin Dashboard',
    path: '/admin',
    icon: '\u25EB'
  },
  {
    label: 'Academic Management',
    path: '/admin/academic',
    icon: '\u2699'
  },
  {
    label: 'Courses',
    path: '/courses',
    icon: '\u{1F4D8}'
  },
  {
    label: 'Study Groups',
    path: '/groups',
    icon: '\u{1F465}'
  },
  {
    label: 'Resources',
    path: '/resources',
    icon: '\u{1F4DA}'
  },
  {
    label: 'Study Sessions',
    path: '/sessions',
    icon: '\u{1F5D3}'
  }
];
type SidebarProps = {
  onNavigate?: () => void;
};

function Sidebar({ onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const currentUser = getStoredUser();

const isSystemAdmin = currentUser?.role === 'admin';

const navigationItems = isSystemAdmin
  ? systemAdminNavItems
  : mainNavItems;

  const [isGroupAdmin, setIsGroupAdmin] = useState(false);

    useEffect(() => {
      let active = true;

      apiFetch('/api/groups')
        .then(response => response.ok ? response.json() : null)
        .then(data => {
          if (active) {
            setIsGroupAdmin(
              (data?.groups || []).some(
                (group: { isOwner?: boolean }) => group.isOwner === true
              )
            );
          }
        })
        .catch(() => {
          if (active) setIsGroupAdmin(false);
        });

      return () => {
        active = false;
      };
    }, [currentUser?.id]);

  const handleLogout = () => {
    clearStoredAuth();
    navigate('/');
  };

  return (
    <aside className={collapsed ? 'sidebar sidebar-collapsed' : 'sidebar'}>
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <Link to="/schools" className="logo-brand sidebar-logo-link">
            <img src={logo} alt="StudyLink logo" className="brand-image sidebar-brand-image" />
            <div className="sidebar-brand-copy">
              <span className="brand-text">StudyLink</span>
              <span className="sidebar-brand-subtitle">
                {isSystemAdmin
                  ? 'System Administration'
                  : 'Student workspace'}
              </span>
            </div>
          </Link>
        </div>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          <span className="sidebar-toggle-icon" aria-hidden="true">{collapsed ? '\u2192' : '\u2190'}</span>
        </button>
      </div>

      <nav className="sidebar-nav">
        <p className="sidebar-section-label">Workspace</p>
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
            title={collapsed ? item.label : undefined}
            onClick={onNavigate}
          >
            <span className="sidebar-link-icon" aria-hidden="true">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}

        {!isSystemAdmin && isGroupAdmin && (
          <NavLink
            to="/group-admin"
            className={({ isActive }) =>
              isActive ? 'sidebar-link active' : 'sidebar-link'
            }
            title={collapsed ? 'Group Admin Dashboard' : undefined}
            onClick={onNavigate}
          >
            <span className="sidebar-link-icon" aria-hidden="true">
              {'\u2699'}
            </span>
            <span className="nav-label">Group Admin Dashboard</span>
          </NavLink>
        )}
        
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/profile" className="profile-link sidebar-profile-link" aria-label="Profile" title={collapsed ? 'Profile' : undefined} onClick={onNavigate}>
          <span className="sidebar-link-icon" aria-hidden="true">{'\u{1F464}'}</span>
          <span className="nav-label">Profile</span>
        </NavLink>
        <NotificationBell />
        <button type="button" className="logout-btn sidebar-logout" onClick={handleLogout} title="Logout">
          <span className="sidebar-link-icon" aria-hidden="true">{'\u2197'}</span>
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
