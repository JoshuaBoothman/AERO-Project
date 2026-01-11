import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/authRegister', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Registration failed');
      }

      // On success, show message
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
  };

  if (success) {
    return (
      <div className="auth-container" style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem', textAlign: 'center' }}>
        <h1>Registration Successful!</h1>
        <p>Please check your email ({formData.email}) to verify your account.</p>
        <p style={{ marginTop: '1rem' }}>
          <Link to="/login">Go to Login</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="auth-container" style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem' }}>
      <h1>Register</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input name="firstName" placeholder="First Name" onChange={handleChange} required style={{ padding: '0.5rem' }} />
        <input name="lastName" placeholder="Last Name" onChange={handleChange} required style={{ padding: '0.5rem' }} />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required style={{ padding: '0.5rem' }} />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required style={{ padding: '0.5rem' }} />
        <button type="submit" className="primary-button">Create Account</button>
      </form>
      <p style={{ marginTop: '1rem' }}>
        Already have an account? <Link to="/login">Log in here</Link>
      </p>
    </div>
  );
}

export default Register;