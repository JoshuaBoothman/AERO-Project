import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

function SupplierList() {
    const { token } = useAuth();
    const { notify } = useNotification();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        contact_name: '',
        phone: '',
        email: '',
        is_active: true
    });

    const fetchSuppliers = useCallback(async () => {
        try {
            const res = await fetch('/api/suppliers', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                }
            });
            if (res.ok) {
                const data = await res.json();
                setSuppliers(data);
            } else {
                notify('Failed to load suppliers', 'error');
            }
        } catch (e) {
            console.error(e);
            notify('Error loading suppliers', 'error');
        } finally {
            setLoading(false);
        }
    }, [token, notify]);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const handleEdit = (supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            name: supplier.name,
            contact_name: supplier.contact_name || '',
            phone: supplier.phone || '',
            email: supplier.email || '',
            is_active: supplier.is_active
        });
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingSupplier(null);
        setFormData({
            name: '',
            contact_name: '',
            phone: '',
            email: '',
            is_active: true
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingSupplier
            ? `/api/suppliers/${editingSupplier.supplier_id}`
            : '/api/suppliers';
        const method = editingSupplier ? 'PUT' : 'POST';

        try {
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
                notify(editingSupplier ? 'Supplier updated' : 'Supplier created', 'success');
                setIsModalOpen(false);
                fetchSuppliers();
            } else {
                const data = await res.json();
                notify(data.error || 'Operation failed', 'error');
            }
        } catch (e) {
            console.error(e);
            notify('Error saving supplier', 'error');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <Link to="/admin/merchandise">← Back to Merchandise</Link>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', marginTop: '10px' }}>
                <h1 style={{ margin: 0 }}>Supplier Management</h1>
                <button
                    onClick={handleCreate}
                    style={{ background: 'black', color: 'white', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', border: 'none' }}
                >
                    + New Supplier
                </button>
            </div>

            <div style={{ overflowX: 'auto', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f5f5f5' }}>
                        <tr>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Name</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Contact</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Phone</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Email</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>Active</th>
                            <th style={{ padding: '15px', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.map(s => (
                            <tr key={s.supplier_id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '15px', fontWeight: 'bold' }}>{s.name}</td>
                                <td style={{ padding: '15px' }}>{s.contact_name}</td>
                                <td style={{ padding: '15px' }}>{s.phone}</td>
                                <td style={{ padding: '15px' }}>{s.email}</td>
                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                    {s.is_active ?
                                        <span style={{ color: 'green', background: '#e8f5e9', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>Active</span> :
                                        <span style={{ color: 'red', background: '#ffebee', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>Inactive</span>
                                    }
                                </td>
                                <td style={{ padding: '15px', textAlign: 'right' }}>
                                    <button
                                        onClick={() => handleEdit(s)}
                                        style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {suppliers.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#666' }}>No suppliers found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <form onSubmit={handleSubmit} style={{ background: 'white', padding: '30px', borderRadius: '8px', width: '500px', maxWidth: '90%' }}>
                        <h2>{editingSupplier ? 'Edit Supplier' : 'New Supplier'}</h2>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Company Name *</label>
                            <input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                required
                                autoFocus
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Contact Person</label>
                            <input
                                value={formData.contact_name}
                                onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Phone</label>
                                <input
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                Active Supplier
                            </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #ddd', cursor: 'pointer', borderRadius: '4px' }}>Cancel</button>
                            <button type="submit" style={{ padding: '8px 16px', background: 'black', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
                                {editingSupplier ? 'Save Changes' : 'Create Supplier'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default SupplierList;
