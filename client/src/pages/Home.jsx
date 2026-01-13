import { useState, useEffect } from 'react';
import EventDetails from './EventDetails';

function Home() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Finding upcoming events...');
  const [targetSlug, setTargetSlug] = useState(null);

  useEffect(() => {
    const fetchAndDecide = async () => {
      try {
        const response = await fetch('/api/events');
        if (!response.ok) throw new Error('Failed to fetch events');

        const events = await response.json();

        if (!events || events.length === 0) {
          setMessage('No upcoming events found.');
          setLoading(false);
          return;
        }

        const now = new Date();

        // 1. Check for Current Event (happening right now)
        const currentEvent = events.find(e => {
          const start = new Date(e.start_date);
          const end = new Date(e.end_date);
          return now >= start && now <= end;
        });

        if (currentEvent) {
          setTargetSlug(currentEvent.slug);
          return;
        }

        // 2. Check for Next Upcoming Event
        const futureEvents = events
          .filter(e => new Date(e.start_date) > now)
          .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

        if (futureEvents.length > 0) {
          setTargetSlug(futureEvents[0].slug);
          return;
        }

        setMessage('No upcoming events scheduled at this time.');

      } catch (err) {
        console.error("Home error:", err);
        setMessage('Unable to load events.');
      } finally {
        setLoading(false);
      }
    };

    fetchAndDecide();
  }, []);

  if (targetSlug) {
    return <EventDetails propSlug={targetSlug} />;
  }

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '2rem' }}>
        <div className="spinner"></div>
        <p>{message}</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <h2>Event Portal</h2>
      <p>{message}</p>
      <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>
        Admin? <a href="/login">Login here</a>
      </p>
    </div>
  );
}

export default Home;