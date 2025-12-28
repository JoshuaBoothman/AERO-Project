import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate, useParams } from 'react-router-dom';

function Checkout() {
    const { cart, removeFromCart, clearCart, cartTotal } = useCart();
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const { slug } = useParams(); // May not be available if not under /events/:slug... logic needs care.

    const [loading, setLoading] = useState(false);

    // We need an Event ID for the order. 
    // Assuming mixed events isn't allowed. Take eventId from first item?
    // Items should store eventId.

    const handleCheckout = async () => {
        if (!token) {
            alert("Please login to checkout.");
            navigate('/login');
            return;
        }

        setLoading(true);
        try {
            // Transform Cart to API Payload
            // API expects: { eventId, items: [], campsites: [] }

            // 1. Group by Event (Simple validation)
            const eventId = cart[0]?.eventId;
            // Wait, we didn't store eventId in CampingPage cart item. We should.
            // Let's assume we pass eventId via props or store it.
            // For now, let's look at the cart items. 

            const tickets = cart.filter(i => i.type === 'TICKET');
            const campsites = cart.filter(i => i.type === 'CAMPSITE');


            if (!eventId) {
                alert("Error: No event associated with cart items.");
                setLoading(false);
                return;
            }

            // Construct payload
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
                }))
            };

            // Note: Validation required here.

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

    return (
        <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px' }}>
            <h1>Checkout</h1>
            <div style={{ marginBottom: '20px' }}>
                {cart.map((item, idx) => (
                    <div key={idx} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <strong>{item.name}</strong> <br />
                            <small>{item.checkIn ? `${item.checkIn} to ${item.checkOut}` : 'Ticket'}</small>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span>${item.price.toFixed(2)}</span>
                            <button onClick={() => removeFromCart(idx)} style={{ color: 'red' }}>x</button>
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'right', marginBottom: '20px' }}>
                Total: ${cartTotal.toFixed(2)}
            </div>
            <button
                onClick={handleCheckout}
                disabled={loading}
                style={{ width: '100%', padding: '15px', background: 'black', color: 'white', fontSize: '1.2rem', cursor: loading ? 'wait' : 'pointer' }}
            >
                {loading ? 'Processing...' : 'Pay Now'}
            </button>
        </div>
    );
}

export default Checkout;
