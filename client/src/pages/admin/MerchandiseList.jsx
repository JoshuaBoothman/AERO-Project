import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function MerchandiseList() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProductName, setNewProductName] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

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
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newProductName })
            });
            if (res.ok) {
                const data = await res.json();
                navigate(`/admin/merchandise/${data.product_id}`);
            } else {
                alert('Failed to create product');
            }
        } catch (e) {
            alert('Error creating product');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ margin: 0 }}>Merchandise</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{ background: 'black', color: 'white', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', border: 'none' }}
                >
                    + New Product
                </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <thead style={{ background: '#f5f5f5' }}>
                        <tr>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Image</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Name</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>Variants</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>SKUs</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>Total Stock</th>
                            <th style={{ padding: '15px', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.product_id} style={{ borderBottom: '1px solid #eee' }}>
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
                                    {!p.is_active && <span style={{ marginLeft: '10px', fontSize: '0.8rem', background: '#ccc', padding: '2px 6px', borderRadius: '4px' }}>Draft</span>}
                                </td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>{p.variant_count}</td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>{p.sku_count}</td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>{p.total_stock || 0}</td>
                                <td style={{ padding: '10px', textAlign: 'right' }}>
                                    <Link to={`/admin/merchandise/${p.product_id}`} style={{ color: 'blue', textDecoration: 'none', marginRight: '10px' }}>Edit</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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

export default MerchandiseList;
