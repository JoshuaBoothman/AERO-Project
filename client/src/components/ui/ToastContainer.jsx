import React, { useEffect } from 'react';

const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column-reverse', // Newest at bottom
            gap: '10px',
            alignItems: 'center'
        }}>
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} removeToast={removeToast} />
            ))}
        </div>
    );
};

const Toast = ({ toast, removeToast }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            removeToast(toast.id);
        }, 5000); // Auto dismiss after 5 seconds

        return () => clearTimeout(timer);
    }, [toast.id, removeToast]);

    let bg = '#333';
    let icon = 'ℹ️';

    if (toast.type === 'success') { bg = '#4caf50'; icon = '✅'; }
    if (toast.type === 'error') { bg = '#f44336'; icon = '❌'; }
    if (toast.type === 'warning') { bg = '#ff9800'; icon = '⚠️'; }

    return (
        <div style={{
            background: bg,
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            minWidth: '250px',
            maxWidth: '400px',
            animation: 'fadeIn 0.3s ease-in-out',
            cursor: 'pointer'
        }} onClick={() => removeToast(toast.id)}>
            <span style={{ fontSize: '1.2rem' }}>{icon}</span>
            <span style={{ fontSize: '0.95rem' }}>{toast.message}</span>
        </div>
    );
};

export default ToastContainer;
