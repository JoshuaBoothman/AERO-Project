import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';

function FlightLineRoster() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { notify, confirm } = useNotification();
    const token = localStorage.getItem('token');

    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(null);
    const [roster, setRoster] = useState([]);
    const [eligiblePilots, setEligiblePilots] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [availableDates, setAvailableDates] = useState([]);

    // Modals
    const [assignModal, setAssignModal] = useState({ show: false, slot: null });
    const [editTimeModal, setEditTimeModal] = useState({ show: false, slot: null, startTime: '', endTime: '' });

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

    // Fetch roster and eligible pilots
    useEffect(() => {
        if (!event) return;
        fetchRoster();
        fetchEligiblePilots();
    }, [event]);

    const fetchRoster = async () => {
        try {
            const res = await fetch(`/api/events/${event.event_id}/flight-lines/roster`, {
                headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
            });
            if (!res.ok) throw new Error('Failed to fetch roster');
            const data = await res.json();
            setRoster(data);

            // Extract unique dates
            const dates = [...new Set(data.map(slot => slot.roster_date))].sort();
            setAvailableDates(dates);

            // Set first date as selected if not already set
            if (!selectedDate && dates.length > 0) {
                setSelectedDate(dates[0]);
            }

            setLoading(false);
        } catch (err) {
            notify(err.message, 'error');
            setLoading(false);
        }
    };

    const fetchEligiblePilots = async () => {
        try {
            const res = await fetch(`/api/events/${event.event_id}/eligible-pilots`, {
                headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
            });
            if (!res.ok) throw new Error('Failed to fetch pilots');
            const data = await res.json();
            setEligiblePilots(data);
        } catch (err) {
            notify(err.message, 'error');
        }
    };

    const handleAssign = async (attendeeId) => {
        try {
            const res = await fetch(`/api/flight-line-roster/${assignModal.slot.roster_id}/assign`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify({ attendee_id: attendeeId })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Assignment failed');
            }

            notify('Pilot assigned successfully', 'success');
            setAssignModal({ show: false, slot: null });
            await fetchRoster();
        } catch (err) {
            notify(err.message, 'error');
        }
    };

    const handleUnassign = (slot) => {
        confirm(`Unassign ${slot.first_name} ${slot.last_name} from this duty?`, async () => {
            try {
                const res = await fetch(`/api/flight-line-roster/${slot.roster_id}/unassign`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Auth-Token': token
                    }
                });

                if (!res.ok) throw new Error('Unassignment failed');

                notify('Pilot unassigned successfully', 'success');
                await fetchRoster();
            } catch (err) {
                notify(err.message, 'error');
            }
        });
    };

    const handleEditTimes = async () => {
        const { startTime, endTime } = editTimeModal;

        if (!startTime || !endTime) {
            notify('Both start and end times are required', 'error');
            return;
        }

        if (startTime >= endTime) {
            notify('Start time must be before end time', 'error');
            return;
        }

        try {
            const res = await fetch(`/api/flight-line-roster/${editTimeModal.slot.roster_id}/times`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify({
                    start_time: `${startTime}:00`,
                    end_time: `${endTime}:00`
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Time update failed');
            }

            notify('Slot times updated successfully', 'success');
            setEditTimeModal({ show: false, slot: null, startTime: '', endTime: '' });
            await fetchRoster();
        } catch (err) {
            notify(err.message, 'error');
        }
    };

    const handleClearDay = () => {
        confirm(`Clear ALL assignments for ${new Date(selectedDate).toLocaleDateString()}? This will unassign all pilots for this date.`, async () => {
            try {
                const res = await fetch(`/api/events/${event.event_id}/flight-lines/roster/clear-date`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'X-Auth-Token': token
                    },
                    body: JSON.stringify({ date: selectedDate })
                });

                if (!res.ok) throw new Error('Clear failed');

                const result = await res.json();
                notify(`Cleared ${result.clearedCount} assignments`, 'success');
                await fetchRoster();
            } catch (err) {
                notify(err.message, 'error');
            }
        });
    };

    const handleAutoAssign = async () => {
        try {
            const checkRes = await fetch(`/api/events/${event.event_id}/flight-lines/roster-status`, {
                headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
            });

            let replaceExisting = false;

            if (checkRes.ok) {
                const { hasAssignments } = await checkRes.json();
                if (hasAssignments) {
                    confirm(
                        'Some flight line duties are already assigned. Do you want to replace ALL existing assignments with new auto-assignments?',
                        async () => {
                            await executeAutoAssign(true);
                        }
                    );
                    return;
                }
            }

            await executeAutoAssign(false);
        } catch (err) {
            notify(err.message, 'error');
        }
    };

    const executeAutoAssign = async (replaceExisting) => {
        try {
            const res = await fetch(`/api/events/${event.event_id}/flight-lines/auto-assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify({ replaceExisting })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Auto-assign failed');
            }

            const result = await res.json();

            notify(
                `Auto-assign complete! ${result.assignedSlots} of ${result.totalSlots} slots assigned using ${result.pilotsUsed} pilots.` +
                (result.unassignedSlots > 0 ? ` (${result.unassignedSlots} slots could not be filled)` : ''),
                'success'
            );

            await fetchRoster();
        } catch (err) {
            notify(err.message, 'error');
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
        if (timeValue instanceof Date) {
            return timeValue.toTimeString().substring(0, 5);
        }
        return timeValue;
    };

    // Detect time overlaps for a slot with other slots on same flight line
    const hasTimeOverlap = (slot) => {
        const slotStart = formatTime(slot.start_time);
        const slotEnd = formatTime(slot.end_time);

        return filteredRoster.some(otherSlot => {
            // Skip same slot
            if (otherSlot.roster_id === slot.roster_id) return false;

            // Only check same flight line
            if (otherSlot.flight_line_id !== slot.flight_line_id) return false;

            const otherStart = formatTime(otherSlot.start_time);
            const otherEnd = formatTime(otherSlot.end_time);

            // Check for overlap: slot starts before other ends AND slot ends after other starts
            return slotStart < otherEnd && slotEnd > otherStart;
        });
    };

    // Get row style based on slot conditions
    const getRowStyle = (slot) => {
        const baseStyle = { borderBottom: '1px solid #eee' };

        // Priority: overlap takes precedence over unassigned
        if (hasTimeOverlap(slot)) {
            return {
                ...baseStyle,
                backgroundColor: '#fee2e2', // Light red for overlaps
                borderLeft: '4px solid #dc2626'
            };
        }

        if (!slot.attendee_id) {
            return {
                ...baseStyle,
                backgroundColor: '#fef3c7', // Light yellow for unassigned
                borderLeft: '4px solid #f59e0b'
            };
        }

        return baseStyle;
    };

    const filteredRoster = roster.filter(slot => slot.roster_date === selectedDate);

    if (loading) return <div className="container">Loading...</div>;
    if (!event) return <div className="container">Event not found</div>;

    return (
        <div className="container" style={{ maxWidth: '1200px', margin: '2rem auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Flight Line Roster</h1>
                    <p style={{ color: '#666', margin: '0.5rem 0 0' }}>Event: {event.name}</p>
                </div>
                <button className="secondary-button" onClick={() => navigate(`/events/${slug}/edit`)}>
                    Back to Event
                </button>
            </div>

            {/* Controls */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Select Date:</label>
                        <select
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="form-control"
                            style={{ width: '100%' }}
                        >
                            {availableDates.map(date => (
                                <option key={date} value={date}>
                                    {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                        <button
                            className="secondary-button"
                            onClick={handleAutoAssign}
                            style={{ background: '#059669', color: 'white', border: 'none' }}
                        >
                            🎯 Auto-Assign All
                        </button>
                        <button
                            className="secondary-button"
                            onClick={handleClearDay}
                            style={{ background: '#dc2626', color: 'white', border: 'none' }}
                            disabled={filteredRoster.filter(s => s.attendee_id).length === 0}
                        >
                            Clear This Day
                        </button>
                    </div>
                </div>
            </div>

            {/* Roster Table */}
            <div className="card" style={{ padding: '2rem' }}>
                <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
                    Roster for {selectedDate && new Date(selectedDate).toLocaleDateString()}
                </h2>

                {filteredRoster.length === 0 ? (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No roster slots for this date.</p>
                ) : (
                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', fontSize: '0.9rem', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem' }}>Flight Line</th>
                                <th style={{ padding: '0.75rem' }}>Time Slot</th>
                                <th style={{ padding: '0.75rem' }}>Assigned Pilot</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRoster.map(slot => (
                                <tr key={slot.roster_id} style={getRowStyle(slot)}>
                                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{slot.flight_line_name}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {slot.attendee_id ? (
                                            <span style={{ fontWeight: '500' }}>
                                                {slot.first_name} {slot.last_name}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#999', fontStyle: 'italic' }}>-- Unassigned --</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => setAssignModal({ show: true, slot })}
                                                style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}
                                            >
                                                {slot.attendee_id ? 'Reassign' : 'Assign'}
                                            </button>
                                            {slot.attendee_id && (
                                                <button
                                                    onClick={() => handleUnassign(slot)}
                                                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                                                >
                                                    Unassign
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setEditTimeModal({
                                                    show: true,
                                                    slot,
                                                    startTime: formatTime(slot.start_time),
                                                    endTime: formatTime(slot.end_time)
                                                })}
                                                style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer' }}
                                            >
                                                Edit Times
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Assign Modal */}
            {assignModal.show && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>
                                {assignModal.slot.attendee_id ? 'Reassign Pilot' : 'Assign Pilot'}
                            </h3>
                            <button
                                onClick={() => setAssignModal({ show: false, slot: null })}
                                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <p style={{ margin: '0 0 0.5rem', color: '#666' }}>
                                <strong>Flight Line:</strong> {assignModal.slot.flight_line_name}<br />
                                <strong>Time:</strong> {formatTime(assignModal.slot.start_time)} - {formatTime(assignModal.slot.end_time)}
                            </p>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Select Pilot:</label>
                            <select
                                id="pilot-select"
                                className="form-control"
                                style={{ width: '100%' }}
                                defaultValue=""
                            >
                                <option value="" disabled>-- Choose a pilot --</option>
                                {eligiblePilots.map(pilot => (
                                    <option key={pilot.attendee_id} value={pilot.attendee_id}>
                                        {pilot.first_name} {pilot.last_name}
                                        {pilot.arrival_date && pilot.departure_date &&
                                            ` (${new Date(pilot.arrival_date).toLocaleDateString()} - ${new Date(pilot.departure_date).toLocaleDateString()})`
                                        }
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button className="secondary-button" onClick={() => setAssignModal({ show: false, slot: null })}>
                                Cancel
                            </button>
                            <button
                                className="primary-button"
                                onClick={() => {
                                    const selected = document.getElementById('pilot-select').value;
                                    if (!selected) {
                                        notify('Please select a pilot', 'error');
                                        return;
                                    }
                                    handleAssign(parseInt(selected));
                                }}
                            >
                                Assign
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Time Modal */}
            {editTimeModal.show && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Edit Slot Times</h3>
                            <button
                                onClick={() => setEditTimeModal({ show: false, slot: null, startTime: '', endTime: '' })}
                                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <p style={{ margin: '0 0 0.5rem', color: '#666' }}>
                                <strong>Flight Line:</strong> {editTimeModal.slot.flight_line_name}
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Start Time:</label>
                                <input
                                    type="time"
                                    value={editTimeModal.startTime}
                                    onChange={(e) => setEditTimeModal({ ...editTimeModal, startTime: e.target.value })}
                                    className="form-control"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>End Time:</label>
                                <input
                                    type="time"
                                    value={editTimeModal.endTime}
                                    onChange={(e) => setEditTimeModal({ ...editTimeModal, endTime: e.target.value })}
                                    className="form-control"
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button
                                className="secondary-button"
                                onClick={() => setEditTimeModal({ show: false, slot: null, startTime: '', endTime: '' })}
                            >
                                Cancel
                            </button>
                            <button className="primary-button" onClick={handleEditTimes}>
                                Save Times
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FlightLineRoster;
