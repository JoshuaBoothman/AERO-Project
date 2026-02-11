import { useState, useEffect } from 'react';
import { useNotification } from '../../../context/NotificationContext';
import { formatDateForDisplay } from '../../../utils/dateHelpers';

function AssetHires() {
    const { notify } = useNotification();
    const [hires, setHires] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchHires();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchHires = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/assets/hires');
            if (res.ok) {
                const data = await res.json();
                setHires(data);
            }
        } catch (_e) { notify('Error loading hires', 'error'); }
        finally { setLoading(false); }
    };


    const filteredHires = hires.filter(hire => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = !term ||
            (hire.asset_type_name || '').toLowerCase().includes(term) ||
            (hire.hirer_name || '').toLowerCase().includes(term) ||
            (hire.order_id || '').toString().includes(searchTerm);

        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && !hire.returned_at) ||
            (statusFilter === 'returned' && hire.returned_at);

        return matchesSearch && matchesStatus;
    });

    if (loading) return <div>Loading hires...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Current Hires</h2>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Search by asset, hirer, or order #..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="returned">Returned</option>
                </select>
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
                    {filteredHires.map(hire => (
                        <tr key={hire.asset_hire_id} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                                <div className="font-bold">{hire.asset_type_name}</div>
                                {hire.identifier ? (
                                    <div className="text-sm text-gray-500">{hire.identifier}</div>
                                ) : (
                                    <div className="text-xs text-gray-400 italic">Pooled Assignment</div>
                                )}
                            </td>
                            <td className="p-3">
                                <div className="font-medium">{hire.hirer_name || 'Guest'}</div>
                                <div className="text-xs text-blue-600">Order #{hire.order_id}</div>
                            </td>
                            <td className="p-3">
                                <div className="text-sm">
                                    {formatDateForDisplay(hire.hire_start_date)} - {formatDateForDisplay(hire.hire_end_date)}
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
                    {filteredHires.length === 0 && (
                        <tr>
                            <td colSpan="4" className="p-8 text-center text-gray-500">
                                {hires.length === 0
                                    ? 'No active hires found.'
                                    : 'No hires match your search or filter.'}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default AssetHires;
