import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

function SortableTicketRow({ ticket, onEdit, onDelete }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: ticket.ticket_type_id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <tr ref={setNodeRef} style={{ ...style, borderBottom: '1px solid #eee', background: 'white' }}>
            <td style={{ padding: '0.5rem', width: '30px' }}>
                <div {...attributes} {...listeners} style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: '#ccc' }}>
                    <GripVertical size={16} />
                </div>
            </td>
            <td style={{ padding: '0.5rem' }}>{ticket.name}</td>
            <td style={{ padding: '0.5rem' }}>${Number(ticket.price).toFixed(2)}</td>
            <td style={{ padding: '0.5rem' }}>
                {ticket.system_role === 'pilot' && <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', marginRight: '4px' }}>Pilot</span>}
                {ticket.system_role === 'pit_crew' && <span style={{ background: '#f0fdf4', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>Pit Crew</span>}
            </td>
            <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                <button type="button" onClick={() => onEdit(ticket)} style={{ marginRight: '0.5rem', background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}>Edit</button>
                <button type="button" onClick={() => onDelete(ticket.ticket_type_id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>Delete</button>
            </td>
        </tr>
    );
}

function EventForm() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const { notify, confirm } = useNotification();

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
        is_public_viewable: false,
        mop_url: ''
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
    });

    // Ticket Types State
    const [ticketTypes, setTicketTypes] = useState([]);
    const [products, setProducts] = useState([]); // [NEW] Products for linkage
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [editingTicket, setEditingTicket] = useState(null);
    const [ticketForm, setTicketForm] = useState({
        name: '',
        price: '',
        system_role: 'spectator', // spectator, pilot, staff, etc.
        description: '',
        includes_merch: false,
        price_no_flight_line: '',
        linkedProductIds: [] // [NEW] Link Multiple Products
    });

    // Public Days State
    const [publicDays, setPublicDays] = useState([]);
    const [showPublicDayModal, setShowPublicDayModal] = useState(false);
    const [editingPublicDay, setEditingPublicDay] = useState(null);
    const [publicDayForm, setPublicDayForm] = useState({
        title: '',
        description: '',
        date: '',
        start_time: '',
        end_time: '',
        is_active: true
    });

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setTicketTypes((items) => {
                const oldIndex = items.findIndex((item) => item.ticket_type_id === active.id);
                const newIndex = items.findIndex((item) => item.ticket_type_id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Trigger API update
                // We do this immediately or debounced? Immediate is fine for now but we should not await it to block UI
                // However, we need to send the new order to the backend.

                const sortedPayload = newItems.map((item, index) => ({
                    ticket_type_id: item.ticket_type_id,
                    sort_order: index
                }));

                fetch(`/api/events/${formData.event_id}/ticket-types/reorder`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'X-Auth-Token': token
                    },
                    body: JSON.stringify({ sortedTickets: sortedPayload })
                }).catch(err => {
                    console.error("Failed to reorder tickets", err);
                    notify("Failed to save new order", "error");
                });

                return newItems;
            });
        }
    };

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
                        is_public_viewable: eventData.is_public_viewable,
                        mop_url: eventData.mop_url || ''
                    });

                    // Fetch Ticket Types
                    const ticketRes = await fetch(`/api/events/${eventData.event_id}/ticket-types`, { headers });
                    if (ticketRes.ok) {
                        const tickets = await ticketRes.json();
                        setTicketTypes(tickets);
                    }

                    // Fetch Public Days
                    const publicDaysRes = await fetch(`/api/public-days?eventId=${eventData.event_id}`, { headers });
                    if (publicDaysRes.ok) {
                        const days = await publicDaysRes.json();
                        setPublicDays(days);
                    }
                }

                // Fetch Products for Ticket Linking
                const prodRes = await fetch('/api/products', { headers });
                if (prodRes.ok) {
                    const prodData = await prodRes.json();
                    setProducts(prodData);
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
            notify('Image upload failed: ' + err.message, 'error');
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
            notify("Name and State are required", "error");
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
            notify(err.message, 'error');
        }
    };

    // Ticket Handlers
    const handleTicketChange = (e) => {
        const { name, value, type, checked } = e.target;
        setTicketForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSaveTicket = async () => {
        if (!ticketForm.name || ticketForm.price === '') {
            notify("Name and Price are required", "error");
            return;
        }

        try {
            const url = editingTicket
                ? `/api/ticket-types/${editingTicket.ticket_type_id}`
                : `/api/events/${formData.event_id}/ticket-types`;

            const method = editingTicket ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify(ticketForm)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save ticket type');
            }

            const savedTicket = await res.json();

            if (editingTicket) {
                setTicketTypes(prev => prev.map(t => t.ticket_type_id === savedTicket.ticket_type_id ? savedTicket : t));
            } else {
                setTicketTypes(prev => [...prev, savedTicket]);
            }

            setShowTicketModal(false);
            setEditingTicket(null);
            setTicketForm({ name: '', price: '', system_role: 'spectator', is_pilot: false, is_pit_crew: false, description: '' });

        } catch (err) {
            notify(err.message, "error");
        }
    };

    const handleDeleteTicket = (id) => {
        confirm("Delete this ticket type?", async () => {
            try {
                const res = await fetch(`/api/ticket-types/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Delete failed');
                }
                setTicketTypes(prev => prev.filter(t => t.ticket_type_id !== id));
                notify('Ticket type deleted', 'success');
            } catch (err) {
                notify(err.message, 'error');
            }
        });
    };

    const openCreateTicket = () => {
        setEditingTicket(null);
        setEditingTicket(null);
        setTicketForm({ name: '', price: '', system_role: 'spectator', description: '', includes_merch: false, price_no_flight_line: '', linkedProductIds: [] });
        setShowTicketModal(true);
        setShowTicketModal(true);
    };

    const openEditTicket = (ticket) => {
        setEditingTicket(ticket);
        setTicketForm({
            name: ticket.name,
            price: ticket.price,
            system_role: ticket.system_role,
            description: ticket.description || '',
            includes_merch: ticket.includes_merch || false,
            price_no_flight_line: ticket.price_no_flight_line || '',
            linkedProductIds: ticket.linkedProductIds || [] // Ensure Array
        });
        setShowTicketModal(true);
    };

    // Public Day Handlers
    const handlePublicDayChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPublicDayForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSavePublicDay = async () => {
        if (!publicDayForm.title || !publicDayForm.date) {
            notify("Title and Date are required", "error");
            return;
        }

        try {
            const url = editingPublicDay
                ? `/api/public-days/${editingPublicDay.id}`
                : `/api/public-days`;

            const method = editingPublicDay ? 'PUT' : 'POST';
            const body = { ...publicDayForm, event_id: formData.event_id };

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save day');
            }

            const savedDay = await res.json();

            if (editingPublicDay) {
                setPublicDays(prev => prev.map(d => d.id === savedDay.id ? savedDay : d));
            } else {
                setPublicDays(prev => [...prev, savedDay]);
            }

            setShowPublicDayModal(false);
            setEditingPublicDay(null);
            setPublicDayForm({ title: '', description: '', date: '', start_time: '', end_time: '', is_active: true });
            notify('Public Day saved', 'success');

        } catch (err) {
            notify(err.message, "error");
        }
    };

    const handleDeletePublicDay = (id) => {
        confirm("Delete this public day? This will remove all registrations associated with it.", async () => {
            try {
                const res = await fetch(`/api/public-days/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
                });

                if (res.status === 409) {
                    notify("Cannot delete day with existing registrations.", "error");
                    return;
                }

                if (!res.ok) throw new Error('Delete failed');

                setPublicDays(prev => prev.filter(d => d.id !== id));
                notify('Public Day deleted', 'success');
            } catch (err) {
                notify(err.message, 'error');
            }
        });
    };

    const openCreatePublicDay = () => {
        setEditingPublicDay(null);
        setPublicDayForm({ title: '', description: '', date: '', start_time: '', end_time: '', is_active: true });
        setShowPublicDayModal(true);
    };

    const openEditPublicDay = (day) => {
        setEditingPublicDay(day);
        setPublicDayForm({
            title: day.title,
            description: day.description || '',
            date: day.date.split('T')[0], // Extract YYYY-MM-DD
            start_time: day.start_time ? day.start_time.substring(0, 5) : '',
            end_time: day.end_time ? day.end_time.substring(0, 5) : '',
            is_active: day.is_active
        });
        setShowPublicDayModal(true);
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

    const handleDeleteEvent = () => {
        confirm("Are you sure you want to delete this event? This action cannot be undone.", async () => {
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
                notify('Event deleted', 'success');
                navigate('/events');
            } catch (err) {
                notify(err.message, 'error');
                setSaving(false);
            }
        });
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

                {/* 5. MOP PDF */}
                <div className="form-group mb-4" style={{ border: '1px solid #ced4da', padding: '1rem', borderRadius: '4px', background: '#fafafa' }}>
                    <label style={{ marginBottom: '0.5rem', display: 'block' }}>MOP PDF (Manual of Procedures)</label>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {formData.mop_url ? (
                            <a href={formData.mop_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#2563eb', textDecoration: 'none', padding: '10px', background: 'white', border: '1px solid #ddd', borderRadius: '4px' }}>
                                <span style={{ fontSize: '1.2rem' }}>📄</span> View MOP
                            </a>
                        ) : (
                            <div style={{ padding: '10px 20px', background: '#eee', color: '#999', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #ddd' }}>No Document</div>
                        )}
                        <div style={{ flex: 1 }}>
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={async (e) => {
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
                                        setFormData(prev => ({ ...prev, mop_url: data.url }));
                                        notify('MOP PDF uploaded', 'success');
                                    } catch (err) {
                                        notify('Upload failed: ' + err.message, 'error');
                                    } finally {
                                        setSaving(false);
                                    }
                                }}
                                className="form-control-file"
                            />
                            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>Upload MOP PDF (Replaces current). Pilots must acknowledge this.</p>
                        </div>
                    </div>
                </div>

                {/* 6. Status & Flags */}
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

                {/* 6. Ticket Types (Only in Edit Mode) */}
                {isEditMode && (
                    <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Ticket Types</h3>
                            <button type="button" className="primary-button" style={{ fontSize: '0.85rem' }} onClick={openCreateTicket}>+ Add Ticket</button>
                        </div>

                        {ticketTypes.length === 0 ? (
                            <p style={{ color: '#666', fontStyle: 'italic' }}>No ticket types configured.</p>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#f9fafb', fontSize: '0.85rem', textAlign: 'left' }}>
                                            <th style={{ padding: '0.5rem', width: '30px' }}></th>
                                            <th style={{ padding: '0.5rem' }}>Name</th>
                                            <th style={{ padding: '0.5rem' }}>Price</th>
                                            <th style={{ padding: '0.5rem' }}>Flags</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <SortableContext
                                            items={ticketTypes.map(t => t.ticket_type_id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {ticketTypes.map(t => (
                                                <SortableTicketRow
                                                    key={t.ticket_type_id}
                                                    ticket={t}
                                                    onEdit={openEditTicket}
                                                    onDelete={handleDeleteTicket}
                                                />
                                            ))}
                                        </SortableContext>
                                    </tbody>
                                </table>
                            </DndContext>
                        )}
                    </div>
                )}

                {/* 7. Public Event Days (Only in Edit Mode) */}
                {isEditMode && (
                    <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Public Air Show Days</h3>
                                <p style={{ margin: '5px 0 0', fontSize: '0.8rem', color: '#666' }}>Manage days available for public registration.</p>
                            </div>
                            <button type="button" className="primary-button" style={{ fontSize: '0.85rem' }} onClick={openCreatePublicDay}>+ Add Day</button>
                        </div>

                        {publicDays.length === 0 ? (
                            <p style={{ color: '#666', fontStyle: 'italic' }}>No public days configured.</p>
                        ) : (
                            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f9fafb', fontSize: '0.85rem', textAlign: 'left' }}>
                                        <th style={{ padding: '0.5rem' }}>Title</th>
                                        <th style={{ padding: '0.5rem' }}>Date</th>
                                        <th style={{ padding: '0.5rem' }}>Time</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {publicDays.map(d => (
                                        <tr key={d.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '0.5rem' }}>{d.title}</td>
                                            <td style={{ padding: '0.5rem' }}>{new Date(d.date).toLocaleDateString()}</td>
                                            <td style={{ padding: '0.5rem' }}>
                                                {d.start_time ? d.start_time.substring(0, 5) : '-'}
                                                {d.end_time ? ` - ${d.end_time.substring(0, 5)}` : ''}
                                            </td>
                                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                                <button type="button" onClick={() => openEditPublicDay(d)} style={{ marginRight: '0.5rem', background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}>Edit</button>
                                                <button type="button" onClick={() => handleDeletePublicDay(d.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* 8. Flight Lines (Only in Edit Mode) */}
                {isEditMode && (
                    <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Flight Line Duties</h3>
                                <p style={{ margin: '5px 0 0', fontSize: '0.8rem', color: '#666' }}>Configure flight lines, schedules, and duty roster.</p>
                            </div>
                            <button
                                type="button"
                                className="primary-button"
                                style={{ fontSize: '0.85rem' }}
                                onClick={() => navigate(`/admin/events/${slug}/flight-lines`)}
                            >
                                Manage Flight Lines
                            </button>
                        </div>
                    </div>
                )}

                <div className="form-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                    {isEditMode && (
                        <button
                            type="button"
                            onClick={handleDeleteEvent}
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

            {/* TICKET TYPE MODAL */}
            {showTicketModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>{editingTicket ? 'Edit Ticket Type' : 'New Ticket Type'}</h3>
                            <button onClick={() => setShowTicketModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', padding: 0, color: '#666' }}>×</button>
                        </div>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.3rem' }}>Name *</label>
                                <input
                                    className="form-control" placeholder="e.g. General Admission"
                                    name="name" value={ticketForm.name} onChange={handleTicketChange}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.3rem' }}>Price ($) *</label>
                                <input
                                    type="number" step="0.01" className="form-control" placeholder="0.00"
                                    name="price" value={ticketForm.price} onChange={handleTicketChange}
                                />
                            </div>

                            {ticketForm.system_role === 'pilot' && (
                                <div style={{ background: '#f0f9ff', padding: '10px', borderRadius: '4px', border: '1px solid #bae6fd' }}>
                                    <label style={{ display: 'block', marginBottom: '0.3rem' }}>Price - No Flight Line Duties ($)</label>
                                    <input
                                        type="number" step="0.01" className="form-control" placeholder="Leave empty to use Standard Price"
                                        name="price_no_flight_line" value={ticketForm.price_no_flight_line} onChange={handleTicketChange}
                                    />
                                    <small style={{ color: '#0284c7', display: 'block', marginTop: '5px' }}>
                                        If set, this higher price is charged when a pilot <strong>does not</strong> agree to duties.
                                        Standard Price applies if they <strong>do</strong> agree.
                                    </small>
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.3rem' }}>Description</label>
                                <textarea
                                    className="form-control" rows="2" placeholder="Brief details about what includes..."
                                    name="description" value={ticketForm.description} onChange={handleTicketChange}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.3rem' }}>System Role</label>
                                <select
                                    className="form-control"
                                    name="system_role" value={ticketForm.system_role} onChange={handleTicketChange}
                                >
                                    <option value="spectator">Spectator</option>
                                    <option value="pilot">Pilot</option>
                                    <option value="pit_crew">Pit Crew</option>
                                    <option value="staff">Staff</option>
                                    <option value="volunteer">Volunteer</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        name="includes_merch"
                                        checked={ticketForm.includes_merch}
                                        onChange={handleTicketChange}
                                    />
                                    <strong>Includes Free Merchandise?</strong>
                                </label>
                                {ticketForm.includes_merch && (
                                    <div style={{ marginLeft: '1.5rem', border: '1px solid #ddd', padding: '0.5rem', borderRadius: '4px', maxHeight: '150px', overflowY: 'auto' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>Select Products to Link *</label>

                                        {products.length === 0 ? (
                                            <div style={{ color: '#999', fontSize: '0.85rem' }}>No products available.</div>
                                        ) : (
                                            <div style={{ display: 'grid', gap: '5px' }}>
                                                {products.map(p => {
                                                    const isChecked = ticketForm.linkedProductIds.includes(p.product_id);
                                                    return (
                                                        <label key={p.product_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={(e) => {
                                                                    const checked = e.target.checked;
                                                                    setTicketForm(prev => {
                                                                        let newIds = [...prev.linkedProductIds];
                                                                        if (checked) {
                                                                            newIds.push(p.product_id);
                                                                        } else {
                                                                            newIds = newIds.filter(id => id !== p.product_id);
                                                                        }
                                                                        return { ...prev, linkedProductIds: newIds };
                                                                    });
                                                                }}
                                                            />
                                                            {p.name}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem', borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
                                            Users will choose <strong>ONE</strong> of these items (and its variant) for free.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* REMOVED CHECKBOXES */}

                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button className="secondary-button" onClick={() => setShowTicketModal(false)}>Cancel</button>
                                <button className="primary-button" onClick={handleSaveTicket}>
                                    {editingTicket ? 'Update Ticket' : 'Create Ticket'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PUBLIC DAY MODAL */}
            {showPublicDayModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>{editingPublicDay ? 'Edit Public Day' : 'New Public Day'}</h3>
                            <button onClick={() => setShowPublicDayModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', padding: 0, color: '#666' }}>×</button>
                        </div>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.3rem' }}>Title *</label>
                                <input
                                    className="form-control" placeholder="e.g. Saturday Air Show"
                                    name="title" value={publicDayForm.title} onChange={handlePublicDayChange}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.3rem' }}>Date *</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="date" value={publicDayForm.date} onChange={handlePublicDayChange}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.3rem' }}>Start Time</label>
                                    <input
                                        type="time"
                                        className="form-control"
                                        name="start_time" value={publicDayForm.start_time} onChange={handlePublicDayChange}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.3rem' }}>End Time</label>
                                    <input
                                        type="time"
                                        className="form-control"
                                        name="end_time" value={publicDayForm.end_time} onChange={handlePublicDayChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.3rem' }}>Description</label>
                                <textarea
                                    className="form-control" rows="2" placeholder="Details visible to public..."
                                    name="description" value={publicDayForm.description} onChange={handlePublicDayChange}
                                />
                            </div>

                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button className="secondary-button" onClick={() => setShowPublicDayModal(false)}>Cancel</button>
                                <button className="primary-button" onClick={handleSavePublicDay}>
                                    {editingPublicDay ? 'Update Day' : 'Create Day'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EventForm;
