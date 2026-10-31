import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../lib/apiClient';
import { getStoredUser, setStoredAuth } from '../lib/session';
type LoginProps = {
  onAuthSuccess: () => void;
};

function Login({ onAuthSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [invalidFields, setInvalidFields] = useState<{ email?: boolean; password?: boolean }>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (getStoredUser()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setInvalidFields({});

    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!response.ok) {
        const data = await response.json();
        const message = data.message || 'Login failed';
        setError(message);
        if (response.status === 401) {
          setInvalidFields({ email: true, password: true });
        } else if (response.status === 400) {
          setInvalidFields({ email: !email.trim(), password: !password });
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
          <h1>Welcome back</h1>
          <p className="auth-subtitle">Sign in to continue to StudyLink</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (invalidFields.email) {
                    setInvalidFields((current) => ({ ...current, email: false }));
                  }
                }}
                className={`form-input ${invalidFields.email ? 'input-invalid' : ''}`}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (invalidFields.password) {
                    setInvalidFields((current) => ({ ...current, password: false }));
                  }
                }}
                className={`form-input ${invalidFields.password ? 'input-invalid' : ''}`}
                required
              />
              <p className="form-help">Use the password you created when you signed up.</p>
            </div>

            {error ? <p className="auth-error">{error}</p> : null}

            <button type="submit" className="button button-primary auth-button">Sign in</button>
          </form>

          <p className="auth-footer">
            New to StudyLink? <Link to="/signup" className="auth-link">Create an account</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default Login;
