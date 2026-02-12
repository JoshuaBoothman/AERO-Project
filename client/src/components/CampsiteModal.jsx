import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

function CampsiteModal({ event, onClose, onAddToCart, orgSettings, existingBooking }) {
    // DEBUG LOG
    console.log('[Modal] Render', { cid: event?.event_id, mode: existingBooking ? 'EDIT' : 'NEW' });

    const [campgrounds, setCampgrounds] = useState([]);
    const [selectedCampgroundId, setSelectedCampgroundId] = useState(null);
    const [loading, setLoading] = useState(false);

    // Selection Dates (Default to Event Dates)
    // Format YYYY-MM-DD
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toISOString().split('T')[0];
    };

    // Shift a YYYY-MM-DD string by ±1 day
    const dayBefore = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
    };
    const dayAfter = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    };

    const [startDate, setStartDate] = useState(formatDate(event?.start_date));
    const [endDate, setEndDate] = useState(formatDate(event?.end_date));
    const [useFullEventPrice, setUseFullEventPrice] = useState(false);
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);

    // Initial State from Existing Booking
    useEffect(() => {
        if (existingBooking) {
            if (existingBooking.checkIn) setStartDate(formatDate(existingBooking.checkIn));
            if (existingBooking.checkOut) setEndDate(formatDate(existingBooking.checkOut));
            if (existingBooking.adults) setAdults(existingBooking.adults);
            if (existingBooking.children) setChildren(existingBooking.children);
            if (existingBooking.campgroundId) setSelectedCampgroundId(existingBooking.campgroundId);
        }
    }, [existingBooking]);

    // Derived State for Validation
    const nights = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    const isShortStay = nights <= 4;

    // Enforce 5+ nights rule
    useEffect(() => {
        if (useFullEventPrice && isShortStay) {
            setUseFullEventPrice(false);
        }
    }, [isShortStay, useFullEventPrice]);

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
        fetch('/api/campgrounds')
            .then(res => res.json())
            .then(data => {
                const filtered = data.filter(c => c.event_id === event.event_id);
                setCampgrounds(filtered);
            })
            .catch(err => console.error(err));
    }, [event?.event_id]);

    // Auto-select first campground if none selected and NOT editing (or if editing but ID missing)
    useEffect(() => {
        if (!existingBooking && campgrounds.length > 0 && !selectedCampgroundId) {
            setSelectedCampgroundId(campgrounds[0].campground_id);
        }
    }, [campgrounds, selectedCampgroundId, existingBooking]);

    // Fetch sites when campground or dates change
    useEffect(() => {
        if (selectedCampgroundId && startDate && endDate) {
            setLoading(true);
            const excludeParam = existingBooking?.legacyOrderId ? `&exclude_order_id=${existingBooking.legacyOrderId}` : '';
            fetch(`/api/campgrounds/${selectedCampgroundId}/sites?startDate=${startDate}&endDate=${endDate}${excludeParam}`)
                .then(res => res.json())
                .then(data => {
                    setCampground(data.campground);
                    setSites(data.sites);
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [selectedCampgroundId, startDate, endDate, existingBooking]);

    // Pre-select site when sites load if editing
    useEffect(() => {
        if (existingBooking && sites.length > 0) {
            const mySite = sites.find(s => s.campsite_id === existingBooking.campsiteId);
            // Only set if not already selected to avoid loop
            if (mySite) {
                setSelectedSites(prev => {
                    // Check if already selected
                    if (prev.length === 1 && prev[0].campsite_id === mySite.campsite_id) return prev;
                    return [mySite];
                });
            }
        }
    }, [sites, existingBooking]);

    const toggleSiteSelection = (site) => {
        if (site.is_booked) return;

        // Strict No-Switching Rule for Legacy Bookings
        if (existingBooking) {
            if (site.campsite_id !== existingBooking.campsiteId) {
                alert("You cannot switch campsites for this legacy booking. Please contact admin if you need to move.");
                return;
            }
            // Allow deselecting? No, why would they? They must book it.
            // Actually, maybe they want to toggle to "refresh" logic? 
            // Better to just Lock it.
            return;
        }

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
        const safeAdults = adults === '' ? 1 : parseInt(adults);
        const extraAdults = Math.max(0, safeAdults - 1);

        const selection = selectedSites.map(s => {
            // Calculate correct price for the item based on selection
            let finalPrice = 0;

            // LEGACY BOOKING PRICING (Fixed Base + Variable Extras)
            if (existingBooking && existingBooking.campsiteId === s.campsite_id && existingBooking.basePrice !== undefined) {
                const fixedBase = existingBooking.basePrice;

                let extraFee = 0;
                // extras based on NEW duration/settings
                if (useFullEventPrice && s.full_event_price) {
                    extraFee = extraAdults * (s.extra_adult_full_event_price || 0);
                } else {
                    extraFee = extraAdults * (s.extra_adult_price_per_night || 0) * nights;
                }

                finalPrice = fixedBase + extraFee;
            }
            // STANDARD PRICING
            else {
                if (useFullEventPrice && s.full_event_price) {
                    finalPrice = s.full_event_price + (extraAdults * (s.extra_adult_full_event_price || 0));
                } else {
                    finalPrice = (s.price_per_night * nights) + (extraAdults * (s.extra_adult_price_per_night || 0) * nights);
                }
            }

            return {
                type: 'CAMPSITE', // Critical for CartContext
                id: s.campsite_id,
                name: `Site ${s.site_number || s.campsite_id}`,
                campsiteId: s.campsite_id,
                campsiteName: s.site_number || s.campsite_id,
                campgroundId: campground?.campground_id,
                campgroundName: campground?.name,
                site_number: s.site_number,
                checkIn: startDate,
                checkOut: endDate,
                price: finalPrice,
                eventId: event?.event_id,
                eventName: event?.name,
                eventSlug: event?.slug,
                adults: adults === '' ? 1 : parseInt(adults),
                children: children === '' ? 0 : parseInt(children),
                // Preserve Legacy Context
                isLegacy: existingBooking?.isLegacy || false,
                legacyOrderId: existingBooking?.legacyOrderId,
                basePrice: existingBooking?.basePrice
            };
        });
        onAddToCart(selection);
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '900px', width: '95%', height: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>{existingBooking ? 'Edit Booking' : 'Book Campsite'}</h2>
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
                            disabled={!!existingBooking} // LOCKED for editing
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
                                min={dayBefore(formatDate(event?.start_date))}
                                max={formatDate(event?.end_date)}
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
                                min={formatDate(event?.start_date)}
                                max={dayAfter(formatDate(event?.end_date))}
                                onChange={e => !useFullEventPrice && setEndDate(e.target.value)}
                                disabled={useFullEventPrice}
                                style={{ padding: '4px', background: useFullEventPrice ? '#eee' : 'white' }}
                            />
                        </div>
                        {/* Hide Full Event Package for Legacy Edits to avoid pricing confusion */}
                        {!existingBooking && (
                            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '15px', gap: '2px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <input
                                        type="checkbox"
                                        id="fullEventCheck"
                                        checked={useFullEventPrice}
                                        onChange={e => handleFullEventToggle(e.target.checked)}
                                        disabled={isShortStay}
                                        style={{ cursor: isShortStay ? 'not-allowed' : 'pointer' }}
                                    />
                                    <label htmlFor="fullEventCheck" style={{ fontSize: '0.9rem', cursor: isShortStay ? 'not-allowed' : 'pointer', color: isShortStay ? '#999' : 'inherit' }}>
                                        Full Event Package
                                    </label>
                                </div>
                                {isShortStay && <span style={{ fontSize: '0.75rem', color: '#d32f2f', marginLeft: '20px' }}>Requires 5+ nights</span>}
                            </div>
                        )}
                    </div>

                    {/* Guest Selection */}
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold' }}>Adults</label>
                            <input
                                type="number"
                                min="1"
                                value={adults}
                                onChange={e => setAdults(e.target.value === '' ? '' : parseInt(e.target.value))}
                                onBlur={() => { if (adults === '') setAdults(1); }}
                                style={{ padding: '4px', width: '60px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold' }}>Children</label>
                            <input
                                type="number"
                                min="0"
                                value={children}
                                onChange={e => setChildren(e.target.value === '' ? '' : parseInt(e.target.value))}
                                onBlur={() => { if (children === '') setChildren(0); }}
                                style={{ padding: '4px', width: '60px' }}
                            />
                        </div>
                    </div>

                    {/* Summary */}
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold' }}>{selectedSites.length} sites selected</div>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                            {existingBooking ? (
                                <span title="Base Price Locked on original booking. Extra fees updated dynamically.">
                                    Base Price Locked
                                </span>
                            ) : null}
                            <br />
                            Total: ${selectedSites.reduce((sum, s) => {
                                const safeAdults = adults === '' ? 1 : parseInt(adults);
                                const extraAdults = Math.max(0, safeAdults - 1);

                                if (existingBooking && existingBooking.campsiteId === s.campsite_id && existingBooking.basePrice !== undefined) {
                                    // Legacy Logic
                                    const fixedBase = existingBooking.basePrice;
                                    let extraFee = 0;
                                    if (useFullEventPrice && s.full_event_price) {
                                        extraFee = extraAdults * (s.extra_adult_full_event_price || 0);
                                    } else {
                                        // Re-calc nights for extra fee
                                        const currNights = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)));
                                        extraFee = extraAdults * (s.extra_adult_price_per_night || 0) * currNights;
                                    }
                                    return sum + fixedBase + extraFee;
                                }

                                if (useFullEventPrice && s.full_event_price) {
                                    const extraFee = extraAdults * (s.extra_adult_full_event_price || 0);
                                    return sum + s.full_event_price + extraFee;
                                }
                                const nights = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)));
                                const extraFee = extraAdults * (s.extra_adult_price_per_night || 0) * nights;
                                return sum + (s.price_per_night * nights) + extraFee;
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
                                    try { c = JSON.parse(site.map_coordinates); } catch (_e) { return null; }

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

                                    // Locked Style when editing
                                    if (existingBooking && site.campsite_id !== existingBooking.campsiteId) {
                                        cursor = 'not-allowed'; // Cannot select other sites
                                        if (!site.is_booked) bg = '#ccc'; // Grey out available sites? Or just leave green but unclickable?
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
                        {existingBooking ? 'Update Booking' : `Add ${selectedSites.length} Sites to Order`}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CampsiteModal;
