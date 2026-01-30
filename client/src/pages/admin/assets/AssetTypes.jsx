import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';

function AssetTypes() {
    const { token } = useAuth();
    const { notify, confirm } = useNotification();

    const [types, setTypes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        asset_category_id: '',
        base_hire_cost: '', // Daily Price
        full_event_cost: '',
        show_daily_cost: true,
        show_full_event_cost: false,
        stock_quantity: 0, // [NEW] Pooled Inventory
        image_url: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [typesRes, catsRes] = await Promise.all([
                fetch('/api/assets'),
                fetch('/api/assets/categories') // Fetch all categories? Or per event? Assuming global for now or needing eventId
            ]);

            // Note: Categories usually need eventId, so we might need to get it from somewhere or API handles it.
            // Let's assume generic fetch for now or we might need to pass eventId if available.
            // Actually, usually admin dashboard has a selected event context? 
            // AssetDashboard seems to specific to general assets or event specific?
            // The AssetDashboard didn't seem to take props.

            if (typesRes.ok) {
                const data = await typesRes.json();
                setTypes(data);
            }
            if (catsRes.ok) {
                const data = await catsRes.json();
                setCategories(data);
            }
        } catch {
            notify('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setFormData({
            name: '',
            description: '',
            asset_category_id: categories.length > 0 ? categories[0].asset_category_id : '',
            base_hire_cost: '',
            full_event_cost: '',
            show_daily_cost: true,
            show_full_event_cost: false,
            stock_quantity: 0,
            image_url: ''
        });
        setEditMode(false);
        setEditId(null);
        setShowModal(true);
    };

    const handleEdit = (type) => {
        setFormData({
            name: type.name,
            description: type.description || '',
            asset_category_id: type.asset_category_id || '',
            base_hire_cost: type.base_hire_cost || '',
            full_event_cost: type.full_event_cost || '',
            show_daily_cost: type.show_daily_cost || false,
            show_full_event_cost: type.show_full_event_cost || false,
            stock_quantity: type.stock_quantity || 0,
            image_url: type.image_url || ''
        });
        setEditMode(true);
        setEditId(type.asset_type_id);
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const url = editMode ? `/api/assets/types/${editId}` : '/api/assets/types';
            const method = editMode ? 'PUT' : 'POST';

            const payload = {
                ...formData,
                base_hire_cost: formData.base_hire_cost === '' ? 0 : parseFloat(formData.base_hire_cost),
                full_event_cost: formData.full_event_cost === '' ? null : parseFloat(formData.full_event_cost),
                stock_quantity: parseInt(formData.stock_quantity) || 0
            };

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                notify(editMode ? 'Asset Type updated' : 'Asset Type created', 'success');
                setShowModal(false);
                fetchData(); // Reload
            } else {
                const err = await res.json();
                notify(err.error || 'Failed to save', 'error');
            }
        } catch {
            notify('Error saving asset type', 'error');
        }
    };

    const handleDelete = (id) => {
        confirm('Delete this Asset Type?', async () => {
            try {
                const res = await fetch(`/api/assets/types/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
                });
                if (res.ok) {
                    notify('Asset Type deleted', 'success');
                    setTypes(prev => prev.filter(t => t.asset_type_id !== id));
                } else {
                    notify('Delete failed', 'error');
                }
            } catch {
                notify('Delete failed', 'error');
            }
        });
    };

    const handleImageUpload = async (e) => {
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
                setFormData(prev => ({ ...prev, image_url: data.url }));
                notify('Image uploaded', 'success');
            } else {
                notify('Upload failed', 'error');
            }
        } catch {
            notify('Upload error', 'error');
        }
    };

    return (
        <div>
            <div className="flex justify-between mb-6">
                <h2 className="text-xl font-bold">Asset Types</h2>
                <button onClick={handleCreate} className="bg-black text-white px-4 py-2 rounded">+ Add Asset Type</button>
            </div>

            {loading ? <div>Loading...</div> : (
                <div className="grid gap-4">
                    {types.map(type => (
                        <div key={type.asset_type_id} className="bg-white border p-4 rounded flex items-center gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                {type.image_url ? (
                                    <img src={type.image_url} alt={type.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400 text-xs">No Img</div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg">{type.name}</h3>
                                <p className="text-sm text-gray-600">{type.description}</p>
                                <div className="mt-1 flex gap-4 text-sm">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                        Stock: {type.stock_quantity ?? 'Unset'}
                                    </span>
                                    <span>Daily: ${type.base_hire_cost || 0}</span>
                                    <span>Full: ${type.full_event_cost || 0}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(type)} className="px-3 py-1 border rounded hover:bg-gray-50">Edit</button>
                                <button onClick={() => handleDelete(type.asset_type_id)} className="px-3 py-1 border rounded text-red-600 hover:bg-red-50">Delete</button>
                            </div>
                        </div>
                    ))}
                    {types.length === 0 && <p className="text-center text-gray-500 py-10">No Asset Types found.</p>}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">{editMode ? 'Edit Asset Type' : 'Create Asset Type'}</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input required className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <select className="w-full border p-2 rounded" value={formData.asset_category_id} onChange={e => setFormData({ ...formData, asset_category_id: e.target.value })}>
                                    <option value="">Select Category...</option>
                                    {categories.map(c => (
                                        <option key={c.asset_category_id} value={c.asset_category_id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea className="w-full border p-2 rounded h-20" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Stock Quantity</label>
                                    <input type="number" min="0" className="w-full border p-2 rounded" value={formData.stock_quantity} onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })} />
                                    <p className="text-xs text-gray-500 mt-1">Total pool size available.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                <div>
                                    <label className="flex items-center gap-2 mb-1">
                                        <input type="checkbox" checked={formData.show_daily_cost} onChange={e => setFormData({ ...formData, show_daily_cost: e.target.checked })} />
                                        <span className="text-sm font-medium">Daily Hire</span>
                                    </label>
                                    <input type="number" step="0.01" className="w-full border p-2 rounded" placeholder="Price per day" value={formData.base_hire_cost} onChange={e => setFormData({ ...formData, base_hire_cost: e.target.value })} disabled={!formData.show_daily_cost} />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 mb-1">
                                        <input type="checkbox" checked={formData.show_full_event_cost} onChange={e => setFormData({ ...formData, show_full_event_cost: e.target.checked })} />
                                        <span className="text-sm font-medium">Full Event</span>
                                    </label>
                                    <input type="number" step="0.01" className="w-full border p-2 rounded" placeholder="Price for event" value={formData.full_event_cost} onChange={e => setFormData({ ...formData, full_event_cost: e.target.value })} disabled={!formData.show_full_event_cost} />
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <label className="block text-sm font-medium mb-1">Image</label>
                                <div className="flex items-center gap-4">
                                    {formData.image_url ? (
                                        <img src={formData.image_url} alt="Preview" className="w-16 h-16 object-cover rounded border" />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-100 border rounded flex items-center justify-center text-xs text-gray-400">No Img</div>
                                    )}
                                    <input type="file" onChange={handleImageUpload} className="text-sm" />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">Save Asset Type</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AssetTypes;
