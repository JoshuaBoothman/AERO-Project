import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { formatDateTimeForDisplay } from '../utils/dateHelpers';

function OrderDetail() {
    const { orderId } = useParams();
    const { user } = useAuth();
    const { notify, confirm } = useNotification();

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
                        'Authorization': `Bearer ${token}`,
                        'X-Auth-Token': token
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
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
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
            notify(`Error updating: ${err.message}`, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleRefundAction = (item, action = 'refund') => {
        const verb = action === 'refund' ? 'refunded' : 'restored';
        const msg = action === 'refund'
            ? `Are you sure you want to mark "${item.item_name}" as refunded? \n\nThis will restore stock for merchandise items (1 unit).\nIt does NOT refund the money automatically.`
            : `Are you sure you want to restore "${item.item_name}"? \n\nThis will remove the refund status and reduce stock by 1.`;

        confirm(msg, async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/orders/${orderId}/items/${item.order_item_id}/refund`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'X-Auth-Token': token
                    },
                    body: JSON.stringify({ action })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.body || data.error || 'Action failed');
                }

                notify(`Item ${verb} successfully`, "success");

                // Refresh order
                const updatedOrderRes = await fetch(`/api/orders/${orderId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Auth-Token': token
                    }
                });
                const updatedOrder = await updatedOrderRes.json();
                setOrder(updatedOrder);

            } catch (err) {
                notify(`Error: ${err.message}`, "error");
            }
        });
    };

    if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading details...</div>;

    if (error) return (
        <div className="container" style={{ padding: '2rem' }}>
            <Link to={user?.role === 'admin' ? "/admin/orders" : "/my-orders"} className="back-link">
                ← Back to {user?.role === 'admin' ? "All Orders" : "My Orders"}
            </Link>
            <div className="error-message" style={{ marginTop: '1rem' }}>{error}</div>
        </div>
    );

    if (!order) return <div className="container">Order not found</div>;

    // Order Summary Items (All items)
    const summaryItems = order.items;

    // Filter for Tickets that need management
    const ticketsToManage = order.items.filter(item => item.item_type === 'Ticket');

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link to={user?.role === 'admin' ? "/admin/orders" : "/my-orders"} className="back-link">
                    ← Back to {user?.role === 'admin' ? "All Orders" : "My Orders"}
                </Link>
            </div>

            <div className="order-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Order #{order.order_id}</h1>
                    <p style={{ color: '#666', margin: 0 }}>
                        Placed on {new Date(order.order_date).toLocaleString()}
                    </p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        {order.invoice_number && (
                            <span>Invoice: <strong>{order.invoice_number}</strong></span>
                        )}
                        {order.tax_invoice_number && (
                            <span>Tax Invoice: <strong>{order.tax_invoice_number}</strong></span>
                        )}
                    </div>

                    <div className="mt-4">
                        <Link
                            to={`/orders/${order.order_id}/invoice`}
                            target="_blank"
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow inline-flex items-center gap-2"
                        >
                            <span>📄 View / Print Invoice</span>
                        </Link>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                        ${order.total_amount.toFixed(2)}
                    </div>

                    {order.amount_paid > 0 && (
                        <div className="text-sm text-gray-500 mb-1">
                            Paid: ${order.amount_paid.toFixed(2)}
                        </div>
                    )}

                    {(order.total_amount - order.amount_paid) > 0.01 && (
                        <div className="text-red-600 font-bold mb-2">
                            Due: ${(order.total_amount - order.amount_paid).toFixed(2)}
                        </div>
                    )}

                    <span className={`status-badge status-${order.payment_status?.toLowerCase().replace(' ', '-')}`}>
                        {order.payment_status}
                    </span>
                </div>
            </div>

            {/* Event Summary Card */}
            <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                {order.banner_url && (
                    <div style={{
                        width: '120px',
                        height: '80px',
                        borderRadius: '4px',
                        backgroundImage: `url(${order.banner_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        flexShrink: 0
                    }} />
                )}
                <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{order.event_name}</h2>
                </div>
                <div>
                    <Link to={`/events/${order.event_slug}`} className="secondary-button">
                        View Event Page
                    </Link>
                </div>
            </div>

            {/* ORDER SUMMARY SECTION */}
            <h2 className="text-xl font-bold border-b border-gray-200 pb-2 mb-4">Order Summary</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-8">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 font-semibold">Item</th>
                            <th className="px-6 py-3 font-semibold">Details</th>
                            {(user?.role === 'admin' || user?.role === 'Operational') && (
                                <th className="px-6 py-3 font-semibold text-center">Admin</th>
                            )}
                            <th className="px-6 py-3 font-semibold text-right">Price</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {summaryItems.map(item => (
                            <tr key={item.order_item_id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 align-top">
                                    <div className="font-bold text-gray-800 text-lg mb-1">{item.item_name}</div>
                                    <div className="flex gap-2">
                                        <span className={`status-badge`}>
                                            {item.item_type.toUpperCase()}
                                        </span>
                                        {(item.quantity || 1) > 1 && (
                                            <span className="status-badge" style={{ backgroundColor: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe' }}>
                                                Qty: {item.quantity}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 align-top">
                                    <div className="text-sm text-gray-600 space-y-1">
                                        {/* Dynamic details based on type */}
                                        {item.item_type === 'Merchandise' && (
                                            <>
                                                {item.variant_string && (
                                                    <div className="flex gap-2">
                                                        <span className="font-medium">Option:</span>
                                                        <span>{item.variant_string}</span>
                                                    </div>
                                                )}
                                                {item.sku_code && (
                                                    <div className="text-xs text-gray-400 font-mono mt-1">Ref: {item.sku_code}</div>
                                                )}
                                            </>
                                        )}

                                        {item.item_type === 'Campsite' && item.camp_check_in && (
                                            <div>
                                                <span className="font-medium">Dates: </span>
                                                {new Date(item.camp_check_in).toLocaleDateString()} &rarr; {new Date(item.camp_check_out).toLocaleDateString()}
                                            </div>
                                        )}

                                        {item.item_type === 'Asset' && item.asset_start && (
                                            <div>
                                                <div>
                                                    {new Date(item.asset_start).toLocaleDateString()} &rarr; {new Date(item.asset_end).toLocaleDateString()}
                                                </div>
                                                {item.asset_identifier && (
                                                    <div className="text-xs font-mono bg-yellow-50 text-yellow-800 inline-block px-1 rounded mt-1 border border-yellow-100">
                                                        ID: {item.asset_identifier}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {item.item_type === 'Subevent' && (
                                            <div>
                                                {item.subevent_start && (
                                                    <div>{formatDateTimeForDisplay(item.subevent_start)}</div>
                                                )}
                                                {item.subevent_attendee_name && (
                                                    <div className="text-xs font-semibold text-gray-700 mt-1">
                                                        For: {item.subevent_attendee_name}
                                                    </div>
                                                )}
                                                {item.subevent_options && (
                                                    <div className="mt-1 text-blue-700 bg-blue-50 px-2 py-1 rounded inline-block text-xs font-semibold">
                                                        {item.subevent_options}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Pit Crew / Pilot Logic */}
                                        {item.pilot_name && (
                                            <div className="mt-2 text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 inline-flex items-center gap-1">
                                                <span className="text-xs font-bold uppercase tracking-wide">For Pilot:</span>
                                                <span className="font-medium">{item.pilot_name}</span>
                                            </div>
                                        )}

                                        {item.item_type === 'Ticket' && item.ticket_code && (
                                            <div className="text-xs text-gray-400 font-mono mt-1">
                                                Ref: {item.ticket_code}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                {(user?.role === 'admin' || user?.role === 'Operational') && (
                                    <td className="px-6 py-4 align-top text-center">
                                        {item.refunded_at ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <div title={`Refunded on ${new Date(item.refunded_at).toLocaleString()}`}
                                                    className="status-badge"
                                                    style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' }}>
                                                    🚫 REFUNDED
                                                </div>
                                                <button
                                                    onClick={() => handleRefundAction(item, 'unrefund')}
                                                    className="text-xs text-blue-600 underline hover:text-blue-800"
                                                >
                                                    Undo Refund
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleRefundAction(item, 'refund')}
                                                className="bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-400 font-bold py-1 px-3 rounded text-xs transition duration-150 uppercase tracking-wide"
                                            >
                                                Refund
                                            </button>
                                        )}
                                    </td>
                                )}
                                <td className="px-6 py-4 align-top text-right font-bold text-gray-900">
                                    ${(item.price_at_purchase * (item.quantity || 1)).toFixed(2)}
                                    {(item.quantity || 1) > 1 && (
                                        <div className="text-xs font-normal text-gray-500 mt-1">
                                            ${item.price_at_purchase.toFixed(2)} ea
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-100">
                        <tr>
                            <td colSpan="2" className="px-6 py-4 text-right font-bold text-gray-600 uppercase tracking-wide">Total</td>
                            <td className="px-6 py-4 text-right font-bold text-xl text-gray-900 pr-8" colSpan={user?.role === 'admin' || user?.role === 'Operational' ? 2 : 1}>
                                ${order.total_amount.toFixed(2)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>


            {/* PAYMENT HISTORY SECTION */}
            {order.transactions && order.transactions.length > 0 && (
                <>
                    <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Payment History</h2>
                    <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '3rem' }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: '1.5rem' }}>Date</th>
                                    <th>Reference</th>
                                    <th>Method</th>
                                    <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.transactions.map((txn, idx) => (
                                    <tr key={idx}>
                                        <td style={{ paddingLeft: '1.5rem', paddingTop: '1rem', paddingBottom: '1rem' }}>
                                            {new Date(txn.payment_date || txn.timestamp).toLocaleDateString()}
                                        </td>
                                        <td>{txn.reference || '-'}</td>
                                        <td>{txn.payment_method}</td>
                                        <td style={{ textAlign: 'right', paddingRight: '1.5rem', fontWeight: 'bold' }}>
                                            ${txn.amount.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* PAY NOW INSTRUCTIONS */}
            {(order.total_amount - order.amount_paid) > 0.01 && (
                <div className="card bg-blue-50 border-blue-200 mb-8 p-6">
                    <h3 className="text-blue-800 font-bold text-lg mb-2">Payment Required</h3>
                    <p className="text-blue-900 mb-4">
                        Please pay the outstanding balance of <strong>${(order.total_amount - order.amount_paid).toFixed(2)}</strong> via Direct Deposit.
                    </p>
                    <div className="bg-white p-4 rounded border border-blue-100 inline-block">
                        <p className="text-sm text-gray-500 mb-1 uppercase tracking-wide">Payment Reference (Required)</p>
                        <p className="text-xl font-mono font-bold">
                            {order.invoice_number || `INV-${new Date(order.order_date).getFullYear()}-${order.order_id}`}
                        </p>
                    </div>
                    <div className="mt-4">
                        <Link to={`/orders/${order.order_id}/invoice`} target="_blank" className="text-blue-700 font-bold underline">
                            View Invoice for Bank Details &rarr;
                        </Link>
                    </div>
                </div>
            )}

            {/* TICKET MANAGEMENT SECTION */}
            {ticketsToManage.length > 0 && (
                <>
                    <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Ticket Management</h2>
                    <p style={{ marginBottom: '1.5rem', color: '#666' }}>
                        Please assign the details for each ticket holder below. For Pilots, you can also manage your registered aircraft.
                    </p>

                    <div className="tickets-list">
                        {ticketsToManage.map(item => {
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
                                                {item.item_name}
                                                {item.system_role === 'pilot' && <span style={{ marginLeft: '0.5rem', color: '#007bff' }}>✈️ Pilot</span>}
                                                {item.system_role === 'junior_pilot' && <span style={{ marginLeft: '0.5rem', color: '#4338ca' }}>✈️ Junior Pilot</span>}
                                                {item.system_role === 'pit_crew' && <span style={{ marginLeft: '0.5rem', color: '#ff9800' }}>🛠️ Crew</span>}
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

                                    {/* Pilot Details Section */}
                                    {['pilot', 'junior_pilot'].includes(item.system_role) && (
                                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                                            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                                <div style={{ minWidth: '150px' }}>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#888', marginBottom: '0.25rem' }}>License / AUS #</div>
                                                    <div>{item.license_number || 'N/A'}</div>
                                                    {item.is_heavy_model_inspector && (
                                                        <div style={{ marginTop: '0.5rem' }}>
                                                            <span className="status-badge" style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9' }}>
                                                                ✔ HM Inspector
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#888', marginBottom: '0.25rem' }}>Registered Aircraft</div>
                                                    {item.planes && item.planes.length > 0 ? (
                                                        <ul style={{ margin: 0, paddingLeft: '1rem', listStyleType: 'disc' }}>
                                                            {item.planes.map((p, idx) => (
                                                                <li key={idx} style={{ marginBottom: '0.25rem' }}>
                                                                    <strong>{p.name} {p.model_type}</strong> - {p.registration_number}
                                                                    {(p.heavy_model_cert_number || p.heavy_model_cert_image_url) && (
                                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem', backgroundColor: '#fff3cd', padding: '1px 6px', borderRadius: '4px', fontSize: '0.85rem' }}>
                                                                            <span>⚖️ Heavy Model</span>
                                                                            {p.heavy_model_cert_number && <span>(Cert: {p.heavy_model_cert_number})</span>}
                                                                            {p.heavy_model_cert_image_url && (
                                                                                <a href={p.heavy_model_cert_image_url} target="_blank" rel="noopener noreferrer" style={{ color: '#856404', textDecoration: 'underline' }}>View File</a>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <div style={{ color: '#999', fontStyle: 'italic' }}>No aircraft listed.</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

export default OrderDetail;
