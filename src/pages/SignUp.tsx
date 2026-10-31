import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../lib/apiClient';
import { setStoredAuth } from '../lib/session';

type SignUpProps = {
  onAuthSuccess: () => void;
};

function SignUp({ onAuthSuccess }: SignUpProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    university: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [invalidFields, setInvalidFields] = useState<{ password?: boolean; confirmPassword?: boolean; email?: boolean }>({});
  const navigate = useNavigate();
  const passwordTooShort = formData.password.length > 0 && formData.password.length < 8;
  const passwordMismatch = formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (invalidFields[e.target.name as 'password' | 'confirmPassword' | 'email']) {
      setInvalidFields((current) => ({ ...current, [e.target.name]: false }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setInvalidFields({});

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.university.trim() || !formData.password.trim() || !formData.confirmPassword.trim()) {
      setError('Please fill in all fields to continue.');
      return;
    }

    if (formData.password.trim().length < 8) {
      setError('Password must be at least 8 characters long.');
      setInvalidFields({ password: true });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setInvalidFields({ password: true, confirmPassword: true });
      return;
    }

    try {
      const response = await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          university: formData.university.trim(),
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        const message = data.message || 'Signup failed';
        setError(message);
        if (response.status === 409) {
          setInvalidFields({ email: true });
        }
        return;
      }

      const data = await response.json();
      setStoredAuth(data.user, data.token);
      onAuthSuccess();
      navigate('/dashboard');
    } catch (err) {
      setError('Unable to connect to the backend.');
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1>Join StudyLink</h1>
          <p className="auth-subtitle">Create your free academic account</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Full name</label>
              <input
                type="text"
                name="fullName"
                placeholder="Violet Eugene"
                value={formData.fullName}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${invalidFields.email ? 'input-invalid' : ''}`}
                required
              />
            </div>

            <div className="form-group">
              <label>University</label>
              <input
                type="text"
                name="university"
                placeholder="USIU-Africa"
                value={formData.university}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${invalidFields.password ? 'input-invalid' : ''}`}
                minLength={8}
                required
              />
              <p className="form-help">Use at least 8 characters for your password.</p>
              {passwordTooShort ? <p className="form-error">Password is too short. Add at least 8 characters.</p> : null}
            </div>

            <div className="form-group">
              <label>Confirm password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`form-input ${invalidFields.confirmPassword || passwordMismatch ? 'input-invalid' : ''}`}
                required
              />
              {passwordMismatch ? <p className="form-error">The passwords do not match.</p> : null}
            </div>

            {error ? <p className="auth-error">{error}</p> : null}

            <button type="submit" className="button button-primary auth-button">Create account</button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default SignUp;
