import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

function Checkout() {
    const { cart, removeFromCart, clearCart, cartTotal } = useCart();
    const { token } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        if (!token) {
            alert("Please login to checkout.");
            navigate('/login');
            return;
        }

        setLoading(true);
        try {
            const eventId = cart[0]?.eventId;
            if (!eventId) {
                alert("Error: No event associated with cart items.");
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
                    price: c.price
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
                    price: s.price
                }))
            };

            const res = await fetch('/api/createOrder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                alert(`Order Success! ID: ${data.orderId}`);
                clearCart();
                navigate('/my-orders');
            } else {
                const err = await res.json();
                alert('Checkout Failed: ' + err.error);
            }

        } catch (e) {
            console.error(e);
            alert('Error submitting order');
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0) return <div style={{ padding: '20px' }}>Cart is empty</div>;

    const renderItem = (item, idx) => (
        <div key={idx} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
            <div>
                <strong>{item.name}</strong> <br />
                <small className="text-gray-500">
                    {item.type === 'CAMPSITE' && `${item.checkIn} to ${item.checkOut}`}
                    {item.type === 'ASSET' && `${item.checkIn} to ${item.checkOut}`}
                    {item.type === 'SUBEVENT' && new Date(item.startTime).toLocaleString()}
                </small>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span>${item.price.toFixed(2)}</span>
                <button onClick={() => removeFromCart(idx)} style={{ color: 'red' }}>x</button>
            </div>
        </div>
    );

    return (
        <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px' }}>
            <h1 className="text-2xl font-bold mb-4">Checkout</h1>

            <div className="bg-white shadow rounded p-4 mb-4">
                {cart.map((item, idx) => renderItem(item, idx))}
            </div>

            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'right', marginBottom: '20px' }}>
                Total: ${cartTotal.toFixed(2)}
            </div>
            <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-black text-white p-4 rounded text-xl font-bold hover:bg-gray-800 disabled:bg-gray-400"
            >
                {loading ? 'Processing...' : 'Pay Now'}
            </button>
        </div>
    );
}

export default Checkout;
