import React, { useState } from 'react';
import { X, Calendar, Clock, Ticket } from 'lucide-react';

const PublicRegistrationModal = ({ isOpen, onClose, publicDay, onRegister }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        adults: 1,
        children: 0,
        subscribeToEmails: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [ticketCode, setTicketCode] = useState(null);

    if (!isOpen || !publicDay) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/public/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    public_event_day_id: publicDay.id,
                    ...formData
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            setSuccess(true);
            setTicketCode(data.ticketCode);
            if (onRegister) onRegister();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const date = new Date(timeString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // If time is string "09:00:00" from SQL simple time, we need to handle it or just substring
    const displayTime = (t) => {
        if (!t) return '';
        if (t.includes('T')) return formatTime(t); // ISO
        return t.substring(0, 5); // Simple "HH:MM"
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative animate-fade-in-up">

                {/* Header */}
                <div className="bg-[#0f172a] text-white p-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <h2 className="text-xl font-bold">{publicDay.title}</h2>
                    <div className="flex items-center gap-2 text-blue-200 mt-1 text-sm">
                        <Calendar size={14} />
                        <span>
                            {new Date(publicDay.date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {success ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Ticket size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">You're Registered!</h3>
                            <p className="text-gray-600 mb-4">We've sent your ticket code to <strong>{formData.email}</strong>.</p>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                                <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Your Ticket Code</span>
                                <div className="text-2xl font-mono font-bold text-[#0f172a] tracking-wider mt-1">{ticketCode}</div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full bg-[#0f172a] text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f172a] focus:border-transparent outline-none"
                                        value={formData.firstName}
                                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f172a] focus:border-transparent outline-none"
                                        value={formData.lastName}
                                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f172a] focus:border-transparent outline-none"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Adults</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f172a] focus:border-transparent outline-none"
                                        value={formData.adults}
                                        onChange={e => setFormData({ ...formData, adults: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Children</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f172a] focus:border-transparent outline-none"
                                        value={formData.children}
                                        onChange={e => setFormData({ ...formData, children: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-start gap-3 mt-4">
                                <input
                                    type="checkbox"
                                    id="subscribeToEmails"
                                    className="mt-1 h-4 w-4 text-[#0f172a] border-gray-300 rounded focus:ring-[#0f172a]"
                                    checked={formData.subscribeToEmails}
                                    onChange={e => setFormData({ ...formData, subscribeToEmails: e.target.checked })}
                                />
                                <label htmlFor="subscribeToEmails" className="text-sm text-gray-700">
                                    Would you like to be notified of future air shows?
                                </label>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#e11d48] text-white py-3 rounded-lg font-bold text-lg hover:bg-rose-700 transition-colors shadow-lg shadow-rose-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Processing...' : 'Complete Registration'}
                                </button>
                                <p className="text-center text-xs text-gray-500 mt-3">
                                    It's free! We just need numbers for catering and safety.
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublicRegistrationModal;
