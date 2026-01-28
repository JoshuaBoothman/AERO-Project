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

function AssetCategoryManager({ eventId, onClose, onUpdate }) {
    const { token } = useAuth();
    const { notify, confirm } = useNotification();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newCategoryName, setNewCategoryName] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (eventId) {
            fetchCategories();
        }
    }, [eventId]);

    const fetchCategories = async () => {
        try {
            const res = await fetch(`/api/assets/categories?eventId=${eventId}`);
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (e) {
            console.error('Failed to load categories', e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        try {
            const res = await fetch('/api/assets/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify({
                    event_id: eventId,
                    name: newCategoryName,
                    sort_order: categories.length + 1
                })
            });

            if (res.ok) {
                setNewCategoryName('');
                fetchCategories();
                notify('Category created', 'success');
                if (onUpdate) onUpdate();
            } else {
                notify('Failed to create category', 'error');
            }
        } catch (e) {
            notify('Error creating category', 'error');
        }
    };

    const handleDelete = (id) => {
        confirm('Are you sure? This will fail if the category contains assets.', async () => {
            try {
                const res = await fetch(`/api/assets/categories/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
                });

                if (res.ok) {
                    fetchCategories();
                    notify('Category deleted', 'success');
                    if (onUpdate) onUpdate();
                } else {
                    const err = await res.json();
                    notify(err.error || 'Delete failed', 'error');
                }
            } catch (e) {
                notify('Delete failed', 'error');
            }
        });
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {

            const oldIndex = categories.findIndex((i) => i.asset_category_id === active.id);
            const newIndex = categories.findIndex((i) => i.asset_category_id === over.id);

            if (oldIndex === -1 || newIndex === -1) return;

            const newItems = arrayMove(categories, oldIndex, newIndex);

            // Assign new sort order locally for UI stability if needed, 
            // but for categories we generally trust the array order.
            // However, let's update the sort_order property too.
            const updatedItems = newItems.map((item, index) => ({
                ...item,
                sort_order: index
            }));

            // Update State
            setCategories(updatedItems);

            // API Update
            const updates = updatedItems.map((item, index) => ({
                id: item.asset_category_id,
                sort_order: index
            }));

            try {
                const res = await fetch('/api/assets/categories/reorder', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'X-Auth-Token': token
                    },
                    body: JSON.stringify(updates)
                });

                if (res.ok) {
                    notify('Order saved', 'success');
                    if (onUpdate) onUpdate();
                } else {
                    notify('Failed to save order', 'error');
                }
            } catch (e) {
                notify('Failed to save order', 'error');
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Manage Categories</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                <div className="mb-4">
                    <form onSubmit={handleCreate} className="flex gap-2">
                        <input
                            className="flex-1 border border-gray-300 rounded p-2"
                            placeholder="New Category Name"
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                        />
                        <button type="submit" className="bg-black text-white px-4 py-2 rounded">Add</button>
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto min-h-[200px] border rounded p-2 bg-gray-50">
                    {loading ? <div className="p-4 text-center">Loading...</div> : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={categories.map(c => c.asset_category_id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-2">
                                    {categories.map(cat => (
                                        <SortableItem
                                            key={cat.asset_category_id}
                                            id={cat.asset_category_id}
                                            category={cat}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                    {categories.length === 0 && <p className="text-gray-400 text-center py-4">No categories yet.</p>}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}
                </div>

                <div className="mt-4 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">Close</button>
                </div>
            </div>
        </div>
    );
}

function SortableItem({ id, category, onDelete }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.8 : 1
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white p-3 rounded border shadow-sm flex items-center justify-between ${isDragging ? 'shadow-lg border-blue-500' : ''}`}
        >
            <div className="flex items-center gap-3 flex-1">
                <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600 px-1">
                    ☰
                </div>
                <span className="font-medium">{category.name}</span>
            </div>
            <button
                onClick={() => onDelete(id)}
                className="text-red-500 hover:text-red-700 text-sm px-2"
            >
                Delete
            </button>
        </div>
    );
}

export default AssetCategoryManager;
