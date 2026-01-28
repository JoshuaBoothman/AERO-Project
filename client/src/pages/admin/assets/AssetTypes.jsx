import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AssetCategoryManager from './AssetCategoryManager';

function AssetTypes() {
    const { token } = useAuth();
    const { notify, confirm } = useNotification();

    const [types, setTypes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        asset_type_id: null,
        name: '',
        description: '',
        base_hire_cost: 0,
        full_event_cost: '', // Default empty or 0
        show_daily_cost: true,
        show_full_event_cost: false,
        image_url: '',
        event_id: 1,
        asset_category_id: ''
    });

    const [events, setEvents] = useState([]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchTypes();
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const headers = token ? { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token } : {};
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

                    // Fetch categories for this event
                    fetchCategories(defaultEvent.event_id);
                }
            }
        } catch (e) { console.error('Error loading events', e); }
    };

    const fetchCategories = async (eventId) => {
        if (!eventId) return;
        try {
            const res = await fetch(`/api/assets/categories?eventId=${eventId}`);
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (e) { console.error('Error loading categories', e); }
    };

    const fetchTypes = async (silent = false) => {
        if (!silent) setLoading(true);
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
            if (!silent) setLoading(false);
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over) return;
        
        if (active.id !== over.id) {
            // Find the moved item
            const movedItem = types.find(t => t.asset_type_id === active.id);
            if (!movedItem) return;

            // 1. Get all items in this group
            // We use the current state 'types' as the source of truth
            const groupItems = types
                .filter(i => i.asset_category_id === movedItem.asset_category_id || (movedItem.asset_category_id === null && i.asset_category_id === null))
                .sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0));

            const oldIndex = groupItems.findIndex((i) => i.asset_type_id === active.id);
            const newIndex = groupItems.findIndex((i) => i.asset_type_id === over.id);
            
            if (oldIndex === -1 || newIndex === -1) return;

            // 2. Create a NEW array for the group with the new order
            const reorderedGroup = arrayMove(groupItems, oldIndex, newIndex);
            
            // 3. Prepare updates with new sort_order
            const updates = reorderedGroup.map((item, index) => ({
                id: item.asset_type_id,
                sort_order: index
            }));

            // 4. Update local state optimistically WITHOUT mutating original objects
            setTypes(prevTypes => {
                return prevTypes.map(t => {
                    const update = updates.find(u => u.id === t.asset_type_id);
                    if (update) {
                        return { ...t, sort_order: update.sort_order };
                    }
                    return t;
                });
            });

            try {
                const res = await fetch('/api/assets/types/reorder', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token,
                        'X-Auth-Token': token
                    },
                    body: JSON.stringify(updates)
                });

                if (!res.ok) {
                    const err = await res.json();
                    notify('Failed to save order: ' + (err.error || 'Unknown error'), 'error');
                }
            } catch (e) {
                notify('Error saving order', 'error');
            }
        }
    };
const handleEdit = (type) => {
    setFormData({
        asset_type_id: type.asset_type_id,
        name: type.name,
        description: type.description || '',
        base_hire_cost: type.base_hire_cost || 0,
        full_event_cost: type.full_event_cost || 0,
        show_daily_cost: type.show_daily_cost !== undefined ? type.show_daily_cost : true,
        show_full_event_cost: type.show_full_event_cost || false,
        image_url: type.image_url || '',
        event_id: type.event_id || (events.length > 0 ? events[0].event_id : ''),
        asset_category_id: type.asset_category_id || ''
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
        full_event_cost: '',
        show_daily_cost: true,
        show_full_event_cost: false,
        image_url: '',
        event_id: events.length > 0 ? events[0].event_id : '',
        asset_category_id: ''
    });
    setEditMode(false);
    setShowModal(true);
};

