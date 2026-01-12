import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';

function AssetItems() {
    const { token } = useAuth();
    const { notify, confirm } = useNotification();

    const [items, setItems] = useState([]);
    const [types, setTypes] = useState([]);
    const [selectedType, setSelectedType] = useState('');
    const [loading, setLoading] = useState(false);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        identifier: '',
        serial_number: '',
        status: 'Active',
        notes: '',
        asset_type_id: '',
        image_url: ''
    });

    // Load Types first
    useEffect(() => {
        fetch('/api/assets')
            .then(res => res.json())
            .then(data => {
                setTypes(data);
                if (data.length > 0) setSelectedType(data[0].asset_type_id);
            });
    }, []);

    // Load Items when Type changes
    useEffect(() => {
        if (selectedType) fetchItems(selectedType);
    }, [selectedType]);

    const fetchItems = async (typeId) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/assets/items?typeId=${typeId}`);
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (e) {
            notify('Error loading items', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setFormData({
            identifier: '',
            serial_number: '',
            status: 'Active',
            notes: '',
            asset_type_id: selectedType,
            image_url: ''
        });
        setEditMode(false);
        setEditId(null);
        setShowModal(true);
    };

    const handleEdit = (item) => {
        setFormData({
            identifier: item.identifier,
            serial_number: item.serial_number || '',
            status: item.status,
            notes: item.notes || '',
            asset_type_id: item.asset_type_id,
            image_url: item.image_url || ''
        });
        setEditMode(true);
        setEditId(item.asset_item_id);
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const url = editMode ? `/api/assets/items/${editId}` : '/api/assets/items';
            const method = editMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                notify(editMode ? 'Item updated' : 'Item added', 'success');
                setShowModal(false);
                fetchItems(selectedType);
            } else {
                notify('Failed to save item', 'error');
            }
        } catch (e) { notify('Error saving item', 'error'); }
    };

    const handleDelete = async (id) => {
        confirm('Delete this item?', async () => {
            try {
                const res = await fetch(`/api/assets/items/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
                });
                if (res.ok) {
                    notify('Item deleted', 'success');
                    setItems(prev => prev.filter(i => i.asset_item_id !== id));
                } else {
                    const err = await res.json();
                    notify(err.error || 'Delete failed', 'error');
                }
            } catch (e) { notify('Error deleting', 'error'); }
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
        } catch (e) {
            notify('Upload error', 'error');
        }
    };

    return (
        <div>
            <div className="flex gap-4 mb-6">
                <select
                    className="border p-2 rounded w-64"
                    value={selectedType}
                    onChange={e => setSelectedType(e.target.value)}
                >
                    {types.map(t => <option key={t.asset_type_id} value={t.asset_type_id}>{t.name}</option>)}
                </select>
                <button onClick={handleCreate} className="bg-black text-white px-4 py-2 rounded">+ Add Item</button>
            </div>

            {loading ? <div>Loading items...</div> : (
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-100 border-b">
                            <th className="p-3">Image</th>
                            <th className="p-3">Identifier</th>
                            <th className="p-3">Serial</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Notes</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.asset_item_id} className="border-b hover:bg-gray-50">
                                <td className="p-3">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.identifier} className="w-10 h-10 object-cover rounded" />
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">No Img</div>
                                    )}
                                </td>
                                <td className="p-3 font-medium">{item.identifier}</td>
                                <td className="p-3 font-mono text-sm">{item.serial_number}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs ${item.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-200'}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="p-3 text-sm text-gray-500">{item.notes}</td>
                                <td className="p-3">
                                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:underline mr-3">Edit</button>
                                    <button onClick={() => handleDelete(item.asset_item_id)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr><td colSpan="6" className="p-8 text-center text-gray-500">No items found for this type.</td></tr>
                        )}
                    </tbody>
                </table>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4">{editMode ? 'Edit Item' : 'Add Item'}</h3>
                        <form onSubmit={handleSave}>
                            <div className="mb-3">
                                <label className="block text-sm font-medium mb-1">Identifier (e.g. #01) *</label>
                                <input required className="w-full border p-2 rounded" value={formData.identifier} onChange={e => setFormData({ ...formData, identifier: e.target.value })} />
                            </div>
                            <div className="mb-3">
                                <label className="block text-sm font-medium mb-1">Serial Number</label>
                                <input className="w-full border p-2 rounded" value={formData.serial_number} onChange={e => setFormData({ ...formData, serial_number: e.target.value })} />
                            </div>
                            <div className="mb-3">
                                <label className="block text-sm font-medium mb-1">Status</label>
                                <select className="w-full border p-2 rounded" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="Active">Active</option>
                                    <option value="Servicing">Servicing</option>
                                    <option value="Retired">Retired</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="block text-sm font-medium mb-1">Notes</label>
                                <textarea className="w-full border p-2 rounded" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-1">Image</label>
                                <div className="flex items-center gap-4">
                                    {formData.image_url ? (
                                        <img src={formData.image_url} alt="Preview" className="w-16 h-16 object-cover rounded border" />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-100 border rounded"></div>
                                    )}
                                    <input type="file" onChange={handleImageUpload} className="text-sm max-w-[200px]" />
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

export default AssetItems;
