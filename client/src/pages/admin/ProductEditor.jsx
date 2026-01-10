import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

function ProductEditor() {
    const { id } = useParams();
    const { token } = useAuth();
    const { notify, confirm } = useNotification();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('info'); // info, options, skus

    // Data State
    const [product, setProduct] = useState({});
    const [variants, setVariants] = useState([]); // [{ variant_id, name, options: [{id, value}] }]
    const [skus, setSkus] = useState([]); // [{ id, code, price, stock, options: [], description }]

    // Edit State
    const [formData, setFormData] = useState({ name: '', description: '', base_image_url: '' });

    // Option State
    const [newCatName, setNewCatName] = useState('');
    const [newOptValue, setNewOptValue] = useState('');
    const [selectedVariantId, setSelectedVariantId] = useState(null);

    // Initial Fetch
    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/products/${id}`);
            if (res.ok) {
                const data = await res.json();
                setProduct(data.product);
                setVariants(data.variants);
                setSkus(data.skus);
                setFormData({
                    name: data.product.name,
                    description: data.product.description || '',
                    base_image_url: data.product.base_image_url || ''
                });
            } else {
                notify('Failed to load product', 'error');
            }
        } catch (e) {
            console.error(e);
            notify('Error loading product', 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Tab 1: Info Handlers ---
    const handleInfoSave = async () => {
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            if (res.ok) notify('Saved Details successfully!', 'success');
        } catch (e) { notify('Error saving details', 'error'); }
    };

    // --- Tab 2: Options Handlers ---
    const handleAddOption = async (categoryName, value) => {
        // If categoryName is passed, we are creating a new variant category or adding to existing
        try {
            const res = await fetch(`/api/products/${id}/options`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ categoryName, value })
            });
            if (res.ok) {
                fetchDetails(); // Reload to see changes
                setNewCatName('');
                setNewOptValue('');
                notify('Option added', 'success');
            }
        } catch (e) { notify('Error adding option', 'error'); }
    };

    const handleGenerateSKUs = async () => {
        confirm('This will generate all missing SKUs based on current options. Continue?', async () => {
            try {
                const res = await fetch(`/api/products/${id}/generate-skus`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    notify(data.message, 'success');
                    fetchDetails();
                } else {
                    notify('Failed to generate SKUs', 'error');
                }
            } catch (e) { notify('Error generating SKUs', 'error'); }
        });
    };

    // --- Image Upload Handlers ---
    const handleProductImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: uploadData });
            if (res.ok) {
                const data = await res.json();
                setFormData({ ...formData, base_image_url: data.url });
                notify('Image uploaded', 'success');
            } else { notify('Upload failed', 'error'); }
        } catch (e) { notify('Upload error', 'error'); }
    };

    const handleSkuImageUpload = async (skuId, e) => {
        const file = e.target.files[0];
        if (!file) return;
        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: uploadData });
            if (res.ok) {
                const data = await res.json();
                handleSkuUpdate(skuId, 'image_url', data.url);
                notify('SKU Image uploaded', 'success');
            } else { notify('Upload failed', 'error'); }
        } catch (e) { notify('Upload error', 'error'); }
    };

    const handleDeleteSku = async (skuId) => {
        confirm('Are you sure you want to delete this SKU?', async () => {
            try {
                const res = await fetch(`/api/skus/${skuId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setSkus(prev => prev.filter(s => s.id !== skuId));
                    notify('SKU deleted', 'success');
                } else {
                    const data = await res.json();
                    notify(data.error || 'Failed to delete SKU', 'error');
                }
            } catch (e) { notify('Error deleting SKU', 'error'); }
        });
    };

    // --- Tab 3: SKU Handlers ---
    const handleSkuUpdate = async (skuId, field, value) => {
        // Optimistic update
        setSkus(prev => prev.map(s => s.id === skuId ? { ...s, [field]: value } : s));

        try {
            await fetch(`/api/skus/${skuId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ [field]: value })
            });
        } catch (e) { console.error('Failed to save SKU change', e); }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <Link to="/admin/merchandise">← Back to List</Link>
            <h1 style={{ marginTop: '10px' }}>Editing: {product.name}</h1>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '20px' }}>
                {['info', 'options', 'skus'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '10px 20px',
                            background: activeTab === tab ? '#eee' : 'transparent',
                            border: 'none', borderBottom: activeTab === tab ? '2px solid black' : 'none',
                            cursor: 'pointer', fontWeight: 'bold', textTransform: 'capitalize'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* TAB: INFO */}
            {activeTab === 'info' && (
                <div style={{ maxWidth: '600px' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold' }}>Name</label>
                        <input
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold' }}>Description</label>
                        <textarea
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', height: '100px' }}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold' }}>Base Image</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            {formData.base_image_url ? (
                                <img src={formData.base_image_url} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                            ) : (
                                <div style={{ width: '100px', height: '100px', background: '#eee', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>No Img</div>
                            )}
                            <input
                                type="file"
                                onChange={handleProductImageUpload}
                            />
                        </div>
                    </div>
                    <button onClick={handleInfoSave} style={{ background: 'black', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Save Details
                    </button>
                </div>
            )}

            {/* TAB: OPTIONS */}
            {activeTab === 'options' && (
                <div>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        {/* Existing Options */}
                        {variants.map(v => (
                            <div key={v.variant_id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', minWidth: '250px', background: '#fff' }}>
                                <h3 style={{ marginTop: 0 }}>{v.name}</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                                    {v.options.map(opt => (
                                        <span key={opt.id} style={{ background: '#eee', padding: '4px 8px', borderRadius: '12px', fontSize: '0.9rem' }}>
                                            {opt.value}
                                        </span>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <input
                                        placeholder={`New ${v.name}...`}
                                        style={{ flex: 1, padding: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
                                        id={`new-opt-${v.variant_id}`}
                                    />
                                    <button
                                        onClick={() => {
                                            const val = document.getElementById(`new-opt-${v.variant_id}`).value;
                                            if (val) handleAddOption(v.name, val);
                                        }}
                                        style={{ background: '#aaa', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                                </div>
                            </div>
                        ))}

                        {/* Add New Category */}
                        <div style={{ border: '1px dashed #ccc', borderRadius: '8px', padding: '15px', minWidth: '250px' }}>
                            <h3 style={{ marginTop: 0, color: '#666' }}>Add Variant Type</h3>
                            <input
                                placeholder="e.g. Size, Color"
                                value={newCatName}
                                onChange={e => setNewCatName(e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '10px' }}
                            />
                            <button
                                onClick={() => { if (newCatName) handleAddOption(newCatName, null); }}
                                disabled={!newCatName}
                                style={{ width: '100%', background: 'black', color: 'white', padding: '8px', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: newCatName ? 1 : 0.5 }}>
                                Create Category
                            </button>
                        </div>
                    </div>

                    <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                        <p style={{ color: '#666' }}>Once you have configured all options (e.g. Sizes: S, M, L and Colors: Red, Blue), click the button below to generate inventory items (SKUs) for selling.</p>
                        <button
                            onClick={handleGenerateSKUs}
                            style={{ background: 'blue', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            Regenerate SKUs
                        </button>
                    </div>
                </div>
            )}

            {/* TAB: SKUS */}
            {activeTab === 'skus' && (
                <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <thead style={{ background: '#f5f5f5' }}>
                            <tr>
                                <th style={{ padding: '10px', textAlign: 'left', width: '60px' }}>Active</th>
                                <th style={{ padding: '10px', textAlign: 'left' }}>SKU Info</th>
                                <th style={{ padding: '10px', textAlign: 'left' }}>Image URL</th>
                                <th style={{ padding: '10px', textAlign: 'left', width: '100px' }}>Price ($)</th>
                                <th style={{ padding: '10px', textAlign: 'left', width: '100px' }}>Stock</th>

                                <th style={{ padding: '10px', width: '60px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {skus.map(sku => (
                                <tr key={sku.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={sku.active}
                                            onChange={e => handleSkuUpdate(sku.id, 'is_active', e.target.checked)}
                                        />
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        <div style={{ fontWeight: 'bold' }}>{sku.description || 'Base Item'}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{sku.code}</div>
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                            {sku.image_url ? <img src={sku.image_url} alt="product" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} /> :
                                                <div style={{ width: '40px', height: '40px', background: '#eee', borderRadius: '4px' }}></div>}
                                            <label style={{ cursor: 'pointer', background: '#eee', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                                Upload
                                                <input type="file" style={{ display: 'none' }} onChange={(e) => handleSkuImageUpload(sku.id, e)} />
                                            </label>
                                        </div>
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        <input
                                            type="number"
                                            value={sku.price}
                                            onChange={e => handleSkuUpdate(sku.id, 'price', e.target.value)}
                                            style={{ width: '80px', padding: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
                                        />
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        <input
                                            type="number"
                                            value={sku.stock}
                                            onChange={e => handleSkuUpdate(sku.id, 'current_stock', e.target.value)}
                                            style={{ width: '80px', padding: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
                                        />
                                    </td>

                                    <td style={{ padding: '10px' }}>
                                        <button
                                            onClick={() => handleDeleteSku(sku.id)}
                                            style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem' }}
                                            title="Delete SKU"
                                        >×</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {skus.length === 0 && <p style={{ textAlign: 'center', marginTop: '20px' }}>No SKUs generated yet. Go to "Options" tab to generate.</p>}
                </div>
            )}
        </div>
    );
}

export default ProductEditor;
