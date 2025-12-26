import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function OrderDetail() {
    const { orderId } = useParams();
    const { user } = useAuth();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                {tickets.map(item => (
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
                                <h3 style={{ margin: 0 }}>
                                    {item.first_name || item.last_name
                                        ? `${item.first_name} ${item.last_name}`.trim()
                                        : <span style={{ fontStyle: 'italic', color: '#999' }}>Unassigned Ticket</span>
                                    }
                                </h3>

                                {item.ticket_code && (
                                    <div style={{ marginTop: '0.5rem', fontFamily: 'monospace', background: '#eee', display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                        CODE: {item.ticket_code}
                                    </div>
                                )}
                            </div>

                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Email</div>
                                <div>{item.email || '-'}</div>
                            </div>

                            <div style={{ flex: 0, minWidth: '150px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                                <span className="status-badge" style={{ backgroundColor: '#e0f7fa', color: '#006064' }}>
                                    {item.attendee_status}
                                </span>
                                <div style={{ marginTop: '0.5rem' }}>
                                    {/* Future: Edit Button */}
                                    {/* <button className="secondary-button" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>Edit Details</button> */}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}

export default OrderDetail;
