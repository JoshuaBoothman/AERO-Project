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
    const [isArchived, setIsArchived] = useState(false);

    // Edit State
    const [formData, setFormData] = useState({ name: '', description: '', base_image_url: '' });

    // Option State
    const [newCatName, setNewCatName] = useState('');
    const [newOptValue, setNewOptValue] = useState('');
    const [selectedVariantId, setSelectedVariantId] = useState(null);

    // Template State
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

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
                setIsArchived(!data.product.is_active);
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
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token },
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
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token },
                body: JSON.stringify({ categoryName, value })
            });
            if (res.ok) {
                const data = await res.json();

                // Update Local State without Refetch
                // 1. Check if variant category exists in state
                setVariants(prev => {
                    const existingVarIndex = prev.findIndex(v => v.name === categoryName);
                    if (existingVarIndex >= 0) {
                        // Add option to existing category
                        const updated = [...prev];
                        const existingVar = updated[existingVarIndex];
                        // Avoid duplicates in UI if backend returned existing ID
                        if (!existingVar.options.find(o => o.id === data.option.id)) {
                            updated[existingVarIndex] = {
                                ...existingVar,
                                options: [...existingVar.options, { id: data.option.id, value: data.option.value }]
                            };
                        }
                        return updated;
                    } else {
                        // Create new category
                        return [...prev, {
                            variant_id: data.option.variant_id,
                            name: categoryName,
                            options: data.option.value ? [{ id: data.option.id, value: data.option.value }] : []
                        }];
                    }
                });

                setNewCatName('');
                setNewOptValue('');
                notify('Option added', 'success');
            }
        } catch (e) { notify('Error adding option', 'error'); }
    };

    const handleDeleteOption = async (optionId) => {
        confirm('Deleting this option will delete ALL SKUs that use it. This cannot be undone. Are you sure?', async () => {
            try {
                const res = await fetch(`/api/options/${optionId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
                });
                if (res.ok) {
                    const data = await res.json();
                    notify(data.message || 'Option deleted', 'success');

                    // Local Update
                    setVariants(prev => prev.map(v => ({
                        ...v,
                        options: v.options.filter(o => o.id !== optionId)
                    })));

                    if (data.deletedSkuIds && data.deletedSkuIds.length > 0) {
                        setSkus(prev => prev.filter(s => !data.deletedSkuIds.includes(s.id)));
                    }
                } else {
                    notify('Failed to delete option', 'error');
                }
            } catch (e) { notify('Error deleting option', 'error'); }
        });
    };

    const handleDeleteVariant = async (variantId) => {
        confirm('Are you sure you want to remove this category from the product? You must delete all options first.', async () => {
            try {
                const res = await fetch(`/api/variants/${variantId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
                });

                if (res.ok) {
                    const data = await res.json();
                    notify(data.message || 'Category removed', 'success');
                    // Local Update
                    setVariants(prev => prev.filter(v => v.variant_id !== variantId));
                } else if (res.status === 409) {
                    const data = await res.json();
                    notify(data.error, 'error');
                } else {
                    notify('Failed to delete category', 'error');
                }
            } catch (e) { notify('Error deleting category', 'error'); }
        });
    };

    const handleGenerateSKUs = async () => {
        confirm('This will generate all missing SKUs based on current options. Continue?', async () => {
            try {
                const res = await fetch(`/api/products/${id}/generate-skus`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
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
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: uploadData,
                headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
            });
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
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: uploadData,
                headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
            });
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
                    headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
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

    // --- Delete / Archive Handlers ---
    const handleDeleteProduct = async (force = false) => {
        if (!force) {
            const confirmMsg = "Are you sure you want to delete this product? This action cannot be undone.";
            if (!window.confirm(confirmMsg)) return;
            // Note: using window.confirm for initial check to avoid nested custom modals complexity for now, or use custom if preferred.
            // Actually, let's just proceed to API call, the API handles the logic checks.
            // But for "Clean" product, we want a confirm.
        }

        try {
            const res = await fetch(`/api/products/${id}${force ? '?force=true' : ''}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
            });

            if (res.ok) {
                notify('Product deleted successfully', 'success');
                window.location.href = '/admin/merchandise'; // using location.href to ensure full refresh or navigate
                return;
            }

            const data = await res.json();

            if (res.status === 409) {
                if (data.code === 'HAS_ORDERS') {
                    if (window.confirm(`${data.error} \n\nWould you like to archive this product instead?`)) {
                        handleToggleArchive(true); // Archive it
                    }
                } else if (data.code === 'HAS_SKUS') {
                    if (window.confirm(`${data.error} \n\nAre you sure you want to proceed? This will delete all SKUs and cannot be undone.`)) {
                        handleDeleteProduct(true); // Force delete
                    }
                } else {
                    notify(data.error, 'error');
                }
            } else {
                notify(data.error || 'Failed to delete product', 'error');
            }

        } catch (e) {
            console.error(e);
            notify('Error deleting product', 'error');
        }
    };

    const handleToggleArchive = async (archive) => {
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token },
                body: JSON.stringify({ is_active: !archive }) // if archive=true, is_active=false
            });
            if (res.ok) {
                setIsArchived(archive);
                notify(archive ? 'Product Archived' : 'Product Unarchived', 'success');
                setProduct({ ...product, is_active: !archive });
            } else {
                notify('Failed to update status', 'error');
            }
        } catch (e) { notify('Error updating status', 'error'); }
    };


    // --- Tab 3: SKU Handlers ---
    const handleSkuUpdate = async (skuId, field, value) => {
        // Optimistic update
        setSkus(prev => prev.map(s => s.id === skuId ? { ...s, [field]: value } : s));

        // Map state keys to API keys
        let apiField = field;
        if (field === 'stock') apiField = 'current_stock';
        if (field === 'active') apiField = 'is_active';

        try {
            await fetch(`/api/skus/${skuId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token },
                body: JSON.stringify({ [apiField]: value })
            });
        } catch (e) { console.error('Failed to save SKU change', e); }
    };

    const fetchTemplates = async () => {
        try {
            const res = await fetch('/api/manage/variant-templates');
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (e) { console.error(e); }
    };

    const handleApplyTemplate = async () => {
        if (!selectedTemplate) return;

        try {
            // Get full template details with options
            const res = await fetch(`/api/manage/variant-templates/${selectedTemplate.template_id}`);
            if (!res.ok) throw new Error('Failed to load template details');
            const data = await res.json();

            notify('Applying template options...', 'info');
            setIsTemplateModalOpen(false);

            // Sequentially add options to avoid race conditions or overwhelming server
            for (const option of data.options) {
                await handleAddOption(option.category_name, option.option_name);
            }
            notify('Template applied successfully!', 'success');
        } catch (e) {
            notify('Error applying template: ' + e.message, 'error');
        }
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
                    <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
                        <h3>Actions</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {isArchived ? (
                                <button
                                    onClick={() => handleToggleArchive(false)}
                                    style={{ background: '#4CAF50', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Unarchive Product
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleToggleArchive(true)}
                                    style={{ background: '#FF9800', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Archive Product
                                </button>
                            )}

                            <button
                                onClick={() => handleDeleteProduct(false)}
                                style={{ background: '#F44336', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Delete Product
                            </button>
                        </div>
                        <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '10px' }}>
                            <strong>Note:</strong> Archiving hides the product from the store but keeps historical data. Deleting permanently removes it.
                        </p>
                    </div>
                </div>
            )}

            {/* TAB: OPTIONS */}
            {activeTab === 'options' && (
                <div>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        {/* Existing Options */}
                        {variants.map(v => (
                            <div key={v.variant_id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', minWidth: '250px', background: '#fff' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <h3 style={{ margin: 0 }}>{v.name}</h3>
                                    <button
                                        onClick={() => handleDeleteVariant(v.variant_id)}
                                        style={{ color: '#999', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px' }}
                                        title="Remove Category"
                                    >×</button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                                    {v.options.map(opt => (
                                        <span key={opt.id} style={{ background: '#eee', padding: '4px 8px', borderRadius: '12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            {opt.value}
                                            <button
                                                onClick={() => handleDeleteOption(opt.id)}
                                                style={{ border: 'none', background: 'none', color: '#999', cursor: 'pointer', padding: 0, fontSize: '1rem', lineHeight: 1 }}
                                                title="Delete Option"
                                            >×</button>
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

                        {/* Apply Template Button */}
                        <div style={{ border: '1px dashed #ccc', borderRadius: '8px', padding: '15px', minWidth: '250px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                            <h3 style={{ marginTop: 0, color: '#666', marginBottom: '15px' }}>Use Template</h3>
                            <button
                                onClick={() => { fetchTemplates(); setIsTemplateModalOpen(true); }}
                                style={{ background: '#2196F3', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Apply Template
                            </button>
                            <p style={{ fontSize: '0.8rem', color: '#888', textAlign: 'center', marginTop: '10px' }}>
                                Pre-fill options from saved templates (e.g. Sizes)
                            </p>
                        </div>
                    </div>

                    {/* Template Modal */}
                    {isTemplateModalOpen && (
                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
                                <h2 style={{ marginTop: 0 }}>Select Template</h2>
                                {loading && <p>Loading templates...</p>}
                                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', marginBottom: '15px' }}>
                                    {templates.map(t => (
                                        <div
                                            key={t.template_id}
                                            onClick={() => setSelectedTemplate(t)}
                                            style={{
                                                padding: '10px',
                                                borderBottom: '1px solid #eee',
                                                cursor: 'pointer',
                                                background: selectedTemplate?.template_id === t.template_id ? '#e3f2fd' : 'white'
                                            }}
                                        >
                                            <div style={{ fontWeight: 'bold' }}>{t.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{t.option_count} options</div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                    <button onClick={() => setIsTemplateModalOpen(false)} style={{ padding: '8px 16px', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                    <button
                                        onClick={handleApplyTemplate}
                                        disabled={!selectedTemplate}
                                        style={{ padding: '8px 16px', background: 'blue', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: selectedTemplate ? 1 : 0.5 }}
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

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
                                            onChange={e => handleSkuUpdate(sku.id, 'active', e.target.checked)}
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
                                            onChange={e => handleSkuUpdate(sku.id, 'stock', e.target.value)}
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
