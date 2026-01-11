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
    const [formData, setFormData] = useState({
        identifier: '',
        serial_number: '',
        status: 'Active',
        notes: '',
        asset_type_id: ''
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
            asset_type_id: selectedType
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/assets/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                notify('Item added', 'success');
                setShowModal(false);
                fetchItems(selectedType);
            } else {
                notify('Failed to add item', 'error');
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
                    notify('Delete failed', 'error');
                }
            } catch (e) { notify('Error deleting', 'error'); }
        });
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
                                <td className="p-3 font-medium">{item.identifier}</td>
                                <td className="p-3 font-mono text-sm">{item.serial_number}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs ${item.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-200'}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="p-3 text-sm text-gray-500">{item.notes}</td>
                                <td className="p-3">
                                    <button onClick={() => handleDelete(item.asset_item_id)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4">Add Item</h3>
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
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-1">Notes</label>
                                <textarea className="w-full border p-2 rounded" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-black text-white rounded">Add</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AssetItems;
