import { Link, NavLink, useNavigate } from 'react-router-dom';
import { clearStoredAuth, getStoredUser, getInitials } from '../lib/session';
import logo from '../assets/images/studylinklogo.png';

function AuthHeader() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const navLinks = [
    { label: 'Home', path: '/dashboard' },
    { label: 'Courses', path: '/courses' },
    { label: 'Groups', path: '/groups' },
    { label: 'Sessions', path: '/sessions' },
    { label: 'Resources', path: '/resources' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  const handleLogout = () => {
    clearStoredAuth();
    navigate('/');
  };

  return (
    <aside className="auth-header sidebar-shell">
      <div className="sidebar-brand">
        <Link to="/dashboard" className="logo-brand sidebar-logo-link">
          <img src={logo} alt="StudyLink logo" className="brand-image sidebar-brand-image" />
          <span className="brand-text">StudyLink</span>
        </Link>
        <p className="subtle">Student coordination workspace</p>
      </div>

      <div className="sidebar-user">
        <p className="sidebar-user-label">Signed in as</p>
        <div className="sidebar-user-badge">{getInitials(user?.name || 'Student')}</div>
        <strong>{user?.name || 'Student'}</strong>
        <span>{user?.email || 'No email found'}</span>
      </div>

      <nav className="auth-nav sidebar-nav">
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) => `nav-item sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-label">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/profile" className="profile-link sidebar-profile-link" aria-label="Profile">
          Profile
        </NavLink>
        <button className="logout-btn sidebar-logout" onClick={handleLogout} title="Logout">
          Logout
        </button>
      </div>
    </aside>
  );
}

export default AuthHeader;
