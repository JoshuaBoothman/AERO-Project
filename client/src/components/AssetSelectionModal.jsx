import { useState, useEffect } from 'react';
import { X } from 'lucide-react';



// Helper to determine initial mode
function getInitialMode(asset) {
    if (asset.show_daily_cost && !asset.show_full_event_cost) return 'daily';
    if (!asset.show_daily_cost && asset.show_full_event_cost) return 'full';
    return 'daily'; // Default if both or neither (though neither shouldn't happen)
}

function AssetSelectionModal({ asset, hireDates, setHireDates, eventDates, onClose, onAddToCart }) {
    const [loading, setLoading] = useState(false);
    const [availableItems, setAvailableItems] = useState([]);
    const [error, setError] = useState(null);

    // Pricing Mode State
    const [pricingMode, setPricingMode] = useState(getInitialMode(asset));

    // Update mode if asset changes
    useEffect(() => {
        setPricingMode(getInitialMode(asset));
    }, [asset]);

    useEffect(() => {
        const targetDates = pricingMode === 'full' ? eventDates : hireDates;

        if (asset && targetDates && targetDates.start && targetDates.end) {
            fetchAvailability(targetDates);
        } else {
            setAvailableItems([]);
            setLoading(false);
        }
    }, [asset, hireDates, pricingMode, eventDates]);

    const fetchAvailability = async (dates) => {
        setLoading(true);
        setError(null);
        try {
            const query = new URLSearchParams({
                typeId: asset.id,
                start: dates.start,
                end: dates.end
            });
            const res = await fetch(`/api/assets/availability?${query}`);
            if (res.ok) {
                const data = await res.json();
                setAvailableItems(data);
            } else {
                setError("Failed to check availability.");
            }
        } catch (e) {
            setError("Error checking availability.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item) => {
        // Construct item with correct price based on mode
        const costInfo = calculateCost(); // Re-calc to be safe
        const finalPrice = costInfo.rawTotal; // Float

        // Determine correct dates based on mode
        const selectedDates = pricingMode === 'full' ? eventDates : hireDates;

        // Make sure we pass the 'price' to onAddToCart so the cart knows what to charge
        // Modifying the asset object passed to cart? Or the item?
        // onAddToCart(asset, item, dates) -> usually creates a cart item.
        // We might need to override the price in the cart item.
        // Assuming onAddToCart handles an override or we pass a constructed object.
        // Let's attach the price to the asset clone or item.
        const assetWithPrice = { ...asset, price: finalPrice };
        onAddToCart(assetWithPrice, item, selectedDates);
        onClose();
    };

    // Calculate Costs
    const calculateCost = () => {
        if (pricingMode === 'full') {
            const price = parseFloat(asset.full_event_cost || 0);
            return {
                label: 'Full Event',
                total: price.toFixed(2),
                rawTotal: price,
                detail: 'Event Package'
            };
        }

        // Daily Mode
        if (!hireDates.start || !hireDates.end) return { days: 0, total: 0, rawTotal: 0, label: '', detail: '' };
        const start = new Date(hireDates.start);
        const end = new Date(hireDates.end);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const days = diffDays + 1; // Inclusive

        // Allow fallback to 'price' if base_hire_cost is missing (StorePage mapping legacy vs new)
        const pricePerDay = parseFloat(asset.base_hire_cost || asset.price || 0);
        const total = days * pricePerDay;

        return {
            days,
            label: `${days} Day${days !== 1 ? 's' : ''}`,
            total: total.toFixed(2),
            rawTotal: total,
            detail: `@ $${pricePerDay}/day`
        };
    };

    const { label, total, detail } = calculateCost();

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{asset.name}</h2>
                        <div className="mt-2 flex flex-col gap-2">
                            {/* Pricing Toggle */}
                            {(asset.show_daily_cost && asset.show_full_event_cost) && (
                                <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
                                    <button
                                        onClick={() => setPricingMode('daily')}
                                        className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${pricingMode === 'daily' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}
                                    >
                                        Daily Hire
                                    </button>
                                    <button
                                        onClick={() => setPricingMode('full')}
                                        className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${pricingMode === 'full' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}
                                    >
                                        Full Event Pkg
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <p>
                                    <span className="font-semibold text-gray-700">
                                        {pricingMode === 'full' && eventDates && eventDates.start ? (
                                            <>
                                                {new Date(eventDates.start).toLocaleDateString()} - {new Date(eventDates.end).toLocaleDateString()}
                                                <span className="ml-1 text-xs text-primary bg-primary/10 px-1 rounded">Event Dates</span>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="date"
                                                    className="p-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary outline-none"
                                                    value={hireDates.start}
                                                    min={eventDates?.start ? new Date(eventDates.start).toISOString().split('T')[0] : undefined}
                                                    max={eventDates?.end ? new Date(eventDates.end).toISOString().split('T')[0] : undefined}
                                                    onChange={e => setHireDates ? setHireDates({ ...hireDates, start: e.target.value }) : null}
                                                />
                                                <span>to</span>
                                                <input
                                                    type="date"
                                                    className="p-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary outline-none"
                                                    value={hireDates.end}
                                                    min={eventDates?.start ? new Date(eventDates.start).toISOString().split('T')[0] : undefined}
                                                    max={eventDates?.end ? new Date(eventDates.end).toISOString().split('T')[0] : undefined}
                                                    onChange={e => setHireDates ? setHireDates({ ...hireDates, end: e.target.value }) : null}
                                                />
                                            </div>
                                        )}
                                    </span>
                                </p>
                                <span>|</span>
                                <p className="font-medium text-primary bg-primary/5 px-2 py-0.5 rounded">
                                    {label} {detail} = <span className="font-bold text-xl text-black">${total}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {loading ? (
                        <div className="flex justify-center py-20 text-gray-500">Checking availability...</div>
                    ) : error ? (
                        <div className="text-red-500 text-center py-10">{error}</div>
                    ) : availableItems.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-xl font-bold text-gray-400 mb-2">Unavailable</p>
                            <p className="text-gray-500">No items of this type are available for the selected dates.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {availableItems.map(item => (
                                <div key={item.asset_item_id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full overflow-hidden group">
                                    {/* Image Area */}
                                    <div className="w-full h-48 bg-gray-100 relative overflow-hidden">
                                        {(item.image_url || asset.image) ? (
                                            <img
                                                src={item.image_url || asset.image}
                                                alt={item.identifier}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                                <span>No Image</span>
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm">
                                            {item.identifier}
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="p-4 flex-1 flex flex-col">
                                        <div className="flex-1">
                                            {item.notes ? (
                                                <p className="text-sm text-gray-600 mb-3">{item.notes}</p>
                                            ) : (
                                                <p className="text-sm text-gray-400 italic mb-3">No specific notes.</p>
                                            )}
                                            {item.serial_number && (
                                                <div className="text-xs text-gray-400 font-mono mb-4">
                                                    SN: {item.serial_number}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleSelect(item)}
                                            className="w-full mt-auto bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <span>Select for ${total}</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AssetSelectionModal;
