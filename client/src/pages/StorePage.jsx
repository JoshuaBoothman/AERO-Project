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
    }, [slug]);

    // Fetch My Pilots
    useEffect(() => {
        if (user && slug) {
            fetch(`/api/events/${slug}/my-attendees`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setMyPilots(data);
                    }
                })
                .catch(err => console.error("Failed to fetch my pilots", err));
        }
    }, [user, slug]);

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

    // Handlers
    const handleAddMerch = (product, sku) => {
        // Construct cart item
        const item = {
            ...product,
            id: sku.product_sku_id || sku.id, // Use SKU ID as the primary ID for the cart
            productId: product.id,
            skuCode: sku.sku_code || sku.code,
            quantity: 1, // Default to 1
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
        const item = {
            ...specificItem,
            id: specificItem.asset_item_id, // Use specific unit ID
            assetTypeId: asset.id,
            name: asset.name, // Ensure name is preserved
            identifier: specificItem.identifier,
            checkIn: dates.start,
            checkOut: dates.end,
            eventId: data.eventId,
            type: 'ASSET',
            price: asset.price // Ensure calculated price passed from modal is used (attached to asset in modal)
        };
        addToCart(item);
        setSelectedAssetType(null);
        notify(`${asset.name} (${specificItem.identifier}) added to cart!`, 'success');
    };

    const handleAddSubevent = (subevent) => {
        addToCart({ ...subevent, eventId: data.eventId, type: 'SUBEVENT' });
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

        const item = {
            ...selectedTicketForModal,
            type: 'TICKET',
            quantity: 1,
            eventId: data.eventId, // Ensure eventId is passed
            attendees: attendees
        };

        addToCart(item);
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {data.assets.length === 0 && <p className="text-gray-500 italic">No assets available for hire.</p>}
                            {data.assets.map(asset => (
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
                                        {new Date(sub.startTime).toLocaleString()} - {new Date(sub.endTime).toLocaleTimeString()}
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
                        <CampingPage embedded={true} />
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

            {/* Ticket Attendee Modal */}
            <AttendeeModal
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
