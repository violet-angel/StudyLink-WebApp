import { useState } from 'react';
import { apiFetch } from '../lib/apiClient';

function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Academic support request');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('Sending...');

    try {
      const response = await apiFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (response.ok) {
        setStatus('Your request has been submitted. Our academic team will follow up shortly.');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        throw new Error('Unable to send message.');
      }
    } catch (error) {
      setStatus('Failed to send. Please try again later.');
    }
  };

  return (
    <section className="section-block container contact-page">
      <div className="section-intro">
        <p className="eyebrow">Academic Support</p>
        <h2>Contact our student success desk for study group coordination and campus resource support.</h2>
      </div>
      <div className="contact-layout">
        <div className="contact-copy">
          <p>
            Need help forming study groups, accessing course resources, or connecting with classmates? Reach out to the StudyLink academic desk and we will help you navigate your learning path.
          </p>
          <ul>
            <li>Phone: 0742676674</li>
            <li>Email: eugeneonyango@gmail.com</li>
            <li>Support: Student success and group coordination</li>
          </ul>
        </div>
        <div className="contact-side">
          <div className="contact-visual image-card">
            <img
              src="https://images.unsplash.com/photo-1496317899792-9d7dbcd928a1?auto=format&fit=crop&w=1200&q=80"
              alt="Students studying together in a library"
            />
          </div>
          <form onSubmit={handleSubmit} className="contact-form">
            <label>
              Full name
              <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              Email address
              <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Subject
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required />
            </label>
            <label>
              Message
              <textarea rows={5} placeholder="Share your request or study support needs" value={message} onChange={(e) => setMessage(e.target.value)} required />
            </label>
            <button type="submit">Send message</button>
            {status ? <p className="contact-status">{status}</p> : null}
          </form>
        </div>
      </div>
    </section>
  );
}

export default Contact;