const handleDelete = async (id) => {
    confirm('Are you sure you want to delete this asset type?', async () => {
        try {
            const res = await fetch(`/api/assets/types/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
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
                'Authorization': `Bearer ${token}`,
                'X-Auth-Token': token
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

const groupedTypes = () => {
    const groups = {};

    // Initialize groups from categories to ensure empty categories show (optional, but good for Dnd targets maybe?)
    // For now let's just use what we have in types + categories

    categories.forEach(c => {
        groups[c.asset_category_id] = { name: c.name, items: [] };
    });
    groups['uncategorized'] = { name: 'Uncategorized', items: [] };

    types.forEach(type => {
        if (type.asset_category_id && groups[type.asset_category_id]) {
            groups[type.asset_category_id].items.push(type);
        } else {
            groups['uncategorized'].items.push(type);
        }
    });

    // Convert to array for rendering
    const result = [];
    categories.forEach(c => {
        if (groups[c.asset_category_id]) { groups[c.asset_category_id].items.sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)); result.push({ id: c.asset_category_id, ...groups[c.asset_category_id] }); }
    });
    if (groups['uncategorized'].items.length > 0) {
        groups['uncategorized'].items.sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)); result.push({ id: 'uncategorized', ...groups['uncategorized'] });
    }

    return result;
};

if (loading) return <div>Loading...</div>;

const renderHeader = () => (
    <thead className="bg-gray-100 border-b border-gray-200">
        <tr>
            <th className="p-3 w-10"></th>
            <th className="p-3">Image</th>
            <th className="p-3">Name</th>
            <th className="p-3">Cost ($)</th>
            <th className="p-3">Inventory</th>
            <th className="p-3">Actions</th>
        </tr>
    </thead>
);

return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Asset Types</h2>
            <div className="flex gap-2">
                <button onClick={() => setShowCategoryManager(true)} className="bg-white border border-gray-300 px-4 py-2 rounded shadow-sm hover:bg-gray-50">Manage Categories</button>
                <button onClick={handleCreate} className="bg-black text-white px-4 py-2 rounded">+ New Type</button>
            </div>
        </div>

        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            {groupedTypes().map(group => (
                <div key={group.id} className="mb-8">
                    <h3 className="text-lg font-bold mb-2 border-b pb-1 text-gray-700">{group.name}</h3>
                    <table className="w-full text-left border-collapse">
                        {renderHeader()}
                        <tbody className="bg-white">
                            <SortableContext
                                items={group.items.map(t => t.asset_type_id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {group.items.map(type => (
                                    <SortableRow
                                        key={type.asset_type_id}
                                        type={type}
                                        onEdit={() => handleEdit(type)}
                                        onDelete={() => handleDelete(type.asset_type_id)}
                                    />
                                ))}
                                {group.items.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-4 text-center text-gray-400 text-sm">No assets in this category</td>
                                    </tr>
                                )}
                            </SortableContext>
                        </tbody>
                    </table>
                </div>
            ))}
        </DndContext>

        {types.length === 0 && categories.length === 0 && (
            <div className="p-8 text-center text-gray-500 border rounded bg-gray-50">
                No Asset Types or Categories found. Create one to get started.
            </div>
        )}

        {showCategoryManager && (
            <AssetCategoryManager
                eventId={formData.event_id}
                onClose={() => setShowCategoryManager(false)}
                onUpdate={() => {
                    fetchCategories(formData.event_id);
                    fetchTypes(true); // Silent reload to avoid flashing
                }}
            />
        )}

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
                        <div className="mb-4 grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Daily Hire Cost ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full border border-gray-300 rounded p-2"
                                    value={formData.base_hire_cost}
                                    onChange={e => setFormData({ ...formData, base_hire_cost: e.target.value })}
                                />
                                <div className="mt-1 flex items-center">
                                    <input
                                        type="checkbox"
                                        id="showDaily"
                                        className="mr-2"
                                        checked={formData.show_daily_cost !== false} // Default true
                                        onChange={e => setFormData({ ...formData, show_daily_cost: e.target.checked })}
                                    />
                                    <label htmlFor="showDaily" className="text-sm text-gray-600">Enable Daily Hire</label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Full Event Cost ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full border border-gray-300 rounded p-2"
                                    value={formData.full_event_cost || ''}
                                    onChange={e => setFormData({ ...formData, full_event_cost: e.target.value })}
                                    placeholder="Optional"
                                />
                                <div className="mt-1 flex items-center">
                                    <input
                                        type="checkbox"
                                        id="showFull"
                                        className="mr-2"
                                        checked={formData.show_full_event_cost === true} // Default false
                                        onChange={e => setFormData({ ...formData, show_full_event_cost: e.target.checked })}
                                    />
                                    <label htmlFor="showFull" className="text-sm text-gray-600">Enable Full Event Pkg</label>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <select
                                className="w-full border border-gray-300 rounded p-2"
                                value={formData.asset_category_id}
                                onChange={e => setFormData({ ...formData, asset_category_id: e.target.value })}
                            >
                                <option value="">Uncategorized</option>
                                {categories.map(cat => (
                                    <option key={cat.asset_category_id} value={cat.asset_category_id}>{cat.name}</option>
                                ))}
                            </select>
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

function SortableRow({ type, onEdit, onDelete }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: type.asset_type_id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        position: 'relative',
        backgroundColor: isDragging ? '#f9fafb' : undefined,
        boxShadow: isDragging ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : undefined
    };

    return (
        <tr ref={setNodeRef} style={style} className="border-b border-gray-100 hover:bg-gray-50 bg-white">
            <td className="p-3 text-center cursor-grab text-gray-400 hover:text-gray-600" {...attributes} {...listeners}>
                ☰
            </td>
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
            <td className="p-3">
                <div>
                    {type.show_daily_cost && <div className="text-sm">Daily: ${typeof type.base_hire_cost === 'number' ? type.base_hire_cost.toFixed(2) : type.base_hire_cost}</div>}
                    {type.show_full_event_cost && <div className="text-sm">Full: ${typeof type.full_event_cost === 'number' ? type.full_event_cost.toFixed(2) : type.full_event_cost}</div>}
                    {!type.show_daily_cost && !type.show_full_event_cost && <span className="text-red-500 text-xs">No Pricing</span>}
                </div>
            </td>
            <td className="p-3">
                <span className={`px-2 py-1 rounded text-xs ${type.total_items > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {type.active_items} Active / {type.total_items} Total
                </span>
            </td>
            <td className="p-3">
                <button onClick={onEdit} className="text-blue-600 hover:underline mr-3">Edit</button>
                <button onClick={onDelete} className="text-red-600 hover:underline">Delete</button>
            </td>
        </tr>
    );
}

export default AssetTypes;
