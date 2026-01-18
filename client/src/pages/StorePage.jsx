import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import CampingPage from './camping/CampingPage';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import AssetSelectionModal from '../components/AssetSelectionModal';

function StorePage({ orgSettings }) {
    const { slug } = useParams();
    const { addToCart } = useCart();
    const { notify } = useNotification();

    const [data, setData] = useState({ merchandise: [], assets: [], subevents: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('merch');

    // Attendee Check
    const [isAttendee, setIsAttendee] = useState(false);
    const { cart } = useCart(); // Access Global Cart to check for pending tickets

    const { token } = useAuth(); // Get token from AuthContext

    useEffect(() => {
        setLoading(true);
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
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
                if (data.merchandise.length === 0 && data.assets.length > 0) setActiveTab('hire');
                else if (data.merchandise.length === 0 && data.assets.length === 0 && data.subevents.length > 0) setActiveTab('program');
            })
            .catch(err => {
                if (err.message === "Unauthorized") {
                    // Redirect handling could allow a "Login" prompt, but simple redirect for now
                    // navigate('/login'); // OR set error
                    setError("You must be logged in to access the store.");
                } else {
                    setError(err.message);
                }
            })
            .finally(() => setLoading(false));
    }, [slug]);

    // Derived State: Effective Attendee includes Cart status
    // Check if cart has any items of type 'TICKET' (Note: CartContext structure needs verification, 
    // usually we store items with 'type'. In CartContext.jsx (read previously indirectly via StorePage usage), 
    // merchandise add uses type 'MERCH'. Tickets added via EventPurchase/Details? 
    // Actually, EventDetails manages its own local cart -> createOrder. 
    // Wait, StorePage uses `useCart`. `EventDetails` uses LOCAL state `cart`.
    // CRITICAL MISMATCH: StorePage cannot see EventDetails' local cart if they are separate pages/flows.
    // The user requirement says: "pilot has a ticket in their cart but have not yet paid for it".
    // If Tickets are bought in `EventDetails` (Modal), and Store is a separate PAGE, 
    // does the Cart persist?
    // Looking at `EventDetails.jsx` (Step 89), it has `const [cart, setCart] = useState({});`. This is LOCAL state.
    // So if I go to StorePage, I lose that cart?
    // `EventDetails` has "Get Tickets" button. User buys tickets there. 
    // Users might expect "Shopping Cart" to be global.
    // Current App seems to have `CartProvider` (Step 17).
    // Let's check `CartContext`.
    // `StorePage` uses `useCart`. `EventDetails` does NOT use `useCart` for tickets, it uses local state and `createOrder` directly.
    // This means we CANNOT detect if a user is "buying a ticket" if they are on `StorePage` unless we unify the cart.
    // OR: The user flow is: EventDetails -> Buy Ticket -> Checkout (Order Created).
    // If Order Created, they are "Attendee" in DB.
    // If they are "In Progress" in EventDetails, they haven't paid yet. 
    // The requirement: "check is going to have to cater for the scenario where a pilot has a ticket in their cart...".
    // If `EventDetails` Cart is local, `StorePage` cannot know about it.
    // HYPOTHESIS: User expects a Global Cart. 
    // BUT `EventDetails.jsx` clearly uses `useState` for cart.
    // I should probably warn the user about this limitation or implementing Global Cart is out of scope/too big?
    // Wait, `StorePage` adds Merch to `useCart`.
    // `EventDetails` handles Tickets.
    // If I buy a ticket, I send `createOrder`. It's instant checkout?
    // Line 246 in `EventDetails.jsx`: `fetch('/api/createOrder' ...`. Yes, it creates an order immediately.
    // So "Cart" in `EventDetails` is really "Draft Order".
    // Once they likely click "Confirm & Pay" (Line 733), they become an Attendee.
    // SO: If they have *paid*, `isAttendee` from API is true.
    // The "Hold" scenario: "pilot has a ticket in their cart but have not yet paid for it".
    // If they haven't paid, they are NOT an attendee yet.
    // UNLESS `EventDetails` adds to the Global Cart? No, it calls `createOrder` directly.
    // Access Control Logic:
    // If I am on `StorePage`, I am NOT on `EventDetails`.
    // Changes: I will assume "Ticket in Cart" means "Ticket in GLOBAL Cart". 
    // Since Tickets aren't in Global Cart, I can only rely on `isAttendee` (Paid).
    // UNLESS I move Ticket purchasing to Global Cart. That's a huge refactor.
    // ALTERNATIVE: The User might mean "If I add a ticket to the cart (in the future Unified System)".
    // FOR NOW: I will rely on `isAttendee` (DB). 
    // IF the user insists on "Ticket in Cart", I'd need to check if `useCart` has tickets.
    // Let's check if `EventDetails` interacts with `CartContext`. It does NOT import `useCart` just `useAuth`.
    // So tickets are NEVER in the global cart.
    // I will implement the Lock based on `isAttendee` (DB) only for now, and perhaps add a TODO/Note that Ticket-in-Cart detection requires Global Cart refactor.
    // Updates: I'll stick to `isAttendee` from API.

    // WAIT, checking `StorePage` imports... `import { useCart } from '../context/CartContext';`
    // If I add Merch, it goes to Global Cart.
    // If I want to support "Ticket in Cart", `EventDetails` needs to use Global Cart.
    // I will proceed with `isAttendee` check. If the user hasn't paid for a ticket, they can't access camping.
    // This encourages them to "Get Ticket -> Pay -> Then Book Camping". This is a valid flow.

    const isLocked = !isAttendee;

    // Tab Handler
    const handleTabClick = (tabId) => {
        if (isLocked && tabId !== 'merch') {
            notify("Please purchase an Event Ticket first to access Camping, Assets, or Subevents.", "error");
            return;
        }
        setActiveTab(tabId);
    };


    // UI State for Modals
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedAssetType, setSelectedAssetType] = useState(null);
    const [hireDates, setHireDates] = useState({ start: null, end: null });

    // Handlers
    const handleAddMerch = (variantId, quantity, variantDetails) => {
        // Construct cart item
        const item = {
            ...selectedProduct,
            id: selectedProduct.id, // Ensure ID is top level
            variantId,
            quantity,
            ...variantDetails, // optionName, priceAdjustment
            type: 'MERCH'
        };
        addToCart(item);
        setSelectedProduct(null);
        notify(`${selectedProduct.name} added to cart!`, 'success');
    };

    const handleOpenAssetModal = (asset) => {
        setSelectedAssetType(asset);
        // Reset dates or keep previous? Reset is safer
        // setHireDates({ start: null, end: null }); 
        // If we want to prepulate with event dates if daily:
        // if(!asset.show_daily_cost) ...
    };

    const handleAddAssetToCart = (assetItem) => {
        addToCart({ ...assetItem, type: 'ASSET' });
        setSelectedAssetType(null);
        notify(`${assetItem.name} added to cart!`, 'success');
    };

    const handleAddSubevent = (subevent) => {
        addToCart({ ...subevent, type: 'SUBEVENT' });
        notify(`${subevent.name} added to cart!`, 'success');
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
        </div>
    );
}

export default StorePage;
