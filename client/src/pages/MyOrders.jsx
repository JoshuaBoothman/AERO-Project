import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

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

    const { notify, confirm } = useNotification();

    const handleDelete = async (orderId) => {
        confirm("Are you sure you want to delete this unpaid order? This action cannot be undone.", async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/orders/${orderId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Auth-Token': token
                    }
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to delete order');
                }

                notify("Order deleted successfully", "success");
                // Remove from local state
                setOrders(prev => prev.filter(o => o.order_id !== orderId));

            } catch (err) {
                notify(err.message, "error");
            }
        });
    };

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
                        <div key={order.order_id} style={{ position: 'relative' }}>
                            <Link
                                to={`/orders/${order.order_id}`}
                                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
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
                                    <div style={{ textAlign: 'right', paddingRight: order.payment_status === 'Pending' ? '40px' : '0' }}>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                                            ${order.total_amount.toFixed(2)}
                                        </div>
                                        <span className={`status-badge status-${order.payment_status?.toLowerCase() || 'pending'}`}>
                                            {order.payment_status}
                                        </span>
                                    </div>
                                </div>
                            </Link>

                            {order.payment_status === 'Pending' && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDelete(order.order_id);
                                    }}
                                    title="Delete Unpaid Order"
                                    style={{
                                        position: 'absolute',
                                        right: '15px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#ef4444',
                                        padding: '5px',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    className="hover:bg-red-50"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyOrders;
