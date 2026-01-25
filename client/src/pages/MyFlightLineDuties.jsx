import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

function MyFlightLineDuties() {
    const { slug } = useParams();
    const { notify } = useNotification();
    const token = localStorage.getItem('token');

    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(null);
    const [pilots, setPilots] = useState([]);
    const [duties, setDuties] = useState([]);
    const [selectedPilot, setSelectedPilot] = useState('all');

    // Fetch event details
    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await fetch(`/api/events/${slug}`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
                });
                if (!res.ok) throw new Error('Event not found');
                const data = await res.json();
                setEvent(data);
            } catch (err) {
                notify(err.message, 'error');
                setLoading(false);
            }
        };
        fetchEvent();
    }, [slug, token]);

    // Fetch duties
    useEffect(() => {
        if (!event) return;
        fetchDuties();
    }, [event]);

    const fetchDuties = async () => {
        try {
            const res = await fetch(`/api/events/${slug}/my-flight-line-duties`, {
                headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
            });
            if (!res.ok) throw new Error('Failed to fetch duties');
            const data = await res.json();
            setPilots(data.pilots);
            setDuties(data.duties);
            setLoading(false);
        } catch (err) {
            notify(err.message, 'error');
            setLoading(false);
        }
    };

    const formatTime = (timeValue) => {
        if (!timeValue) return '';
        if (typeof timeValue === 'string' && timeValue.includes('T')) {
            const timePart = timeValue.split('T')[1];
            return timePart.substring(0, 5);
        }
        if (typeof timeValue === 'string') {
            return timeValue.substring(0, 5);
        }
        return timeValue;
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Filter duties by selected pilot
    const filteredDuties = selectedPilot === 'all'
        ? duties
        : duties.filter(d => d.attendee_id === parseInt(selectedPilot));

    // Group duties by date
    const groupedDuties = filteredDuties.reduce((acc, duty) => {
        const date = duty.roster_date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(duty);
        return acc;
    }, {});

    // Get pilot with flight line duties enabled
    const pilotsWithDuties = pilots.filter(p => p.flight_line_duties);

    if (loading) return <div className="container">Loading...</div>;
    if (!event) return <div className="container">Event not found</div>;

    return (
        <div className="container" style={{ maxWidth: '900px', margin: '2rem auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1>My Flight Line Duties</h1>
                <p style={{ color: '#666', margin: '0.5rem 0 0' }}>Event: {event.name}</p>
            </div>

            {/* Pilot Filter */}
            {pilotsWithDuties.length > 1 && (
                <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Select Pilot:
                    </label>
                    <select
                        value={selectedPilot}
                        onChange={(e) => setSelectedPilot(e.target.value)}
                        className="form-control"
                        style={{ width: '100%', maxWidth: '400px' }}
                    >
                        <option value="all">All My Pilots</option>
                        {pilotsWithDuties.map(pilot => (
                            <option key={pilot.attendee_id} value={pilot.attendee_id}>
                                {pilot.first_name} {pilot.last_name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* No Duties Message */}
            {pilotsWithDuties.length === 0 && (
                <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                    <p style={{ color: '#666', fontSize: '1.1rem' }}>
                        None of your registered pilots have flight line duties enabled.
                    </p>
                </div>
            )}

            {pilotsWithDuties.length > 0 && filteredDuties.length === 0 && (
                <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                    <p style={{ color: '#666', fontSize: '1.1rem' }}>
                        No flight line duties assigned yet.
                    </p>
                    <p style={{ color: '#999', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Duties will appear here once the event organizer assigns them.
                    </p>
                </div>
            )}

            {/* Duties List */}
            {filteredDuties.length > 0 && (
                <div>
                    {Object.keys(groupedDuties).sort().map(date => (
                        <div key={date} className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
                            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                                {formatDate(date)}
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {groupedDuties[date].map(duty => {
                                    const pilot = pilots.find(p => p.attendee_id === duty.attendee_id);
                                    return (
                                        <div
                                            key={duty.roster_id}
                                            style={{
                                                padding: '1rem',
                                                background: '#f9fafb',
                                                borderRadius: '8px',
                                                borderLeft: '4px solid #2563eb'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                                <div style={{ flex: '1', minWidth: '200px' }}>
                                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#111', marginBottom: '0.25rem' }}>
                                                        {duty.flight_line_name}
                                                    </div>
                                                    {pilotsWithDuties.length > 1 && selectedPilot === 'all' && (
                                                        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>
                                                            Pilot: {pilot?.first_name} {pilot?.last_name}
                                                        </div>
                                                    )}
                                                    <div style={{ fontSize: '1rem', color: '#444' }}>
                                                        ⏰ {formatTime(duty.start_time)} - {formatTime(duty.end_time)}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    padding: '0.5rem 1rem',
                                                    background: '#dbeafe',
                                                    color: '#1e40af',
                                                    borderRadius: '6px',
                                                    fontSize: '0.9rem',
                                                    fontWeight: '500'
                                                }}>
                                                    Duration: {calculateDuration(duty.start_time, duty.end_time)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary */}
            {filteredDuties.length > 0 && (
                <div className="card" style={{ padding: '1.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>
                                {filteredDuties.length}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#047857' }}>
                                Total Duties
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>
                                {Object.keys(groupedDuties).length}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#047857' }}>
                                Days Scheduled
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>
                                {calculateTotalHours(filteredDuties)}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#047857' }}>
                                Total Hours
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper to extract minutes from any time format (ISO string, HH:MM:SS, etc)
function getTimeMinutes(timeValue) {
    if (!timeValue) return 0;

    let timeStr = '';

    // Handle Date object
    if (timeValue instanceof Date) {
        timeStr = timeValue.toTimeString().substring(0, 5);
    }
    // Handle ISO string (2026-01-01T10:00:00)
    else if (typeof timeValue === 'string' && timeValue.includes('T')) {
        timeStr = timeValue.split('T')[1].substring(0, 5);
    }
    // Handle simple string (10:00:00)
    else if (typeof timeValue === 'string') {
        timeStr = timeValue.substring(0, 5);
    }

    if (!timeStr.includes(':')) return 0;

    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + minutes;
}

// Helper function to calculate duration between two times
function calculateDuration(startTime, endTime) {
    const startMinutes = getTimeMinutes(startTime);
    const endMinutes = getTimeMinutes(endTime);

    let duration = endMinutes - startMinutes;

    // Handle simplified case where end time is next day (though usually we have dates)
    // For flight lines usually same day, but just in case of negative duration (midnight crossing)
    if (duration < 0) duration += 24 * 60;

    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    if (hours === 0 && minutes === 0) return '0m';
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
}

// Helper function to calculate total hours
function calculateTotalHours(duties) {
    let totalMinutes = 0;

    duties.forEach(duty => {
        const startMinutes = getTimeMinutes(duty.start_time);
        const endMinutes = getTimeMinutes(duty.end_time);

        let duration = endMinutes - startMinutes;
        if (duration < 0) duration += 24 * 60;

        totalMinutes += duration;
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0 && minutes === 0) return '0m';
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
}

export default MyFlightLineDuties;
