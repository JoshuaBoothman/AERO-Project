function ProductCard({ product, onSelect }) {
    // Determine price range
    const prices = product.skus.map(s => s.price);
    const minPrice = Math.min(...prices);

    return (
        <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center h-full">
            <div className="w-full aspect-square mb-4 bg-gray-50 rounded overflow-hidden cursor-pointer" onClick={() => onSelect(product)}>
                {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-contain hover:scale-105 transition-transform duration-300" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>
                )}
            </div>

            <h3 className="font-bold text-lg text-gray-800 mb-1 cursor-pointer hover:text-primary transition-colors" onClick={() => onSelect(product)}>{product.name}</h3>

            <div className="text-primary font-medium mb-4">
                From ${minPrice}
            </div>

            <button
                onClick={() => onSelect(product)}
                className="mt-auto px-6 py-2 border border-black text-black rounded hover:bg-black hover:text-white transition-all text-sm font-bold uppercase tracking-wide"
            >
                Select Options
            </button>
        </div>
    );
}

export default ProductCard;
