import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';

function EventPurchase() {
  const { slug } = useParams();
  const navigate = useNavigate();
  // const { user } = useAuth(); // We will use this later to pre-fill info

  const [ticketTypes, setTicketTypes] = useState([]);
  const [quantities, setQuantities] = useState({}); // { ticket_type_id: number }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [officialDinnerSubevent, setOfficialDinnerSubevent] = useState(null); // [NEW] Link
  const [dinnerOptIn, setDinnerOptIn] = useState({}); // { ticket_type_id: boolean }

  // 1. Fetch Event & Tickets on Load
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/events/${slug}`);
        if (!res.ok) throw new Error('Failed to load event');
        const data = await res.json();

        // Extract tickets from the combined response
        if (data.tickets) {
          setTicketTypes(data.tickets);
        }

        // Check for official dinner
        if (data.official_dinner_subevent_id) {
          // Fetch subevent details
          const subRes = await fetch(`/api/events/${data.event_id}/subevents`);
          if (subRes.ok) {
            const subs = await subRes.json();
            const dinner = subs.find(s => s.subevent_id === data.official_dinner_subevent_id);
            if (dinner) {
              setOfficialDinnerSubevent(dinner);
            }
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  // 2. Handle Quantity Changes
  const updateQuantity = (id, change) => {
    setQuantities(prev => {
      const current = prev[id] || 0;
      const newVal = Math.max(0, current + change); // Prevent negative
      return { ...prev, [id]: newVal };
    });
  };

  // Toggle Dinner Opt-In
  const toggleDinner = (ticketId) => {
    setDinnerOptIn(prev => ({
      ...prev,
      [ticketId]: !prev[ticketId]
    }));
  };

  // 3. Calculate Total
  const totalAmount = ticketTypes.reduce((sum, ticket) => {
    const qty = quantities[ticket.ticket_type_id] || 0;
    return sum + (ticket.price * qty);
  }, 0);

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);

  // 4. Handle "Next" Button
  const handleNext = () => {
    const cart = [];

    ticketTypes.forEach(t => {
      const qty = quantities[t.ticket_type_id] || 0;
      if (qty > 0) {
        // Add Ticket
        cart.push({
          ...t,
          type: 'TICKET',
          id: t.ticket_type_id,
          quantity: qty
        });

        // Add Official Dinner if opted-in
        if (dinnerOptIn[t.ticket_type_id] && officialDinnerSubevent && t.includes_official_dinner) {
          cart.push({
            type: 'SUBEVENT',
            id: officialDinnerSubevent.subevent_id,
            name: officialDinnerSubevent.name,
            price: 0,
            quantity: qty, // Match ticket quantity
            description: 'Official Dinner Entry (Included with Ticket)',
            startTime: officialDinnerSubevent.start_time
          });
        }
      }
    });

    // Navigate
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
            flexDirection: 'column',
            border: '1px solid #ddd',
            borderRadius: '8px',
            background: 'white',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
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

            {/* Official Dinner Option */}
            {ticket.includes_official_dinner && officialDinnerSubevent && quantities[ticket.ticket_type_id] > 0 && (
              <div style={{ background: '#f0fdf4', padding: '1rem 1.5rem', borderTop: '1px solid #bbf7d0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#166534' }}>
                  <input
                    type="checkbox"
                    checked={!!dinnerOptIn[ticket.ticket_type_id]}
                    onChange={() => toggleDinner(ticket.ticket_type_id)}
                    style={{ width: '1.2rem', height: '1.2rem' }}
                  />
                  <div>
                    <strong>Add Official Dinner Entry? ({officialDinnerSubevent.name})</strong>
                    <div style={{ fontSize: '0.85rem' }}>Includes {quantities[ticket.ticket_type_id]}x entries at $0.00</div>
                  </div>
                </label>
              </div>
            )}
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