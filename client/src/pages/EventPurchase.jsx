import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function EventPurchase() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // We will use this later to pre-fill info

  const [ticketTypes, setTicketTypes] = useState([]);
  const [quantities, setQuantities] = useState({}); // { ticket_type_id: number }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Fetch Ticket Types on Load
  useEffect(() => {
    async function fetchTickets() {
      try {
        const res = await fetch(`/api/getEventTicketTypes?slug=${slug}`);
        if (!res.ok) throw new Error('Failed to load tickets');
        const data = await res.json();
        setTicketTypes(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTickets();
  }, [slug]);

  // 2. Handle Quantity Changes
  const updateQuantity = (id, change) => {
    setQuantities(prev => {
      const current = prev[id] || 0;
      const newVal = Math.max(0, current + change); // Prevent negative
      return { ...prev, [id]: newVal };
    });
  };

  // 3. Calculate Total
  const totalAmount = ticketTypes.reduce((sum, ticket) => {
    const qty = quantities[ticket.ticket_type_id] || 0;
    return sum + (ticket.price * qty);
  }, 0);

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);

  // 4. Handle "Next" Button
  const handleNext = () => {
    // We filter out any tickets with 0 quantity
    const cart = ticketTypes
      .map(t => ({ ...t, quantity: quantities[t.ticket_type_id] || 0 }))
      .filter(t => t.quantity > 0);

    // Navigate to the next step (we'll build this route next)
    // We pass the 'cart' state via the router location state
    navigate(`/events/${slug}/purchase/assign`, { state: { cart } });
  };

  if (loading) return <div>Loading ticket options...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
      <h1>Select Tickets</h1>
      
      <div className="ticket-list" style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        {ticketTypes.map(ticket => (
          <div key={ticket.ticket_type_id} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            background: 'white'
          }}>
            <div>
              <h3 style={{ margin: 0 }}>{ticket.name}</h3>
              <p style={{ margin: '0.5rem 0 0', color: '#666' }}>${ticket.price.toFixed(2)}</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                className="secondary-button"
                onClick={() => updateQuantity(ticket.ticket_type_id, -1)}
                disabled={!quantities[ticket.ticket_type_id]}
              >-</button>
              
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', minWidth: '2ch', textAlign: 'center' }}>
                {quantities[ticket.ticket_type_id] || 0}
              </span>

              <button 
                className="secondary-button"
                onClick={() => updateQuantity(ticket.ticket_type_id, 1)}
              >+</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        marginTop: '2rem', 
        padding: '1.5rem', 
        background: '#f8f9fa', 
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: 0 }}>Total: ${totalAmount.toFixed(2)}</h2>
          <small>{totalItems} tickets selected</small>
        </div>
        
        <button 
          className="primary-button" 
          disabled={totalItems === 0}
          onClick={handleNext}
        >
          Next: Assign Attendees &rarr;
        </button>
      </div>
    </div>
  );
}

export default EventPurchase;