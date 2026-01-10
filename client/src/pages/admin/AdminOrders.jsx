import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function AdminOrders() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchOrders() {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/getAdminOrders', { // Ensure API name matches
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.status === 403) throw new Error("Access Denied: You are not an admin.");
                if (!response.ok) throw new Error('Failed to fetch orders');

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

    if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading Admin Orders...</div>;
    if (error) return <div className="container" style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Admin: All Orders</h1>
                <div>
                    {/* Placeholder for future filters */}
                </div>
            </div>

            <div className="orders-table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>ID</th>
                            <th style={{ padding: '1rem' }}>Date</th>
                            <th style={{ padding: '1rem' }}>Event</th>
                            <th style={{ padding: '1rem' }}>Customer</th>
                            <th style={{ padding: '1rem' }}>Items</th>
                            <th style={{ padding: '1rem' }}>Total</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.order_id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '1rem' }}>#{order.order_id}</td>
                                <td style={{ padding: '1rem' }}>
                                    {new Date(order.order_date).toLocaleDateString()}
                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{new Date(order.order_date).toLocaleTimeString()}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {order.event_name || 'N/A'}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 'bold' }}>{order.user_first_name} {order.user_last_name}</div>
                                    <div style={{ fontSize: '0.9rem', color: '#666' }}>{order.user_email}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>{order.item_count} items</td>
                                <td style={{ padding: '1rem' }}>${order.total_amount.toFixed(2)}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span className={`status-badge status-${order.payment_status?.toLowerCase()}`}>
                                        {order.payment_status}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <Link to={`/orders/${order.order_id}`} className="secondary-button" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {orders.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No orders found.</div>}
            </div>
        </div>
    );
}

export default AdminOrders;
