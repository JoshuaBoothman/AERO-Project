import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function MyOrders() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchOrders() {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/orders', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Auth-Token': token
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch orders');
                }

                const data = await response.json();
                setOrders(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            fetchOrders();
        }
    }, [user]);

    if (loading) return (
        <div className="container" style={{ padding: '2rem' }}>
            <h2>My Orders</h2>
            <p>Loading your order history...</p>
        </div>
    );

    if (error) return (
        <div className="container" style={{ padding: '2rem' }}>
            <h2>My Orders</h2>
            <div className="error-message">Error: {error}</div>
        </div>
    );

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <h1 style={{ marginBottom: '2rem' }}>My Orders</h1>

            {orders.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <h3>No orders found</h3>
                    <p>You haven't purchased any tickets yet.</p>
                    <Link to="/events" className="primary-button" style={{ display: 'inline-block', marginTop: '1rem' }}>
                        Browse Events
                    </Link>
                </div>
            ) : (
                <div className="orders-grid" style={{ display: 'grid', gap: '1rem' }}>
                    {orders.map(order => (
                        <Link
                            to={`/orders/${order.order_id}`}
                            key={order.order_id}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                            <div className="card order-card" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'transform 0.2s',
                                cursor: 'pointer'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {order.banner_url && (
                                        <div style={{
                                            width: '80px',
                                            height: '60px',
                                            borderRadius: '4px',
                                            overflow: 'hidden',
                                            backgroundImage: `url(${order.banner_url})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                        }} />
                                    )}
                                    <div>
                                        <h3 style={{ margin: '0 0 0.25rem' }}>{order.event_name || 'Unknown Event'}</h3>
                                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                            Order #{order.order_id} • {new Date(order.order_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                                        ${order.total_amount.toFixed(2)}
                                    </div>
                                    <span className={`status-badge status-${order.payment_status?.toLowerCase() || 'pending'}`}>
                                        {order.payment_status}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyOrders;
