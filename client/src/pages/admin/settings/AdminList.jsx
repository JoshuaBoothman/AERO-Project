import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import AdminModal from './AdminModal';

function AdminList() {
    const { user, token } = useAuth(); // Logged in user info
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/manage/admins', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to load admins');
            const data = await res.json();
            setAdmins(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedAdmin(null); // Clear selection for new
        setIsModalOpen(true);
    };

    const handleEdit = (admin) => {
        setSelectedAdmin(admin);
        setIsModalOpen(true);
    };

    const handleDelete = async (adminId) => {
        if (!window.confirm('Are you sure you want to delete this admin? This action cannot be undone.')) return;

        try {
            const res = await fetch(`/api/manage/admins/${adminId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to delete admin');
            }

            setAdmins(prev => prev.filter(a => a.admin_user_id !== adminId));
        } catch (err) {
            alert(err.message);
        }
    };

    const handleSave = (savedAdmin) => {
        if (selectedAdmin) {
            // Update list
            setAdmins(prev => prev.map(a => a.admin_user_id === savedAdmin.admin_user_id ? savedAdmin : a));
        } else {
            // Add new
            setAdmins(prev => [savedAdmin, ...prev]);
        }
        setIsModalOpen(false);
    };

    if (loading) return <div>Loading admins...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="card" style={{ padding: '2rem' }}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Admin Users</h2>
                <button
                    onClick={handleCreate}
                    className="bg-primary text-secondary px-4 py-2 rounded font-bold text-sm hover:brightness-110 transition-all"
                >
                    + Add Admin
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b">
                            <th className="py-2 px-3 font-semibold text-gray-600">Name</th>
                            <th className="py-2 px-3 font-semibold text-gray-600">Email</th>
                            <th className="py-2 px-3 font-semibold text-gray-600">Role</th>
                            <th className="py-2 px-3 font-semibold text-gray-600">Status</th>
                            <th className="py-2 px-3 font-semibold text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {admins.map(admin => (
                            <tr key={admin.admin_user_id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-3">
                                    <div className="font-bold text-gray-800">{admin.first_name} {admin.last_name}</div>
                                </td>
                                <td className="py-3 px-3 text-gray-600">{admin.email}</td>
                                <td className="py-3 px-3">
                                    <span className="bg-gray-200 text-gray-700 py-1 px-2 rounded text-xs font-bold uppercase">
                                        {admin.role}
                                    </span>
                                </td>
                                <td className="py-3 px-3">
                                    {admin.is_active ? (
                                        <span className="text-green-600 font-bold text-xs">Active</span>
                                    ) : (
                                        <span className="text-red-500 font-bold text-xs">Inactive</span>
                                    )}
                                </td>
                                <td className="py-3 px-3 text-right">
                                    <button
                                        onClick={() => handleEdit(admin)}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-semibold mr-3"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(admin.admin_user_id)}
                                        className={`text-sm font-semibold ${admin.admin_user_id === user?.id ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-800'}`}
                                        disabled={admin.admin_user_id === user?.id}
                                        title={admin.admin_user_id === user?.id ? "You cannot delete yourself" : "Delete Admin"}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <AdminModal
                    admin={selectedAdmin}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}

export default AdminList;
