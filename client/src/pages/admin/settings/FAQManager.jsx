import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { Edit, Trash2, Plus, Upload, X } from 'lucide-react';

function FAQManager() {
    const { token } = useAuth();
    const { notify, confirm } = useNotification();
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentFaq, setCurrentFaq] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        image_url: '',
        display_order: 0,
        is_active: true
    });

    useEffect(() => {
        fetchFaqs();
    }, []);

    const fetchFaqs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/manage/faqs', {
                headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setFaqs(data);
            } else {
                notify('Failed to load FAQs', 'error');
            }
        } catch (e) {
            notify('Error loading FAQs', 'error');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            question: '',
            answer: '',
            image_url: '',
            display_order: faqs.length > 0 ? Math.max(...faqs.map(f => f.display_order)) + 10 : 10,
            is_active: true
        });
        setCurrentFaq(null);
        setIsEditing(false);
    };

    const handleEdit = (faq) => {
        setCurrentFaq(faq);
        setFormData({
            question: faq.question,
            answer: faq.answer,
            image_url: faq.image_url || '',
            display_order: faq.display_order,
            is_active: faq.is_active
        });
        setIsEditing(true);
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id) => {
        confirm('Are you sure you want to delete this FAQ?', async () => {
            try {
                const res = await fetch(`/api/manage/faqs/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
                });
                if (res.ok) {
                    notify('FAQ deleted successfully', 'success');
                    fetchFaqs();
                } else {
                    notify('Failed to delete FAQ', 'error');
                }
            } catch (e) {
                notify('Error deleting FAQ', 'error');
            }
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: uploadData,
                headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setFormData(prev => ({ ...prev, image_url: data.url }));
                notify('Image uploaded', 'success');
            } else {
                notify('Upload failed', 'error');
            }
        } catch (e) {
            notify('Upload error', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const url = isEditing ? `/api/manage/faqs/${currentFaq.id}` : '/api/manage/faqs';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                notify(isEditing ? 'FAQ updated' : 'FAQ created', 'success');
                fetchFaqs();
                resetForm();
            } else {
                const data = await res.json();
                notify(data.error || 'Operation failed', 'error');
            }
        } catch (e) {
            notify('Error saving FAQ', 'error');
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{isEditing ? 'Edit FAQ' : 'Add New FAQ'}</h2>
                    {isEditing && (
                        <button onClick={resetForm} className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm">
                            <X size={16} /> Cancel Edit
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                                <input
                                    type="text"
                                    value={formData.question}
                                    onChange={e => setFormData({ ...formData, question: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                                    required
                                    placeholder="e.g., What time do gates open?"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                                <textarea
                                    value={formData.answer}
                                    onChange={e => setFormData({ ...formData, answer: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-accent focus:border-transparent outline-none min-h-[120px]"
                                    required
                                    placeholder="Enter the answer here..."
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                                <input
                                    type="number"
                                    value={formData.display_order}
                                    onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                                    className="w-full p-2 border border-gray-300 rounded"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-6">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="h-4 w-4 text-accent border-gray-300 rounded focus:ring-accent"
                                />
                                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 select-none">Active / Visible</label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image (Optional)</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors relative">
                                    {formData.image_url ? (
                                        <div className="relative z-10"> {/* Lift container above input if needed, or just button */}
                                            <img src={formData.image_url} alt="Preview" className="max-h-32 mx-auto rounded" />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    setFormData({ ...formData, image_url: '' });
                                                }}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 z-20"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-gray-500 pointer-events-none">
                                            <Upload className="mx-auto mb-2 opacity-50" size={24} />
                                            <span className="text-xs">Click to upload</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors flex items-center gap-2 font-medium"
                        >
                            {isEditing ? <Edit size={16} /> : <Plus size={16} />}
                            {isEditing ? 'Update FAQ' : 'Add FAQ'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700">
                    Existing FAQs
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : faqs.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No FAQs found. Create one above.</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {faqs.map(faq => (
                            <div key={faq.id} className={`p-4 hover:bg-gray-50 transition-colors flex gap-4 items-start ${!faq.is_active ? 'opacity-60 bg-gray-50' : ''}`}>
                                <div className="font-mono text-xs text-gray-400 mt-1 w-8 text-center bg-gray-100 rounded p-1">
                                    {faq.display_order}
                                </div>

                                {faq.image_url && (
                                    <img src={faq.image_url} alt="Thumbnail" className="w-16 h-16 object-cover rounded bg-gray-200 flex-shrink-0" />
                                )}

                                <div className="flex-grow min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <h3 className="font-bold text-gray-900 truncate pr-4">{faq.question}</h3>
                                        {!faq.is_active && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-medium">Inactive</span>}
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2 mt-1 whitespace-pre-line">{faq.answer}</p>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => handleEdit(faq)}
                                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                        title="Edit"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(faq.id)}
                                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default FAQManager;
