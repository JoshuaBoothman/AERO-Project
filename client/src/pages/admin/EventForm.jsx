import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function EventForm() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();

    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        venue_id: '',
        banner_url: '',
        status: 'Draft',
        is_purchasing_enabled: false,
        is_public_viewable: false
    });

    const isEditMode = !!slug;

    // Venue Modal State
    const [showVenueModal, setShowVenueModal] = useState(false);
    const [venueForm, setVenueForm] = useState({
        name: '',
        address_line_1: '',
        city: '',
        state: 'QLD',
        postcode: '',
        map_url: ''
    });

    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/events');
        }
    }, [user, navigate]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const headers = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                    headers['X-Auth-Token'] = token;
                }

                const venueRes = await fetch('/api/venues', { headers });
                if (!venueRes.ok) throw new Error('Failed to load venues');
                const venueData = await venueRes.json();
                setVenues(venueData);

                if (isEditMode) {
                    const eventRes = await fetch(`/api/events/${slug}`, { headers });
                    if (!eventRes.ok) throw new Error('Failed to load event');
                    const eventData = await eventRes.json();

                    const formatDateTime = (dateStr) => {
                        if (!dateStr) return '';
                        return new Date(dateStr).toISOString().slice(0, 16);
                    };

                    setFormData({
                        event_id: eventData.event_id,
                        name: eventData.name,
                        description: eventData.description || '',
                        start_date: formatDateTime(eventData.start_date),
                        end_date: formatDateTime(eventData.end_date),
                        venue_id: eventData.venue_id || '',
                        banner_url: eventData.banner_url || '',
                        status: eventData.status || 'Draft',
                        is_purchasing_enabled: eventData.is_purchasing_enabled,
                        is_public_viewable: eventData.is_public_viewable
                    });
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [slug, isEditMode, token]);

    // Logic Constraints
    useEffect(() => {
        if (formData.status === 'Draft' || formData.status === 'Archived') {
            if (formData.is_public_viewable) {
                setFormData(prev => ({ ...prev, is_public_viewable: false }));
            }
        }

        if (formData.status !== 'Published') {
            if (formData.is_purchasing_enabled) {
                setFormData(prev => ({ ...prev, is_purchasing_enabled: false }));
            }
        }
    }, [formData.status, formData.is_public_viewable, formData.is_purchasing_enabled]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            setSaving(true);
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: uploadData,
                headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
            });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            setFormData(prev => ({ ...prev, banner_url: data.url }));
        } catch (err) {
            alert('Image upload failed: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const url = isEditMode ? `/api/events/${formData.event_id}` : '/api/events';
        const method = isEditMode ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Save failed');

            navigate('/events');
        } catch (err) {
            setError(err.message);
            setSaving(false);
        }
    };

    const handleVenueChange = (e) => {
        setVenueForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleCreateVenue = async () => {
        if (!venueForm.name || !venueForm.state) {
            alert("Name and State are required");
            return;
        }
        try {
            const res = await fetch('/api/venues', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify(venueForm)
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to create venue');
            }
            const newVenue = await res.json();

            setVenues(prev => [...prev, newVenue]);
            setFormData(prev => ({ ...prev, venue_id: newVenue.venue_id }));
            setShowVenueModal(false);
            setVenueForm({ name: '', address_line_1: '', city: '', state: 'QLD', postcode: '', map_url: '' });
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div className="container">Loading...</div>;

    const canBePublic = !(formData.status === 'Draft' || formData.status === 'Archived');
    const canPurchase = formData.status === 'Published';

    // Helper to format date for display "10-Jan-2026"
    const formatDateDisplay = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        if (isNaN(date)) return '';
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '2rem auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>{isEditMode ? 'Edit Event' : 'New Event'}</h1>
                {isEditMode && <button className="secondary-button" onClick={() => navigate('/events')}>Cancel</button>}
            </div>

            {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem' }}>

                {/* 1. Basic Info */}
                <div className="form-group mb-4">
                    <label>Event Name *</label>
                    <input
                        type="text" name="name" required
                        value={formData.name} onChange={handleChange}
                        className="form-control"
                    />
                </div>

                <div className="form-group mb-4">
                    <label>Description</label>
                    <textarea
                        name="description" rows="4"
                        value={formData.description} onChange={handleChange}
                        className="form-control"
                    />
                </div>

                {/* 2. Dates */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label>Start Date *</label>
                        <input
                            type="datetime-local" name="start_date" required
                            value={formData.start_date} onChange={handleChange}
                            className="form-control"
                        />
                        {formData.start_date && (
                            <small style={{ color: '#666', display: 'block', marginTop: '0.2rem' }}>
                                Selected: {formatDateDisplay(formData.start_date)}
                            </small>
                        )}
                    </div>
                    <div>
                        <label>End Date *</label>
                        <input
                            type="datetime-local" name="end_date" required
                            value={formData.end_date} onChange={handleChange}
                            className="form-control"
                        />
                        {formData.end_date && (
                            <small style={{ color: '#666', display: 'block', marginTop: '0.2rem' }}>
                                Selected: {formatDateDisplay(formData.end_date)}
                            </small>
                        )}
                    </div>
                </div>

                {/* 3. Venue */}
                <div className="form-group mb-4">
                    <label>Venue *</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <select
                            name="venue_id" required
                            value={formData.venue_id} onChange={handleChange}
                            className="form-control"
                            style={{ flex: 1 }}
                        >
                            <option value="">-- Select Venue --</option>
                            {venues.map(v => (
                                <option key={v.venue_id} value={v.venue_id}>
                                    {v.name} ({v.city}, {v.state})
                                </option>
                            ))}
                        </select>
                        {/* New Venue Button styled differently if needed, but primary-button is fine */}
                        <button
                            type="button"
                            className="primary-button"
                            style={{ whiteSpace: 'nowrap' }}
                            onClick={() => setShowVenueModal(true)}
                        >
                            + New Venue
                        </button>
                    </div>
                </div>

                {/* 4. Banner Image */}
                <div className="form-group mb-4" style={{ border: '1px solid #ced4da', padding: '1rem', borderRadius: '4px', background: '#fafafa' }}>
                    <label style={{ marginBottom: '0.5rem', display: 'block' }}>Banner Image</label>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {formData.banner_url ? (
                            <img src={formData.banner_url} alt="Preview" style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
                        ) : (
                            <div style={{ width: '120px', height: '80px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #ddd' }}>No Image</div>
                        )}
                        <div style={{ flex: 1 }}>
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="form-control-file" />
                            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>Replaces current image immediately.</p>
                        </div>
                    </div>
                </div>

                {/* 5. Status & Flags */}
                <div style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #e5e7eb' }}>
                    <h3 style={{ marginTop: 0, fontSize: '1.1rem', marginBottom: '1rem' }}>Visibility & Settings</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '2rem', alignItems: 'center' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Event Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="form-control"
                            >
                                <option value="Draft">Draft</option>
                                <option value="Published">Published</option>
                                <option value="Archived">Archived</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div style={{ opacity: canBePublic ? 1 : 0.5 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: canBePublic ? 'pointer' : 'not-allowed' }}>
                                <input
                                    type="checkbox" name="is_public_viewable"
                                    checked={formData.is_public_viewable}
                                    onChange={handleChange}
                                    disabled={!canBePublic}
                                />
                                <div>
                                    <span style={{ display: 'block', fontWeight: 'bold' }}>Publicly Viewable</span>
                                    <span style={{ fontSize: '0.8rem', color: '#666' }}> Visible to users</span>
                                </div>
                            </label>
                        </div>

                        <div style={{ opacity: canPurchase ? 1 : 0.5 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: canPurchase ? 'pointer' : 'not-allowed' }}>
                                <input
                                    type="checkbox" name="is_purchasing_enabled"
                                    checked={formData.is_purchasing_enabled}
                                    onChange={handleChange}
                                    disabled={!canPurchase}
                                />
                                <div>
                                    <span style={{ display: 'block', fontWeight: 'bold' }}>Enable Purchasing</span>
                                    <span style={{ fontSize: '0.8rem', color: '#666' }}> Sell tickets</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="form-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                    {isEditMode && (
                        <button
                            type="button"
                            onClick={async () => {
                                if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
                                    setSaving(true);
                                    try {
                                        const res = await fetch(`/api/events/${formData.event_id}`, {
                                            method: 'DELETE',
                                            headers: {
                                                'Authorization': `Bearer ${token}`,
                                                'X-Auth-Token': token
                                            }
                                        });
                                        if (!res.ok) {
                                            const err = await res.json().catch(() => ({}));
                                            throw new Error(err.error || 'Delete failed');
                                        }
                                        navigate('/events');
                                    } catch (err) {
                                        alert(err.message);
                                        setSaving(false);
                                    }
                                }
                            }}
                            style={{
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                marginRight: 'auto' // Pushes it to the left
                            }}
                        >
                            Delete Event
                        </button>
                    )}
                    <button type="button" className="secondary-button" onClick={() => navigate('/events')}>
                        Cancel
                    </button>
                    <button type="submit" className="primary-button" disabled={saving}>
                        {saving ? 'Saving...' : (isEditMode ? 'Update Event' : 'Create Event')}
                    </button>
                </div>

            </form>

            {/* QUICK VENUE MODAL */}
            {showVenueModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Create New Venue</h3>
                            <button onClick={() => setShowVenueModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', padding: 0, color: '#666' }}>×</button>
                        </div>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.3rem' }}>Venue Name *</label>
                                <input
                                    className="form-control" placeholder="e.g. Brisbane Showgrounds"
                                    name="name" value={venueForm.name} onChange={handleVenueChange}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.3rem' }}>Address Line 1</label>
                                <input
                                    className="form-control" placeholder="e.g. 600 Gregory Terrace"
                                    name="address_line_1" value={venueForm.address_line_1} onChange={handleVenueChange}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.3rem' }}>City</label>
                                    <input
                                        className="form-control" placeholder="Bowen Hills"
                                        name="city" value={venueForm.city} onChange={handleVenueChange}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.3rem' }}>State *</label>
                                    <select
                                        className="form-control"
                                        name="state" value={venueForm.state} onChange={handleVenueChange}
                                    >
                                        <option value="QLD">QLD</option>
                                        <option value="NSW">NSW</option>
                                        <option value="VIC">VIC</option>
                                        <option value="WA">WA</option>
                                        <option value="SA">SA</option>
                                        <option value="TAS">TAS</option>
                                        <option value="ACT">ACT</option>
                                        <option value="NT">NT</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.3rem' }}>Postcode</label>
                                <input
                                    className="form-control" placeholder="4006"
                                    name="postcode" value={venueForm.postcode} onChange={handleVenueChange}
                                />
                            </div>

                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button className="secondary-button" onClick={() => setShowVenueModal(false)}>Cancel</button>
                                <button className="primary-button" onClick={handleCreateVenue}>Create Venue</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EventForm;
