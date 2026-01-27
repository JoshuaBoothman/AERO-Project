import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatDateTimeForDisplay } from '../utils/dateHelpers';

function Checkout() {
    const { cart, removeFromCart, clearCart, cartTotal } = useCart();
    const { token } = useAuth();
    const { notify } = useNotification();
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        if (!token) {
            notify("Please login to checkout.", "error");
            navigate('/login', { state: { from: location } });
            return;
        }

        setLoading(true);
        try {
            const eventId = cart[0]?.eventId;
            if (!eventId) {
                notify("Error: No event associated with cart items.", "error");
                setLoading(false);
                return;
            }

            // Group Items
            const tickets = cart.filter(i => i.type === 'TICKET');
            const campsites = cart.filter(i => i.type === 'CAMPSITE');
            const merch = cart.filter(i => i.type === 'MERCH');
            const assets = cart.filter(i => i.type === 'ASSET');
            const subevents = cart.filter(i => i.type === 'SUBEVENT');

            const payload = {
                eventId: eventId,
                items: tickets.map(t => ({
                    ticketTypeId: t.id,
                    quantity: t.quantity,
                    attendees: t.attendees || []
                })),
                campsites: campsites.map(c => ({
                    campsiteId: c.id,
                    checkIn: c.checkIn,
                    checkOut: c.checkOut,
                    price: c.price,
                    adults: c.adults,
                    children: c.children
                })),
                merchandise: merch.map(m => ({
                    skuId: m.id,
                    quantity: m.quantity,
                    price: m.price
                })),
                assets: assets.map(a => ({
                    assetId: a.id,
                    checkIn: a.checkIn,
                    checkOut: a.checkOut,
                    price: a.price
                })),
                subevents: subevents.map(s => ({
                    subeventId: s.id,
                    price: s.price,
                    selectedOptions: s.selectedOptions || {}
                }))
            };

            const res = await fetch('/api/createOrder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                notify(`Order Success! ID: ${data.orderId}`, "success");
                clearCart();
                navigate(`/orders/${data.orderId}/invoice`);
            } else {
                const err = await res.json();
                notify('Checkout Failed: ' + err.error, "error");
            }

        } catch (e) {
            console.error(e);
            notify('Error submitting order', "error");
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0) return (
        <div className="max-w-4xl mx-auto p-8 text-center bg-white rounded-lg shadow-sm mt-12">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Cart is Empty</h2>
            <p className="text-gray-500">Looks like you haven't added anything yet.</p>
        </div>
    );

    const renderItem = (item, idx) => (
        <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors group gap-4">
            <div className="flex-grow w-full sm:w-auto">
                <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-lg text-gray-800">{item.name}</strong>
                    <span className="text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded whitespace-nowrap">{item.type}</span>
                </div>
                {(item.type === 'CAMPSITE' || item.type === 'ASSET') && (
                    <small className="block text-gray-500 mt-1">
                        {new Date(item.checkIn).toLocaleDateString()} &rarr; {new Date(item.checkOut).toLocaleDateString()}
                    </small>
                )}
                {item.type === 'SUBEVENT' && (
                    <div className="mt-1">
                        <small className="block text-gray-500">
                            {formatDateTimeForDisplay(item.startTime)}
                        </small>
                        {item.variationDetails && (
                            <div className="mt-1 flex flex-wrap gap-2">
                                {item.variationDetails.map((detail, i) => (
                                    <span key={i} className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                                        {detail}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="flex items-center justify-between w-full sm:w-auto sm:gap-6">
                <span className="font-bold text-lg text-gray-900">${Number(item.price || 0).toFixed(2)}</span>
                <button
                    onClick={() => removeFromCart(idx)}
                    className="text-gray-400 hover:text-red-600 bg-transparent hover:bg-red-50 rounded-full w-10 h-10 flex items-center justify-center transition-all focus:outline-none"
                    aria-label="Remove item"
                >
                    ✕
                </button>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-900 border-b pb-4">Checkout</h1>

            <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-8 border border-gray-100">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <span className="text-sm font-bold uppercase text-gray-500 tracking-wider">Order Summary</span>
                    <span className="text-sm font-semibold text-gray-600">{cart.length} Items</span>
                </div>

                {/* Cart Items List */}
                <div className="divide-y divide-gray-50">
                    {cart.map((item, idx) => renderItem(item, idx))}
                </div>

                {/* Total Section */}
                <div className="bg-gray-50 p-8 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-8">
                        <span className="text-xl font-medium text-gray-600">Total Amount</span>
                        <span className="text-4xl font-bold text-primary">${cartTotal.toFixed(2)}</span>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={loading}
                        className="w-full bg-primary text-secondary py-4 rounded-lg text-xl font-bold hover:brightness-110 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                                Processing...
                            </>
                        ) : (
                            <>
                                🔒 Secure Pay Now
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Checkout;
