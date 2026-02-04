import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export default function AdminLegacyImport({ onClose, campsiteId, eventId, campsiteName, siteNumber, eventStartDate, eventEndDate, onSuccess }) {
    const { token } = useAuth();
    const { notify } = useNotification();

    // Format date to YYYY-MM-DD for input fields
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toISOString().split('T')[0];
    };

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        ausNumber: '',
        email: '',
        arrivalDate: formatDate(eventStartDate),
        departureDate: formatDate(eventEndDate)
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate dates
        if (!formData.arrivalDate || !formData.departureDate) {
            notify("Please enter arrival and departure dates.", "error");
            return;
        }

        if (new Date(formData.departureDate) <= new Date(formData.arrivalDate)) {
            notify("Departure date must be after arrival date.", "error");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/createLegacyBooking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    eventId,
                    campsiteId,
                    arrivalDate: formData.arrivalDate,
                    departureDate: formData.departureDate,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    ausNumber: formData.ausNumber,
                    email: formData.email
                })
            });

            if (res.ok) {
                notify("Legacy booking created successfully!", "success");
                if (onSuccess) onSuccess();
                onClose();
            } else {
                const err = await res.json();
                notify(err.error || "Failed to create legacy booking.", "error");
            }
        } catch (error) {
            console.error(error);
            notify("Network error.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '450px', maxWidth: '90%' }}>
                <h3 style={{ marginTop: 0 }}>Book for Past Attendee</h3>

                {/* Site Confirmation */}
                <div style={{
                    backgroundColor: '#e8f4fd',
                    border: '1px solid #b3d9f2',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <span style={{ fontSize: '1.5rem' }}>🏕️</span>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', fontWeight: 'bold' }}>Selected Site</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0066cc' }}>Site {siteNumber || campsiteName}</div>
                    </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '15px' }}>
                    Create a pending booking for a returning camper. They will receive an email to claim their account.
                </p>

                <form onSubmit={handleSubmit}>
                    {/* Date Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.8rem' }}>Arrival Date *</label>
                            <input
                                required
                                type="date"
                                min={formatDate(eventStartDate)}
                                max={formatDate(eventEndDate)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                value={formData.arrivalDate}
                                onChange={e => setFormData({ ...formData, arrivalDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.8rem' }}>Departure Date *</label>
                            <input
                                required
                                type="date"
                                min={formatDate(eventStartDate)}
                                max={formatDate(eventEndDate)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                value={formData.departureDate}
                                onChange={e => setFormData({ ...formData, departureDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Name Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.8rem' }}>First Name *</label>
                            <input
                                required
                                type="text"
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                value={formData.firstName}
                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.8rem' }}>Last Name *</label>
                            <input
                                required
                                type="text"
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                value={formData.lastName}
                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.8rem' }}>Email *</label>
                        <input
                            required
                            type="email"
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.8rem' }}>AUS Number (Optional)</label>
                        <input
                            type="text"
                            placeholder="Leave blank to auto-generate"
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            value={formData.ausNumber}
                            onChange={e => setFormData({ ...formData, ausNumber: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} disabled={submitting} style={{ padding: '8px 16px', background: '#eee', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" disabled={submitting} style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            {submitting ? 'Creating...' : 'Create Booking'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
