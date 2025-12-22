import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

function EventDetails() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`/api/events/${slug}`);
        if (response.status === 404) throw new Error('Event not found');
        const data = await response.json();
        setEvent(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [slug]);

  if (loading) return <div>Loading details...</div>;
  if (error) return (
    <div className="card">
      <h3>Error</h3>
      <p>{error}</p>
      <Link to="/events">Back to Events</Link>
    </div>
  );

  const formatDate = (date) => new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();
  const isPast = new Date(event.end_date) < new Date();
  
  // Dynamic Badge Logic
  const getBadgeStyle = (status) => {
    const s = status.toLowerCase();
    if (s === 'active') {
      return {
        background: 'var(--accent-color)', // Gold
        color: 'var(--primary-color)',     // Black text on Gold
      };
    } else if (s === 'planned') {
      return {
        background: 'var(--primary-color)', // Black
        color: 'var(--secondary-color)',    // White text on Black
      };
    } else {
      // Completed/Default
      return {
        background: '#eee',                 // Neutral Grey
        color: '#777',                      // Muted text
      };
    }
  };

  return (
    <div className="event-details-page">
      <Link to="/events" className="back-link">← Back to Events</Link>
      
        <div className="card">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}> {/* Remove padding from card wrapper so image hits edges */}
        
        {/* BANNER IMAGE */}
        {event.banner_url && (
            <div style={{ 
                width: '100%', 
                height: '300px', 
                overflow: 'hidden',
                borderBottom: '1px solid #eee'
            }}>
                <img 
                    src={event.banner_url} 
                    alt={event.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
            </div>
        )}

        {/* Content Container (re-add padding here) */}
        <div style={{ padding: '2rem' }}>
            
            <h1>{event.name}</h1>
            {/* ... rest of the existing JSX ... */}
            
            {/* Make sure to close the extra div we opened! */}
        </div>
      </div>
        
        <h1>{event.name}</h1>
        
        <div className="status-badge" style={{ 
            display: 'inline-block', 
            padding: '4px 8px', 
            borderRadius: '4px', 
            marginBottom: '1rem',
            fontWeight: 'bold',
            fontSize: '0.85rem',
            ...getBadgeStyle(event.status) // Apply the dynamic style
              }}>
        
          {event.status.toUpperCase()}
        </div>

        <h3>Date & Time</h3>
        <p>{formatDate(event.start_date)} - {formatDate(event.end_date)}</p>

        <h3>Location</h3>
        <p>
            <strong>{event.venue_name}</strong><br/>
            {event.address_line_1}<br/>
            {event.city}, {event.state} {event.postcode}
        </p>
        {event.map_url && (
            <p><a href={event.map_url} target="_blank" rel="noreferrer">View Map</a></p>
        )}

        <h3>About this Event</h3>
        <p style={{ whiteSpace: 'pre-line' }}>{event.description}</p>

        <hr />
        
        <div className="actions">
            {event.is_purchasing_enabled ? (
                // Use Primary Color for the main Call-to-Action
                <button 
                  className="primary-button" 
                  style={{ backgroundColor: 'var(--primary-color)', color: 'var(--secondary-color)' }}
                  onClick={() => alert("Ticket purchasing coming next!")}
                >
                    Get Tickets / Register
                </button>
            ) : isPast ? (
                <button disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                    Event Ended
                </button>
            ) : (
                <button disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                    Ticket Sales Closed
                </button>
            )}
        </div>
      </div>
    </div>
  );
}

export default EventDetails;