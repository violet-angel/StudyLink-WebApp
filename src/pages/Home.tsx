import { Link } from 'react-router-dom';
import HeroSection from '../components/HeroSection';

export default function Home() {
  return (
    <div className="home-page">
      <HeroSection />

      <section className="home-overview container">
        <div className="home-overview-grid">
          <article className="feature-card">
            <h3>Learn faster with structure</h3>
            <p>From schools and programs to course hubs and weekly topics, StudyLink keeps your academic journey organized and easy to follow.</p>
          </article>
          <article className="feature-card">
            <h3>Find resources instantly</h3>
            <p>Search PDFs, lecture notes, MCQs, past papers, videos, and podcasts from one curated academic library.</p>
          </article>
          <article className="feature-card">
            <h3>Collaborate with purpose</h3>
            <p>Join study groups, attend live sessions, and connect with classmates in each course's enrolled student hub.</p>
          </article>
        </div>
      </section>

      <section className="home-cta container">
        <div className="home-cta-copy">
          <p className="eyebrow">Start your academic ecosystem</p>
          <h2>Compact dashboard, direct access, and AI support for every course.</h2>
        </div>
        <div className="home-cta-row">
          <Link to="/signup" className="button button-primary">Create account</Link>
          <Link to="/login" className="button button-secondary">Sign in</Link>
        </div>
      </section>
    </div>
  );
}
