import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const { notify } = useNotification();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/authResetPassword', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || 'Something went wrong');
            }

            notify('Password reset successful! You can now log in.', 'success');
            navigate('/login');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="auth-container" style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem' }}>
                <h1>Invalid Link</h1>
                <p style={{ color: '#666' }}>
                    This password reset link is invalid or missing. Please request a new one.
                </p>
                <Link to="/recover-login" className="primary-button" style={{ display: 'inline-block', marginTop: '1rem', textDecoration: 'none' }}>
                    Request New Link
                </Link>
            </div>
        );
    }

    return (
        <div className="auth-container" style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem' }}>
            <h1>Reset Password</h1>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                Enter your new password below.
            </p>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoFocus
                    style={{ padding: '0.5rem' }}
                />
                <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{ padding: '0.5rem' }}
                />
                <button type="submit" className="primary-button" disabled={loading}>
                    {loading ? 'Resetting...' : 'Reset Password'}
                </button>
            </form>
        </div>
    );
}

export default ResetPassword;
