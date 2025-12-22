import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function EventDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Purchase State
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [cart, setCart] = useState({}); // { ticket_type_id: quantity }
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`/api/events/${slug}`);
        if (response.status === 404) throw new Error('Event not found');
        const data = await response.json();
        
        // Handle API response structure (checking if tickets are included)
        if (data.tickets) {
            setTickets(data.tickets);
            // Remove tickets from main event object to keep it clean
            const { tickets, ...eventData } = data;
            setEvent(eventData);
        } else {
            setEvent(data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [slug]);

  const handleGetTickets = () => {
    if (!user) {
        // Redirect to login, but remember to come back here!
        navigate('/login', { state: { from: location } });
    } else {
        setShowTicketModal(true);
    }
  };

  const updateCart = (ticketId, delta) => {
    setCart(prev => {
        const currentQty = prev[ticketId] || 0;
        const newQty = Math.max(0, currentQty + delta);
        return { ...prev, [ticketId]: newQty };
    });
  };

  const handleCheckout = async () => {
    setPurchasing(true);
    setError(null);

    // Prepare items for API
    const items = Object.entries(cart)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => ({ ticketTypeId: parseInt(id), quantity: qty }));

    if (items.length === 0) {
        alert("Please select at least one ticket.");
        setPurchasing(false);
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/createOrder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                eventId: event.event_id,
                items
            })
        });

        const result = await res.json();
        
        if (!res.ok) throw new Error(result.error || "Purchase failed");

        setPurchaseSuccess(result);
        setCart({}); // Clear cart
        // Don't close modal immediately so they see success message

    } catch (err) {
        console.error(err);
        alert(`Error: ${err.message}`);
    } finally {
        setPurchasing(false);
    }
  };

  if (loading) return <div>Loading details...</div>;
  if (error) return <div className="card"><h3>Error</h3><p>{error}</p><Link to="/events">Back to Events</Link></div>;

  const formatDate = (date) => new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();
  const isPast = new Date(event.end_date) < new Date();

  // Helper for total calculation
  const cartTotal = Object.entries(cart).reduce((total, [id, qty]) => {
      const ticket = tickets.find(t => t.ticket_type_id === parseInt(id));
      return total + (ticket ? ticket.price * qty : 0);
  }, 0);

  return (
    <div className="event-details-page">
      <Link to="/events" className="back-link">← Back to Events</Link>
      
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Banner */}
        {event.banner_url && (
            <div style={{ width: '100%', height: '300px', overflow: 'hidden', borderBottom: '1px solid #eee' }}>
                <img src={event.banner_url} alt={event.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
        )}

        <div style={{ padding: '2rem' }}>
            <h1>{event.name}</h1>
            
            {/* Status Badge */}
            <div className="status-badge" style={{ 
                display: 'inline-block', padding: '4px 8px', borderRadius: '4px', marginBottom: '1rem',
                fontWeight: 'bold', fontSize: '0.85rem', background: '#eee', color: '#555'
            }}>
                {event.status.toUpperCase()}
            </div>

            <h3>Date & Time</h3>
            <p>{formatDate(event.start_date)} - {formatDate(event.end_date)}</p>

            <h3>Location</h3>
            <p><strong>{event.venue_name}</strong><br/>{event.address_line_1}<br/>{event.city}, {event.state} {event.postcode}</p>

            <h3>About this Event</h3>
            <p style={{ whiteSpace: 'pre-line' }}>{event.description}</p>

            <hr />
            
            <div className="actions">
                {event.is_purchasing_enabled ? (
                    <button 
                      className="primary-button" 
                      onClick={handleGetTickets}
                    >
                        Get Tickets
                    </button>
                ) : (
                    <button disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                        {isPast ? 'Event Ended' : 'Ticket Sales Closed'}
                    </button>
                )}
            </div>
        </div>
      </div>

      {/* TICKET MODAL */}
      {showTicketModal && (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2>Select Tickets</h2>
                    <button onClick={() => setShowTicketModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

                {purchaseSuccess ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <h3 style={{ color: 'green' }}>Order Confirmed!</h3>
                        <p>Order ID: #{purchaseSuccess.orderId}</p>
                        <p>Total Paid: ${purchaseSuccess.total}</p>
                        <button className="secondary-button" onClick={() => setShowTicketModal(false)}>Close</button>
                    </div>
                ) : (
                    <>
                        {tickets.length === 0 ? (
                            <p>No tickets available for this event.</p>
                        ) : (
                            <div className="ticket-list">
                                {tickets.map(t => (
                                    <div key={t.ticket_type_id} style={{ 
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                        padding: '1rem', borderBottom: '1px solid #eee' 
                                    }}>
                                        <div>
                                            <strong>{t.name}</strong>
                                            <div style={{ color: '#666', fontSize: '0.9rem' }}>${t.price}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <button 
                                                style={{ width: '30px', height: '30px', padding: 0 }} 
                                                onClick={() => updateCart(t.ticket_type_id, -1)}
                                            >-</button>
                                            <span style={{ width: '20px', textAlign: 'center' }}>{cart[t.ticket_type_id] || 0}</span>
                                            <button 
                                                style={{ width: '30px', height: '30px', padding: 0 }} 
                                                onClick={() => updateCart(t.ticket_type_id, 1)}
                                            >+</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '2px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Total: ${cartTotal.toFixed(2)}</h3>
                            
                            {/* THIS IS THE CHECKOUT BUTTON */}
                            <button 
                                className="primary-button" 
                                disabled={purchasing || cartTotal === 0}
                                onClick={handleCheckout}
                            >
                                {purchasing ? 'Processing...' : 'Checkout'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
      )}

    </div>
  );
}

export default EventDetails;