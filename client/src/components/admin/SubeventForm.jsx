import { useState, useEffect } from 'react';

function SubeventForm({ isOpen, onClose, onSubmit, initialData }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        start_time: '',
        end_time: '',
        capacity: '',
        cost: '',
        img_url: ''
    });

    useEffect(() => {
        if (initialData) {
            // Format dates for input datetime-local if necessary, or assume API sends ISO
            // HTML datetime-local expects YYYY-MM-DDThh:mm
            const formatDateTime = (dateStr) => {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                // Adjust to local ISO string for input
                // Basic trick: offset by timezone
                const tzOffset = date.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(date - tzOffset)).toISOString().slice(0, 16);
                return localISOTime;
            };

            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
                start_time: formatDateTime(initialData.start_time),
                end_time: formatDateTime(initialData.end_time),
                capacity: initialData.capacity || '',
                cost: initialData.cost || 0,
                img_url: initialData.img_url || ''
            });
        } else {
            setFormData({
                name: '',
                description: '',
                start_time: '',
                end_time: '',
                capacity: '',
                cost: '',
                img_url: ''
            });
        }
    }, [initialData, isOpen]);

    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                console.log("Upload success, url:", data.url);
                setFormData(prev => ({ ...prev, img_url: data.url }));
            } else {
                alert('Image upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Image upload failed');
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">{initialData ? 'Edit Subevent' : 'Add Subevent'}</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full border p-2 rounded"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full border p-2 rounded"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Start Time</label>
                            <input
                                type="datetime-local"
                                name="start_time"
                                value={formData.start_time}
                                onChange={handleChange}
                                required
                                className="w-full border p-2 rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">End Time</label>
                            <input
                                type="datetime-local"
                                name="end_time"
                                value={formData.end_time}
                                onChange={handleChange}
                                required
                                className="w-full border p-2 rounded"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Capacity</label>
                            <input
                                type="number"
                                name="capacity"
                                value={formData.capacity}
                                onChange={handleChange}
                                className="w-full border p-2 rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Cost ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                name="cost"
                                value={formData.cost}
                                onChange={handleChange}
                                className="w-full border p-2 rounded"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Image</label>
                        <input
                            type="file"
                            onChange={handleImageUpload}
                            className="w-full border p-2 rounded"
                            accept="image/*"
                        />
                        <input
                            type="hidden"
                            name="img_url"
                            value={formData.img_url}
                        />
                    </div>

                    {uploading && <p className="text-sm text-blue-500">Uploading image...</p>}

                    {formData.img_url && (
                        <div className="mt-2 text-center">
                            <p className="text-xs text-gray-500 mb-1">Current Image:</p>
                            <img src={formData.img_url} alt="Preview" className="h-32 w-auto object-cover rounded border mx-auto" />
                        </div>
                    )}

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {uploading ? 'Uploading...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SubeventForm;
