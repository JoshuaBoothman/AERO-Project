import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

function CampsiteModal({ event, onClose, onAddToCart, orgSettings }) {
    // DEBUG LOG
    console.log('[Modal] Render', { cid: event?.event_id });

    const [campgrounds, setCampgrounds] = useState([]);
    const [selectedCampgroundId, setSelectedCampgroundId] = useState(null);
    const [loading, setLoading] = useState(false);

    // Selection Dates (Default to Event Dates)
    // Adjust logic: If event start is in future, use it. 
    // Format YYYY-MM-DD
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toISOString().split('T')[0];
    };

    const [startDate, setStartDate] = useState(formatDate(event?.start_date));
    const [endDate, setEndDate] = useState(formatDate(event?.end_date));
    const [useFullEventPrice, setUseFullEventPrice] = useState(false);

    // Toggle Full Event Logic
    const handleFullEventToggle = (checked) => {
        setUseFullEventPrice(checked);
        if (checked) {
            setStartDate(formatDate(event?.start_date));
            setEndDate(formatDate(event?.end_date));
        }
    };

    // Data State
    const [campground, setCampground] = useState(null);
    const [sites, setSites] = useState([]);
    const [selectedSites, setSelectedSites] = useState([]); // Array of site objects

    // Fetch campgrounds for this event
    useEffect(() => {
        // Assuming we fetch all and filter, or fetch by event. 
        // Admin tool used /api/campgrounds. Let's stick to that for now or consistent with Admin.
        // Ideally: /api/events/:id/campgrounds. 
        // Let's use the one that works: /api/campgrounds and filter.
        fetch('/api/campgrounds')
            .then(res => res.json())
            .then(data => {
                const filtered = data.filter(c => c.event_id === event.event_id);
                setCampgrounds(filtered);
            })
            .catch(err => console.error(err));
    }, [event?.event_id]);

    // Auto-select first campground if none selected
    useEffect(() => {
        if (campgrounds.length > 0 && !selectedCampgroundId) {
            setSelectedCampgroundId(campgrounds[0].campground_id);
        }
    }, [campgrounds, selectedCampgroundId]);

    // Fetch sites when campground or dates change
    useEffect(() => {
        if (selectedCampgroundId && startDate && endDate) {
            setLoading(true);
            fetch(`/api/campgrounds/${selectedCampgroundId}/sites?startDate=${startDate}&endDate=${endDate}`)
                .then(res => res.json())
                .then(data => {
                    setCampground(data.campground);
                    setSites(data.sites);
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [selectedCampgroundId, startDate, endDate]);

    const toggleSiteSelection = (site) => {
        if (site.is_booked) return;

        setSelectedSites(prev => {
            const exists = prev.find(s => s.campsite_id === site.campsite_id);
            if (exists) {
                return prev.filter(s => s.campsite_id !== site.campsite_id);
            } else {
                return [...prev, site];
            }
        });
    };

    const handleConfirm = () => {
        // Pass selected sites back to parent
        // Attach the dates to the selection
        const nights = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
        const selection = selectedSites.map(s => ({
            ...s,
            checkIn: startDate,
            checkOut: endDate,
            campgroundName: campground?.name,
            price: (useFullEventPrice && s.full_event_price) ? s.full_event_price : (s.price_per_night * nights)
        }));
        onAddToCart(selection);
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '900px', width: '95%', height: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>Book Campsite</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#666' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Toolbar */}
                <div style={{ padding: '15px', background: '#f9f9f9', borderBottom: '1px solid #eee', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>

                    {/* Campground Selector */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold' }}>Campground</label>
                        <select
                            value={selectedCampgroundId || ''}
                            onChange={e => setSelectedCampgroundId(e.target.value)}
                            style={{ padding: '5px' }}
                        >
                            {campgrounds.map(cg => (
                                <option key={cg.campground_id} value={cg.campground_id}>{cg.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Pickers */}
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold' }}>Check In</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => !useFullEventPrice && setStartDate(e.target.value)}
                                disabled={useFullEventPrice}
                                style={{ padding: '4px', background: useFullEventPrice ? '#eee' : 'white' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold' }}>Check Out</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => !useFullEventPrice && setEndDate(e.target.value)}
                                disabled={useFullEventPrice}
                                style={{ padding: '4px', background: useFullEventPrice ? '#eee' : 'white' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '15px' }}>
                            <input
                                type="checkbox"
                                id="fullEventCheck"
                                checked={useFullEventPrice}
                                onChange={e => handleFullEventToggle(e.target.checked)}
                            />
                            <label htmlFor="fullEventCheck" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                                Full Event Package
                            </label>
                        </div>
                    </div>

                    {/* Summary */}
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold' }}>{selectedSites.length} sites selected</div>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                            Total: ${selectedSites.reduce((sum, s) => {
                                if (useFullEventPrice && s.full_event_price) return sum + s.full_event_price;
                                const nights = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)));
                                return sum + (s.price_per_night * nights);
                            }, 0).toFixed(2)}
                        </div>
                    </div>
                </div>

                {/* Map Area */}
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#ccc' }}>
                    {loading && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                            Loading availability...
                        </div>
                    )}

                    {campground ? (
                        <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <img
                                    src={campground.map_image_url}
                                    alt="Map"
                                    style={{ display: 'block', maxWidth: '100%' }}
                                />

                                {sites.map(site => {
                                    if (!site.map_coordinates) return null;
                                    let c;
                                    try { c = JSON.parse(site.map_coordinates); } catch (e) { return null; }

                                    const isSelected = selectedSites.some(s => s.campsite_id === site.campsite_id);

                                    // Style Logic
                                    let bg = '#28a745'; // Available (Green)
                                    let border = '2px solid white';
                                    let cursor = 'pointer';

                                    if (site.is_booked) {
                                        bg = '#dc3545'; // Booked (Red)
                                        cursor = 'not-allowed';
                                    } else if (isSelected) {
                                        bg = orgSettings?.primary_color || 'blue';
                                        border = '2px solid yellow';
                                    }

                                    return (
                                        <div
                                            key={site.campsite_id}
                                            onClick={() => toggleSiteSelection(site)}
                                            style={{
                                                position: 'absolute',
                                                left: `${c.x}%`,
                                                top: `${c.y}%`,
                                                width: '24px',
                                                height: '24px',
                                                background: bg,
                                                borderRadius: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                border: border,
                                                cursor: cursor,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '10px',
                                                fontWeight: 'bold',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                            }}
                                            title={`${site.site_number} - ${site.full_event_price ? `Event: $${site.full_event_price}` : `$${site.price_per_night}/n`}`}
                                        >
                                            {isSelected && '✓'}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '50px', textAlign: 'center' }}>No campground selected</div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '15px', background: 'white', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button className="secondary-button" onClick={onClose}>Cancel</button>
                    <button
                        className="primary-button"
                        onClick={handleConfirm}
                        disabled={selectedSites.length === 0}
                    >
                        Add {selectedSites.length} Sites to Order
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CampsiteModal;
