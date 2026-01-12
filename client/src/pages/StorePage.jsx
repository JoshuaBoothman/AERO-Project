import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({ merchandise: [], assets: [], subevents: [] });
    const [activeTab, setActiveTab] = useState('merch');
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Asset Selection State
    const [selectedAssetType, setSelectedAssetType] = useState(null);
    const [hireDates, setHireDates] = useState({ start: '', end: '' });

    useEffect(() => {
        setLoading(true);
        fetch(`/api/getStoreItems?slug=${slug}`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to load store.");
                return res.json();
            })
            .then(data => {
                setData(data);
                if (data.merchandise.length === 0 && data.assets.length > 0) setActiveTab('hire');
                else if (data.merchandise.length === 0 && data.assets.length === 0 && data.subevents.length > 0) setActiveTab('program');
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [slug]);

    const handleAddMerch = (product, sku) => {
        addToCart({
            type: 'MERCH',
            id: sku.id, // product_sku_id (Global)
            name: `${product.name} ${Object.values(sku.variant_map || {}).join(' / ')}`,
            price: sku.price,
            quantity: 1,
            image: sku.image || product.image,
            productId: product.id,
            eventId: data.eventId
        });
        notify("Added to Cart!", "success");
    };

    const handleOpenAssetModal = (asset) => {
        if (!hireDates.start || !hireDates.end) return notify("Please select hire dates first.", "error");
        setSelectedAssetType(asset);
    };

    const handleAddAssetToCart = (assetType, assetItem, dates) => {
        // Calculate Days
        const start = new Date(dates.start);
        const end = new Date(dates.end);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const days = diffDays + 1; // Inclusive

        const price = assetType.price * days;

        addToCart({
            type: 'ASSET',
            id: assetType.id, // asset_type_id
            itemId: assetItem.asset_item_id, // Specific Item ID
            name: `${assetType.name} #${assetItem.identifier} (${days} days)`,
            price: price,
            quantity: 1,
            checkIn: dates.start,
            checkOut: dates.end,
            dailyRate: assetType.price,
            eventId: data.eventId,
            image: assetItem.image_url || assetType.image // Use item image or type image
        });
        notify("Added to Cart!", "success");
    };

    const handleAddSubevent = (sub) => {
        addToCart({
            type: 'SUBEVENT',
            id: sub.id,
            name: sub.name,
            price: sub.price,
            quantity: 1,
            startTime: sub.startTime,
            eventId: data.eventId
        });
        notify("Added to Cart!", "success");
    };

    if (loading) return <div className="p-10 text-center">Loading Store...</div>;
    if (error) return <div className="p-10 text-center text-red-500">Error: {error}</div>;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-8 text-primary">Event Store: {data.eventName || slug}</h1>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
                <button
                    className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap ${activeTab === 'merch' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-primary'}`}
                    onClick={() => setActiveTab('merch')}
                >
                    Merchandise
                </button>
                <button
                    className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap ${activeTab === 'hire' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-primary'}`}
                    onClick={() => setActiveTab('hire')}
                >
                    Hire Assets
                </button>
                <button
                    className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap ${activeTab === 'program' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-primary'}`}
                    onClick={() => setActiveTab('program')}
                >
                    Program / Subevents
                </button>
                <button
                    className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap ${activeTab === 'camping' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-primary'}`}
                    onClick={() => setActiveTab('camping')}
                >
                    Camping
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
                        <div className="bg-gray-100 p-6 rounded-lg mb-8 flex flex-col md:flex-row gap-6 items-end shadow-inner">
                            <div className="w-full md:w-auto">
                                <label className="block text-sm font-bold mb-1 text-gray-700">Hire Start</label>
                                <input type="date" className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none" value={hireDates.start} onChange={e => setHireDates({ ...hireDates, start: e.target.value })} />
                            </div>
                            <div className="w-full md:w-auto">
                                <label className="block text-sm font-bold mb-1 text-gray-700">Hire End</label>
                                <input type="date" className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none" value={hireDates.end} onChange={e => setHireDates({ ...hireDates, end: e.target.value })} />
                            </div>
                            <div className="text-sm text-gray-500 pb-2 italic">Select dates to view available items</div>
                        </div>

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
                                        <p className="font-bold text-xl mb-4 text-primary">${asset.price} <span className="text-sm font-normal text-gray-500">/ day</span></p>
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
                    onClose={() => setSelectedAssetType(null)}
                    onAddToCart={handleAddAssetToCart}
                />
            )}
        </div>
    );
}

export default StorePage;
