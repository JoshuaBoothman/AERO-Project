import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';

function GalleryManager() {
    const { token } = useAuth();
    const { notify, confirm } = useNotification();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchGallery();
    }, []);

    const fetchGallery = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/gallery');
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (e) {
            console.error(e);
            notify('Failed to load gallery items', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            // 1. Upload to Blob Storage
            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: uploadData,
                headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
            });

            if (!uploadRes.ok) throw new Error('Blob upload failed');
            const uploadResult = await uploadRes.json();

            // 2. Save to Database
            const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
            const dbRes = await fetch('/api/gallery', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify({
                    url: uploadResult.url,
                    filename: file.name,
                    media_type: mediaType
                })
            });

            if (dbRes.ok) {
                notify('Media uploaded successfully!', 'success');
                fetchGallery();
            } else {
                throw new Error('Database save failed');
            }
        } catch (e) {
            console.error(e);
            notify(e.message || 'Upload failed', 'error');
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleDelete = (id) => {
        confirm('Are you sure you want to delete this item? This will remove it from the home page. You cannot undo this.', async () => {
            try {
                const res = await fetch(`/api/gallery/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
                });
                if (res.ok) {
                    notify('Item deleted', 'success');
                    setItems(prev => prev.filter(item => item.id !== id));
                } else {
                    notify('Failed to delete item', 'error');
                }
            } catch (e) {
                console.error(e);
                notify('Error deleting item', 'error');
            }
        });
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading gallery...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-primary">Image Gallery</h2>
                    <p className="text-gray-500">Manage images and videos for the homepage carousel.</p>
                </div>
                <div className="relative">
                    <input
                        type="file"
                        id="gallery-upload"
                        className="hidden"
                        onChange={handleUpload}
                        accept="image/*,video/*"
                        disabled={uploading}
                    />
                    <label
                        htmlFor="gallery-upload"
                        className={`inline-flex items-center px-6 py-3 rounded-lg font-bold text-white transition-all cursor-pointer ${uploading ? 'bg-gray-400' : 'bg-accent hover:brightness-110 shadow-md hover:shadow-lg'
                            }`}
                    >
                        {uploading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Uploading...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                Upload Media
                            </>
                        )}
                    </label>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-xl">
                    <p className="text-gray-400 italic text-lg">No media in the gallery yet. Start by uploading an image or video.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {items.map(item => (
                        <div key={item.id} className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                            {item.media_type === 'video' ? (
                                <div className="w-full h-full relative">
                                    <video
                                        src={item.url}
                                        className="w-full h-full object-cover"
                                        muted
                                        onMouseOver={(e) => e.target.play()}
                                        onMouseOut={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-black/50 rounded-full p-3 text-white">
                                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <img src={item.url} alt={item.filename} className="w-full h-full object-cover" />
                            )}

                            {/* Overlay Controls */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
                                    title="Delete Item"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default GalleryManager;
