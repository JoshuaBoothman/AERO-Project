import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';

function AdminModal({ admin, onClose, onSave }) {
    const { token } = useAuth();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        role: 'admin',
        password: '',
        is_active: true
    });

    useEffect(() => {
        if (admin) {
            setForm({
                first_name: admin.first_name,
                last_name: admin.last_name,
                email: admin.email,
                role: admin.role,
                password: '', // Keep clean for security, only send if changing
                is_active: admin.is_active
            });
        }
    }, [admin]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const isEdit = !!admin;
        const url = isEdit ? `/api/manage/admins/${admin.admin_user_id}` : '/api/manage/admins';
        const method = isEdit ? 'PUT' : 'POST';

        // Filter out empty password if editing
        const body = { ...form };
        if (isEdit && !body.password) {
            delete body.password;
        }

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Save failed');
            }

            const savedData = await res.json();
            onSave(savedData);

        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl font-bold"
                >
                    ×
                </button>

                <h3 className="text-xl font-bold mb-4">{admin ? 'Edit Admin' : 'New Admin'}</h3>

                {error && <div className="mb-4 text-red-600 bg-red-50 p-2 rounded text-sm">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">First Name</label>
                            <input
                                name="first_name" required
                                value={form.first_name} onChange={handleChange}
                                className="w-full border rounded p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Last Name</label>
                            <input
                                name="last_name" required
                                value={form.last_name} onChange={handleChange}
                                className="w-full border rounded p-2"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email" name="email" required
                            value={form.email} onChange={handleChange}
                            className="w-full border rounded p-2"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                            Password {admin && <span className="text-gray-400 font-normal">(Leave blank to keep current)</span>}
                        </label>
                        <input
                            type="password" name="password"
                            required={!admin} // Required only for new admins
                            value={form.password} onChange={handleChange}
                            className="w-full border rounded p-2"
                            placeholder={admin ? "••••••••" : ""}
                        />
                    </div>

                    <div className="mb-6 flex gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Role</label>
                            <select
                                name="role" value={form.role} onChange={handleChange}
                                className="border rounded p-2 bg-white"
                            >
                                <option value="admin">Admin</option>
                                <option value="super_admin">Super Admin</option>
                            </select>
                        </div>

                        <div className="flex items-center pt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox" name="is_active"
                                    checked={form.is_active} onChange={handleChange}
                                />
                                <span className="text-sm font-medium">Active Account</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button" onClick={onClose}
                            className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit" disabled={saving}
                            className="px-4 py-2 bg-primary text-secondary rounded font-bold hover:brightness-110"
                        >
                            {saving ? 'Saving...' : 'Save Admin'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AdminModal;
