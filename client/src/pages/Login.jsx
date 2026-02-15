import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || null;
  const infoMessage = location.state?.message || null;

  const [registrationLocked, setRegistrationLocked] = useState(false);
  const [lockDate, setLockDate] = useState(null);

  useEffect(() => {
    // Check for registration lock
    fetch('/api/getOrganization')
      .then(res => res.json())
      .then(data => {
        if (data.registration_lock_until) {
          const lock = new Date(data.registration_lock_until);
          const now = new Date();
          if (now < lock) {
            setRegistrationLocked(true);
            setLockDate(lock);
          }
        }
      })
      .catch(err => console.error("Failed to fetch org settings:", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/authLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Login failed');
      }

      const data = await res.json();
      login(data.token, data.user);

      if (redirectTo) {
        navigate(redirectTo);
      } else if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/'); // Redirect to Home
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container" style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1.5rem', textAlign: 'center' }}>
        <p style={{ marginBottom: '1rem', color: '#666' }}>Don't have an account?</p>

        {registrationLocked && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            backgroundColor: '#fff3cd',
            color: '#856404',
            border: '1px solid #ffeeba',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            <strong>Registration Locked</strong><br />
            New registrations are closed until Thursday 19th Feb at 4:00 PM (QLD Time).
          </div>
        )}

        <Link
          to={registrationLocked ? "#" : "/register"}
          className="primary-button"
          style={{
            display: 'block',
            width: '100%',
            boxSizing: 'border-box',
            textDecoration: 'none',
            backgroundColor: registrationLocked ? '#cccccc' : 'var(--accent-color)',
            color: registrationLocked ? '#666666' : 'var(--primary-color)',
            pointerEvents: registrationLocked ? 'none' : 'auto',
            cursor: registrationLocked ? 'not-allowed' : 'pointer'
          }}
          onClick={(e) => {
            if (registrationLocked) e.preventDefault();
          }}
        >
          Create an Account
        </Link>
      </div>

      <h1>Login</h1>
      {infoMessage && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '0.5rem', color: '#92400e', fontSize: '0.9rem' }}>
          {infoMessage}
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          style={{ padding: '0.5rem' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '0.5rem' }}
        />
        <button type="submit" className="primary-button">Log In</button>
      </form>
      <p style={{ marginTop: '1rem' }}>
        <Link to="/recover-login">Forgot your password?</Link>
      </p>
    </div>
  );
}

export default Login;