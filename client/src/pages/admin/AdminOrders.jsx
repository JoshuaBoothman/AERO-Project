import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Search, Calendar, Filter, X, RefreshCw } from 'lucide-react';

function AdminOrders() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [eventFilter, setEventFilter] = useState('All');
    const [events, setEvents] = useState([]);

    // Fetch Events for Dropdown
    useEffect(() => {
        async function fetchEvents() {
            try {
                const response = await fetch('/api/events');
                if (response.ok) {
                    const data = await response.json();
                    setEvents(data);
                }
            } catch (err) {
                console.error("Failed to load events", err);
            }
        }
        fetchEvents();
    }, []);

    const fetchOrders = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');

            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (dateFrom) params.append('startDate', dateFrom);
            if (dateTo) params.append('endDate', dateTo);
            if (statusFilter && statusFilter !== 'All') params.append('status', statusFilter);
            if (eventFilter && eventFilter !== 'All') params.append('eventId', eventFilter);

            const response = await fetch(`/api/getAdminOrders?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
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
    }, [user, searchTerm, dateFrom, dateTo, statusFilter, eventFilter]);

    // Debounce Search & Auto-Fetch on Filter Change
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchOrders();
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [fetchOrders]);

    const handleResetFilters = () => {
        setSearchTerm('');
        setDateFrom('');
        setDateTo('');
        setStatusFilter('All');
        setEventFilter('All');
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'paid': return 'bg-green-100 text-green-800 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'failed': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        reference: '',
        method: 'Direct Deposit'
    });
    const [processingPayment, setProcessingPayment] = useState(false);

    const openPaymentModal = (order) => {
        // Default amount to balance due
        const paid = order.amount_paid || 0; // Need to ensure API returns this in list or calculate it
        // Wait, list API might not have amount_paid. Schema added it to orders table.
        // Assuming getAdminOrders returns SELECT * or includes amount_paid.
        // If not, we might need to rely on what we have: total - (paid??)
        // If API doesn't return amount_paid, we should default to total_amount for now or 0.
        // Let's assume getAdminOrders DOES return amount_paid (schema update should flow through if using SELECT *)

        const balance = order.total_amount - (order.amount_paid || 0);

        setSelectedOrderForPayment(order);
        setPaymentForm({
            amount: balance > 0 ? balance.toFixed(2) : order.total_amount.toFixed(2),
            date: new Date().toISOString().split('T')[0],
            reference: '',
            method: 'Direct Deposit'
        });
        setIsPaymentModalOpen(true);
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        if (!selectedOrderForPayment) return;
        setProcessingPayment(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/orders/${selectedOrderForPayment.order_id}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify(paymentForm)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Payment failed');
            }

            // Success
            setIsPaymentModalOpen(false);
            fetchOrders(); // Refresh list
        } catch (err) {
            alert(err.message);
        } finally {
            setProcessingPayment(false);
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-900">Admin: All Orders</h1>
                <button
                    onClick={fetchOrders}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 space-y-4 md:space-y-0 md:flex md:items-end md:gap-4">
                {/* Search */}
                <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Search</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Name, Email, Order ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Date Range */}
                <div className="flex gap-2">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">From</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">To</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* Status Dropdown */}
                <div className="w-40">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Paid">Paid</option>
                        <option value="Partially Paid">Partiailly Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Failed">Failed</option>
                        <option value="Refunded">Refunded</option>
                    </select>
                </div>

                {/* Event Dropdown */}
                <div className="w-48">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Event</label>
                    <select
                        value={eventFilter}
                        onChange={(e) => setEventFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                        <option value="All">All Events</option>
                        {events.map(ev => (
                            <option key={ev.event_id} value={ev.event_id}>
                                {ev.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Reset Button */}
                <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-gray-50 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors mb-[1px]"
                    title="Reset Filters"
                >
                    <X size={20} />
                </button>
            </div>

            {loading && <div className="text-center py-10 text-gray-500">Loading orders...</div>}
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-md mb-6">{error}</div>}

            {!loading && !error && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                    <th className="p-4">ID / Invoice</th>
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
                                        <td className="p-4 font-mono text-sm text-gray-600">
                                            <div>#{order.order_id}</div>
                                            {order.invoice_number && <div className="text-xs text-blue-600 font-bold">{order.invoice_number}</div>}
                                        </td>
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
                                        <td className="p-4 font-bold text-gray-900">
                                            ${order.total_amount.toFixed(2)}
                                            {order.amount_paid > 0 && order.amount_paid < order.total_amount && (
                                                <div className="text-xs text-orange-600 font-normal">Paid: ${order.amount_paid.toFixed(2)}</div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase border ${getStatusColor(order.payment_status)}`}>
                                                {order.payment_status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex sm:flex-col lg:flex-row gap-2">
                                                <Link
                                                    to={`/orders/${order.order_id}`}
                                                    className="inline-block px-3 py-1 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm text-center"
                                                >
                                                    View
                                                </Link>
                                                {order.payment_status !== 'Paid' && (
                                                    <button
                                                        onClick={() => openPaymentModal(order)}
                                                        className="inline-block px-3 py-1 bg-green-50 border border-green-200 rounded text-sm font-bold text-green-700 hover:bg-green-100 transition-colors shadow-sm text-center"
                                                    >
                                                        Pay
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-bold">Record Payment</h3>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    className="w-full p-2 border rounded"
                                    value={paymentForm.amount}
                                    onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date Paid</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full p-2 border rounded"
                                    value={paymentForm.date}
                                    onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reference (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded"
                                    placeholder="e.g. DD-12345"
                                    value={paymentForm.reference}
                                    onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={paymentForm.method}
                                    onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
                                >
                                    <option value="Direct Deposit">Direct Deposit</option>
                                    <option value="Cash">Cash</option>
                                    <option value="EFT">EFT</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsPaymentModalOpen(false)}
                                    className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingPayment}
                                    className="px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700"
                                >
                                    {processingPayment ? 'Recording...' : 'Record Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminOrders;
