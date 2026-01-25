import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Plane, Trash2, Edit2, Upload, FileText, Scale, Tag, ChevronRight, User, Calendar, ArrowLeft } from 'lucide-react';

function MyPlanes() {
    const { token } = useAuth();
    const { notify, confirm } = useNotification();
    const [loading, setLoading] = useState(true);
    const [planes, setPlanes] = useState([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalStep, setModalStep] = useState(1); // 1: Event, 2: Pilot, 3: Details
    const [editingPlane, setEditingPlane] = useState(null); // If set, we skip steps 1 & 2 (edit mode)

    // Data for Selection Steps
    const [pilotEvents, setPilotEvents] = useState([]); // Events where user is a pilot
    const [selectedEventSlug, setSelectedEventSlug] = useState('');
    const [eligiblePilots, setEligiblePilots] = useState([]); // Persons from selected event
    const [selectedPersonId, setSelectedPersonId] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        model_type: '',
        registration_number: '',
        is_heavy_model: true,
        heavy_model_cert_number: '',
        heavy_model_cert_image_url: '',
        weight_kg: ''
    });

    useEffect(() => {
        fetchPlanes();
    }, []);

    const fetchPlanes = async () => {
        try {
            const res = await fetch('/api/planes', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                }
            });
            if (res.ok) {
                const data = await res.json();
                setPlanes(data);
            } else {
                notify('Failed to load planes', 'error');
            }
        } catch (e) {
            console.error(e);
            notify('Error loading planes', 'error');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            model_type: '',
            registration_number: '',
            is_heavy_model: true,
            heavy_model_cert_number: '',
            heavy_model_cert_image_url: '',
            weight_kg: ''
        });
        setSelectedEventSlug('');
        setSelectedPersonId('');
        setModalStep(1);
    }

    const handleEditClick = (plane) => {
        setEditingPlane(plane);
        setFormData({
            name: plane.name || '',
            model_type: plane.model_type || '',
            registration_number: plane.registration_number || '',
            is_heavy_model: true,
            heavy_model_cert_number: plane.heavy_model_cert_number || '',
            heavy_model_cert_image_url: plane.heavy_model_cert_image_url || '',
            weight_kg: plane.weight_kg || ''
        });
        setIsModalOpen(true);
    };

    const handleCreateClick = async () => {
        // Fetch Pilot Events first
        try {
            const res = await fetch('/api/user/pilot-events', {
                headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
            });
            if (res.ok) {
                const events = await res.json();
                if (events.length === 0) {
                    notify("You must be a registered Pilot for an upcoming event to add a plane.", "warning");
                    return;
                }
                setPilotEvents(events);
                setEditingPlane(null);
                resetForm();
                setIsModalOpen(true);
            } else {
                notify("Failed to check pilot eligibility", "error");
            }
        } catch (e) {
            console.error(e);
            notify("Error checking pilot eligibility", "error");
        }
    };

    const handleEventSelect = async (slug) => {
        setSelectedEventSlug(slug);
        // Fetch Pilots for this event
        try {
            const res = await fetch(`/api/events/${slug}/my-attendees`, {
                headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
            });
            if (res.ok) {
                const attendees = await res.json();
                // Filter is handled by API but double check? API only returns pilot role attendees.
                setEligiblePilots(attendees);
                setModalStep(2);
            } else {
                notify("Failed to load pilots", "error");
            }
        } catch (e) {
            console.error(e);
            notify("Error loading pilots", "error");
        }
    };

    const handlePilotSelect = (personId) => {
        setSelectedPersonId(personId);
        setModalStep(3);
    };

    const handleDeleteClick = (id) => {
        confirm('Are you sure you want to delete this plane? This cannot be undone.', async () => {
            try {
                const res = await fetch(`/api/planes/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Auth-Token': token
                    }
                });

                if (res.ok) {
                    notify('Plane deleted successfully', 'success');
                    setPlanes(prev => prev.filter(p => p.plane_id !== id));
                } else {
                    const data = await res.json();
                    notify(data.error || 'Failed to delete plane', 'error');
                }
            } catch (e) {
                console.error(e);
                notify('Error deleting plane', 'error');
            }
        });
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            notify('Uploading certificate...', 'info');
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: uploadData,
                headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setFormData({ ...formData, heavy_model_cert_image_url: data.url });
                notify('Certificate uploaded!', 'success');
            } else {
                notify('Upload failed', 'error');
            }
        } catch (e) {
            console.error(e);
            notify('Upload error', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const url = editingPlane ? `/api/planes/${editingPlane.plane_id}` : '/api/planes';
        const method = editingPlane ? 'PUT' : 'POST';

        const payload = { ...formData };
        if (!editingPlane) {
            payload.person_id = selectedPersonId;
        }

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                notify(editingPlane ? 'Plane updated successfully' : 'Plane registered successfully', 'success');
                setIsModalOpen(false);
                fetchPlanes();
            } else {
                const data = await res.json();
                notify(data.error || 'Failed to save plane', 'error');
            }
        } catch (e) {
            console.error(e);
            notify('Error saving plane', 'error');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading hangar...</div>;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Plane className="text-accent" /> My Hangar
                    </h1>
                    <p className="text-gray-600 mt-1">Manage your aircraft and heavy model certificates.</p>
                </div>
                {/* Only allow adding if we are not loading. Logic inside handles validation */}
                <button
                    onClick={handleCreateClick}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-all flex items-center gap-2"
                >
                    <Plane size={18} /> Register New Plane
                </button>
            </div>

            {planes.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-100">
                    <Plane className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No planes found</h3>
                    <p className="text-gray-500 mt-2">You haven't registered any planes yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {planes.map(plane => (
                        <div key={plane.plane_id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{plane.name || 'Unknown Aircraft'}</h3>
                                        <p className="text-sm text-gray-500">{plane.model_type}</p>
                                    </div>
                                    {plane.is_heavy_model && (
                                        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                            <Scale size={12} /> Heavy Model
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-3 text-sm text-gray-600">
                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-50">
                                        <User size={14} className="text-gray-400" />
                                        <span className="font-medium text-xs text-gray-500 uppercase tracking-wide">Flown By:</span>
                                        <span className="font-semibold">{plane.first_name || 'My'} {plane.last_name || 'Pilot'}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Tag size={16} className="text-gray-400" />
                                        <span className="font-medium">Rego:</span> {plane.registration_number || 'N/A'}
                                    </div>

                                    {plane.is_heavy_model && (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <Scale size={16} className="text-gray-400" />
                                                <span className="font-medium">Weight:</span> {plane.weight_kg} kg
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <FileText size={16} className="text-gray-400" />
                                                <span className="font-medium">Cert #:</span> {plane.heavy_model_cert_number || 'Pending'}
                                            </div>
                                            {plane.heavy_model_cert_image_url && (
                                                <div className="mt-2 text-blue-600">
                                                    <a href={plane.heavy_model_cert_image_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
                                                        <FileText size={14} /> View Certificate
                                                    </a>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-end gap-2">
                                <button
                                    onClick={() => handleEditClick(plane)}
                                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(plane.plane_id)}
                                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up">
                        <div className="bg-primary/5 p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {editingPlane ? 'Edit Plane Details' : (
                                    <>
                                        {modalStep === 1 && 'Step 1: Select Event'}
                                        {modalStep === 2 && 'Step 2: Select Pilot'}
                                        {modalStep === 3 && 'Step 3: Plane Details'}
                                    </>
                                )}
                            </h2>
                            {/* Progress Dots if adding */}
                            {!editingPlane && (
                                <div className="flex gap-2 mt-2">
                                    <div className={`h-1.5 flex-1 rounded-full ${modalStep >= 1 ? 'bg-accent' : 'bg-gray-200'}`}></div>
                                    <div className={`h-1.5 flex-1 rounded-full ${modalStep >= 2 ? 'bg-accent' : 'bg-gray-200'}`}></div>
                                    <div className={`h-1.5 flex-1 rounded-full ${modalStep >= 3 ? 'bg-accent' : 'bg-gray-200'}`}></div>
                                </div>
                            )}
                        </div>

                        {/* STEP 1: EVENT SELECTION */}
                        {!editingPlane && modalStep === 1 && (
                            <div className="p-6 space-y-4">
                                <p className="text-gray-600 text-sm">Select the event you have registered for as a Pilot.</p>
                                <div className="space-y-2">
                                    {pilotEvents.map(event => (
                                        <button
                                            key={event.event_id}
                                            onClick={() => handleEventSelect(event.slug)}
                                            className="w-full text-left p-4 border border-gray-200 rounded-xl hover:border-accent hover:bg-accent/5 transition-all flex justify-between items-center group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                                    <Calendar size={20} />
                                                </div>
                                                <span className="font-semibold text-gray-800">{event.name}</span>
                                            </div>
                                            <ChevronRight className="text-gray-400 group-hover:text-accent" />
                                        </button>
                                    ))}
                                </div>
                                <div className="flex justify-start pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: PILOT SELECTION */}
                        {!editingPlane && modalStep === 2 && (
                            <div className="p-6 space-y-4">
                                <p className="text-gray-600 text-sm">Select which Pilot profile owns this aircraft.</p>
                                <div className="space-y-2">
                                    {eligiblePilots.length === 0 ? (
                                        <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                                            No eligible pilot profiles found for this event.
                                        </div>
                                    ) : (
                                        eligiblePilots.map(p => (
                                            <button
                                                key={p.attendee_id}
                                                // Assuming we want the person_id, but the array has person_id now thanks to backend update
                                                onClick={() => handlePilotSelect(p.person_id)}
                                                className="w-full text-left p-4 border border-gray-200 rounded-xl hover:border-accent hover:bg-accent/5 transition-all flex justify-between items-center group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-800">{p.first_name} {p.last_name}</div>
                                                        <div className="text-xs text-gray-500">{p.ticket_name}</div>
                                                    </div>
                                                </div>
                                                <ChevronRight className="text-gray-400 group-hover:text-accent" />
                                            </button>
                                        ))
                                    )}
                                </div>
                                <div className="flex justify-between pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setModalStep(1)}
                                        className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
                                    >
                                        <ArrowLeft size={16} /> Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3 (or EDIT): PLANE DETAILS */}
                        {(editingPlane || modalStep === 3) && (
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Make / Name</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                                            value={formData.model_type}
                                            onChange={e => setFormData({ ...formData, model_type: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                                        value={formData.registration_number}
                                        onChange={e => setFormData({ ...formData, registration_number: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-200 animate-fade-in pl-1">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                                            value={formData.weight_kg}
                                            onChange={e => setFormData({ ...formData, weight_kg: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Heavy Model Certificate #</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                                            value={formData.heavy_model_cert_number}
                                            onChange={e => setFormData({ ...formData, heavy_model_cert_number: e.target.value })}
                                            required // Now required if heavy model
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Image / PDF</label>
                                        <div className="flex gap-2 items-center">
                                            {formData.heavy_model_cert_image_url && (
                                                <a href={formData.heavy_model_cert_image_url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm hover:underline">
                                                    Current
                                                </a>
                                            )}
                                            <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm text-sm">
                                                <Upload size={16} /> {formData.heavy_model_cert_image_url ? 'Change File' : 'Upload File'}
                                                <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" />
                                            </label>
                                        </div>
                                        {!formData.heavy_model_cert_image_url && <p className="text-xs text-red-500 mt-1">Certificate file is required.</p>}
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-end pt-4">
                                    {!editingPlane && (
                                        <button
                                            type="button"
                                            onClick={() => setModalStep(2)}
                                            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors cursor-pointer mr-auto"
                                        >
                                            Back
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 shadow-md transition-all transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!formData.weight_kg || !formData.heavy_model_cert_number || !formData.heavy_model_cert_image_url}
                                    >
                                        {editingPlane ? 'Save Changes' : 'Register Plane'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyPlanes;
