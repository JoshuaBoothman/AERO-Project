import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function MerchandiseList() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const { notify } = useNotification();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProductName, setNewProductName] = useState('');
    const [showArchived, setShowArchived] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setProducts((items) => {
                const oldIndex = items.findIndex((i) => i.product_id === active.id);
                const newIndex = items.findIndex((i) => i.product_id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Prepare API update
                // We need to send ALL items with their new order index
                const updates = newItems.map((item, index) => ({
                    id: item.product_id,
                    sort_order: index
                }));

                // Call API in background
                fetch('/api/manage/products/reorder', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'X-Auth-Token': token
                    },
                    body: JSON.stringify({ items: updates })
                })
                    .then(async res => {
                        if (!res.ok) {
                            const errData = await res.json();
                            throw new Error(errData.error || 'Failed to save');
                        }
                        notify("Order saved", "success");
                    })
                    .catch(err => {
                        console.error("Failed to save order", err);
                        notify("Failed to save new order: " + err.message, "error");
                        // Revert? For now just notify.
                    });

                return newItems;
            });
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products');
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify({ name: newProductName })
            });
            if (res.ok) {
                const data = await res.json();
                navigate(`/admin/merchandise/${data.product_id}`);
            } else {
                notify('Failed to create product', 'error');
            }
        } catch (e) {
            notify('Error creating product', 'error');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ margin: 0 }}>Merchandise</h1>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={showArchived}
                            onChange={(e) => setShowArchived(e.target.checked)}
                        />
                        Show Archived
                    </label>
                    <Link to="/admin/suppliers" style={{ background: '#2196F3', color: 'white', padding: '10px 20px', borderRadius: '4px', textDecoration: 'none', display: 'inline-block' }}>
                        Suppliers
                    </Link>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        style={{ background: 'black', color: 'white', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', border: 'none' }}
                    >
                        + New Product
                    </button>
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <thead style={{ background: '#f5f5f5' }}>
                            <tr>
                                <th style={{ padding: '15px', width: '40px' }}></th>
                                <th style={{ padding: '15px', textAlign: 'left' }}>Image</th>
                                <th style={{ padding: '15px', textAlign: 'left' }}>Name</th>
                                <th style={{ padding: '15px', textAlign: 'center' }}>Variants</th>
                                <th style={{ padding: '15px', textAlign: 'center' }}>SKUs</th>
                                <th style={{ padding: '15px', textAlign: 'center' }}>Total Stock</th>
                                <th style={{ padding: '15px', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <SortableContext items={products.map(p => p.product_id)} strategy={verticalListSortingStrategy}>
                                {products
                                    .filter(p => showArchived ? true : p.is_active)
                                    .map(p => (
                                        <SortableRow key={p.product_id} p={p} />
                                    ))}
                            </SortableContext>
                        </tbody>
                    </table>
                </DndContext>
                {products.length === 0 && <p style={{ textAlign: 'center', marginTop: '20px' }}>No products found.</p>}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <form onSubmit={handleCreate} style={{ background: 'white', padding: '30px', borderRadius: '8px', width: '400px' }}>
                        <h2>New Product</h2>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Product Name</label>
                            <input
                                autoFocus
                                value={newProductName}
                                onChange={e => setNewProductName(e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #ddd', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" style={{ padding: '8px 16px', background: 'black', color: 'white', border: 'none', cursor: 'pointer' }}>Create</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

// Separate Component for Sortable Row to avoid Hooks errors in loop
function SortableRow({ p }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: p.product_id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        background: isDragging ? '#f0f0f0' : 'white',
        zIndex: isDragging ? 2 : 1,
        position: 'relative'
    };

    return (
        <tr ref={setNodeRef} style={{ borderBottom: '1px solid #eee', ...style }}>
            <td style={{ padding: '10px', width: '40px', cursor: 'grab' }} {...attributes} {...listeners}>
                {/* Drag Handle Icon */}
                <div style={{ color: '#aaa', display: 'flex', justifyContent: 'center' }}>
                    ☰
                </div>
            </td>
            <td style={{ padding: '10px' }}>
                {p.base_image_url ? (
                    <img src={p.base_image_url} alt={p.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                ) : (
                    <div style={{ width: '50px', height: '50px', background: '#eee', borderRadius: '4px' }}></div>
                )}
            </td>
            <td style={{ padding: '10px', fontWeight: 'bold' }}>
                <Link to={`/admin/merchandise/${p.product_id}`} style={{ color: 'black', textDecoration: 'none' }}>
                    {p.name}
                </Link>
                {!p.is_active && <span style={{ marginLeft: '10px', fontSize: '0.8rem', background: '#ccc', padding: '2px 6px', borderRadius: '4px' }}>Archived</span>}
            </td>
            <td style={{ padding: '10px', textAlign: 'center' }}>{p.variant_count}</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>{p.sku_count}</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>{p.total_stock || 0}</td>
            <td style={{ padding: '10px', textAlign: 'right' }}>
                <Link to={`/admin/merchandise/${p.product_id}`} style={{ color: 'blue', textDecoration: 'none', marginRight: '10px' }}>Edit</Link>
            </td>
        </tr>
    );
}

export default MerchandiseList;
