import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';

function AssetHires() {
    const { token } = useAuth();
    const { notify, confirm } = useNotification();
    const [hires, setHires] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchHires();
    }, []);

    const fetchHires = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/assets/hires');
            if (res.ok) {
                const data = await res.json();
                setHires(data);
            }
        } catch (e) { notify('Error loading hires', 'error'); }
        finally { setLoading(false); }
    };

    const handleSeedTestData = async () => {
        confirm('Generate a test hire record? This requires at least one active Asset Item and one existing Order.', async () => {
            // 1. Get an item
            const itemRes = await fetch('/api/assets/items');
            const items = await itemRes.json();
            if (items.length === 0) { notify('No asset items found to hire.', 'error'); return; }
            const randomItem = items[0]; // Just pick first

            // 2. We need a valid order_item_id. Ideally we query DB, but for quick hack we might guess or need an endpoint.
            // Let's assume there is at least one order_item in the DB.
            // I'll skip the 'fetch orders' step for simplicity and rely on user having data OR fail gracefully.
            // Actually, let's try to fetch orders to get a valid ID.
            const ordersRes = await fetch('/api/orders/all', { headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token } });
            if (!ordersRes.ok) { notify('Could not fetch orders to link hire to.', 'error'); return; }
            const orders = await ordersRes.json();
            if (orders.length === 0) { notify('No orders found.', 'error'); return; }

            // We need an *order_item_id*. "orders" usually returns order-level info.
            // We might need to fetch details of an order.
            const orderId = orders[0].order_id;
            const detailRes = await fetch(`/api/orders/${orderId}`, { headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token } });
            const orderDetail = await detailRes.json();

            if (!orderDetail.items || orderDetail.items.length === 0) { notify('Chosen order has no items.', 'error'); return; }
            const randomOrderItem = orderDetail.items[0];

            // 3. Create Hire
            try {
                const res = await fetch('/api/assets/hires', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'X-Auth-Token': token
                    },
                    body: JSON.stringify({
                        asset_item_id: randomItem.asset_item_id,
                        order_item_id: randomOrderItem.order_item_id,
                        start_date: new Date().toISOString(),
                        end_date: new Date(Date.now() + 86400000).toISOString() // +1 day
                    })
                });
                if (res.ok) {
                    notify('Test Hire created!', 'success');
                    fetchHires();
                } else {
                    notify('Failed to create test hire', 'error');
                }
            } catch (e) { notify('Error creating hire', 'error'); }
        });
    };

    if (loading) return <div>Loading hires...</div>;

    return (
        <div>
            <div className="flex justify-between mb-4">
                <h2 className="text-xl font-bold">Current Hires</h2>
                <button onClick={handleSeedTestData} className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">
                    + Seed Test Data
                </button>
            </div>

            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-100 border-b">
                        <th className="p-3">Asset</th>
                        <th className="p-3">Hirer / Order</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {hires.map(hire => (
                        <tr key={hire.asset_hire_id} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                                <div className="font-bold">{hire.asset_type_name}</div>
                                <div className="text-sm text-gray-500">{hire.identifier}</div>
                            </td>
                            <td className="p-3">
                                <div className="font-medium">{hire.hirer_name || 'Guest'}</div>
                                <div className="text-xs text-blue-600">Order #{hire.order_id}</div>
                            </td>
                            <td className="p-3">
                                <div className="text-sm">
                                    {new Date(hire.hire_start_date).toLocaleDateString()} - {new Date(hire.hire_end_date).toLocaleDateString()}
                                </div>
                            </td>
                            <td className="p-3">
                                {hire.returned_at ? (
                                    <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">Returned</span>
                                ) : (
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Active</span>
                                )}
                            </td>
                        </tr>
                    ))}
                    {hires.length === 0 && (
                        <tr>
                            <td colSpan="4" className="p-8 text-center text-gray-500">
                                No active hires. Use "Seed Test Data" to test.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default AssetHires;
