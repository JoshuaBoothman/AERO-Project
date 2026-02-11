import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Link } from 'react-router-dom';

function CampingAvailabilityReport() {
    const { token } = useAuth();
    const { notify } = useNotification();

    // State
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    // Removed manual date state, will derive from selectedEvent
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Initial Load: Get Events
    useEffect(() => {
        fetch('/api/events')
            .then(res => res.json())
            .then(data => {
                // Sort by start_date ascending
                const sorted = data.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
                setEvents(sorted);

                if (sorted.length > 0) {
                    // Default to first active/future event
                    const active = sorted.find(e => new Date(e.end_date) >= new Date()) || sorted[sorted.length - 1];
                    setSelectedEventId(active.event_id);
                }
            })
            .catch(err => console.error(err));
    }, []);

    // Auto-fetch when event changes
    useEffect(() => {
        if (selectedEventId) {
            handleSearch();
        }
    }, [selectedEventId]);

    const handleSearch = async () => {
        if (!selectedEventId) return;

        const event = events.find(e => e.event_id == selectedEventId);
        if (!event) return;

        // Extend query range by 1 day each side for early arrival / late departure
        const sDate = new Date(event.start_date.split('T')[0]);
        sDate.setDate(sDate.getDate() - 1);
        const startDate = sDate.toISOString().split('T')[0];
        const eDate = new Date(event.end_date.split('T')[0]);
        eDate.setDate(eDate.getDate() + 1);
        const endDate = eDate.toISOString().split('T')[0];

        setLoading(true);
        try {
            const res = await fetch(`/api/reports/camping-availability?eventId=${selectedEventId}&start_date=${startDate}&end_date=${endDate}`, {
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
                notify('Failed to fetch report: ' + res.statusText, 'error');
            }
        } catch (e) {
            console.error('Fetch error:', e);
            notify('Error fetching report', 'error');
        } finally {
            setLoading(false);
        }
    };

    const selectedEvent = useMemo(() => events.find(e => e.event_id == selectedEventId), [events, selectedEventId]);

    // Process Data for Grid
    const processedData = useMemo(() => {
        if (!hasSearched || !selectedEvent || !reportData.length) return [];

        // 1. Calculate Total Event Nights
        // Use YYYY-MM-DD to avoid time issues, matching CampingPage logic
        const sStr = selectedEvent.start_date.split('T')[0];
        const eStr = selectedEvent.end_date.split('T')[0];
        const eventStart = new Date(sStr);
        eventStart.setDate(eventStart.getDate() - 1);
        const eventEnd = new Date(eStr);
        eventEnd.setDate(eventEnd.getDate() + 1);
        const totalEventNights = Math.max(1, Math.ceil((eventEnd - eventStart) / (1000 * 60 * 60 * 24)));

        // 2. Group by Campsite
        const sites = {};
        reportData.forEach(row => {
            if (!sites[row.campsite_id]) {
                sites[row.campsite_id] = {
                    campsite_id: row.campsite_id,
                    site_number: row.site_number,
                    is_powered: row.is_powered,
                    bookings: []
                };
            }
            if (row.booking_id) {
                sites[row.campsite_id].bookings.push({
                    booking_id: row.booking_id,
                    check_in_date: row.check_in_date,
                    check_out_date: row.check_out_date,
                    first_name: row.first_name,
                    last_name: row.last_name,
                    order_id: row.order_id
                });
            }
        });

        // 3. Status Determination
        const siteArray = Object.values(sites).map(site => {
            let bookedNights = 0;

            if (site.bookings && site.bookings.length > 0) {
                site.bookings.forEach(b => {
                    // Parse as dates (booking dates from API might be ISO with time, strict YYYY-MM-DD is safer)
                    const bStart = new Date(b.check_in_date.split('T')[0]);
                    const bEnd = new Date(b.check_out_date.split('T')[0]);

                    // Clamp booking to event bounds
                    const effectiveStart = bStart < eventStart ? eventStart : bStart;
                    const effectiveEnd = bEnd > eventEnd ? eventEnd : bEnd;

                    if (effectiveEnd > effectiveStart) {
                        const nights = Math.ceil((effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24));
                        bookedNights += nights;
                    }
                });
            }

            let status = 'Available';
            // Allow for tiny floating point errors or overlaps by checking >= total
            if (bookedNights >= totalEventNights) status = 'Full';
            else if (bookedNights > 0) status = 'Partial';

            return {
                ...site,
                status,
                bookedNightsCount: bookedNights
            };
        });

        // 4. Sort Naturally (e.g. 1, 2, 10 instead of 1, 10, 2)
        return siteArray.sort((a, b) => {
            return a.site_number.localeCompare(b.site_number, undefined, { numeric: true, sensitivity: 'base' });
        });
    }, [reportData, selectedEvent, hasSearched]);

    // Grid Columns (Dates)
    const gridDates = useMemo(() => {
        if (!selectedEvent) return [];
        // Generate array of dates for the header
        const d = [];
        // Use string splitting for safety
        const sStr = selectedEvent.start_date.split('T')[0];
        const eStr = selectedEvent.end_date.split('T')[0];

        // Extend grid by 1 day on each side for early arrival / late departure
        let curr = new Date(sStr);
        curr.setDate(curr.getDate() - 1);  // Day before event
        const end = new Date(eStr);
        end.setDate(end.getDate() + 1);    // Day after event

        // Logic "Booking cannot start on last day". 
        // We only show columns for "Nights". The night of the End Date is NOT part of the event.
        while (curr < end) {
            d.push(new Date(curr)); // Clone
            curr.setDate(curr.getDate() + 1);
        }
        return d;
    }, [selectedEvent]);

    // Helper: Check if a date is booked for a specific site
    const getBookingForDate = (site, dateObj) => {
        // A night is booked if dateObj is >= checkIn AND dateObj < checkOut
        // (Checkout day is not occupied)
        return site.bookings.find(b => {
            const checkIn = new Date(b.check_in_date.split('T')[0]);
            const checkOut = new Date(b.check_out_date.split('T')[0]);

            // Normalized comparison using timestamps of strict dates
            const t = dateObj.getTime();
            const ci = checkIn.getTime();
            const co = checkOut.getTime();

            return t >= ci && t < co;
        });
    };

    return (
        <div style={{ padding: '20px', maxWidth: '100%', margin: '0 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h1>Camping Availability Report</h1>
                <Link to="/admin" style={{ color: '#666', textDecoration: 'none' }}>← Back to Dashboard</Link>
            </div>

            {/* Simpler Toolbar */}
            <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '30px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ fontWeight: 'bold' }}>Event:</label>
                    <select
                        value={selectedEventId}
                        onChange={e => setSelectedEventId(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minWidth: '250px' }}
                    >
                        {events.map(e => (
                            <option key={e.event_id} value={e.event_id}>{e.name}</option>
                        ))}
                    </select>
                </div>
                {loading && <span style={{ color: '#666', fontStyle: 'italic' }}>Loading grid...</span>}
            </div>

            {/* Key/Legend */}
            <div style={{ marginBottom: '15px', display: 'flex', gap: '15px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '15px', height: '15px', background: 'red', display: 'inline-block', borderRadius: '3px' }}></span> Full
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '15px', height: '15px', background: '#ff69b4', display: 'inline-block', borderRadius: '3px' }}></span> Partial
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '15px', height: '15px', background: 'green', display: 'inline-block', borderRadius: '3px' }}></span> Available
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '15px', height: '15px', background: '#e2e8f0', display: 'inline-block', borderRadius: '3px' }}></span> Booked Night
                </div>
            </div>

            {/* Results Grid */}
            {hasSearched && (
                <div style={{ overflowX: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                    {processedData.length === 0 ? (
                        <p style={{ padding: '20px' }}>No data found.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                            <thead>
                                <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #ddd' }}>
                                    <th style={{ textAlign: 'left', padding: '12px', width: '80px', position: 'sticky', left: 0, background: '#f9f9f9', zIndex: 10 }}>Site</th>
                                    <th style={{ textAlign: 'left', padding: '12px', width: '100px' }}>Type</th>
                                    <th style={{ textAlign: 'center', padding: '12px', width: '100px' }}>Status</th>
                                    {gridDates.map((d, i) => (
                                        <th key={i} style={{ textAlign: 'center', padding: '8px', minWidth: '80px', fontSize: '0.8rem' }}>
                                            {d.getDate()}/{d.getMonth() + 1}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {processedData.map((site) => (
                                    <tr key={site.campsite_id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '8px 12px', fontWeight: 'bold', position: 'sticky', left: 0, background: 'white', zIndex: 5, borderRight: '1px solid #eee' }}>
                                            {site.site_number}
                                        </td>
                                        <td style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                                            {site.is_powered ? 'Powered' : 'Unpowered'}
                                        </td>
                                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                color: 'white',
                                                background: site.status === 'Full' ? 'red' : site.status === 'Partial' ? '#ff69b4' : 'green',
                                                display: 'block',
                                                textAlign: 'center'
                                            }}>
                                                {site.status}
                                            </span>
                                        </td>
                                        {gridDates.map((d, i) => {
                                            const booking = getBookingForDate(site, d);
                                            return (
                                                <td key={i}
                                                    title={booking ? `Booked by: ${booking.first_name} ${booking.last_name} (Order #${booking.order_id})` : 'Available'}
                                                    style={{
                                                        textAlign: 'center',
                                                        padding: '2px',
                                                        background: booking ? '#e2e8f0' : 'transparent',
                                                        borderLeft: '1px solid #f0f0f0'
                                                    }}
                                                >
                                                    {booking ? (
                                                        <div style={{ width: '100%', height: '100%', minHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px' }}>
                                                            <span style={{ fontSize: '0.6rem', color: '#1e293b', lineHeight: '1.1', textAlign: 'center', wordBreak: 'break-word' }}>
                                                                {booking.first_name} {booking.last_name}
                                                            </span>
                                                        </div>
                                                    ) : null}
                                                </td>
                                            );
                                        })}
                                    </tr>
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
