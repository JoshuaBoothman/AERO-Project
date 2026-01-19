import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import CampsiteModal from '../components/CampsiteModal';

function EventDetails({ propSlug }) {
    const { slug: paramSlug } = useParams();
    const slug = propSlug || paramSlug;
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { notify } = useNotification();

    const [event, setEvent] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Purchase State
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [showAttendeeModal, setShowAttendeeModal] = useState(false);
    const [showCampsiteModal, setShowCampsiteModal] = useState(false);

    const [cart, setCart] = useState({}); // { ticket_type_id: quantity }
    const [campsiteCart, setCampsiteCart] = useState([]); // [{ campsite_id, site_number, checkIn, checkOut, price_per_night, campgroundName }]

    const [attendeeDetails, setAttendeeDetails] = useState({}); // { "ticketId_index": { firstName, lastName, email } }
    const [purchasing, setPurchasing] = useState(false);
    const [purchaseSuccess, setPurchaseSuccess] = useState(null);

    const [myPilots, setMyPilots] = useState([]); // [{ attendee_id, ticket_code, first_name, last_name }]

    useEffect(() => {
        async function fetchEvent() {
            try {
                const response = await fetch(`/api/events/${slug}`);
                if (response.status === 404) throw new Error('Event not found');
                const data = await response.json();

                // Handle API response structure (checking if tickets are included)
                if (data.tickets) {
                    setTickets(data.tickets);
                    // Remove tickets from main event object to keep it clean
                    const { tickets, ...eventData } = data;
                    setEvent(eventData);
                } else {
                    // Fallback if tickets aren't nested (based on previous API iterations)
                    setEvent(data);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchEvent();
    }, [slug]);

    // Fetch user's registered pilots for this event
    useEffect(() => {
        if (user && event && event.slug) {
            fetch(`/api/events/${event.slug}/my-attendees`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setMyPilots(data);
                    }
                })
                .catch(err => console.error("Failed to fetch my pilots", err));
        }
    }, [user, event]);

    const updateCart = (ticketId, change) => {
        setCart(prev => {
            const current = prev[ticketId] || 0;
            const next = Math.max(0, current + change);
            if (next === 0) {
                const { [ticketId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [ticketId]: next };
        });
    };

    const handleAddToCartCampsites = (sites) => {
        // Merge with existing cart, avoiding duplicates
        setCampsiteCart(prev => {
            const newSites = [...prev];
            sites.forEach(site => {
                if (!newSites.some(s => s.campsite_id === site.campsite_id)) {
                    newSites.push(site);
                }
            });
            return newSites;
        });
        // Automatically open ticket modal to review cart
        setShowTicketModal(true);
    };

    const removeCampsiteFromCart = (index) => {
        setCampsiteCart(prev => prev.filter((_, i) => i !== index));
    };



    const handleInitialCheckout = () => {
        // 1. Close ticket modal, Open Attendee modal
        setShowTicketModal(false);
        setShowAttendeeModal(true);

        // 2. Initialize attendee slots
        const initialSlots = {};
        Object.entries(cart).forEach(([ticketId, qty]) => {
            for (let i = 0; i < qty; i++) {
                // Generate a tempId for robust linking
                const tempId = Math.random().toString(36).substr(2, 9);
                initialSlots[`${ticketId}_${i}`] = {
                    firstName: '',
                    lastName: '',
                    email: user?.email || '',
                    tempId: tempId
                };
            }
        });
        setAttendeeDetails(initialSlots);
    };

    const handleAttendeeChange = (key, field, value) => {
        setAttendeeDetails(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
    };

    const handleUpload = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        return data.url;
    };

    const addPlane = (key) => {
        setAttendeeDetails(prev => {
            const currentPlanes = prev[key]?.planes || [];
            return {
                ...prev,
                [key]: {
                    ...prev[key],
                    planes: [...currentPlanes, { make: '', model: '', rego: '', isHeavy: false, heavyCertNumber: '', heavyCertFile: '' }]
                }
            };
        });
    };

    const removePlane = (key, index) => {
        setAttendeeDetails(prev => {
            const currentPlanes = prev[key]?.planes || [];
            const newPlanes = currentPlanes.filter((_, i) => i !== index);
            return {
                ...prev,
                [key]: { ...prev[key], planes: newPlanes }
            };
        });
    };

    const updatePlane = (key, index, field, value) => {
        setAttendeeDetails(prev => {
            const currentPlanes = prev[key]?.planes || [{}]; // Ensure at least one if initializing
            const newPlanes = [...currentPlanes];
            if (!newPlanes[index]) newPlanes[index] = {};
            newPlanes[index] = { ...newPlanes[index], [field]: value };
            return {
                ...prev,
                [key]: { ...prev[key], planes: newPlanes }
            };
        });
    };

    const handleFinalCheckout = async () => {
        if (!user) {
            navigate('/login', { state: { from: location } });
            return;
        }

        // Validation
        for (const [ticketTypeId, quantity] of Object.entries(cart)) {
            const ticket = tickets.find(t => t.ticket_type_id === parseInt(ticketTypeId));
            if (ticket?.is_pilot) {
                for (let i = 0; i < quantity; i++) {
                    const key = `${ticketTypeId}_${i}`;
                    const details = attendeeDetails[key] || {};
                    const label = details.firstName ? `${details.firstName} (Pilot)` : `Pilot #${i + 1}`;

                    if (!details.hasReadMop) {
                        notify(`${label}: You must read and agree to the Monitor of Procedures (MOP).`, "error");
                        return;
                    }

                    const planes = details.planes || [{}];
                    for (const p of planes) {
                        if (p.isHeavy) {
                            if (!p.heavyCertNumber) {
                                notify(`${label}: Heavy Model requires a Certificate Number.`, "error");
                                return;
                            }
                            if (!p.heavyCertFile) {
                                notify(`${label}: Heavy Model requires a Certificate File Upload.`, "error");
                                return;
                            }
                        }
                    }
                }
            }
        }

        setPurchasing(true);
        // setError(null); // Don't reset global error, just proceed

        // Prepare payload
        const itemsPayload = Object.entries(cart).map(([ticketTypeId, quantity]) => {
            // Gather attendees for this ticket type
            const attendees = [];
            for (let i = 0; i < quantity; i++) {
                const key = `${ticketTypeId}_${i}`;
                attendees.push(attendeeDetails[key]);
            }
            return { ticketTypeId: parseInt(ticketTypeId), quantity, attendees };
        });

        // Prepare campsites payload
        const campsitesPayload = campsiteCart.map(site => ({
            campsiteId: site.campsite_id,
            checkIn: site.checkIn,
            checkOut: site.checkOut,
            price: site.price_per_night
            // link to attendee? Backend handles this default
        }));

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/createOrder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    eventId: event.event_id,
                    items: itemsPayload,
                    campsites: campsitesPayload
                })
            });

            const data = await res.json();

            if (res.ok) {
                setPurchaseSuccess(data);
                setCart({});
                setCampsiteCart([]);
                setAttendeeDetails({});
                setShowAttendeeModal(false);
            } else {
                notify(data.error + (data.details ? `: ${data.details}` : '') || 'Purchase failed', "error");
                setShowAttendeeModal(false);
                setShowTicketModal(true);
            }
        } catch (err) {
            notify(err.message, "error");
        } finally {
            setPurchasing(false);
        }
    };

    if (loading) return <div className="container">Loading...</div>;
    if (error) return <div className="container error">{error}</div>;
    if (!event) return <div className="container">Event not found</div>;

    const ticketsTotal = tickets.reduce((sum, t) => {
        return sum + (t.price * (cart[t.ticket_type_id] || 0));
    }, 0);

    const campsitesTotal = campsiteCart.reduce((sum, site) => sum + site.price_per_night, 0);

    const cartTotal = ticketsTotal + campsitesTotal;

    // Helper to get pilots currently in the cart
    const getPilotsInCart = () => {
        const pilots = [];
        Object.entries(cart).forEach(([ticketId, qty]) => {
            const ticket = tickets.find(t => t.ticket_type_id === parseInt(ticketId));
            if (ticket?.is_pilot) {
                for (let i = 0; i < qty; i++) {
                    const key = `${ticketId}_${i}`;
                    const details = attendeeDetails[key];
                    if (details) {
                        const label = (details.firstName || details.lastName)
                            ? `${details.firstName} ${details.lastName}`.trim()
                            : `Pilot #${i + 1}`;
                        pilots.push({
                            tempId: details.tempId,
                            label: `${label} (In Cart)`
                        });
                    }
                }
            }
        });
        return pilots;
    };

    return (
        <div className="container mx-auto px-4 py-6">
            {event.banner_url && (
                <div className="w-full h-48 md:h-[350px] rounded-xl overflow-hidden mb-8 shadow-md bg-gray-200">
                    <img
                        src={event.banner_url}
                        alt={event.name}
                        className="w-full h-full object-cover object-center"
                    />
                </div>
            )}

            <div className="max-w-3xl mx-auto text-center">
                <h1 className="text-3xl md:text-5xl font-bold my-6 text-gray-900">{event.name}</h1>
                <p className="whitespace-pre-wrap mb-8 text-gray-700 leading-relaxed text-lg text-left md:text-center">{event.description}</p>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    {/* Get Tickets button removed - Tickets purchased via Store */}
                    {/* Campsite Booking Button Removed as per request */}
                </div>

                {purchaseSuccess && (
                    <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
                        <h3>Success!</h3>
                        <p>{purchaseSuccess.message}</p>
                        <p>Order ID: #{purchaseSuccess.orderId}</p>
                    </div>
                )}

                {/* Ticket Selection Modal */}
                {showTicketModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h2>Your Cart</h2>
                                <button className="secondary-button" onClick={() => setShowTicketModal(false)}>Close</button>
                            </div>

                            {/* Tickets Section */}
                            <h3>Tickets</h3>
                            {tickets.length === 0 ? (
                                <p>No tickets available for this event.</p>
                            ) : (
                                <div className="space-y-2">
                                    {tickets.map(t => (
                                        <div key={t.ticket_type_id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                                            <div>
                                                <strong className="text-gray-800">{t.name}</strong>
                                                {t.description && <div className="text-sm text-gray-500 mt-1 max-w-sm">{t.description}</div>}
                                                <div className="text-gray-600">${t.price}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200 text-lg font-medium transition-colors"
                                                    onClick={() => updateCart(t.ticket_type_id, -1)}
                                                >-</button>
                                                <span className="w-6 text-center font-medium">{cart[t.ticket_type_id] || 0}</span>
                                                <button
                                                    className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200 text-lg font-medium transition-colors"
                                                    onClick={() => updateCart(t.ticket_type_id, 1)}
                                                >+</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Campsites Section */}
                            {campsiteCart.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-lg font-bold mb-2">Campsites</h3>
                                    {campsiteCart.map((site, index) => (
                                        <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                                            <div>
                                                <strong className="block text-gray-800">{site.campgroundName} - {site.site_number}</strong>
                                                <div className="text-sm text-gray-500">{site.checkIn} to {site.checkOut}</div>
                                                <div className="font-medium">${site.price_per_night}</div>
                                            </div>
                                            <button
                                                onClick={() => removeCampsiteFromCart(index)}
                                                className="text-red-500 hover:text-red-700 p-2 text-xl font-bold transition-colors"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Empty State Help */}
                            {Object.keys(cart).length === 0 && campsiteCart.length === 0 && (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                                    <p>Your cart is empty.</p>
                                    <button onClick={() => setShowCampsiteModal(true)} style={{ textDecoration: 'underline', border: 'none', background: 'none', color: 'blue', cursor: 'pointer' }}>
                                        Add a Campsite?
                                    </button>
                                </div>
                            )}

                            <div className="mt-8 pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <h3 className="text-xl font-bold">Total: ${cartTotal.toFixed(2)}</h3>
                                <button
                                    className="bg-primary hover:bg-primary/90 text-secondary font-bold py-3 px-6 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto transition-all"
                                    disabled={purchasing || cartTotal === 0}
                                    onClick={handleInitialCheckout}
                                >
                                    Next: Attendee Details
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Campsite Modal */}
                {showCampsiteModal && (
                    <CampsiteModal
                        event={event}
                        onClose={() => setShowCampsiteModal(false)}
                        onAddToCart={handleAddToCartCampsites}
                    // Pass org settings if available globally, or rely on defaults
                    // orgSettings={...}
                    />
                )}

                {/* Attendee Details Modal */}
                {showAttendeeModal && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h2>Attendee Details</h2>
                                <button className="secondary-button" onClick={() => setShowAttendeeModal(false)}>Back</button>
                            </div>

                            {Object.entries(cart).map(([ticketId, qty]) => {
                                const ticketName = tickets.find(t => t.ticket_type_id === parseInt(ticketId))?.name;
                                return Array.from({ length: qty }).map((_, idx) => {
                                    const key = `${ticketId}_${idx}`;
                                    const data = attendeeDetails[key] || {};
                                    return (
                                        <div key={key} style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                                            <h4>{ticketName} #{idx + 1}</h4>
                                            <div className="attendee-form-grid">
                                                <div className="attendee-input-group">
                                                    <input
                                                        className="attendee-input"
                                                        type="text" placeholder="First Name"
                                                        value={data.firstName || ''}
                                                        onChange={e => handleAttendeeChange(key, 'firstName', e.target.value)}
                                                    />
                                                    <input
                                                        className="attendee-input"
                                                        type="text" placeholder="Last Name"
                                                        value={data.lastName || ''}
                                                        onChange={e => handleAttendeeChange(key, 'lastName', e.target.value)}
                                                    />
                                                </div>
                                                <input
                                                    className="attendee-input"
                                                    type="email" placeholder="Email"
                                                    value={data.email || ''}
                                                    onChange={e => handleAttendeeChange(key, 'email', e.target.value)}
                                                    style={{ width: '100%', marginBottom: '0.5rem' }}
                                                />

                                                {/* Pilot Specific Fields */}
                                                {tickets.find(t => t.ticket_type_id === parseInt(ticketId))?.is_pilot && (
                                                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                                                        <h5 style={{ margin: '0 0 0.5rem' }}>✈️ Pilot & Aircraft Registration</h5>

                                                        {/* MOP Agreement */}
                                                        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded">
                                                            <h6 className="font-bold text-sm mb-2 text-blue-800">Monitor of Procedures (MOP)</h6>
                                                            <p className="text-xs text-blue-700 mb-2">
                                                                Plese read the <a href="#" className="underline text-blue-900" onClick={(e) => { e.preventDefault(); alert("MOP Content Placeholder"); }}>Event MOP</a>. All pilots must agree to these terms.
                                                            </p>
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={data.hasReadMop || false}
                                                                    onChange={e => handleAttendeeChange(key, 'hasReadMop', e.target.checked)}
                                                                />
                                                                <span className="text-sm font-medium">I have read and agree to the MOP</span>
                                                            </label>
                                                        </div>

                                                        <input
                                                            className="attendee-input"
                                                            type="text" placeholder="CASA License / ARN"
                                                            value={data.licenseNumber || ''}
                                                            onChange={e => handleAttendeeChange(key, 'licenseNumber', e.target.value)}
                                                            style={{ width: '100%', marginBottom: '1rem' }}
                                                        />

                                                        <h6 className="font-bold text-sm mb-2">Aircraft List</h6>
                                                        {(data.planes && data.planes.length > 0 ? data.planes : [{}]).map((plane, pIdx) => (
                                                            <div key={pIdx} className="mb-4 pb-4 border-b border-gray-200 last:border-0" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                                        <input
                                                                            className="attendee-input"
                                                                            placeholder="Make / Name (e.g. Extra 300)"
                                                                            value={plane.make || ''}
                                                                            onChange={e => updatePlane(key, pIdx, 'make', e.target.value)}
                                                                            disabled={purchasing}
                                                                        />
                                                                        <input
                                                                            className="attendee-input"
                                                                            placeholder="Model Type"
                                                                            value={plane.model || ''}
                                                                            onChange={e => updatePlane(key, pIdx, 'model', e.target.value)}
                                                                            disabled={purchasing}
                                                                        />
                                                                        <input
                                                                            className="attendee-input"
                                                                            placeholder="Registration"
                                                                            value={plane.rego || ''}
                                                                            onChange={e => updatePlane(key, pIdx, 'rego', e.target.value)}
                                                                            disabled={purchasing}
                                                                        />
                                                                    </div>

                                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={plane.isHeavy || false}
                                                                            onChange={e => updatePlane(key, pIdx, 'isHeavy', e.target.checked)}
                                                                            disabled={purchasing}
                                                                        />
                                                                        <span style={{ fontWeight: '500', color: '#666' }}>Is this a heavy model (&gt; 7kg / 15lbs)?</span>
                                                                    </label>

                                                                    {plane.isHeavy && (
                                                                        <div style={{ background: '#fff9c4', padding: '0.75rem', borderRadius: '4px', border: '1px solid #fbc02d' }}>
                                                                            <div style={{ marginBottom: '0.5rem' }}>
                                                                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Heavy Model Cert #</label>
                                                                                <input
                                                                                    className="attendee-input"
                                                                                    placeholder="Cert Number"
                                                                                    value={plane.heavyCertNumber || ''}
                                                                                    onChange={e => updatePlane(key, pIdx, 'heavyCertNumber', e.target.value)}
                                                                                    style={{ background: 'white' }}
                                                                                    disabled={purchasing}
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Upload Certificate (PDF/Image)</label>
                                                                                {plane.heavyCertFile ? (
                                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#2e7d32' }}>
                                                                                        <span>✓ Uploaded</span>
                                                                                        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                                                                                        <a href={plane.heavyCertFile} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: '#2e7d32' }}>View</a>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => updatePlane(key, pIdx, 'heavyCertFile', null)}
                                                                                            style={{ color: '#d32f2f', background: 'none', border: 'none', padding: 0, marginLeft: '0.5rem', cursor: 'pointer', textDecoration: 'underline' }}
                                                                                            disabled={purchasing}
                                                                                        >
                                                                                            Remove
                                                                                        </button>
                                                                                    </div>
                                                                                ) : (
                                                                                    <input
                                                                                        type="file"
                                                                                        accept="image/*,application/pdf"
                                                                                        onChange={e => {
                                                                                            if (e.target.files?.[0]) {
                                                                                                handleUpload(e.target.files[0]).then(url => {
                                                                                                    updatePlane(key, pIdx, 'heavyCertFile', url);
                                                                                                }).catch(err => alert("Upload failed: " + err.message));
                                                                                            }
                                                                                        }}
                                                                                        disabled={purchasing}
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {(data.planes || []).length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removePlane(key, pIdx)}
                                                                        style={{
                                                                            background: '#fee2e2',
                                                                            color: '#ef4444',
                                                                            border: 'none',
                                                                            borderRadius: '4px',
                                                                            width: '32px',
                                                                            height: '32px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            cursor: 'pointer',
                                                                            fontSize: '1.2rem',
                                                                            lineHeight: 1,
                                                                            flexShrink: 0,
                                                                            marginTop: '0px'
                                                                        }}
                                                                        title="Remove Aircraft"
                                                                        disabled={purchasing}
                                                                    >
                                                                        &times;
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}

                                                        <button
                                                            className="text-primary text-sm font-bold hover:underline"
                                                            onClick={() => addPlane(key)}
                                                        >
                                                            + Add Another Aircraft
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Crew Specific Fields */}
                                                {tickets.find(t => t.ticket_type_id === parseInt(ticketId))?.is_pit_crew && (
                                                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', border: '1px solid #ffecb3', borderRadius: '4px' }}>
                                                        <h5 style={{ margin: '0 0 0.5rem' }}>🛠️ Pit Crew</h5>

                                                        {/* Link Pilot Selector */}
                                                        <div style={{ marginBottom: '1rem' }}>
                                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Select Pilot:</label>
                                                            <select
                                                                className="attendee-input"
                                                                style={{ width: '100%', marginBottom: '0.5rem' }}
                                                                value={
                                                                    data.linkedPilotTempId ? `temp:${data.linkedPilotTempId}` :
                                                                        data.linkedPilotCode ? `code:${data.linkedPilotCode}` :
                                                                            ""
                                                                }
                                                                onChange={e => {
                                                                    const val = e.target.value;
                                                                    if (!val) {
                                                                        handleAttendeeChange(key, 'linkedPilotTempId', null);
                                                                        handleAttendeeChange(key, 'linkedPilotCode', '');
                                                                    } else if (val.startsWith('temp:')) {
                                                                        handleAttendeeChange(key, 'linkedPilotTempId', val.split(':')[1]);
                                                                        handleAttendeeChange(key, 'linkedPilotCode', '');
                                                                        handleAttendeeChange(key, 'showManualInput', false);
                                                                    } else if (val.startsWith('code:')) {
                                                                        handleAttendeeChange(key, 'linkedPilotTempId', null);
                                                                        handleAttendeeChange(key, 'linkedPilotCode', val.split(':')[1]);
                                                                        handleAttendeeChange(key, 'showManualInput', false);
                                                                    } else if (val === 'MANUAL') {
                                                                        handleAttendeeChange(key, 'linkedPilotTempId', null);
                                                                        handleAttendeeChange(key, 'linkedPilotCode', '');
                                                                        handleAttendeeChange(key, 'showManualInput', true);
                                                                    }
                                                                }}
                                                            >
                                                                <option value="">-- Choose Pilot --</option>

                                                                {/* In Cart Pilots */}
                                                                {getPilotsInCart().length > 0 && (
                                                                    <optgroup label="In this Order">
                                                                        {getPilotsInCart().map(p => (
                                                                            <option key={p.tempId} value={`temp:${p.tempId}`}>
                                                                                {p.label}
                                                                            </option>
                                                                        ))}
                                                                    </optgroup>
                                                                )}

                                                                {/* Registered Pilots */}
                                                                {myPilots.length > 0 && (
                                                                    <optgroup label="Previously Registered">
                                                                        {myPilots.map(p => (
                                                                            <option key={p.attendee_id} value={`code:${p.ticket_code}`}>
                                                                                {p.first_name || 'Pilot'} {p.last_name} ({p.ticket_name})
                                                                            </option>
                                                                        ))}
                                                                    </optgroup>
                                                                )}

                                                                <option value="MANUAL">Enter Code Manually...</option>
                                                            </select>

                                                            {/* Manual Input Fallback */}
                                                            {data.showManualInput && (
                                                                <input
                                                                    className="attendee-input"
                                                                    type="text" placeholder="Enter Pilot Ticket Code (e.g. A1B2C3D4)"
                                                                    value={data.linkedPilotCode || ''}
                                                                    onChange={e => handleAttendeeChange(key, 'linkedPilotCode', e.target.value.toUpperCase())}
                                                                    style={{ width: '100%' }}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                });
                            })}

                            <div style={{ marginTop: '1rem' }}>
                                <button
                                    className="primary-button"
                                    onClick={handleFinalCheckout}
                                    disabled={purchasing}
                                    style={{ width: '100%' }}
                                >
                                    {purchasing ? 'Processing Order...' : `Confirm & Pay $${cartTotal.toFixed(2)}`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default EventDetails;