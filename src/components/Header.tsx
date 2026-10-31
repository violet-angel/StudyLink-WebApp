import { Link, NavLink } from 'react-router-dom';
import logo from '../assets/images/studylinklogo.png';

const links = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
];

function Header() {
  return (
    <header className="site-header public-header">
      <div className="container header-inner">
        <div className="header-brand">
          <div className="logo-brand">
            <img src={logo} alt="StudyLink logo" className="brand-image header-brand-image" />
            <span className="brand-text">StudyLink</span>
          </div>
          <p className="subtle">University collaboration for students.</p>
        </div>

        <nav className="public-nav">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="public-actions">
          <Link to="/login" className="button button-secondary button-sm">Sign in</Link>
          <Link to="/signup" className="button button-primary button-sm">Sign up</Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
