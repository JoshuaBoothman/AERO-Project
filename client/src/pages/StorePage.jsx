import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import CampingPage from './camping/CampingPage';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import AssetSelectionModal from '../components/AssetSelectionModal';
import AttendeeModal from '../components/AttendeeModal';
import SubeventModal from '../components/SubeventModal';
import { formatDateTimeRange, formatDateForDisplay } from '../utils/dateHelpers';

function StorePage({ orgSettings }) {
    const { slug } = useParams();
    const { addToCart, cart } = useCart();
    const { notify } = useNotification();
    const { user, token } = useAuth(); // Get token from AuthContext

    const [data, setData] = useState({ merchandise: [], assets: [], subevents: [], tickets: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('tickets'); // Default to tickets if available

    // Attendee Check
    const [isAttendee, setIsAttendee] = useState(false);
    const [myPilots, setMyPilots] = useState([]); // For dropdown in modal

    useEffect(() => {
        setLoading(true);
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            headers['X-Auth-Token'] = token;
        }

        fetch(`/api/getStoreItems?slug=${slug}`, { headers })
            .then(res => {
                if (res.status === 401) throw new Error("Unauthorized");
                if (!res.ok) throw new Error("Failed to load store.");
                return res.json();
            })
            .then(data => {
                setData(data);
                setIsAttendee(data.isAttendee); // DB Check from API

                // Default Tab Logic
                if (data.tickets && data.tickets.length > 0) setActiveTab('tickets');
                else if (data.merchandise.length > 0) setActiveTab('merch');
                else if (data.assets.length > 0) setActiveTab('hire');
                else if (data.subevents.length > 0) setActiveTab('program');
            })
            .catch(err => {
                if (err.message === "Unauthorized") {
                    setError("You must be logged in to access the store.");
                } else {
                    setError(err.message);
                }
            })
            .finally(() => setLoading(false));
    }, [slug, token]);

    // Fetch My Pilots
    useEffect(() => {
        if (user && slug && token) {
            fetch(`/api/events/${slug}/my-attendees`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                }
            })
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error('Failed to fetch attendees');
                })
                .then(data => {
                    if (Array.isArray(data)) {
                        setMyPilots(data);
                    }
                })
                .catch(err => console.error("Failed to fetch my pilots", err));
        }
    }, [user, slug, token]);

    const hasTicketInCart = cart.some(item => item.type === 'TICKET');
    const isLocked = !isAttendee && !hasTicketInCart;

    // Tab Handler
    const handleTabClick = (tabId) => {
        // Tickets are always accessible (to buy)
        if (isLocked && tabId !== 'tickets' && tabId !== 'merch') {
            notify("Please purchase an Event Ticket first to access Camping, Assets, or Subevents.", "error");
            return;
        }
        setActiveTab(tabId);
    };


    // UI State for Modals
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedAssetType, setSelectedAssetType] = useState(null);
    const [hireDates, setHireDates] = useState({ start: null, end: null });

    // Ticket Modal State
    const [selectedTicketForModal, setSelectedTicketForModal] = useState(null);

    // Subevent Modal State
    const [selectedSubevent, setSelectedSubevent] = useState(null);

    // Handlers
    const handleAddMerch = (product, sku, qty = 1) => {
        // Construct cart item
        const item = {
            ...product,
            id: sku.product_sku_id || sku.id, // Use SKU ID as the primary ID for the cart
            productId: product.id,
            skuCode: sku.sku_code || sku.code,
            quantity: qty, // Use selected quantity
            price: sku.price, // Use SKU price
            eventId: data.eventId,
            type: 'MERCH',
            // Store specific variant options for display if needed, though SKU code often suffices
            variantValues: sku.variant_map || {}
        };
        addToCart(item);
        setSelectedProduct(null);
        notify(`${product.name} added to cart!`, 'success');
    };

    const handleOpenAssetModal = (asset) => {
        setSelectedAssetType(asset);
    };

    const handleAddAssetToCart = (asset, specificItem, dates) => {
        // specificItem is now the "Virtual" item containing asset_type_id and basic stats.
        // It does NOT have a specific asset_item_id (or it is -1).

        const item = {
            uniqueId: Date.now(), // Front-end unique ID
            type: 'ASSET',
            name: asset.name, // Use Type Name (e.g. "Golf Cart")
            price: specificItem.price || asset.price, // Fallback to category price
            details: `Dates: ${formatDateForDisplay(dates.start)} - ${formatDateForDisplay(dates.end)}`,
            checkIn: dates.start,
            checkOut: dates.end,
            // Key Change: Store Type ID.
            id: asset.id,
            assetTypeId: asset.id,
            assetId: asset.id, // Legacy/Fallback compatibility
            // We don't store specificItem.asset_item_id (it's -1)
            item_reference_id: asset.id // For uniform handling
        };

        addToCart(item);
        setSelectedAssetType(null);
        notify(`${asset.name} added to cart!`, 'success');
    };

    const handleAddSubevent = (subevent) => {
        // ALWAYS open modal to select Attendee
        setSelectedSubevent(subevent);
    };

    const searchAttendees = async (query) => {
        if (!query || query.length < 2) return [];
        try {
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                headers['X-Auth-Token'] = token;
            }
            const res = await fetch(`/api/events/${slug}/attendees/search?q=${encodeURIComponent(query)}`, { headers });
            if (res.ok) {
                const data = await res.json();
                return data.attendees || [];
            }
            return [];
        } catch (err) {
            console.error("Search failed", err);
            return [];
        }
    };

    const handleConfirmSubevent = (subevent, selections, totalPrice, attendeeLink, note) => {
        addToCart({
            ...subevent,
            eventId: data.eventId,
            type: 'SUBEVENT',
            price: totalPrice,
            selectedOptions: selections,
            attendeeId: attendeeLink.attendeeId, // Existing
            attendeeTempId: attendeeLink.attendeeTempId, // New (Cart)
            guestName: attendeeLink.guestName, // [NEW] Guest Name
            attendeeName: attendeeLink.name, // For display in cart if needed
            note: note
        });
        setSelectedSubevent(null);
        notify(`${subevent.name} added to cart!`, 'success');
    };

    const handleOpenTicketModal = (ticket) => {
        setSelectedTicketForModal(ticket);
    };

    const handleConfirmTicket = (details) => {
        if (!selectedTicketForModal) return;

        // Convert details map to array
        // Key is `${ticketId}_0` since we assume qty 1 for this flow
        const attendees = Object.values(details);

        // Calculate price based on first attendee's choice (assuming single ticket flow here)
        // Store Page currently adds 1 qty at a time via modal.
        let finalPrice = selectedTicketForModal.price;

        // Day Pass Pricing: Calculate based on date range
        if (selectedTicketForModal.is_day_pass) {
            const attendee = attendees[0];
            if (attendee && attendee.arrivalDate && attendee.departureDate) {
                const arrival = new Date(attendee.arrivalDate);
                const departure = new Date(attendee.departureDate);
                const dayCount = Math.ceil((departure - arrival) / (1000 * 60 * 60 * 24)) + 1; // +1 for inclusive
                finalPrice = selectedTicketForModal.price * dayCount;
            }
            // Note: Flight line duties checkbox doesn't affect Day Pass pricing
        }
        // Standard Pilot Pricing: Apply flight line surcharge if applicable
        else if (selectedTicketForModal.system_role === 'pilot' && selectedTicketForModal.price_no_flight_line) {
            const attendee = attendees[0];
            if (attendee && !attendee.flightLineDuties) {
                finalPrice = selectedTicketForModal.price_no_flight_line;
            }
        }

        // Generate a Temp ID for linking subevents
        if (attendees.length > 0) {
            attendees[0].tempId = `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        const item = {
            ...selectedTicketForModal,
            type: 'TICKET',
            quantity: 1,
            price: finalPrice, // Override base price
            eventId: data.eventId, // Ensure eventId is passed
            attendees: attendees
        };

        addToCart(item);

        // [NEW] Add Official Dinner Subevent if applicable
        if (selectedTicketForModal.includes_official_dinner && data.official_dinner_subevent_id) {
            // Check if the attendee opted in
            // Since we only process one ticket/attendee at a time in this modal flow:
            const attendee = attendees[0];
            if (attendee && attendee.attendingDinner) {
                const dinnerSubevent = data.subevents.find(s => s.id === data.official_dinner_subevent_id);
                if (dinnerSubevent) {
                    addToCart({
                        type: 'SUBEVENT',
                        id: dinnerSubevent.id,
                        name: dinnerSubevent.name,
                        price: 0,
                        quantity: 1,
                        description: 'Official Dinner Entry (Included with Ticket)',
                        startTime: dinnerSubevent.startTime,
                        eventId: data.eventId,
                        attendeeTempId: attendee.tempId // Link to the new attendee if needed
                    });
                    notify("Official Dinner Entry added to cart", "success");
                }
            }
        }

        setSelectedTicketForModal(null);
        notify(`${selectedTicketForModal.name} added to cart!`, 'success');
    };

    if (loading) return <div className="p-10 text-center">Loading Store...</div>;
    if (error) {
        if (error.includes("logged in")) {
            // Redirect or show login link
            return (
                <div className="max-w-4xl mx-auto p-8 text-center">
                    <h2 className="text-2xl font-bold mb-4">Access Restricted</h2>
                    <p className="mb-4 text-gray-600">{error}</p>
                    <a href="/login" className="bg-primary text-white px-6 py-2 rounded">Login</a>
                </div>
            );
        }
        return <div className="p-10 text-center text-red-500">Error: {error}</div>;
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-8 text-primary">Event Store: {data.eventName || slug}</h1>

            {/* Banner for Non-Attendees */}
            {isLocked && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 text-amber-800">
                    <p className="font-bold">Pilot Access Restricted</p>
                    <p>You can purchase merchandise, but you must be a registered Event Attendee (have a valid ticket) to book Camping, Assets, or Subevents.</p>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-8 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                <button
                    className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'tickets' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-primary'}`}
                    onClick={() => handleTabClick('tickets')}
                >
                    Event Tickets
                </button>
                <button
                    className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'merch' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-primary'}`}
                    onClick={() => handleTabClick('merch')}
                >
                    Merchandise
                </button>
                <button
                    className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'hire' ? 'border-b-2 border-primary text-primary' : isLocked ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-primary'}`}
                    onClick={() => handleTabClick('hire')}
                >
                    Hire Assets {isLocked && '🔒'}
                </button>
                <button
                    className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'program' ? 'border-b-2 border-primary text-primary' : isLocked ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-primary'}`}
                    onClick={() => handleTabClick('program')}
                >
                    Program / Subevents {isLocked && '🔒'}
                </button>
                <button
                    className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'camping' ? 'border-b-2 border-primary text-primary' : isLocked ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-primary'}`}
                    onClick={() => handleTabClick('camping')}
                >
                    Camping {isLocked && '🔒'}
                </button>
            </div>

            {/* Content */}
            <div className="min-h-[400px]">

                {/* TICKETS */}
                {activeTab === 'tickets' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.tickets && data.tickets.length === 0 && <p className="text-gray-500 italic">No tickets available.</p>}
                        {data.tickets && data.tickets.map(ticket => (
                            <div key={ticket.id} className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-xl text-primary mb-2">{ticket.name}</h3>
                                    <p className="text-gray-600 mb-4">{ticket.description}</p>
                                    <div className="flex items-center gap-2 mb-4">
                                        {ticket.isPitCrew && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">Pit Crew</span>}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold mb-4 text-gray-800">${(ticket.price || 0).toFixed(2)}</div>
                                    <button
                                        onClick={() => handleOpenTicketModal(ticket)}
                                        className="w-full bg-accent text-primary py-2 rounded hover:brightness-110 transition-all font-bold shadow-sm"
                                    >
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* MERCHANDISE */}
                {activeTab === 'merch' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {data.merchandise.length === 0 && <p className="text-gray-500 italic">No merchandise available.</p>}
                            {data.merchandise.map(prod => (
                                <ProductCard
                                    key={prod.id}
                                    product={prod}
                                    onSelect={setSelectedProduct}
                                />
                            ))}
                        </div>

                        {selectedProduct && (
                            <ProductModal
                                product={selectedProduct}
                                onClose={() => setSelectedProduct(null)}
                                onAddToCart={handleAddMerch}
                            />
                        )}
                    </>
                )}

                {/* ASSETS */}
                {activeTab === 'hire' && (
                    <div>
                        {(() => {
                            if (!data.assets || data.assets.length === 0) {
                                return <p className="text-gray-500 italic">No assets available for hire.</p>;
                            }

                            // Group assets
                            const groups = {};
                            const groupOrder = []; // To preserve category order from SQL

                            data.assets.forEach(asset => {
                                const catName = asset.category_name || 'Other';
                                if (!groups[catName]) {
                                    groups[catName] = [];
                                    groupOrder.push(catName);
                                }
                                groups[catName].push(asset);
                            });

                            return groupOrder.map(catName => (
                                <div key={catName} className="mb-12">
                                    <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">{catName}</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {groups[catName].map(asset => (
                                            <div key={asset.id} className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                                                <div className="mb-4">
                                                    <div className="w-full h-48 bg-gray-50 rounded mb-4 overflow-hidden border border-gray-100">
                                                        {asset.image ? (
                                                            <img src={asset.image} alt={asset.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-200">No Image</div>
                                                        )}
                                                    </div>
                                                    <h3 className="font-bold text-lg text-gray-800 mb-1">{asset.name}</h3>
                                                    <p className="text-sm text-gray-600">{asset.description}</p>
                                                </div>
                                                <div>
                                                    <div className="mb-4">
                                                        {asset.show_daily_cost && asset.show_full_event_cost ? (
                                                            <div>
                                                                <p className="font-bold text-xl text-primary">${asset.price} <span className="text-sm font-normal text-gray-500">/ day</span></p>
                                                                <p className="text-sm text-gray-500">or ${asset.full_event_cost} Full Event</p>
                                                            </div>
                                                        ) : asset.show_full_event_cost ? (
                                                            <p className="font-bold text-xl text-primary">${asset.full_event_cost} <span className="text-sm font-normal text-gray-500">Full Event</span></p>
                                                        ) : (
                                                            <p className="font-bold text-xl text-primary">${asset.price} <span className="text-sm font-normal text-gray-500">/ day</span></p>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleOpenAssetModal(asset)}
                                                        className="w-full bg-primary text-secondary py-2 rounded hover:brightness-110 transition-all font-bold"
                                                    >
                                                        View Available Items
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                )}

                {/* SUBEVENTS */}
                {activeTab === 'program' && (
                    <div className="space-y-4 max-w-3xl">
                        {data.subevents.length === 0 && <p className="text-gray-500 italic">No program items available.</p>}
                        {data.subevents.map(sub => (
                            <div key={sub.id} className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center">
                                <div>
                                    <h3 className="font-bold text-xl text-primary">{sub.name}</h3>
                                    <p className="text-gray-600 mb-2">{sub.description}</p>
                                    <div className="text-sm font-medium bg-gray-100 inline-block px-2 py-1 rounded text-gray-700">
                                        {formatDateTimeRange(sub.startTime, sub.endTime)}
                                    </div>
                                </div>
                                <div className="mt-4 md:mt-0 text-right min-w-[120px]">
                                    <div className="text-2xl font-bold mb-2 text-gray-800">${sub.price}</div>
                                    <button
                                        onClick={() => handleAddSubevent(sub)}
                                        className="w-full bg-accent text-primary px-6 py-2 rounded hover:brightness-110 transition-all font-bold shadow-sm"
                                    >
                                        Register
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* CAMPING */}
                {activeTab === 'camping' && (
                    <div className="mt-4">
                        <CampingPage embedded={true} event={data} />
                    </div>
                )}

            </div>

            {/* Asset Modal */}
            {selectedAssetType && (
                <AssetSelectionModal
                    asset={selectedAssetType}
                    hireDates={hireDates}
                    setHireDates={setHireDates}
                    eventDates={{ start: data.eventStartDate, end: data.eventEndDate }}
                    onClose={() => setSelectedAssetType(null)}
                    onAddToCart={handleAddAssetToCart}
                />
            )}

            {/* Subevent Modal */}
            {selectedSubevent && (
                <SubeventModal
                    subevent={selectedSubevent}
                    onClose={() => setSelectedSubevent(null)}
                    onAddToCart={handleConfirmSubevent}
                    myPilots={myPilots}
                    cart={cart}
                    onSearchAttendees={searchAttendees}
                />
            )}

            {/* Ticket Attendee Modal */}
            <AttendeeModal
                key={selectedTicketForModal ? selectedTicketForModal.id : 'closed'}
                show={!!selectedTicketForModal}
                onClose={() => setSelectedTicketForModal(null)}
                onConfirm={handleConfirmTicket}
                tickets={selectedTicketForModal ? [selectedTicketForModal] : []}
                cart={selectedTicketForModal ? { [selectedTicketForModal.id]: 1 } : {}}
                user={user}
                myPilots={myPilots}
                event={data}
                confirmLabel="Add to Cart"
            />
        </div>
    );
}

export default StorePage;
