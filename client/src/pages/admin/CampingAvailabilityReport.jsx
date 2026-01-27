import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Link } from 'react-router-dom';

function CampingAvailabilityReport() {
    const { token } = useAuth();
    const { notify } = useNotification();

    // State
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [dates, setDates] = useState({ start: '', end: '' });
    const [reportData, setReportData] = useState([]); // Array of rows
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Initial Load: Get Events
    useEffect(() => {
        fetch('/api/events')
            .then(res => res.json())
            .then(data => {
                setEvents(data);
                if (data.length > 0) {
                    // Default to first active/future event
                    const active = data.find(e => new Date(e.end_date) >= new Date()) || data[0];
                    setSelectedEventId(active.event_id);
                    // Default dates: Event dates
                    setDates({
                        start: active.start_date.split('T')[0],
                        end: active.end_date.split('T')[0]
                    });
                }
            })
            .catch(err => console.error(err));
    }, []);

    const handleSearch = async () => {
        if (!selectedEventId || !dates.start || !dates.end) {
            notify('Please select event and dates', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/reports/camping-availability?eventId=${selectedEventId}&start_date=${dates.start}&end_date=${dates.end}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-auth-token': token
                }
            });
            if (res.ok) {
                const data = await res.json();
                setReportData(data);
                setHasSearched(true);
            } else {
                console.error('API responded with error:', res.status, res.statusText);
                const errText = await res.text();
                console.error('Error body:', errText);
                notify('Failed to fetch report: ' + res.statusText, 'error');
            }
        } catch (e) {
            console.error('Fetch error:', e);
            notify('Error fetching report', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Helper: Group by Campground for display
    const groupedData = reportData.reduce((acc, row) => {
        const cg = row.campground_name;
        if (!acc[cg]) acc[cg] = [];
        acc[cg].push(row);
        return acc;
    }, {});

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h1>Camping Availability Report</h1>
                <Link to="/admin" style={{ color: '#666', textDecoration: 'none' }}>← Back to Dashboard</Link>
            </div>

            {/* Filters */}
            <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '30px', display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Event</label>
                    <select
                        value={selectedEventId}
                        onChange={e => {
                            const eid = e.target.value;
                            setSelectedEventId(eid);
                            // Update dates to event defaults if verified
                            const ev = events.find(x => x.event_id == eid);
                            if (ev) {
                                setDates({
                                    start: ev.start_date.split('T')[0],
                                    end: ev.end_date.split('T')[0]
                                });
                            }
                        }}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minWidth: '200px' }}
                    >
                        {events.map(e => (
                            <option key={e.event_id} value={e.event_id}>{e.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Start Date</label>
                    <input
                        type="date"
                        value={dates.start}
                        onChange={e => setDates({ ...dates, start: e.target.value })}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>End Date</label>
                    <input
                        type="date"
                        value={dates.end}
                        onChange={e => setDates({ ...dates, end: e.target.value })}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                </div>
                <button
                    onClick={handleSearch}
                    disabled={loading}
                    style={{ padding: '10px 25px', background: 'var(--primary-color, black)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    {loading ? 'Loading...' : 'Generate Report'}
                </button>
            </div>

            {/* Results */}
            {hasSearched && (
                <div>
                    {Object.keys(groupedData).length === 0 ? (
                        <p>No campsites found.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                            <thead>
                                <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #ddd' }}>
                                    <th style={{ textAlign: 'left', padding: '12px', width: '10%' }}>Site</th>
                                    <th style={{ textAlign: 'left', padding: '12px', width: '15%' }}>Type</th>
                                    <th style={{ textAlign: 'center', padding: '12px', width: '10%' }}>Status</th>
                                    <th style={{ textAlign: 'left', padding: '12px', width: '25%' }}>Booked By</th>
                                    <th style={{ textAlign: 'left', padding: '12px', width: '25%' }}>Dates</th>
                                    <th style={{ textAlign: 'center', padding: '12px', width: '15%' }}>Order</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(groupedData).map(cgName => (
                                    <React.Fragment key={cgName}>
                                        {/* Campground Header Row */}
                                        <tr style={{ background: '#eef2f7', borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd' }}>
                                            <td colSpan="6" style={{ padding: '10px 15px', fontWeight: 'bold', fontSize: '1.1rem', color: '#444' }}>
                                                {cgName}
                                            </td>
                                        </tr>
                                        {groupedData[cgName].map((row, idx) => {
                                            const isBooked = !!row.booking_id;
                                            return (
                                                <tr key={`${row.campsite_id}-${idx}`} style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>{row.site_number}</td>
                                                    <td style={{ padding: '10px 12px' }}>{row.is_powered ? 'Powered' : 'Unpowered'}</td>
                                                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                        <span style={{
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '0.85rem',
                                                            background: isBooked ? '#ffe6e6' : '#e6ffe6',
                                                            color: isBooked ? 'red' : 'green',
                                                            fontWeight: 'bold',
                                                            display: 'inline-block',
                                                            minWidth: '80px'
                                                        }}>
                                                            {isBooked ? 'Booked' : 'Available'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '10px 12px' }}>
                                                        {isBooked ? (
                                                            <span>{row.first_name} {row.last_name}</span>
                                                        ) : <span style={{ color: '#ccc' }}>-</span>}
                                                    </td>
                                                    <td style={{ padding: '10px 12px', fontSize: '0.9rem' }}>
                                                        {isBooked ? (
                                                            `${new Date(row.check_in_date).toLocaleDateString()} - ${new Date(row.check_out_date).toLocaleDateString()}`
                                                        ) : <span style={{ color: '#ccc' }}>-</span>}
                                                    </td>
                                                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                        {isBooked ? (
                                                            <Link to={`/orders/${row.order_id}`} style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                                                                #{row.order_id}
                                                            </Link>
                                                        ) : <span style={{ color: '#ccc' }}>-</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}

export default CampingAvailabilityReport;
