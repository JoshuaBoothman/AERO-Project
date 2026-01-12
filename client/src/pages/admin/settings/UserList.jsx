import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';

function UserList() {
    const { token } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/manage/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                }
            });
            if (!res.ok) throw new Error('Failed to load users');
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleLock = async (user) => {
        const newStatus = !user.is_locked;
        const confirmMsg = newStatus
            ? `Are you sure you want to LOCK ${user.email}? They will not be able to log in.`
            : `Are you sure you want to UNLOCK ${user.email}?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            const res = await fetch(`/api/manage/users/${user.user_id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify({ is_locked: newStatus })
            });

            if (!res.ok) throw new Error('Failed to update status');

            // Optimistic update
            setUsers(prev => prev.map(u =>
                u.user_id === user.user_id ? { ...u, is_locked: newStatus } : u
            ));

        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div className="p-8">Loading users...</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;

    return (
        <div className="card" style={{ padding: '2rem' }}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Registered Users</h2>
                <div className="text-sm text-gray-500">
                    Total: {users.length}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b">
                            <th className="py-2 px-3 font-semibold text-gray-600">Name</th>
                            <th className="py-2 px-3 font-semibold text-gray-600">Email</th>
                            <th className="py-2 px-3 font-semibold text-gray-600">Verified</th>
                            <th className="py-2 px-3 font-semibold text-gray-600">Status</th>
                            <th className="py-2 px-3 font-semibold text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.user_id} className={`border-b hover:bg-gray-50 ${user.is_locked ? 'bg-red-50' : ''}`}>
                                <td className="py-3 px-3">
                                    <div className="font-bold text-gray-800">{user.first_name} {user.last_name}</div>
                                </td>
                                <td className="py-3 px-3 text-gray-600">{user.email}</td>
                                <td className="py-3 px-3">
                                    {user.is_email_verified ? (
                                        <span className="text-green-600 text-xs font-bold uppercase border border-green-200 bg-green-50 px-2 py-1 rounded">Yes</span>
                                    ) : (
                                        <span className="text-orange-500 text-xs font-bold uppercase border border-orange-200 bg-orange-50 px-2 py-1 rounded">Pending</span>
                                    )}
                                </td>
                                <td className="py-3 px-3">
                                    {user.is_locked ? (
                                        <span className="text-red-600 font-bold text-sm">LOCKED</span>
                                    ) : (
                                        <span className="text-green-600 font-bold text-sm">Active</span>
                                    )}
                                </td>
                                <td className="py-3 px-3 text-right">
                                    <button
                                        onClick={() => toggleLock(user)}
                                        className={`text-sm font-semibold px-3 py-1 rounded border transition-colors ${user.is_locked
                                                ? 'border-gray-300 text-gray-700 hover:bg-gray-100'
                                                : 'border-red-200 text-red-600 hover:bg-red-50'
                                            }`}
                                    >
                                        {user.is_locked ? 'Unlock' : 'Lock Account'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan="5" className="py-8 text-center text-gray-400 italic">
                                    No registered users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default UserList;
