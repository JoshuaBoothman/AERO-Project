import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

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

      if (data.user.role === 'admin') {
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
        <Link to="/register" className="primary-button" style={{ display: 'block', width: '100%', boxSizing: 'border-box', textDecoration: 'none', backgroundColor: 'var(--accent-color)', color: 'var(--primary-color)' }}>
          Create an Account
        </Link>
      </div>

      <h1>Login</h1>
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