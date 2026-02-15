import React, { useMemo } from 'react';

const CampingListView = ({ activeCampground, selectedSite, onSiteSelect, eventStartDate, eventEndDate, originalEventStartDate, originalEventEndDate, compactMode = false }) => {

    // Generate array of dates from event start to event end (exclusive of end date for nights)
    const dateColumns = useMemo(() => {
        if (!eventStartDate || !eventEndDate) return [];
        const dates = [];
        const start = new Date(eventStartDate + 'T00:00:00');
        const end = new Date(eventEndDate + 'T00:00:00');
        let current = new Date(start);
        while (current < end) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return dates;
    }, [eventStartDate, eventEndDate]);

    if (!activeCampground) return null;

    const sites = activeCampground.sites || [];

    // Alpha-numeric sort for site numbers (e.g. A1, A2, A10)
    const sortedSites = [...sites].sort((a, b) => {
        return a.site_number.localeCompare(b.site_number, undefined, { numeric: true, sensitivity: 'base' });
    });

    // Helper: Format date as YYYY-MM-DD in local time (not UTC)
    const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Helper: Check if a specific night (date) is booked for a site
    // Night-based logic: a booking from Jan 1 to Jan 3 occupies nights of Jan 1 and Jan 2
    // Jan 3 is checkout day, so that night is available
    const isNightBooked = (site, nightDate) => {
        if (!site.bookings || site.bookings.length === 0) return false;
        const nightStr = formatLocalDate(nightDate);
        for (const booking of site.bookings) {
            // Booking occupies nights from check_in (inclusive) to check_out (exclusive)
            if (nightStr >= booking.check_in && nightStr < booking.check_out) {
                return true;
            }
        }
        return false;
    };

    const hasDateColumns = dateColumns.length > 0;
    // In compact mode: Site, Type, Status, Action + date columns (4 base cols)
    // In full mode: Site, Type, Dimensions, Daily Rate, Full Event, Status, Action + date columns (7 base cols)
    const baseCols = compactMode ? 4 : 7;
    const totalCols = baseCols + dateColumns.length;

    return (
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: hasDateColumns ? `${(compactMode ? 300 : 600) + dateColumns.length * 36}px` : (compactMode ? '300px' : '600px') }}>
                <thead style={{ background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                    <tr>
                        <th style={{ padding: '10px 12px', textAlign: 'left', position: 'sticky', left: 0, background: '#f5f5f5', zIndex: 2 }}>Site</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left' }}>Type</th>
                        {!compactMode && <th style={{ padding: '10px 12px', textAlign: 'left' }}>Dimensions</th>}
                        {!compactMode && <th style={{ padding: '10px 12px', textAlign: 'right' }}>Daily Rate</th>}
                        {!compactMode && <th style={{ padding: '10px 12px', textAlign: 'right' }}>Full Event</th>}
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Status</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Action</th>
                        {dateColumns.map((date, idx) => (
                            <th key={idx} style={{ padding: '6px 2px', textAlign: 'center', fontSize: '0.75rem', minWidth: '32px', borderLeft: '1px solid #ddd' }}>
                                {date.getDate()}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedSites.map(site => {
                        const isSelected = selectedSite?.campsite_id === site.campsite_id;
                        const isAvailable = site.is_available;

                        return (
                            <tr
                                key={site.campsite_id}
                                style={{
                                    borderBottom: '1px solid #eee',
                                    background: isSelected ? '#e0f7fa' : (isAvailable ? 'white' : '#f9f9f9'),
                                    opacity: isAvailable ? 1 : 0.6
                                }}
                            >
                                <td style={{ padding: '10px 12px', fontWeight: 'bold', position: 'sticky', left: 0, background: isSelected ? '#e0f7fa' : (isAvailable ? 'white' : '#f9f9f9'), zIndex: 1 }}>{site.site_number}</td>
                                <td style={{ padding: '10px 12px' }}>{site.is_powered ? 'Powered' : 'Unpowered'}</td>
                                {!compactMode && <td style={{ padding: '10px 12px' }}>{site.dimensions || '-'}</td>}
                                {!compactMode && <td style={{ padding: '10px 12px', textAlign: 'right' }}>${parseFloat(site.price_per_night || 0).toFixed(2)}</td>}
                                {!compactMode && (
                                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                        {site.full_event_price ? `$${parseFloat(site.full_event_price).toFixed(2)}` : '-'}
                                    </td>
                                )}
                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                    {(() => {
                                        // Calculate Booking Status
                                        // 1. Calculate total nights in CORE event (for status)
                                        const coreStart = new Date(originalEventStartDate || eventStartDate);
                                        const coreEnd = new Date(originalEventEndDate || eventEndDate);
                                        const coreEventNights = Math.max(1, Math.ceil((coreEnd - coreStart) / (1000 * 60 * 60 * 24)));

                                        // 2. Calculate total nights booked for this site WITHIN CORE DATES
                                        let bookedCoreNights = 0;
                                        if (site.bookings && site.bookings.length > 0) {
                                            site.bookings.forEach(b => {
                                                const bStart = new Date(b.check_in);
                                                const bEnd = new Date(b.check_out);
                                                // Clamp to CORE event bounds
                                                const effectiveStart = bStart < coreStart ? coreStart : bStart;
                                                const effectiveEnd = bEnd > coreEnd ? coreEnd : bEnd;
                                                if (effectiveEnd > effectiveStart) {
                                                    bookedCoreNights += Math.ceil((effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24));
                                                }
                                            });
                                        }

                                        const isFullyBooked = bookedCoreNights >= coreEventNights;
                                        // Partial if ANY booking exists (even outside core) but not full core
                                        const hasAnyBookings = site.bookings && site.bookings.length > 0;
                                        const isPartiallyBooked = hasAnyBookings && !isFullyBooked;


                                        // Status Display:
                                        // 1. Fully Booked -> Red
                                        // 2. Partial -> Pink (Even if unavailable for selected dates)
                                        // 3. Available -> Green
                                        // 4. Unavailable (but empty) -> Red
                                        let label = 'Available';
                                        let bg = '#e6ffe6';
                                        let color = 'green';
                                        let border = 'none';

                                        if (isFullyBooked) {
                                            label = 'Booked';
                                            bg = '#ffe6e6';
                                            color = 'red';
                                        } else if (isPartiallyBooked) {
                                            label = 'Partial';
                                            bg = '#fff0f5';
                                            color = '#d63384';
                                            border = '1px solid #ff69b4';
                                        } else if (!isAvailable) {
                                            label = 'Unavailable';
                                            bg = '#ffe6e6';
                                            color = 'red';
                                        }

                                        return (
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.85rem',
                                                background: bg,
                                                color: color,
                                                fontWeight: 'bold',
                                                border: border,
                                                opacity: !isAvailable ? 0.7 : 1
                                            }}>
                                                {label}
                                            </span>
                                        );
                                    })()}
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                    <button
                                        disabled={!isAvailable}
                                        onClick={() => onSiteSelect(site)}
                                        style={{
                                            padding: '6px 12px',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px',
                                            background: isSelected ? 'var(--primary-color, blue)' : 'white',
                                            color: isSelected ? 'white' : 'black',
                                            cursor: isAvailable ? 'pointer' : 'not-allowed',
                                            opacity: isAvailable ? 1 : 0.5
                                        }}
                                    >
                                        {isSelected ? 'Selected' : (isAvailable ? 'Select' : 'Booked')}
                                    </button>
                                </td>
                                {dateColumns.map((date, idx) => {
                                    const booked = isNightBooked(site, date);
                                    return (
                                        <td key={idx} style={{ padding: '4px', textAlign: 'center', borderLeft: '1px solid #ddd', fontSize: '0.85rem' }}>
                                            {booked ? (
                                                <span style={{ color: 'red', fontWeight: 'bold' }}>X</span>
                                            ) : (
                                                <span style={{ color: '#ccc' }}>-</span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                    {sortedSites.length === 0 && (
                        <tr>
                            <td colSpan={totalCols} style={{ padding: '20px', textAlign: 'center' }}>No campsites found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default CampingListView;


