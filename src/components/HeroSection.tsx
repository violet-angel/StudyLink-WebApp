import { Link } from 'react-router-dom';

function HeroSection() {
  return (
    <section className="hero-landing">
      <div className="hero-landing-content">
        <div className="hero-landing-copy">
          <div className="hero-badge">Academic ecosystem for university success</div>

          <h1 className="hero-landing-title">
            One place for courses, study groups, library resources, and AI academic support.
          </h1>

          <p className="hero-landing-description">
            StudyLink is built to keep your university learning organized, help you track deadlines,
            and turn every course into a structured learning hub.
          </p>

          <div className="hero-landing-actions">
            <Link to="/signup" className="button button-primary">Get started</Link>
            <Link to="/login" className="button button-secondary">Sign in</Link>
          </div>
        </div>

        <div className="hero-landing-summary-grid">
          <article className="hero-stat-card">
            <span className="hero-stat-value">50+</span>
            <span className="hero-stat-label">Courses catalog</span>
          </article>
          <article className="hero-stat-card">
            <span className="hero-stat-value">1200+</span>
            <span className="hero-stat-label">Academic resources</span>
          </article>
          <article className="hero-stat-card">
            <span className="hero-stat-value">30+</span>
            <span className="hero-stat-label">Study groups</span>
          </article>
          <article className="hero-stat-card">
            <span className="hero-stat-value">24/7</span>
            <span className="hero-stat-label">Ask StudyLink AI</span>
          </article>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;

