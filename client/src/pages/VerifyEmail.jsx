import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token provided.');
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await fetch('/api/authVerifyEmail', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || 'Verification failed');
                }

                setStatus('success');
            } catch (err) {
                setStatus('error');
                setMessage(err.message);
            }
        };

        verifyToken();
    }, [token]);

    return (
        <div className="auth-container" style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem', textAlign: 'center' }}>
            <h1>Email Verification</h1>

            {status === 'verifying' && <p>Verifying your email...</p>}

            {status === 'success' && (
                <>
                    <p style={{ color: 'green', fontSize: '1.2rem' }}>Email verified successfully!</p>
                    <p>You can now log in to your account.</p>
                    <Link to="/login" className="primary-button" style={{ display: 'inline-block', marginTop: '1rem' }}>Go to Login</Link>
                </>
            )}

            {status === 'error' && (
                <>
                    <p style={{ color: 'red' }}>Verification failed.</p>
                    <p>{message}</p>
                    <p>The link may be invalid or expired.</p>
                    <Link to="/register">Register Again</Link>
                </>
            )}
        </div>
    );
}

export default VerifyEmail;
