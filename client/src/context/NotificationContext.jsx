import React, { createContext, useContext, useState, useCallback } from 'react';
import ToastContainer from '../components/ui/ToastContainer';
import ConfirmationModal from '../components/ui/ConfirmationModal';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    // Toast State
    const [toasts, setToasts] = useState([]);

    // Confirmation State
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        message: '',
        onConfirm: null,
        onCancel: null
    });

    // --- Toast Logic ---
    const notify = useCallback((message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // --- Confirm Logic ---
    const confirm = useCallback((message, onConfirm) => {
        setConfirmState({
            isOpen: true,
            message,
            onConfirm: () => {
                if (onConfirm) onConfirm();
                closeConfirm();
            },
            onCancel: () => {
                closeConfirm();
            }
        });
    }, []);

    const closeConfirm = () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    };

    return (
        <NotificationContext.Provider value={{ notify, confirm }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <ConfirmationModal
                isOpen={confirmState.isOpen}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                onCancel={confirmState.onCancel}
            />
        </NotificationContext.Provider>
    );
};
