import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

function OrderDetail() {
    const { orderId } = useParams();
    const { user } = useAuth();
    const { notify } = useNotification();

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
            <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Order Summary</h2>
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '3rem' }}>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th style={{ paddingLeft: '1.5rem' }}>Item</th>
                            <th>Details</th>
                            <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summaryItems.map(item => (
                            <tr key={item.order_item_id}>
                                <td style={{ paddingLeft: '1.5rem', verticalAlign: 'top', paddingTop: '1rem', paddingBottom: '1rem' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.item_name}</div>
                                    <span className={`status-badge`}>
                                        {item.item_type.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ verticalAlign: 'top', paddingTop: '1rem', paddingBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.9rem', color: '#555', lineHeight: '1.6' }}>
                                        {/* Dynamic details based on type */}
                                        {item.item_type === 'Merchandise' && item.sku_code && (
                                            <div>Option: <strong>{item.sku_code}</strong></div>
                                        )}

                                        {item.item_type === 'Campsite' && item.camp_check_in && (
                                            <div>
                                                {new Date(item.camp_check_in).toLocaleDateString()} &rarr; {new Date(item.camp_check_out).toLocaleDateString()}
                                            </div>
                                        )}

                                        {item.item_type === 'Asset' && item.asset_start && (
                                            <div>
                                                {new Date(item.asset_start).toLocaleDateString()} &rarr; {new Date(item.asset_end).toLocaleDateString()}
                                                {item.asset_identifier && <div className="text-xs text-gray-500 font-mono mt-1">ID: {item.asset_identifier}</div>}
                                            </div>
                                        )}

                                        {item.item_type === 'Subevent' && item.subevent_start && (
                                            <div>
                                                {new Date(item.subevent_start).toLocaleString()}
                                            </div>
                                        )}

                                        {item.item_type === 'Ticket' && item.ticket_code && (
                                            <div style={{ fontFamily: 'monospace', color: '#666' }}>
                                                Ref: {item.ticket_code}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td style={{ textAlign: 'right', paddingRight: '1.5rem', fontWeight: 'bold', verticalAlign: 'top', paddingTop: '1rem' }}>
                                    ${item.price_at_purchase.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot style={{ backgroundColor: '#f9fafb' }}>
                        <tr>
                            <td colSpan="2" style={{ textAlign: 'right', padding: '1rem', fontWeight: 'bold' }}>Total</td>
                            <td style={{ textAlign: 'right', padding: '1rem', paddingRight: '1.5rem', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                ${order.total_amount.toFixed(2)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>


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
                                    {item.system_role === 'pilot' && (
                                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                                            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                                <div style={{ minWidth: '150px' }}>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#888', marginBottom: '0.25rem' }}>License / AUS #</div>
                                                    <div>{item.license_number || 'N/A'}</div>
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
