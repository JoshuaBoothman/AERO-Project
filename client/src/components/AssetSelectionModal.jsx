import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

function AssetSelectionModal({ asset, hireDates, onClose, onAddToCart }) {
    const [loading, setLoading] = useState(true);
    const [availableItems, setAvailableItems] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (asset && hireDates.start && hireDates.end) {
            fetchAvailability();
        }
    }, [asset, hireDates]);

    const fetchAvailability = async () => {
        setLoading(true);
        setError(null);
        try {
            const query = new URLSearchParams({
                typeId: asset.id,
                start: hireDates.start,
                end: hireDates.end
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
        onAddToCart(asset, item, hireDates);
        onClose();
    };

    // Calculate Costs
    const calculateCost = () => {
        if (!hireDates.start || !hireDates.end) return { days: 0, total: 0 };
        const start = new Date(hireDates.start);
        const end = new Date(hireDates.end);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const days = diffDays + 1; // Inclusive

        return {
            days,
            total: (days * (asset.price || 0)).toFixed(2)
        };
    };

    const { days, total } = calculateCost();

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{asset.name}</h2>
                        <div className="mt-1 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-gray-500">
                            <p>
                                Date Range:
                                <span className="font-semibold text-gray-700 mx-1">
                                    {new Date(hireDates.start).toLocaleDateString()} - {new Date(hireDates.end).toLocaleDateString()}
                                </span>
                            </p>
                            <span className="hidden md:inline text-gray-300">|</span>
                            <p className="font-medium text-primary bg-primary/5 px-2 py-0.5 rounded">
                                {days} Day{days !== 1 ? 's' : ''} @ ${asset.price}/day = <span className="font-bold text-xl">${total}</span>
                            </p>
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
                                            {/* Notes / Description */}
                                            {item.notes ? (
                                                <p className="text-sm text-gray-600 mb-3">{item.notes}</p>
                                            ) : (
                                                <p className="text-sm text-gray-400 italic mb-3">No specific notes.</p>
                                            )}

                                            {/* Serial */}
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
