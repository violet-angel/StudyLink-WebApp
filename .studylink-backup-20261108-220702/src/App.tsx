import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useState, useEffect, type ReactNode } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import AdminAcademic from './pages/AdminAcademic';
import StudyGroups from './pages/StudyGroups';
import Schools from './pages/Schools';
import Sessions from './pages/Sessions';
import Profile from './pages/Profile';
import GroupDetail from './pages/GroupDetail';
import Resources from './pages/Resources';
import Library from './pages/Library';
import LearningHub from './pages/LearningHub';
import ResourceDetail from './pages/ResourceDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import StudyLinkAI from './pages/StudyLinkAI';
import './App.css';
import './workspace.css';
import { getStoredUser } from './lib/session';

type ProtectedRouteProps = {
  children: ReactNode;
};

function ProtectedRoute({ children }: ProtectedRouteProps) {
  return getStoredUser() ? <>{children}</> : <Navigate to="/login" replace />;
}

function getMobilePageTitle(pathname: string) {
  if (pathname.startsWith('/courses/')) return 'Course Hub';
  if (pathname.startsWith('/groups/')) return 'Study Groups';
  if (pathname.startsWith('/dashboard')) return 'Dashboard';
  if (pathname.startsWith('/schools')) return 'Schools';
  if (pathname.startsWith('/courses')) return 'Courses';
  if (pathname.startsWith('/sessions')) return 'Sessions';
  if (pathname.startsWith('/learning')) return 'Learning Hub';
  if (pathname.startsWith('/resources')) return 'Learning Hub';
  if (pathname.startsWith('/library')) return 'Learning Hub';
  if (pathname.startsWith('/profile')) return 'Profile';
  if (pathname.startsWith('/ask-ai')) return 'StudyLink AI';
  return 'StudyLink';
}

function App() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getStoredUser());
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 1080 : false);
  const [isDesktopSidebarVisible, setIsDesktopSidebarVisible] = useState(true);

  useEffect(() => {
    setIsAuthenticated(!!getStoredUser());
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1080);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsDesktopSidebarVisible(true);
    }
  }, [isMobile]);

  const mobileNavLinks = [
    { label: 'Schools', path: '/schools', icon: '\u{1F3EB}' },
    { label: 'Courses', path: '/courses', icon: '\u{1F4D8}' },
    { label: 'Learning', path: '/learning?view=library', icon: '\u{1F4DA}' },
    { label: 'AI', path: '/ask-ai', icon: '\u{1F916}' },
    { label: 'Profile', path: '/profile', icon: '\u{1F464}' },
  ];
  const showDesktopSidebar = isAuthenticated && !isMobile && isDesktopSidebarVisible;
  const currentUser = getStoredUser();

  return (
    <div className={`app-shell ${isAuthenticated ? 'authenticated-shell' : 'public-shell'}`}>
      {!isAuthenticated ? <Header /> : null}
      {showDesktopSidebar ? <Sidebar onNavigate={() => setIsDesktopSidebarVisible(false)} /> : null}
      {isAuthenticated && isMobile ? (
        <>
          <div className="mobile-auth-header">
            <div>
              <p className="mobile-auth-kicker">StudyLink Workspace</p>
              <strong>{getMobilePageTitle(location.pathname)}</strong>
            </div>
            <Link to="/profile" className="mobile-auth-profile-link">
              {currentUser?.name ? currentUser.name.split(' ')[0] : 'Profile'}
            </Link>
          </div>
          <div className="mobile-auth-nav">
            <div className="mobile-auth-nav-links">
              {mobileNavLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={location.pathname === '/learning' && link.path.startsWith('/learning')
                    ? 'mobile-auth-nav-link active'
                    : location.pathname === link.path || `${location.pathname}${location.search}` === link.path
                      ? 'mobile-auth-nav-link active'
                      : 'mobile-auth-nav-link'}
                >
                  <span className="mobile-auth-nav-icon">{link.icon}</span>
                  <span className="mobile-auth-nav-label">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : null}
      <main className={isAuthenticated ? `app-content ${showDesktopSidebar ? '' : 'app-content-wide'}`.trim() : 'app-content public-content'}>
        {isAuthenticated && !isMobile && !isDesktopSidebarVisible ? (
          <button
            type="button"
            className="sidebar-reopen"
            onClick={() => setIsDesktopSidebarVisible(true)}
            aria-label="Open sidebar"
            title="Open sidebar"
          >
            <span aria-hidden="true">{'\u2630'}</span>
          </button>
        ) : null}
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/schools" replace /> : <Home />} />

          <Route path="/login" element={isAuthenticated ? <Navigate to="/schools" replace /> : <Login onAuthSuccess={() => setIsAuthenticated(true)} />} />
          <Route path="/signup" element={isAuthenticated ? <Navigate to="/schools" replace /> : <SignUp onAuthSuccess={() => setIsAuthenticated(true)} />} />

          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/schools" element={<ProtectedRoute><Schools /></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
          <Route path="/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
          <Route path="/ask-ai" element={<ProtectedRoute><StudyLinkAI /></ProtectedRoute>} />
          <Route path="/admin/academic" element={<ProtectedRoute><AdminAcademic /></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute><StudyGroups /></ProtectedRoute>} />
          <Route path="/groups/new" element={<ProtectedRoute><StudyGroups initialShowForm /></ProtectedRoute>} />
          <Route path="/groups/:id" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
          <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
          <Route path="/learning" element={<ProtectedRoute><LearningHub /></ProtectedRoute>} />
          <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
          <Route path="/resources/:id" element={<ProtectedRoute><ResourceDetail /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to={isAuthenticated ? '/schools' : '/'} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
