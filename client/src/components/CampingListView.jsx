import React from 'react';

const CampingListView = ({ activeCampground, selectedSite, onSiteSelect }) => {
    if (!activeCampground) return null;

    // Filter sites to show list
    // We assume activeCampground.sites is properly populated
    const sites = activeCampground.sites || [];

    // Simple helper for sorting: Alpha-numeric sort for site numbers (e.g. A1, A2, A10)
    const sortedSites = [...sites].sort((a, b) => {
        return a.site_number.localeCompare(b.site_number, undefined, { numeric: true, sensitivity: 'base' });
    });

    return (
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                    <tr>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Site</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Dimensions</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Daily Rate</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Full Event</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
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
                                <td style={{ padding: '12px', fontWeight: 'bold' }}>{site.site_number}</td>
                                <td style={{ padding: '12px' }}>{site.is_powered ? 'Powered' : 'Unpowered'}</td>
                                <td style={{ padding: '12px' }}>{site.dimensions || '-'}</td>
                                <td style={{ padding: '12px', textAlign: 'right' }}>${parseFloat(site.price_per_night || 0).toFixed(2)}</td>
                                <td style={{ padding: '12px', textAlign: 'right' }}>
                                    {site.full_event_price ? `$${parseFloat(site.full_event_price).toFixed(2)}` : '-'}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.85rem',
                                        background: isAvailable ? '#e6ffe6' : '#ffe6e6',
                                        color: isAvailable ? 'green' : 'red',
                                        fontWeight: 'bold'
                                    }}>
                                        {isAvailable ? 'Available' : 'Unavailable'}
                                    </span>
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
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
                            </tr>
                        );
                    })}
                    {sortedSites.length === 0 && (
                        <tr>
                            <td colSpan="7" style={{ padding: '20px', textAlign: 'center' }}>No campsites found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default CampingListView;
