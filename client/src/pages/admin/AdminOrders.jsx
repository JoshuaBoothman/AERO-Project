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

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'paid': return 'bg-green-100 text-green-800 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'failed': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) return <div className="container mx-auto p-8 text-center text-gray-500">Loading Admin Orders...</div>;
    if (error) return <div className="container mx-auto p-8 text-center text-red-500">Error: {error}</div>;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Admin: All Orders</h1>
                <div>
                    {/* Placeholder for future filters */}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                <th className="p-4">ID</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Event</th>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Items</th>
                                <th className="p-4">Total</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {orders.map(order => (
                                <tr key={order.order_id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-mono text-sm text-gray-600">#{order.order_id}</td>
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900">{new Date(order.order_date).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-500">{new Date(order.order_date).toLocaleTimeString()}</div>
                                    </td>
                                    <td className="p-4 text-gray-700">
                                        {order.event_name || <span className="text-gray-400 italic">N/A</span>}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900">{order.user_first_name} {order.user_last_name}</div>
                                        <div className="text-sm text-gray-500">{order.user_email}</div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">{order.item_count} items</td>
                                    <td className="p-4 font-bold text-gray-900">${order.total_amount.toFixed(2)}</td>
                                    <td className="p-4">
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase border ${getStatusColor(order.payment_status)}`}>
                                            {order.payment_status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <Link
                                            to={`/orders/${order.order_id}`}
                                            className="inline-block px-3 py-1 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                                        >
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {orders.length === 0 && <div className="p-8 text-center text-gray-500">No orders found.</div>}
            </div>
        </div>
    );
}

export default AdminOrders;
