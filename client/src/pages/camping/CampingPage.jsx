import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

import AdminMapTool from './AdminMapTool';

function CampingPage({ embedded = false }) {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const { addToCart, cart, cartTotal } = useCart();

    // Mode: "Index" (no slug) vs "Detail" (slug)
    const isIndex = !slug;

    // Admin View Redirect (Dashboard)
    if (isIndex && user?.role === 'admin') {
        return <AdminMapTool />;
    }

    // Index State
    const [allEvents, setAllEvents] = useState([]);

    // Detail State
    const [eventId, setEventId] = useState(null);
    const [eventName, setEventName] = useState('');
    const [dates, setDates] = useState({ start: '', end: '' });
    const [eventBounds, setEventBounds] = useState({ start: '', end: '' });
    const [useFullEventPrice, setUseFullEventPrice] = useState(false);
    const [campgrounds, setCampgrounds] = useState([]); // [{ id, name, sites: [] }]
    const [activeCampgroundId, setActiveCampgroundId] = useState(null);

    const [loading, setLoading] = useState(true);
    const [selectedSite, setSelectedSite] = useState(null); // { campsite_id, ... }
    const [cartMessage, setCartMessage] = useState('');

    // --- EFFECT: Load Data ---
    // --- EFFECT: Load Data ---
    useEffect(() => {
        setLoading(true);
        if (isIndex && !embedded) {
            fetchEventsIndex();
        } else {
            fetchEventDetails();
        }
    }, [slug, isIndex, embedded]);

    // --- EFFECT: Load Availability (Detail Mode) ---
    useEffect(() => {
        if (!isIndex && eventId && dates.start && dates.end) {
            fetchAvailability();
        }
    }, [eventId, dates, isIndex]);

    // --- API: Index ---
    const fetchEventsIndex = async () => {
        try {
            const res = await fetch('/api/events');
            if (res.ok) {
                const data = await res.json();
                // Filter for Current & Upcoming
                const now = new Date();
                const relevant = data.filter(e => new Date(e.end_date) >= now);
                setAllEvents(relevant);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    // --- API: Details ---
    const fetchEventDetails = async () => {
        try {
            const res = await fetch(`/api/events/${slug}`);
            if (res.ok) {
                const event = await res.json();
                if (event) {
                    setEventId(event.event_id);
                    setEventName(event.name);
                    const startRaw = event.start_date.split('T')[0];
                    const endRaw = event.end_date.split('T')[0];
                    setDates({ start: startRaw, end: endRaw });
                    setEventBounds({ start: startRaw, end: endRaw });
                }
            }
        } catch (e) { console.error(e); }
        // Loading continues until availability ensures campgrounds are loaded
    };

    const fetchAvailability = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/events/${eventId}/campgrounds?start_date=${dates.start}&end_date=${dates.end}`);
            if (res.ok) {
                const data = await res.json();
                setCampgrounds(data.campgrounds);
                // Set default active tab
                if (data.campgrounds.length > 0) {
                    setActiveCampgroundId(data.campgrounds[0].campground_id);
                }
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    // --- EFFECT: Auto-Check Full Event ---
    useEffect(() => {
        if (selectedSite?.full_event_price && eventBounds.start && eventBounds.end) {
            const isFullDuration = dates.start === eventBounds.start && dates.end === eventBounds.end;
            if (isFullDuration) {
                setUseFullEventPrice(true);
            }
        }
    }, [dates, eventBounds, selectedSite]);

    // --- HANDLERS ---
    const handleSiteClick = (site) => {
        if (!site.is_available) return;
        setSelectedSite(site);
    };

    const handleAddToCart = () => {
        if (!selectedSite) return;

        // Calculate nights
        const s = new Date(dates.start);
        const e = new Date(dates.end);
        const nights = Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)));

        let price = (selectedSite.price_per_night || 0) * nights;
        if (useFullEventPrice && selectedSite.full_event_price) {
            price = parseFloat(selectedSite.full_event_price);
        }

        const item = {
            type: 'CAMPSITE',
            id: selectedSite.campsite_id,
            name: `Site ${selectedSite.site_number}`,
            price: price, // Total Price
            checkIn: dates.start,
            checkOut: dates.end,
            details: selectedSite,
            eventId: eventId // Crucial for checkout
        };

        addToCart(item);
        console.log('Added to Cart:', item);
        setCartMessage(`Added Site ${selectedSite.site_number} to cart! $${price.toFixed(2)}`);
        setTimeout(() => setCartMessage(''), 3000);
        setSelectedSite(null);
    };

    // --- RENDER: Index View ---
    if (isIndex && !embedded) {
        if (loading) return <div style={{ padding: '20px' }}>Loading events...</div>;
        return (
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
                <h1>Camping Registration</h1>
                <p>Select an event below to book a campsite.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
                    {allEvents.map(event => (
                        <div key={event.event_id} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                            {event.banner_url ? (
                                <img src={event.banner_url} alt={event.name} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '150px', background: 'var(--primary-color, black)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                    {event.name}
                                </div>
                            )}
                            <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <h3 style={{ marginTop: '0' }}>{event.name}</h3>
                                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '15px' }}>
                                    {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                                </p>
                                <div style={{ marginTop: 'auto' }}>
                                    <Link to={`/events/${event.slug}/camping`}>
                                        <button style={{ width: '100%', padding: '10px', background: 'var(--primary-color, black)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                            Book Camping
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                    {allEvents.length === 0 && <p>No upcoming events with camping found.</p>}
                </div>
            </div>
        );
    }

    // --- RENDER: Detail View ---
    if (!eventId) return <div style={{ padding: '20px' }}>Loading Event...</div>;

    const activeCampground = campgrounds.find(cg => cg.campground_id === activeCampgroundId);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: embedded ? '0' : '20px' }}>
            {!embedded && (
                <div style={{ marginBottom: '20px' }}>
                    <Link to="/camping" style={{ color: '#666', textDecoration: 'none' }}>← Back to Events</Link>
                    <h1>{eventName}: Camping</h1>
                </div>
            )}

            {/* Date Selector */}
            <div style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Check In</label>
                    <input
                        type="date"
                        value={dates.start}
                        onChange={e => setDates({ ...dates, start: e.target.value })}
                        style={{ padding: '8px', background: useFullEventPrice ? '#eee' : 'white' }}
                        disabled={useFullEventPrice}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Check Out</label>
                    <input
                        type="date"
                        value={dates.end}
                        onChange={e => setDates({ ...dates, end: e.target.value })}
                        style={{ padding: '8px', background: useFullEventPrice ? '#eee' : 'white' }}
                        disabled={useFullEventPrice}
                    />
                </div>
                <button onClick={fetchAvailability} style={{ height: '38px', marginTop: 'auto', padding: '0 20px', background: 'black', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Check Availability
                </button>
            </div>

            {loading ? <div>Checking availability...</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Tabs for Multiple Campgrounds */}
                    {campgrounds.length > 1 && (
                        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
                            {campgrounds.map(cg => (
                                <button
                                    key={cg.campground_id}
                                    onClick={() => { setActiveCampgroundId(cg.campground_id); setSelectedSite(null); }}
                                    style={{
                                        padding: '10px 20px',
                                        background: activeCampgroundId === cg.campground_id ? 'var(--primary-color, black)' : '#eee',
                                        color: activeCampgroundId === cg.campground_id ? 'white' : 'black',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: activeCampgroundId === cg.campground_id ? 'bold' : 'normal'
                                    }}
                                >
                                    {cg.name}
                                </button>
                            ))}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '20px' }}>
                        {/* Map / Grid View */}
                        <div style={{ flex: 2 }}>
                            {/* Legend */}
                            <div style={{ display: 'flex', gap: '15px', marginBottom: '10px', fontSize: '0.9rem', padding: '10px', background: '#fff', border: '1px solid #eee', borderRadius: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <div style={{ width: '15px', height: '15px', borderRadius: '50%', background: 'var(--accent-color, gold)', border: '1px solid #ccc' }}></div>
                                    <span>Available</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <div style={{ width: '15px', height: '15px', borderRadius: '50%', background: 'var(--primary-color, blue)', border: '2px solid white', outline: '1px solid #ccc' }}></div>
                                    <span>Selected</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <div style={{ width: '15px', height: '15px', borderRadius: '50%', background: 'red', opacity: 0.6 }}></div>
                                    <span>Booked / Unavailable</span>
                                </div>
                            </div>

                            {/* Active Map */}
                            {activeCampground ? (
                                <div>
                                    {campgrounds.length <= 1 && <h3>{activeCampground.name}</h3>} {/* Show title if no tabs */}
                                    <div style={{ position: 'relative', border: '1px solid #ddd', background: '#ccc' }}>
                                        <img src={activeCampground.map_image_url} alt={activeCampground.name} style={{ width: '100%', display: 'block' }} />

                                        {/* Render Pins */}
                                        {activeCampground.sites.map(site => {
                                            if (!site.map_coordinates) return null;
                                            let c;
                                            try { c = JSON.parse(site.map_coordinates); } catch (e) { return null; }

                                            const isSelected = selectedSite?.campsite_id === site.campsite_id;
                                            // Use Theme Variables
                                            const color = !site.is_available ? 'red' : (isSelected ? 'var(--primary-color, blue)' : 'var(--accent-color, gold)');
                                            const zIndex = isSelected ? 10 : 1;

                                            return (
                                                <div
                                                    key={site.campsite_id}
                                                    onClick={() => handleSiteClick(site)}
                                                    style={{
                                                        position: 'absolute',
                                                        left: `${c.x}%`,
                                                        top: `${c.y}%`,
                                                        width: '20px',
                                                        height: '20px',
                                                        background: color,
                                                        borderRadius: '50%',
                                                        transform: 'translate(-50%, -50%)',
                                                        border: '2px solid white',
                                                        cursor: site.is_available ? 'pointer' : 'not-allowed',
                                                        zIndex: zIndex,
                                                        opacity: site.is_available ? 1 : 0.6
                                                    }}
                                                    title={`Site ${site.site_number} - ${site.is_available ? 'Available' : 'Booked'}`}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <p>No campgrounds found for this event.</p>
                            )}
                        </div>

                        {/* Sidebar / Info Panel */}
                        <div style={{ flex: 1 }}>
                            <div style={{ position: 'sticky', top: '20px', padding: '20px', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                <h2>Booking Details</h2>
                                {selectedSite ? (
                                    <div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '10px' }}>Site {selectedSite.site_number}</div>
                                        <p><strong>Power:</strong> {selectedSite.is_powered ? 'Yes' : 'No'}</p>
                                        <p><strong>Price:</strong> ${selectedSite.price_per_night} / night</p>
                                        {selectedSite.full_event_price && (
                                            <div style={{ marginTop: '5px', padding: '10px', background: '#e0f7fa', borderRadius: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input
                                                        type="checkbox"
                                                        id="fullEventCheck"
                                                        checked={useFullEventPrice}
                                                        onChange={e => {
                                                            setUseFullEventPrice(e.target.checked);
                                                            if (e.target.checked) setDates({ ...eventBounds });
                                                        }}
                                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                    />
                                                    <label htmlFor="fullEventCheck" style={{ cursor: 'pointer', fontWeight: 'bold', flex: 1 }}>
                                                        Full Event Package (${selectedSite.full_event_price})
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                        <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #eee' }} />

                                        {/* Price Calc */}
                                        {(() => {
                                            const s = new Date(dates.start);
                                            const e = new Date(dates.end);
                                            const nights = Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)));
                                            let total = (selectedSite.price_per_night || 0) * nights;

                                            // Override if Full Event
                                            if (useFullEventPrice && selectedSite.full_event_price) {
                                                total = parseFloat(selectedSite.full_event_price);
                                            }

                                            return (
                                                <div style={{ marginBottom: '20px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>{useFullEventPrice ? 'Full Event Package' : `${nights} Night${nights > 1 ? 's' : ''}`}</span>
                                                        <span>${total.toFixed(2)}</span>
                                                    </div>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '10px', textAlign: 'right' }}>
                                                        Total: ${total.toFixed(2)}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        <button
                                            onClick={handleAddToCart}
                                            style={{ width: '100%', padding: '12px', background: 'gold', border: 'none', borderRadius: '4px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', color: 'black', marginBottom: '10px' }}
                                        >
                                            Add to Cart
                                        </button>

                                        <button
                                            onClick={() => navigate('/checkout')}
                                            style={{ width: '100%', padding: '12px', background: 'black', border: 'none', borderRadius: '4px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', color: 'white' }}
                                        >
                                            Proceed to Checkout
                                        </button>
                                    </div>
                                ) : (
                                    <p style={{ color: '#666' }}>Select a campsite on the map to view details and book.</p>
                                )}

                                {cartMessage && (
                                    <div style={{ marginTop: '15px', padding: '10px', background: '#e6ffe6', color: 'green', borderRadius: '4px', textAlign: 'center' }}>
                                        {cartMessage}
                                    </div>
                                )}

                                {/* Persistent Cart Summary */}
                                {cart.length > 0 && (
                                    <div style={{ marginTop: '30px', borderTop: '2px solid #eee', paddingTop: '20px' }}>
                                        <h3>Your Cart</h3>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                            <span>{cart.length} Item{cart.length !== 1 ? 's' : ''}</span>
                                            <strong>${cartTotal.toFixed(2)}</strong>
                                        </div>
                                        <button
                                            onClick={() => navigate('/checkout')}
                                            style={{ width: '100%', padding: '12px', background: 'var(--primary-color, black)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            View Cart & Checkout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CampingPage;
