import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function EventDetails() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [event, setEvent] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Purchase State
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [showAttendeeModal, setShowAttendeeModal] = useState(false);
    const [cart, setCart] = useState({}); // { ticket_type_id: quantity }
    const [attendeeDetails, setAttendeeDetails] = useState({}); // { "ticketId_index": { firstName, lastName, email } }
    const [purchasing, setPurchasing] = useState(false);
    const [purchaseSuccess, setPurchaseSuccess] = useState(null);

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

    const handleInitialCheckout = () => {
        // 1. Close ticket modal, Open Attendee modal
        setShowTicketModal(false);
        setShowAttendeeModal(true);

        // 2. Initialize attendee slots
        const initialSlots = {};
        Object.entries(cart).forEach(([ticketId, qty]) => {
            for (let i = 0; i < qty; i++) {
                initialSlots[`${ticketId}_${i}`] = { firstName: '', lastName: '', email: user?.email || '' };
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

    const handleFinalCheckout = async () => {
        if (!user) {
            navigate('/login', { state: { from: location } });
            return;
        }

        setPurchasing(true);
        setError(null);

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
                    items: itemsPayload
                })
            });

            const data = await res.json();

            if (res.ok) {
                setPurchaseSuccess(data);
                setCart({});
                setAttendeeDetails({});
                setShowAttendeeModal(false);
            } else {
                setError(data.error + (data.details ? `: ${data.details}` : '') || 'Purchase failed');
                setShowAttendeeModal(false);
                setShowTicketModal(true);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setPurchasing(false);
        }
    };

    if (loading) return <div className="container">Loading...</div>;
    if (error) return <div className="container error">{error}</div>;
    if (!event) return <div className="container">Event not found</div>;

    const cartTotal = tickets.reduce((sum, t) => {
        return sum + (t.price * (cart[t.ticket_type_id] || 0));
    }, 0);

    return (
        <div className="container">
            {event.banner_url && (
                <div className="event-banner">
                    <img src={event.banner_url} alt={event.name} />
                </div>
            )}

            <div className="event-header">
                <Link to="/events" className="back-link">← Back to Events</Link>
                <span className={`status-badge status-${event.status?.toLowerCase()}`}>
                    {event.status}
                </span>
            </div>

            <div className="event-hero">
                <h1>{event.name}</h1>
                <p>{event.description}</p>
                <button
                    className="primary-button"
                    onClick={() => setShowTicketModal(true)}
                >
                    Get Tickets
                </button>
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
                            <h2>Select Tickets</h2>
                            <button className="secondary-button" onClick={() => setShowTicketModal(false)}>Close</button>
                        </div>

                        {tickets.length === 0 ? (
                            <p>No tickets available for this event.</p>
                        ) : (
                            <>
                                <div className="ticket-list">
                                    {tickets.map(t => (
                                        <div key={t.ticket_type_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                                            <div>
                                                <strong>{t.name}</strong>
                                                <div>${t.price}</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <button
                                                    style={{ width: '30px', height: '30px', padding: 0 }}
                                                    onClick={() => updateCart(t.ticket_type_id, -1)}
                                                >-</button>
                                                <span style={{ width: '20px', textAlign: 'center' }}>{cart[t.ticket_type_id] || 0}</span>
                                                <button
                                                    style={{ width: '30px', height: '30px', padding: 0 }}
                                                    onClick={() => updateCart(t.ticket_type_id, 1)}
                                                >+</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '2px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3>Total: ${cartTotal.toFixed(2)}</h3>
                                    <button
                                        className="primary-button"
                                        disabled={purchasing || cartTotal === 0}
                                        onClick={handleInitialCheckout}
                                    >
                                        Next: Attendee Details
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
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
                                                    <h5 style={{ margin: '0 0 0.5rem' }}>✈️ Pilot & Aircraft</h5>
                                                    <input
                                                        className="attendee-input"
                                                        type="text" placeholder="CASA License / ARN"
                                                        value={data.licenseNumber || ''}
                                                        onChange={e => handleAttendeeChange(key, 'licenseNumber', e.target.value)}
                                                        style={{ width: '100%', marginBottom: '0.5rem' }}
                                                    />

                                                    {/* Single Aircraft Entry (MVP) */}
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                                                        <input
                                                            className="attendee-input"
                                                            type="text" placeholder="Make (e.g. Extra)"
                                                            value={data.planes?.[0]?.make || ''}
                                                            onChange={e => {
                                                                const currentPlanes = data.planes || [{}];
                                                                const updatedPlane = { ...currentPlanes[0], make: e.target.value };
                                                                handleAttendeeChange(key, 'planes', [updatedPlane]);
                                                            }}
                                                        />
                                                        <input
                                                            className="attendee-input"
                                                            type="text" placeholder="Model (e.g. 300L)"
                                                            value={data.planes?.[0]?.model || ''}
                                                            onChange={e => {
                                                                const currentPlanes = data.planes || [{}];
                                                                const updatedPlane = { ...currentPlanes[0], model: e.target.value };
                                                                handleAttendeeChange(key, 'planes', [updatedPlane]);
                                                            }}
                                                        />
                                                        <input
                                                            className="attendee-input"
                                                            type="text" placeholder="Rego (e.g. VH-XYZ)"
                                                            value={data.planes?.[0]?.rego || ''}
                                                            onChange={e => {
                                                                const currentPlanes = data.planes || [{}];
                                                                const updatedPlane = { ...currentPlanes[0], rego: e.target.value };
                                                                handleAttendeeChange(key, 'planes', [updatedPlane]);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Crew Specific Fields */}
                                            {tickets.find(t => t.ticket_type_id === parseInt(ticketId))?.system_role?.toLowerCase() === 'crews' && (
                                                <div style={{ marginTop: '0.5rem', padding: '0.5rem', border: '1px solid #ffecb3', borderRadius: '4px' }}>
                                                    <h5 style={{ margin: '0 0 0.5rem' }}>🛠️ Pit Crew</h5>
                                                    <input
                                                        className="attendee-input"
                                                        type="text" placeholder="Link to Pilot (Enter Ticket Code if known)"
                                                        value={data.linkedPilotCode || ''}
                                                        onChange={e => handleAttendeeChange(key, 'linkedPilotCode', e.target.value)}
                                                        style={{ width: '100%' }}
                                                    />
                                                    <small style={{ color: '#666' }}>We'll help you find your pilot later if you don't know this yet.</small>
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
    );
}

export default EventDetails;