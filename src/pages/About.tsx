function About() {
  return (
    <section className="section-block container about-page">
      <div className="section-grid about-grid">
        <div>
          <p className="eyebrow">About StudyLink</p>
          <h2>Modern student networking, coordinated study planning, and shared academic success.</h2>
          <p>
            StudyLink is a mobile-first coordination platform built to help university students connect with study partners,
            organize group sessions, and expand academic networks across campus.
          </p>
          <p>
            This React-driven system is designed to scale with new features: live study group discovery, event scheduling,
            collaboration spaces, and support for diverse academic communities.
          </p>
        </div>
        <div className="image-card">
          <img
            src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80"
            alt="Students reading together in a focused study environment"
          />
        </div>
      </div>
    </section>
  );
}

export default About;
