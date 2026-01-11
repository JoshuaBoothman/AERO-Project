import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function ShopIndex() {
    const [allEvents, setAllEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch('/api/events');
                if (res.ok) {
                    const data = await res.json();
                    // Filter for Current & Upcoming
                    const now = new Date();
                    const relevant = data.filter(e => new Date(e.end_date) >= now);
                    setAllEvents(relevant);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchEvents();
    }, []);

    if (loading) return <div style={{ padding: '20px' }}>Loading shop...</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <h1>Event Stores</h1>
            <p>Select an event below to browse merchandise, hire assets, and register for sub-events.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
                {allEvents.map(event => (
                    <div key={event.event_id} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                        {event.banner_url ? (
                            <img src={event.banner_url} alt={event.name} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '150px', background: 'var(--primary-color, black)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                {event.name}
                            </div>
                        )}
                        <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <h3 style={{ marginTop: '0' }}>{event.name}</h3>
                            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '15px' }}>
                                {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                            </p>
                            <div style={{ marginTop: 'auto' }}>
                                <Link to={`/store/${event.slug}`}>
                                    <button style={{ width: '100%', padding: '10px', background: 'var(--primary-color, black)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                        Visit Store
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
                {allEvents.length === 0 && <p>No upcoming events found.</p>}
            </div>
        </div>
    );
}

export default ShopIndex;
