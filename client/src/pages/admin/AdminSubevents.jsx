import { useState, useEffect } from 'react';
import SubeventForm from '../../components/admin/SubeventForm';
import SubeventVariationManager from '../../components/admin/SubeventVariationManager';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

function AdminSubevents() {
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [subevents, setSubevents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSubevent, setEditingSubevent] = useState(null);
    const [variationManagerOpen, setVariationManagerOpen] = useState(false);
    const [selectedSubeventForVariations, setSelectedSubeventForVariations] = useState(null);
    const { notify: showNotification } = useNotification();
    const { token } = useAuth();

    // Fetch Events on Mount
    useEffect(() => {
        async function fetchEvents() {
            try {
                const headers = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                    headers['X-Auth-Token'] = token;
                }

                const res = await fetch('/api/events', { headers });
                if (res.ok) {
                    const data = await res.json();
                    setEvents(data);
                    // Auto-select first event if available
                    if (data.length > 0) setSelectedEventId(data[0].event_id);
                }
            } catch (err) {
                console.error("Failed to load events", err);
            }
        }
        if (token) fetchEvents();
    }, [token]);

    // Fetch Subevents when Event changes
    useEffect(() => {
        if (!selectedEventId) return;

        async function fetchSubevents() {
            setLoading(true);
            try {
                const headers = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                    headers['X-Auth-Token'] = token;
                }

                const res = await fetch(`/api/events/${selectedEventId}/subevents`, { headers, cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    setSubevents(data);
                } else {
                    setSubevents([]);
                }
            } catch (err) {
                console.error("Failed to load subevents", err);
                showNotification("Failed to load subevents", "error");
            } finally {
                setLoading(false);
            }
        }
        if (token) fetchSubevents();
    }, [selectedEventId, token, showNotification]);

    const handleAddClick = () => {
        setEditingSubevent(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (subevent) => {
        setEditingSubevent(subevent);
        setIsModalOpen(true);
    };

    const handleDeleteClick = async (id) => {
        if (!window.confirm("Are you sure you want to delete this subevent?")) return;

        try {
            const res = await fetch(`/api/subevents/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                }
            });
            if (res.ok) {
                setSubevents(prev => prev.filter(s => s.subevent_id !== id));
                showNotification("Subevent deleted", "info");
            } else {
                showNotification("Failed to delete subevent", "error");
            }
        } catch (err) {
            console.error(err);
            showNotification("Error deleting subevent", "error");
        }
    };

    const handleFormSubmit = async (formData) => {
        try {
            const isEdit = !!editingSubevent;
            const url = isEdit ? `/api/subevents/${editingSubevent.subevent_id}` : '/api/subevents';
            const method = isEdit ? 'PUT' : 'POST';

            const payload = { ...formData, event_id: selectedEventId };

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showNotification(`Subevent ${isEdit ? 'updated' : 'created'} successfully`, "success");
                setIsModalOpen(false);
                // Refresh list
                const headers = { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token };
                const listRes = await fetch(`/api/events/${selectedEventId}/subevents`, { headers, cache: 'no-store' });
                if (listRes.ok) {
                    setSubevents(await listRes.json());
                }
            } else {
                const errData = await res.json();
                showNotification(errData.error || "Operation failed", "error");
            }
        } catch (err) {
            console.error(err);
            showNotification("Server error", "error");
        }
    };

    return (
        <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manage Subevents</h1>
                <button
                    onClick={handleAddClick}
                    disabled={!selectedEventId}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    + Add Subevent
                </button>
            </div>

            <div className="mb-6 bg-white p-4 rounded shadow-sm flex items-center gap-4">
                <label className="font-medium">Select Event:</label>
                <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="border p-2 rounded min-w-[300px]"
                >
                    <option value="">-- Choose Event --</option>
                    {events.map(ev => (
                        <option key={ev.event_id} value={ev.event_id}>{ev.name}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <p>Loading subevents...</p>
            ) : (
                <div className="bg-white rounded shadow cursor-default">
                    {subevents.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            {selectedEventId ? "No subevents found for this event." : "Please select an event."}
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-100 border-b">
                                <tr>
                                    <th className="p-4">Image</th>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Time</th>
                                    <th className="p-4">Capacity</th>
                                    <th className="p-4">Cost</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subevents.map(sub => (
                                    <tr key={sub.subevent_id} className="border-b hover:bg-gray-50">
                                        <td className="p-4">
                                            {sub.img_url ? (
                                                <img src={sub.img_url} alt={sub.name} className="w-12 h-12 object-cover rounded" />
                                            ) : (
                                                <span className="text-gray-300 italic">No img</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium">{sub.name}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-[200px]">{sub.description}</div>
                                        </td>
                                        <td className="p-4 text-sm">
                                            <div className="whitespace-nowrap">Start: {new Date(sub.start_time).toLocaleString()}</div>
                                            <div className="whitespace-nowrap text-gray-500">End: {new Date(sub.end_time).toLocaleString()}</div>
                                        </td>
                                        <td className="p-4">{sub.capacity || 'Unlimited'}</td>
                                        <td className="p-4">${Number(sub.cost).toFixed(2)}</td>
                                        <td className="p-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleEditClick(sub)}
                                                className="text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedSubeventForVariations(sub);
                                                    setVariationManagerOpen(true);
                                                }}
                                                className="text-purple-600 hover:text-purple-800 font-medium mr-2"
                                            >
                                                Variations
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(sub.subevent_id)}
                                                className="text-red-600 hover:text-red-800 font-medium"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            <SubeventForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editingSubevent}
                eventId={selectedEventId}
            />

            {variationManagerOpen && selectedSubeventForVariations && (
                <SubeventVariationManager
                    subevent={selectedSubeventForVariations}
                    onClose={() => setVariationManagerOpen(false)}
                />
            )}
        </div>
    );
}

export default AdminSubevents;
