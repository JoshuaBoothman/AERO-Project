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

    // Options State
    const [options, setOptions] = useState([]);
    const [selectedOptionId, setSelectedOptionId] = useState(null);
    const [loadingOptions, setLoadingOptions] = useState(false);

    // Pricing Mode State
    const [pricingMode, setPricingMode] = useState(getInitialMode(asset));

    // Update mode if asset changes
    useEffect(() => {
        setPricingMode(getInitialMode(asset));
        setSelectedOptionId(null);
        setOptions([]);

        if (asset.option_count > 0) {
            setLoadingOptions(true);
            fetch(`/api/assets/types/${asset.asset_type_id || asset.id}/options`)
                .then(res => res.json())
                .then(data => {
                    setOptions(data);
                    if (data.length > 0) {
                        // Optional: Pre-select first? Or force user choice? 
                        // Plan said: "Selection is mandatory when options exist." 
                        // Let's force choice (init null).
                    }
                })
                .catch(err => console.error("Failed to load options", err))
                .finally(() => setLoadingOptions(false));
        }
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
        } catch {
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
        // Let's attach the price to the asset clone or item.
        const assetWithPrice = {
            ...asset,
            price: finalPrice,
            selectedOptionId: selectedOptionId,
            selectedOptionLabel: options.find(o => o.asset_type_option_id === parseInt(selectedOptionId))?.label
        };
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
                                <div>
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
                                                    value={hireDates.start || ''}
                                                    min={eventDates?.start ? new Date(eventDates.start).toISOString().split('T')[0] : undefined}
                                                    max={eventDates?.end ? new Date(eventDates.end).toISOString().split('T')[0] : undefined}
                                                    onChange={e => setHireDates ? setHireDates({ ...hireDates, start: e.target.value }) : null}
                                                />
                                                <span>to</span>
                                                <input
                                                    type="date"
                                                    className="p-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary outline-none"
                                                    value={hireDates.end || ''}
                                                    min={eventDates?.start ? new Date(eventDates.start).toISOString().split('T')[0] : undefined}
                                                    max={eventDates?.end ? new Date(eventDates.end).toISOString().split('T')[0] : undefined}
                                                    onChange={e => setHireDates ? setHireDates({ ...hireDates, end: e.target.value }) : null}
                                                />
                                            </div>
                                        )}
                                    </span>
                                </div>
                                <span>|</span>
                                <div className="font-medium text-primary bg-primary/5 px-2 py-0.5 rounded">
                                    {label} {detail} = <span className="font-bold text-xl text-black">${total}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">

                    {/* Options Dropdown */}
                    {asset.option_count > 0 && (
                        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                {asset.option_label || "Select Option"}
                            </label>
                            {loadingOptions ? (
                                <div className="text-sm text-gray-500">Loading options...</div>
                            ) : (
                                <select
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary outline-none"
                                    value={selectedOptionId || ''}
                                    onChange={e => setSelectedOptionId(e.target.value)}
                                >
                                    <option value="">-- Select --</option>
                                    {options.map(opt => (
                                        <option key={opt.asset_type_option_id} value={opt.asset_type_option_id}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-20 text-gray-500">Checking availability...</div>
                    ) : error ? (
                        <div className="text-red-500 text-center py-10">{error}</div>
                    ) : availableItems.length === 0 || availableItems[0].available_count <= 0 ? (
                        <div className="text-center py-20">
                            <p className="text-xl font-bold text-gray-400 mb-2">Unavailable</p>
                            <p className="text-gray-500">No stock available for the selected dates.</p>
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">{asset.name}</h3>
                                <p className="text-gray-600">
                                    <span className="font-bold text-green-600">{availableItems[0].available_count}</span> available for your dates.
                                </p>
                            </div>

                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => handleSelect(availableItems[0])} // Pass the "virtual" item (contains typeId)
                                    disabled={asset.option_count > 0 && !selectedOptionId}
                                    className={`font-bold py-3 px-8 rounded-lg shadow-lg transition-transform transform hover:scale-105 ${asset.option_count > 0 && !selectedOptionId
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                                        }`}
                                >
                                    {asset.option_count > 0 && !selectedOptionId ? "Select Option" : `Add to Cart for $${total}`}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AssetSelectionModal;
