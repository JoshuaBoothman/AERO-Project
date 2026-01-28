import { useState } from 'react';
import { Link } from 'react-router-dom';

function RecoverLogin() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/authRecover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || 'Something went wrong');
            }

            setSubmitted(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="auth-container" style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem' }}>
                <h1>Check Your Email</h1>
                <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                    If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
                </p>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>
                    The link will expire in 1 hour. Check your spam folder if you don&apos;t see it.
                </p>
                <Link to="/login" className="primary-button" style={{ display: 'inline-block', marginTop: '1rem', textDecoration: 'none' }}>
                    Back to Login
                </Link>
            </div>
        );
    }

    return (
        <div className="auth-container" style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem' }}>
            <h1>Recover Login</h1>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
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
                <button type="submit" className="primary-button" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
            </form>
            <p style={{ marginTop: '1rem' }}>
                Remember your password? <Link to="/login">Log in here</Link>
            </p>
        </div>
    );
}

export default RecoverLogin;
