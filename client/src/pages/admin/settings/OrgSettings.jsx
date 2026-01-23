import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';

function OrgSettings({ refreshSettings }) {
    const { token } = useAuth();
    const { notify } = useNotification();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    const [formData, setFormData] = useState({
        organization_name: '',
        support_email: '',
        primary_color: '#000000',
        secondary_color: '#ffffff',
        accent_color: '#ffd700',
        logo_url: '',
        bank_name: '',
        bank_account_name: '',
        bank_bsb: '',
        bank_account_number: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/getOrganization');
            if (!res.ok) throw new Error('Failed to load settings');
            const data = await res.json();
            setFormData({
                organization_name: data.organization_name || '',
                support_email: data.support_email || '',
                primary_color: data.primary_color || '#000000',
                secondary_color: data.secondary_color || '#ffffff',
                accent_color: data.accent_color || '#ffd700',
                logo_url: data.logo_url || '',
                bank_name: data.bank_name || '',
                bank_account_name: data.bank_account_name || '',
                bank_bsb: data.bank_bsb || '',
                bank_account_number: data.bank_account_number || ''
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            setSaving(true);
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: uploadData,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                }
            });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            setFormData(prev => ({ ...prev, logo_url: data.url }));
        } catch (err) {
            notify('Image upload failed: ' + err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccessMsg('');

        try {
            const res = await fetch('/api/organization/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to update settings');
            }

            setSuccessMsg('Settings updated successfully!');

            if (refreshSettings) {
                await refreshSettings();
            } else {
                // Fallback if no refresher (shouldn't happen)
                console.warn("No refreshSettings function provided");
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="card" style={{ padding: '2rem' }}>
            <h2 className="text-xl font-bold mb-4">Organization Settings</h2>

            {error && <div className="error mb-4">{error}</div>}
            {successMsg && <div className="success mb-4 text-green-600 font-bold">{successMsg}</div>}

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block mb-2 font-medium">Organization Name</label>
                        <input
                            type="text"
                            name="organization_name"
                            value={formData.organization_name}
                            onChange={handleChange}
                            className="form-control w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-2 font-medium">Support Email</label>
                        <input
                            type="email"
                            name="support_email"
                            value={formData.support_email}
                            onChange={handleChange}
                            className="form-control w-full p-2 border rounded"
                            required
                        />
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="font-bold mb-3">Branding & Colors</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block mb-2 text-sm">Primary Color (Header/Actions)</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    name="primary_color"
                                    value={formData.primary_color}
                                    onChange={handleChange}
                                    className="h-10 w-20 cursor-pointer border rounded"
                                />
                                <span className="text-sm font-mono">{formData.primary_color}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block mb-2 text-sm">Secondary Color (Text/Contrast)</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    name="secondary_color"
                                    value={formData.secondary_color}
                                    onChange={handleChange}
                                    className="h-10 w-20 cursor-pointer border rounded"
                                />
                                <span className="text-sm font-mono">{formData.secondary_color}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block mb-2 text-sm">Accent Color (Highlights)</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    name="accent_color"
                                    value={formData.accent_color}
                                    onChange={handleChange}
                                    className="h-10 w-20 cursor-pointer border rounded"
                                />
                                <span className="text-sm font-mono">{formData.accent_color}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block mb-2 font-medium">Organization Logo</label>
                    <div className="flex items-center gap-4 border p-4 rounded bg-gray-50">
                        {formData.logo_url ? (
                            <img src={formData.logo_url} alt="Logo" className="h-16 w-auto object-contain border bg-white" />
                        ) : (
                            <div className="h-16 w-32 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">No Logo</div>
                        )}
                        <div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-secondary hover:file:bg-primary/90"
                            />
                            <p className="text-xs text-gray-500 mt-1">Recommended size: 200x60px (PNG/SVG/JPG)</p>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="font-bold mb-3">Bank Details (For Invoicing)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block mb-2 font-medium">Bank Name</label>
                            <input
                                type="text"
                                name="bank_name"
                                value={formData.bank_name}
                                onChange={handleChange}
                                placeholder="e.g. Commonwealth Bank"
                                className="form-control w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block mb-2 font-medium">Account Name</label>
                            <input
                                type="text"
                                name="bank_account_name"
                                value={formData.bank_account_name}
                                onChange={handleChange}
                                placeholder={formData.organization_name || "e.g. AERO Project Inc."}
                                className="form-control w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block mb-2 font-medium">BSB</label>
                            <input
                                type="text"
                                name="bank_bsb"
                                value={formData.bank_bsb}
                                onChange={handleChange}
                                placeholder="e.g. 064-001"
                                className="form-control w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block mb-2 font-medium">Account Number</label>
                            <input
                                type="text"
                                name="bank_account_number"
                                value={formData.bank_account_number}
                                onChange={handleChange}
                                placeholder="e.g. 1002 3456"
                                className="form-control w-full p-2 border rounded"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="bg-primary text-secondary px-6 py-2 rounded font-bold hover:brightness-110 transition-all"
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default OrgSettings;
