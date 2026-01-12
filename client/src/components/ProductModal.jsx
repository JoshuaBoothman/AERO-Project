import { useState, useEffect } from 'react';

function ProductModal({ product, onClose, onAddToCart }) {
    const [selectedOptions, setSelectedOptions] = useState({});
    const [matchedSku, setMatchedSku] = useState(null);
    const [displayImage, setDisplayImage] = useState(product.image);

    // Initialize defaults
    useEffect(() => {
        // Pre-select first values? Or wait for user?
        // Let's pre-select the first value of each option to simulate a "default" selection
        const defaults = {};
        product.options.forEach(opt => {
            if (opt.values.length > 0) defaults[opt.name] = opt.values[0];
        });
        setSelectedOptions(defaults);
    }, [product]);

    // Resolve SKU based on selection
    useEffect(() => {
        if (!product.skus) return;

        const found = product.skus.find(sku => {
            const found = product.skus.find(sku => {
                // Check if every selected option matches the sku's variant_map

                // Loop through all product-level option categories
                return product.options.every(opt => {
                    const selectedVal = selectedOptions[opt.name];
                    const skuVal = sku.variant_map[opt.name];
                    return selectedVal === skuVal;
                });
            });

            setMatchedSku(found || null);

            // Update Image if SKU has one
            if (found && found.image) {
                setDisplayImage(found.image);
            } else {
                setDisplayImage(product.image); // Revert to base if SKU has none
            }

        }, [selectedOptions, product]);


        const handleOptionChange = (category, value) => {
            setSelectedOptions(prev => ({ ...prev, [category]: value }));
        };

        const handleAdd = () => {
            if (!matchedSku) return alert("Unavailable combination");
            if (matchedSku.stock <= 0) return alert("Out of stock");
            onAddToCart(product, matchedSku);
            onClose();
        };

        if (!product) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]" onClick={e => e.stopPropagation()}>

                    {/* Image Section */}
                    <div className="w-full md:w-1/2 bg-gray-100 p-6 flex items-center justify-center relative">
                        {displayImage ? (
                            <img src={displayImage} alt={product.name} className="max-h-[400px] object-contain drop-shadow-md" />
                        ) : (
                            <div className="text-gray-400">No Image</div>
                        )}
                        {/* Tiny Thumbnails for other variants could go here? MVP: No. */}
                    </div>

                    {/* Details Section */}
                    <div className="w-full md:w-1/2 p-8 flex flex-col overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-3xl font-bold text-gray-800">{product.name}</h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <p className="text-gray-600 mb-6 text-sm leading-relaxed">{product.description}</p>

                        <div className="mb-6">
                            <div className="text-3xl font-bold text-primary mb-1">
                                {matchedSku ? `$${matchedSku.price}` : <span className="text-gray-400 text-xl font-normal">Select options</span>}
                            </div>
                            {matchedSku && (
                                <div className={`text-sm font-medium ${matchedSku.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {matchedSku.stock > 0 ? `In Stock (${matchedSku.stock})` : 'Sold Out'}
                                </div>
                            )}
                        </div>

                        <div className="space-y-5 mb-8 flex-grow">
                            {product.options.map(opt => (
                                <div key={opt.name}>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">{opt.name}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {opt.values.map(val => (
                                            <button
                                                key={val}
                                                onClick={() => handleOptionChange(opt.name, val)}
                                                className={`px-4 py-2 rounded-md text-sm font-medium border transition-all
                                                ${selectedOptions[opt.name] === val
                                                        ? 'bg-black text-white border-black shadow-md'
                                                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                                                    }
                                            `}
                                            >
                                                {val}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto">
                            <button
                                onClick={handleAdd}
                                disabled={!matchedSku || matchedSku.stock <= 0}
                                className={`w-full py-4 text-lg font-bold rounded-lg transition-all transform active:scale-[0.99]
                                ${matchedSku && matchedSku.stock > 0
                                        ? 'bg-primary text-secondary hover:brightness-110 shadow-lg'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }
                            `}
                            >
                                {matchedSku && matchedSku.stock <= 0 ? 'Sold Out' : 'Add to Cart'}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        );
    }

export default ProductModal;
