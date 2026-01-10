import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function StorePage({ orgSettings }) {
    const { slug } = useParams();
    const { addToCart } = useCart();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({ merchandise: [], assets: [], subevents: [] });
    const [activeTab, setActiveTab] = useState('merch');

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
            id: sku.id, // event_sku_id
            name: `${product.name} (${sku.variant})`,
            price: sku.price,
            quantity: 1,
            image: product.image,
            productId: product.id,
            eventId: data.eventId
        });
        alert("Added to Cart!");
    };

    // Asset State
    const [hireDates, setHireDates] = useState({ start: '', end: '' });

    const handleAddAsset = (asset) => {
        if (!hireDates.start || !hireDates.end) return alert("Select dates first.");

        // Calculate Days
        const start = new Date(hireDates.start);
        const end = new Date(hireDates.end);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const days = diffDays < 1 ? 1 : diffDays; // Minimum 1 day charge? Or depending on logic.

        const price = asset.price * days;

        addToCart({
            type: 'ASSET',
            id: asset.id, // asset_type_id
            name: `${asset.name} (${days} days)`,
            price: price,
            quantity: 1, // "1 hire" but implies dates.
            checkIn: hireDates.start,
            checkOut: hireDates.end,
            dailyRate: asset.price,
            eventId: data.eventId
        });
        alert("Added to Cart!");
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
        alert("Added to Cart!");
    };

    if (loading) return <div className="p-10 text-center">Loading Store...</div>;
    if (error) return <div className="p-10 text-center text-red-500">Error: {error}</div>;

    return (
        <div className="max-w-6xl mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Event Store: {slug}</h1>

            {/* Tabs */}
            <div className="flex border-b mb-6">
                <button
                    className={`px-6 py-3 font-semibold ${activeTab === 'merch' ? 'border-b-2 border-black text-black' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('merch')}
                >
                    Merchandise
                </button>
                <button
                    className={`px-6 py-3 font-semibold ${activeTab === 'hire' ? 'border-b-2 border-black text-black' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('hire')}
                >
                    Hire Assets
                </button>
                <button
                    className={`px-6 py-3 font-semibold ${activeTab === 'program' ? 'border-b-2 border-black text-black' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('program')}
                >
                    Program / Subevents
                </button>
            </div>

            {/* Content */}
            <div className="min-h-[400px]">

                {/* MERCHANDISE */}
                {activeTab === 'merch' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {data.merchandise.length === 0 && <p>No merchandise available.</p>}
                        {data.merchandise.map(prod => (
                            <div key={prod.id} className="border rounded-lg p-4 shadow-sm">
                                <img src={prod.image} alt={prod.name} className="w-full h-48 object-cover mb-4 rounded bg-gray-100" />
                                <h3 className="font-bold text-lg">{prod.name}</h3>
                                <p className="text-sm text-gray-600 mb-4">{prod.description}</p>

                                <div className="space-y-2">
                                    {prod.skus.map(sku => (
                                        <div key={sku.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                            <span>{sku.variant}</span>
                                            <span className="font-bold">${sku.price}</span>
                                            <button
                                                onClick={() => handleAddMerch(prod, sku)}
                                                className="bg-black text-white px-3 py-1 rounded text-sm hover:bg-gray-800"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ASSETS */}
                {activeTab === 'hire' && (
                    <div>
                        <div className="bg-gray-100 p-4 rounded mb-6 flex gap-4 items-end">
                            <div>
                                <label className="block text-sm font-bold mb-1">Hire Start</label>
                                <input type="date" className="p-2 border rounded" value={hireDates.start} onChange={e => setHireDates({ ...hireDates, start: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Hire End</label>
                                <input type="date" className="p-2 border rounded" value={hireDates.end} onChange={e => setHireDates({ ...hireDates, end: e.target.value })} />
                            </div>
                            <div className="text-sm text-gray-500 pb-2">Select dates to view pricing</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {data.assets.length === 0 && <p>No assets available for hire.</p>}
                            {data.assets.map(asset => (
                                <div key={asset.id} className="border rounded-lg p-4 shadow-sm">
                                    <h3 className="font-bold text-lg">{asset.name}</h3>
                                    <p className="text-sm text-gray-600 mb-2">{asset.description}</p>
                                    <p className="font-bold text-xl mb-4">${asset.price} <span className="text-sm font-normal text-gray-500">/ day</span></p>
                                    <button
                                        onClick={() => handleAddAsset(asset)}
                                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                                    >
                                        Add to Cart
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SUBEVENTS */}
                {activeTab === 'program' && (
                    <div className="space-y-4">
                        {data.subevents.length === 0 && <p>No program items available.</p>}
                        {data.subevents.map(sub => (
                            <div key={sub.id} className="border rounded-lg p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center">
                                <div>
                                    <h3 className="font-bold text-xl">{sub.name}</h3>
                                    <p className="text-gray-600 mb-2">{sub.description}</p>
                                    <div className="text-sm text-gray-500">
                                        {new Date(sub.startTime).toLocaleString()} - {new Date(sub.endTime).toLocaleTimeString()}
                                    </div>
                                </div>
                                <div className="mt-4 md:mt-0 text-right">
                                    <div className="text-2xl font-bold mb-2">${sub.price}</div>
                                    <button
                                        onClick={() => handleAddSubevent(sub)}
                                        className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
                                    >
                                        Register
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}

export default StorePage;
