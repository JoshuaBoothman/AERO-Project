
import React from 'react';
import { formatDateForDisplay } from '../utils/dateHelpers';

const CampsiteTooltip = ({ site, eventRange }) => {
    if (!site) return null;

    // Filter relevant bookings for this event range
    const relevantBookings = (site.bookings || []).filter(b => {
        const bStart = new Date(b.check_in);
        const bEnd = new Date(b.check_out);
        const eStart = new Date(eventRange.start);
        const eEnd = new Date(eventRange.end);

        // Check for overlap
        return bStart < eEnd && bEnd > eStart;
    });

    // Sort bookings by date
    relevantBookings.sort((a, b) => new Date(a.check_in) - new Date(b.check_in));

    const isFullyBooked = false; // logic handled by parent usually, but here we can just show dates

    return (
        <div style={{
            position: 'absolute',
            zIndex: 100,
            background: 'white',
            padding: '10px',
            borderRadius: '8px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
            fontSize: '0.85rem',
            minWidth: '200px',
            pointerEvents: 'none',
            border: '1px solid #eee',
            left: site.x ? `calc(${site.x}% + 15px)` : 'auto',
            top: site.y ? `calc(${site.y}% - 15px)` : 'auto',
        }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                Site {site.site_number}
            </div>

            <div style={{ marginBottom: '5px' }}>
                <span style={{
                    display: 'inline-block',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: relevantBookings.length === 0 ? '#e6ffe6' : (site.is_available ? '#fff3cd' : '#ffebee'),
                    color: relevantBookings.length === 0 ? 'green' : (site.is_available ? '#856404' : '#c62828'),
                    fontWeight: 'bold',
                    fontSize: '0.75rem'
                }}>
                    {relevantBookings.length === 0 ? 'Available' : (site.is_available ? 'Partially Booked' : 'Unavailable')}
                </span>
            </div>

            {relevantBookings.length > 0 && (
                <div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '2px' }}>Booked Dates:</div>
                    <ul style={{ margin: 0, paddingLeft: '15px', color: '#d32f2f' }}>
                        {relevantBookings.map((b, i) => (
                            <li key={i}>
                                {formatDateForDisplay(b.check_in)} - {formatDateForDisplay(b.check_out)}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#666' }}>
                {site.is_powered ? '⚡ Powered' : 'No Power'} • ${site.price_per_night}/n
            </div>
        </div>
    );
};

export default CampsiteTooltip;
