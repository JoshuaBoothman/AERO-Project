import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { useAuth } from '../context/AuthContext';

function OrderDetail() {
    const { orderId } = useParams();
    const { user } = useAuth();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Edit Mode State
    const [editingAttendeeId, setEditingAttendeeId] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function fetchOrderDetail() {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/orders/${orderId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.status === 403) {
                    throw new Error("You don't have permission to view this order.");
                }

                if (!response.ok) {
                    throw new Error('Failed to fetch order details');
                }

                const data = await response.json();
                setOrder(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        if (user && orderId) {
            fetchOrderDetail();
        }
    }, [user, orderId]);

    const handleEditClick = (item) => {
        setEditingAttendeeId(item.attendee_id);
        setEditFormData({
            firstName: item.first_name || '',
            lastName: item.last_name || '',
            email: item.email || ''
        });
    };

    const handleCancelEdit = () => {
        setEditingAttendeeId(null);
        setEditFormData({});
    };

    const handleSave = async (attendeeId) => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/attendees/${attendeeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editFormData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.body || 'Failed to update attendee');
            }

            // Update local state
            setOrder(prev => ({
                ...prev,
                items: prev.items.map(item => {
                    if (item.attendee_id === attendeeId) {
                        return {
                            ...item,
                            first_name: editFormData.firstName,
                            last_name: editFormData.lastName,
                            email: editFormData.email
                        };
                    }
                    return item;
                })
            }));

            setEditingAttendeeId(null);
        } catch (err) {
            alert(`Error updating: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading details...</div>;

    if (error) return (
        <div className="container" style={{ padding: '2rem' }}>
            <Link to="/my-orders" className="back-link">← Back to Orders</Link>
            <div className="error-message" style={{ marginTop: '1rem' }}>{error}</div>
        </div>
    );

    if (!order) return <div className="container">Order not found</div>;

    // Separate items by category if needed in future (e.g. Merchandise, Campsites)
    // For now, everything is effectively a ticket or related to one.
    const tickets = order.items || [];

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link to="/my-orders" className="back-link">← Back to Orders</Link>
            </div>

            <div className="order-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Order #{order.order_id}</h1>
                    <p style={{ color: '#666', margin: 0 }}>
                        Placed on {new Date(order.order_date).toLocaleString()}
                    </p>
                    {order.tax_invoice_number && (
                        <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
                            Tax Invoice: #{order.tax_invoice_number}
                        </p>
                    )}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                        ${order.total_amount.toFixed(2)}
                    </div>
                    <span className={`status-badge status-${order.payment_status?.toLowerCase()}`}>
                        {order.payment_status}
                    </span>
                </div>
            </div>

            {/* Event Summary Card */}
            <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1.5rem' }}>
                {order.banner_url && (
                    <div style={{
                        width: '200px',
                        height: '120px',
                        borderRadius: '4px',
                        backgroundImage: `url(${order.banner_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        flexShrink: 0
                    }} />
                )}
                <div>
                    <h2 style={{ marginTop: 0 }}>{order.event_name}</h2>
                    <Link to={`/events/${order.event_slug}`} className="primary-button" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                        View Event Page
                    </Link>
                </div>
            </div>

            {/* Tickets Section */}
            <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Tickets & Attendees</h2>

            <div className="tickets-list">
                {tickets.map(item => {
                    const isEditing = editingAttendeeId === item.attendee_id;
                    return (
                        <div key={item.order_item_id} className="card" style={{ marginBottom: '1rem', borderLeft: '4px solid var(--accent-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ flex: 1, minWidth: '250px' }}>
                                    <div style={{
                                        textTransform: 'uppercase',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        color: '#888',
                                        marginBottom: '0.25rem'
                                    }}>
                                        {item.ticket_name}
                                        {item.is_pilot && <span style={{ marginLeft: '0.5rem', color: '#007bff' }}>✈️ Pilot</span>}
                                        {item.is_pit_crew && <span style={{ marginLeft: '0.5rem', color: '#ff9800' }}>🛠️ Crew</span>}
                                    </div>

                                    {isEditing ? (
                                        <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.5rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input
                                                    type="text"
                                                    className="attendee-input"
                                                    placeholder="First Name"
                                                    value={editFormData.firstName}
                                                    onChange={e => setEditFormData({ ...editFormData, firstName: e.target.value })}
                                                />
                                                <input
                                                    type="text"
                                                    className="attendee-input"
                                                    placeholder="Last Name"
                                                    value={editFormData.lastName}
                                                    onChange={e => setEditFormData({ ...editFormData, lastName: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <h3 style={{ margin: 0 }}>
                                            {item.first_name || item.last_name
                                                ? `${item.first_name} ${item.last_name}`.trim()
                                                : <span style={{ fontStyle: 'italic', color: '#999' }}>Unassigned Ticket</span>
                                            }
                                        </h3>
                                    )}

                                    {item.ticket_code && (
                                        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <div style={{ background: 'white', padding: '4px', border: '1px solid #ddd', borderRadius: '4px' }}>
                                                <QRCode value={item.ticket_code} size={64} />
                                            </div>
                                            <div>
                                                <div style={{ fontFamily: 'monospace', background: '#eee', display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                    {item.ticket_code}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                                                    Scan at Gate
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    {isEditing ? (
                                        <div>
                                            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>Email</div>
                                            <input
                                                type="email"
                                                className="attendee-input"
                                                style={{ width: '100%' }}
                                                value={editFormData.email}
                                                onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Email</div>
                                            <div>{item.email || '-'}</div>
                                        </>
                                    )}
                                </div>

                                <div style={{ flex: 0, width: '120px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <span className="status-badge" style={{ backgroundColor: '#e0f7fa', color: '#006064', width: '100%', alignSelf: 'stretch', textAlign: 'center' }}>
                                        {item.attendee_status}
                                    </span>

                                    {isEditing ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <button
                                                className="primary-button"
                                                onClick={() => handleSave(item.attendee_id)}
                                                disabled={saving}
                                                style={{ width: '100%', fontSize: '0.75rem', padding: '4px 0', fontWeight: 'bold', textTransform: 'uppercase' }}
                                            >
                                                {saving ? 'Saving' : 'Save'}
                                            </button>
                                            <button
                                                className="secondary-button"
                                                onClick={handleCancelEdit}
                                                disabled={saving}
                                                style={{ width: '100%', fontSize: '0.75rem', padding: '4px 0', fontWeight: 'bold', textTransform: 'uppercase' }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className="secondary-button"
                                            onClick={() => handleEditClick(item)}
                                            style={{
                                                width: '100%',
                                                fontSize: '0.75rem',
                                                padding: '4px 0',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}
                                        >
                                            Edit Details
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
}

export default OrderDetail;
