import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';

function AssetTypes() {
    const { token } = useAuth();
    const { notify, confirm } = useNotification();

    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        asset_type_id: null,
        name: '',
        description: '',
        base_hire_cost: 0,
        image_url: '',
        event_id: 1 // Default to 1 (AERO) for now, or fetch from context if available
    });

    const [events, setEvents] = useState([]);

    useEffect(() => {
        fetchTypes();
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const res = await fetch('/api/events', { headers });
            if (res.ok) {
                const data = await res.json();
                setEvents(data);

                // Smart Default Selection
                if (data.length > 0) {
                    const now = new Date();
                    // 1. Find active/current event
                    let defaultEvent = data.find(e => {
                        const start = new Date(e.start_date);
                        const end = new Date(e.end_date);
                        return now >= start && now <= end;
                    });

                    // 2. If no current, find next upcoming
                    if (!defaultEvent) {
                        const upcoming = data
                            .filter(e => new Date(e.start_date) > now)
                            .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
                        if (upcoming.length > 0) defaultEvent = upcoming[0];
                    }

                    // 3. Fallback to first if still null
                    if (!defaultEvent) defaultEvent = data[0];

                    setFormData(prev => ({ ...prev, event_id: defaultEvent.event_id }));
                }
            }
        } catch (e) { console.error('Error loading events', e); }
    };

    const fetchTypes = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/assets'); // Uses getAssets.js
            if (res.ok) {
                const data = await res.json();
                setTypes(data);
            } else {
                notify('Failed to load asset types', 'error');
            }
        } catch (error) {
            notify('Error loading asset types', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (type) => {
        setFormData({
            asset_type_id: type.asset_type_id,
            name: type.name,
            description: type.description || '',
            base_hire_cost: type.base_hire_cost || 0,
            image_url: type.image_url || '',
            event_id: type.event_id || (events.length > 0 ? events[0].event_id : '')
        });
        setEditMode(true);
        setShowModal(true);
    };

    const handleCreate = () => {
        setFormData({
            asset_type_id: null,
            name: '',
            description: '',
            base_hire_cost: 0,
            image_url: '',
            event_id: events.length > 0 ? events[0].event_id : ''
        });
        setEditMode(false);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        confirm('Are you sure you want to delete this asset type?', async () => {
            try {
                const res = await fetch(`/api/assets/types/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    notify('Deleted successfully', 'success');
                    fetchTypes();
                } else {
                    const err = await res.json();
                    notify(err.error || 'Delete failed', 'error');
                }
            } catch (e) {
                notify('Delete failed', 'error');
            }
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const url = editMode ? `/api/assets/types/${formData.asset_type_id}` : '/api/assets/types';
            const method = editMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                notify(editMode ? 'Updated successfully' : 'Created successfully', 'success');
                setShowModal(false);
                fetchTypes();
            } else {
                const err = await res.json();
                notify(err.error || 'Save failed', 'error');
            }
        } catch (e) {
            notify('Save failed', 'error');
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: uploadData });
            if (res.ok) {
                const data = await res.json();
                setFormData(prev => ({ ...prev, image_url: data.url }));
                notify('Image uploaded', 'success');
            } else {
                notify('Upload failed', 'error');
            }
        } catch (e) {
            notify('Upload error', 'error');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Asset Types</h2>
                <button onClick={handleCreate} className="bg-black text-white px-4 py-2 rounded">+ New Type</button>
            </div>

            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-100 border-b border-gray-200">
                        <th className="p-3">Image</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Cost ($)</th>
                        <th className="p-3">Inventory</th>
                        <th className="p-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {types.map(type => (
                        <tr key={type.asset_type_id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-3">
                                {type.image_url ? (
                                    <img src={type.image_url} alt={type.name} className="w-12 h-12 object-cover rounded" />
                                ) : (
                                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">No Img</div>
                                )}
                            </td>
                            <td className="p-3">
                                <div className="font-medium">{type.name}</div>
                                <div className="text-xs text-gray-500">{type.description}</div>
                            </td>
                            <td className="p-3">${typeof type.base_hire_cost === 'number' ? type.base_hire_cost.toFixed(2) : type.base_hire_cost}</td>
                            <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs ${type.total_items > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {type.active_items} Active / {type.total_items} Total
                                </span>
                            </td>
                            <td className="p-3">
                                <button onClick={() => handleEdit(type)} className="text-blue-600 hover:underline mr-3">Edit</button>
                                <button onClick={() => handleDelete(type.asset_type_id)} className="text-red-600 hover:underline">Delete</button>
                            </td>
                        </tr>
                    ))}
                    {types.length === 0 && (
                        <tr>
                            <td colSpan="5" className="p-8 text-center text-gray-500">No Asset Types found. Create one to get started.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">{editMode ? 'Edit Asset Type' : 'New Asset Type'}</h3>
                        <form onSubmit={handleSave}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Name *</label>
                                <input
                                    required
                                    className="w-full border border-gray-300 rounded p-2"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded p-2"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Daily Hire Cost ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full border border-gray-300 rounded p-2"
                                    value={formData.base_hire_cost}
                                    onChange={e => setFormData({ ...formData, base_hire_cost: e.target.value })}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Event Context</label>
                                <select
                                    className="w-full border border-gray-300 rounded p-2"
                                    value={formData.event_id}
                                    onChange={e => setFormData({ ...formData, event_id: e.target.value })}
                                >
                                    {events.map(ev => (
                                        <option key={ev.event_id} value={ev.event_id}>{ev.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-1">Image</label>
                                <div className="flex items-center gap-4">
                                    {formData.image_url ? (
                                        <img src={formData.image_url} alt="Preview" className="w-16 h-16 object-cover rounded border" />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-100 border rounded"></div>
                                    )}
                                    <input type="file" onChange={handleImageUpload} className="text-sm" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-black text-white rounded">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AssetTypes;
