import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

function RosterEventSelector() {
    const navigate = useNavigate();
    const { notify } = useNotification();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch('/api/events');
                if (!res.ok) throw new Error('Failed to fetch events');
                const data = await res.json();
                // Filter for active/upcoming events only
                const activeEvents = data.filter(e => new Date(e.end_date) >= new Date());
                setEvents(activeEvents);
                setLoading(false);
            } catch (err) {
                notify(err.message, 'error');
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    if (loading) return <div className="container">Loading events...</div>;

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '2rem auto' }}>
            <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Select Event</h1>
            <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#666' }}>
                Please select an event to view your flight line duties.
            </p>

            {events.length === 0 ? (
                <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                    <p>No active events found.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {events.map(event => (
                        <div
                            key={event.event_id}
                            className="card"
                            style={{
                                padding: '1.5rem',
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                borderLeft: `6px solid ${event.primary_color || '#2563eb'}`
                            }}
                            onClick={() => navigate(`/events/${event.slug}/my-duties`)}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                            }}
                        >
                            <h2 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.25rem' }}>{event.name}</h2>
                            <div style={{ display: 'flex', gap: '1rem', color: '#666', fontSize: '0.9rem' }}>
                                <span>📅 {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}</span>
                                {event.venue_name && <span>📍 {event.venue_name}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default RosterEventSelector;
