import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

function FlightLinesSetup() {
    const { slug } = useParams(); // event slug
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const { notify, confirm } = useNotification();

    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(null);
    const [flightLines, setFlightLines] = useState([]);
    const [selectedLine, setSelectedLine] = useState(null); // For viewing schedules
    const [schedules, setSchedules] = useState([]);

    // Flight Line Modal
    const [showModal, setShowModal] = useState(false);
    const [editingLine, setEditingLine] = useState(null);
    const [formData, setFormData] = useState({ flight_line_name: '' });

    // Schedule Modal
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [scheduleForm, setScheduleForm] = useState({
        schedule_date: '',
        open_time: '09:00',
        close_time: '17:00',
        duty_duration_minutes: 60
    });

    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/events');
        }
    }, [user, navigate]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                };

                // Fetch Event Details
                const eventRes = await fetch(`/api/events/${slug}`, { headers });
                if (!eventRes.ok) throw new Error('Failed to load event');
                const eventData = await eventRes.json();
                setEvent(eventData);

                // Fetch Flight Lines
                const linesRes = await fetch(`/api/events/${eventData.event_id}/flight-lines`, { headers });
                if (linesRes.ok) {
                    const linesData = await linesRes.json();
                    setFlightLines(linesData);
                }
            } catch (err) {
                notify(err.message, 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [slug, token, notify]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const openCreateModal = () => {
        setEditingLine(null);
        setFormData({ flight_line_name: '' });
        setShowModal(true);
    };

    const openEditModal = (line) => {
        setEditingLine(line);
        setFormData({ flight_line_name: line.flight_line_name });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.flight_line_name || !formData.flight_line_name.trim()) {
            notify("Flight line name is required", "error");
            return;
        }

        try {
            const url = editingLine
                ? `/api/flight-lines/${editingLine.flight_line_id}`
                : `/api/events/${event.event_id}/flight-lines`;

            const method = editingLine ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save flight line');
            }

            const savedLine = await res.json();

            if (editingLine) {
                setFlightLines(prev => prev.map(l => l.flight_line_id === savedLine.flight_line_id ? savedLine : l));
                notify('Flight line updated', 'success');
            } else {
                setFlightLines(prev => [...prev, savedLine]);
                notify('Flight line created', 'success');
            }

            setShowModal(false);
            setEditingLine(null);
            setFormData({ flight_line_name: '' });

        } catch (err) {
            notify(err.message, "error");
        }
    };

    const handleDelete = (lineId, lineName) => {
        confirm(`Delete flight line "${lineName}"? This will also delete all associated schedules and roster entries.`, async () => {
            try {
                const res = await fetch(`/api/flight-lines/${lineId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
                });

                if (res.status === 409) {
                    const err = await res.json();
                    notify(err.error || "Cannot delete flight line with existing data.", "error");
                    return;
                }

                if (!res.ok) throw new Error('Delete failed');

                setFlightLines(prev => prev.filter(l => l.flight_line_id !== lineId));
                notify('Flight line deleted', 'success');
            } catch (err) {
                notify(err.message, 'error');
            }
        });
    };

    // Schedule Functions
    const fetchSchedules = async (lineId) => {
        try {
            const res = await fetch(`/api/flight-lines/${lineId}/schedule`, {
                headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setSchedules(data);
            }
        } catch (err) {
            notify('Failed to load schedules', 'error');
        }
    };

    const handleViewSchedules = async (line) => {
        setSelectedLine(line);
        await fetchSchedules(line.flight_line_id);
    };

    const handleScheduleInputChange = (e) => {
        const { name, value } = e.target;
        setScheduleForm({ ...scheduleForm, [name]: value });
    };

    const openCreateSchedule = () => {
        setEditingSchedule(null);
        setScheduleForm({
            schedule_date: '',
            open_time: '09:00',
            close_time: '17:00',
            duty_duration_minutes: 60
        });
        setShowScheduleModal(true);
    };

    const openEditSchedule = (schedule) => {
        setEditingSchedule(schedule);
        setScheduleForm({
            schedule_date: schedule.schedule_date.split('T')[0],
            open_time: schedule.open_time.substring(0, 5),
            close_time: schedule.close_time.substring(0, 5),
            duty_duration_minutes: schedule.duty_duration_minutes
        });
        setShowScheduleModal(true);
    };

    const handleSaveSchedule = async () => {
        if (!scheduleForm.schedule_date || !scheduleForm.open_time || !scheduleForm.close_time) {
            notify("All schedule fields are required", "error");
            return;
        }

        if (scheduleForm.open_time >= scheduleForm.close_time) {
            notify("Close time must be after open time", "error");
            return;
        }

        try {
            // Format times with seconds for SQL Server (HH:MM:SS)
            const payload = {
                schedule_date: scheduleForm.schedule_date,
                open_time: `${scheduleForm.open_time}:00`,
                close_time: `${scheduleForm.close_time}:00`,
                duty_duration_minutes: parseInt(scheduleForm.duty_duration_minutes)
            };

            const res = await fetch(`/api/flight-lines/${selectedLine.flight_line_id}/schedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save schedule');
            }

            const savedSchedule = await res.json();

            notify(
                editingSchedule
                    ? `Schedule updated! ${savedSchedule.slotsGenerated} slots regenerated.`
                    : `Schedule created! ${savedSchedule.slotsGenerated} slots generated.`,
                'success'
            );

            await fetchSchedules(selectedLine.flight_line_id);
            setShowScheduleModal(false);
            setEditingSchedule(null);

        } catch (err) {
            notify(err.message, "error");
        }
    };

    const handleDeleteSchedule = (scheduleId, date) => {
        confirm(`Delete schedule for ${new Date(date).toLocaleDateString()}? This will remove all duty slots for this date.`, async () => {
            try {
                const res = await fetch(`/api/flight-line-schedule/${scheduleId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
                });

                if (!res.ok) throw new Error('Delete failed');

                await fetchSchedules(selectedLine.flight_line_id);
                notify('Schedule deleted', 'success');
            } catch (err) {
                notify(err.message, 'error');
            }
        });
    };

    // Auto-Assign Handler
    const handleAutoAssign = async () => {
        // Check if any assignments already exist
        try {
            const checkRes = await fetch(`/api/events/${event.event_id}/flight-lines/roster-status`, {
                headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
            });



            if (checkRes.ok) {
                const { hasAssignments } = await checkRes.json();
                if (hasAssignments) {
                    // Use custom confirm dialog instead of browser confirm
                    confirm(
                        'Some flight line duties are already assigned. Do you want to replace ALL existing assignments with new auto-assignments?',
                        async () => {
                            // User confirmed - proceed with replacement
                            await executeAutoAssign(true);
                        }
                    );
                    return; // Exit here, the confirm callback will handle the rest
                }
            }

            // No existing assignments, proceed directly
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

        } catch (err) {
            notify(err.message, 'error');
        }
    };

    // Helper to format time from SQL Server TIME column
    const formatTime = (timeValue) => {
        if (!timeValue) return '';

        // If it's an ISO datetime string (e.g., "1970-01-01T09:00:00.000Z")
        if (typeof timeValue === 'string' && timeValue.includes('T')) {
            const timePart = timeValue.split('T')[1];
            return timePart.substring(0, 5); // HH:MM
        }

        // If it's a simple time string (e.g., "09:00:00")
        if (typeof timeValue === 'string') {
            return timeValue.substring(0, 5);
        }

        // If it's a Date object
        if (timeValue instanceof Date) {
            return timeValue.toTimeString().substring(0, 5);
        }

        return timeValue;
    };

    if (loading) return <div className="container">Loading...</div>;
    if (!event) return <div className="container">Event not found</div>;

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '2rem auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Flight Lines Setup</h1>
                    <p style={{ color: '#666', margin: '0.5rem 0 0' }}>Event: {event.name}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="primary-button" onClick={() => navigate(`/admin/events/${slug}/roster`)}>
                        📋 Manage Roster
                    </button>
                    <button className="secondary-button" onClick={() => navigate(`/events/${slug}/edit`)}>
                        Back to Event
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Flight Lines</h2>
                    <button className="primary-button" onClick={openCreateModal}>+ Add Flight Line</button>
                </div>

                {flightLines.length === 0 ? (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No flight lines configured. Click "Add Flight Line" to get started.</p>
                ) : (
                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', fontSize: '0.9rem', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem' }}>Flight Line Name</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {flightLines.map(line => (
                                <tr
                                    key={line.flight_line_id}
                                    style={{
                                        borderBottom: '1px solid #eee',
                                        background: selectedLine?.flight_line_id === line.flight_line_id ? '#e0f2fe' : 'white'
                                    }}
                                >
                                    <td style={{ padding: '0.75rem' }}>{line.flight_line_name}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                        <button
                                            type="button"
                                            onClick={() => handleViewSchedules(line)}
                                            style={{ marginRight: '0.5rem', background: 'none', border: 'none', color: '#059669', cursor: 'pointer', fontWeight: selectedLine?.flight_line_id === line.flight_line_id ? 'bold' : 'normal' }}
                                        >
                                            View Schedules
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(line)}
                                            style={{ marginRight: '0.5rem', background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(line.flight_line_id, line.flight_line_name)}
                                            style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Schedules Section */}
            {selectedLine && (
                <div className="card" style={{ padding: '2rem', marginTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Schedules for {selectedLine.flight_line_name}</h2>
                            <p style={{ color: '#666', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                                Create flight line schedules. Duty slots will be auto-generated.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            {schedules.length > 0 && (
                                <button
                                    className="secondary-button"
                                    onClick={handleAutoAssign}
                                    style={{ background: '#059669', color: 'white', border: 'none' }}
                                >
                                    🎯 Auto-Assign All
                                </button>
                            )}
                            <button className="primary-button" onClick={openCreateSchedule}>+ Add Schedule</button>
                        </div>
                    </div>

                    {schedules.length === 0 ? (
                        <p style={{ color: '#666', fontStyle: 'italic' }}>No schedules yet. Click "Add Schedule" to create one.</p>
                    ) : (
                        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb', fontSize: '0.9rem', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem' }}>Date</th>
                                    <th style={{ padding: '0.75rem' }}>Open Time</th>
                                    <th style={{ padding: '0.75rem' }}>Close Time</th>
                                    <th style={{ padding: '0.75rem' }}>Slot Duration</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schedules.map(schedule => (
                                    <tr key={schedule.schedule_id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '0.75rem' }}>
                                            {new Date(schedule.schedule_date).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>{formatTime(schedule.open_time)}</td>
                                        <td style={{ padding: '0.75rem' }}>{formatTime(schedule.close_time)}</td>
                                        <td style={{ padding: '0.75rem' }}>{schedule.duty_duration_minutes} min</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                            <button
                                                type="button"
                                                onClick={() => openEditSchedule(schedule)}
                                                style={{ marginRight: '0.5rem', background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteSchedule(schedule.schedule_id, schedule.schedule_date)}
                                                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Flight Line Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>{editingLine ? 'Edit Flight Line' : 'New Flight Line'}</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Flight Line Name *</label>
                            <input
                                type="text"
                                name="flight_line_name"
                                value={formData.flight_line_name}
                                onChange={handleInputChange}
                                placeholder="e.g., North Line, South Line"
                                className="form-control"
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button className="secondary-button" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="primary-button" onClick={handleSave}>
                                {editingLine ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Modal */}
            {showScheduleModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '550px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>{editingSchedule ? 'Edit Schedule' : 'New Schedule'}</h3>
                            <button
                                onClick={() => setShowScheduleModal(false)}
                                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Date *</label>
                            <input
                                type="date"
                                name="schedule_date"
                                value={scheduleForm.schedule_date}
                                onChange={handleScheduleInputChange}
                                min={event?.start_date ? event.start_date.split('T')[0] : undefined}
                                max={event?.end_date ? event.end_date.split('T')[0] : undefined}
                                className="form-control"
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Open Time *</label>
                                <input
                                    type="time"
                                    name="open_time"
                                    value={scheduleForm.open_time}
                                    onChange={handleScheduleInputChange}
                                    className="form-control"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Close Time *</label>
                                <input
                                    type="time"
                                    name="close_time"
                                    value={scheduleForm.close_time}
                                    onChange={handleScheduleInputChange}
                                    className="form-control"
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Duty Duration (minutes) *</label>
                            <input
                                type="number"
                                name="duty_duration_minutes"
                                value={scheduleForm.duty_duration_minutes}
                                onChange={handleScheduleInputChange}
                                min="15"
                                max="480"
                                step="15"
                                className="form-control"
                                style={{ width: '100%' }}
                            />
                            <p style={{ fontSize: '0.8rem', color: '#666', margin: '0.5rem 0 0' }}>
                                Roster slots will be auto-generated based on this duration.
                            </p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button className="secondary-button" onClick={() => setShowScheduleModal(false)}>Cancel</button>
                            <button className="primary-button" onClick={handleSaveSchedule}>
                                {editingSchedule ? 'Update & Regenerate Slots' : 'Create & Generate Slots'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FlightLinesSetup;
