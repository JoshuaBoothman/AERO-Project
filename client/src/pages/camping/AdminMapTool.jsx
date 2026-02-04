import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import AdminLegacyImport from '../admin/AdminLegacyImport';

function AdminMapTool() {
    const { user, token } = useAuth();
    const { notify, confirm } = useNotification();
    const navigate = useNavigate();

    // === ALL STATE HOOKS MUST BE DECLARED BEFORE ANY EARLY RETURNS ===
    // Selection State
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [campgrounds, setCampgrounds] = useState([]);
    const [selectedCampgroundId, setSelectedCampgroundId] = useState(null);

    // Map/Editor State
    const [campground, setCampground] = useState(null);
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSiteId, setSelectedSiteId] = useState(null);
    // const [tempCoords, setTempCoords] = useState(null); // Removed unused state
    const [orgSettings, setOrgSettings] = useState(null);
    const [nextSiteNumber, setNextSiteNumber] = useState(1);

    // Create Campground Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newCampName, setNewCampName] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({ id: null, name: '' });
    const [editFile, setEditFile] = useState(null);

    // Legacy Import Modal State
    const [legacyModalData, setLegacyModalData] = useState(null);

    // Error State (moved up from line 140)
    const [error, setError] = useState(null);

    // Route Protection
    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login');
        }
    }, [user, navigate]);


    // Initial Load: Fetch Events & Settings
    useEffect(() => {
        fetchSettings();
        fetchEvents();
    }, []);

    // When Event Changes: Fetch Campgrounds
    useEffect(() => {
        if (selectedEventId) {
            fetchCampgrounds(selectedEventId);
        } else {
            setCampgrounds([]);
            setSelectedCampgroundId(null);
            setCampground(null);
        }
    }, [selectedEventId]);

    // When Campground Changes: Fetch Map Data
    useEffect(() => {
        if (selectedCampgroundId) {
            fetchCampgroundData(selectedCampgroundId);
        } else {
            setCampground(null);
            setSites([]);
        }
    }, [selectedCampgroundId]);

    // === EARLY RETURNS (after all Hooks) ===
    if (!user || user.role !== 'admin') return null; // Prevent flicker

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/getOrganization');
            if (res.ok) setOrgSettings(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchEvents = async () => {
        try {
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                headers['X-Auth-Token'] = token;
            }

            const res = await fetch('/api/events', { headers });
            if (res.ok) {
                const list = await res.json();

                // Sort by start_date ascending
                const sorted = list.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
                setEvents(sorted);

                // Auto-select: First event where end_date >= today, or the last one (most recent)
                if (sorted.length > 0) {
                    const today = new Date();
                    const active = sorted.find(e => new Date(e.end_date) >= today) || sorted[sorted.length - 1];
                    // Only set if not already set (though this runs on mount, so it's fine)
                    if (active) setSelectedEventId(active.event_id);
                }
            }
        } catch (e) { console.error(e); }
    };

    const fetchCampgrounds = async (eventId) => {
        try {
            // Note: We need an endpoint to get campgrounds by Event ID. 
            // Reuse the public one: /api/events/:id/campgrounds (ignoring dates for admin view? or just listing them)
            // Or assume /api/campgrounds lists all? The original code used /api/campgrounds.
            // Let's assume we want to filter by event.
            // If /api/campgrounds returns ALL, we filter client side.
            // If /api/events/:id/campgrounds needs dates, we might need to fake them or make them optional.
            // Let's try /api/events/:id/campgrounds first with wide dates, OR check if there's a simpler list endpoint.
            // Actually, let's use the one we used in CampingPage: /api/events/:id/campgrounds
            // But that requires dates to check availability.
            // Admin just wants the STRUCTURE.

            // Allow fallback: Fetch ALL /api/campgrounds and filter client side if the API supports it.
            // Based on previous code: fetch('/api/campgrounds') returned a list.
            const res = await fetch('/api/campgrounds');
            if (res.ok) {
                const list = await res.json();
                // Filter by event_id if the API returns it.
                // If not, we might show all. Let's inspect the `list` structure assumption.
                // Assuming list has event_id.
                const filtered = list.filter(c => c.event_id === parseInt(eventId));
                setCampgrounds(filtered);
                if (filtered.length > 0) {
                    setSelectedCampgroundId(filtered[0].campground_id);
                } else {
                    setSelectedCampgroundId(null);
                }
            }
        } catch (e) { console.error(e); }
    };

    const fetchCampgroundData = async (id) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/campgrounds/${id}/sites`);
            if (res.ok) {
                const data = await res.json();
                setCampground(data.campground);

                setSites(data.sites);
                if (data.next_site_number) setNextSiteNumber(data.next_site_number);
            } else {
                const err = await res.json().catch(() => ({}));
                setError(err.error || `Failed to load data (Status: ${res.status})`);
                setCampground(null);
            }
        } catch (err) {
            console.error(err);
            setError("Network error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCampground = async (id) => {
        confirm("Are you sure you want to delete this campground? This cannot be undone.", async () => {
            try {
                const res = await fetch(`/api/campgrounds/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Auth-Token': token
                    }
                });
                if (res.ok) {
                    setCampgrounds(prev => prev.filter(c => c.campground_id !== id));
                    if (selectedCampgroundId === id) {
                        setSelectedCampgroundId(null);
                        setCampground(null);
                    }
                    notify("Campground deleted", "success");
                } else {
                    const text = await res.text();
                    let errMsg = 'Failed to delete campground';
                    try {
                        const json = JSON.parse(text);
                        errMsg = json.error || errMsg;
                    } catch (e) {
                        errMsg += ` (${res.status} ${res.statusText})`;
                    }
                    notify(errMsg, "error");
                }
            } catch (e) {
                console.error(e);
                notify('Error deleting campground', "error");
            }
        });
    };

    const handleEditCampground = (id, currentName) => {
        setEditData({ id, name: currentName });
        setEditFile(null);
        setShowEditModal(true);
    };

    const submitEdit = async () => {
        if (!editData.name || !editData.id) return;

        setUploading(true);
        try {
            let mapUrl = undefined;

            if (editFile) {
                const formData = new FormData();
                formData.append('file', editFile);
                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                if (!uploadRes.ok) throw new Error('Upload failed');
                const data = await uploadRes.json();
                mapUrl = data.url;
            }

            const body = { name: editData.name };
            if (mapUrl) body.map_image_url = mapUrl;

            const res = await fetch(`/api/campgrounds/${editData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setCampgrounds(prev => prev.map(c => c.campground_id === editData.id ? { ...c, name: editData.name } : c));
                // If current campground, Refresh data to show new map
                if (selectedCampgroundId === editData.id && mapUrl) {
                    fetchCampgroundData(editData.id);
                }
                setShowEditModal(false);
            } else {
                const err = await res.json();
                notify('Failed to update: ' + (err.error || 'Unknown error'), "error");
            }
        } catch (e) {
            console.error(e);
            notify('Error updating campground', "error");
        } finally {
            setUploading(false);
        }
    };

    const handleCreateCampground = async () => {
        if (!newCampName || !selectedEventId) {
            notify('Name and Event are required', "error");
            return;
        }

        if (!selectedFile) {
            notify('Please select a map image', "error");
            return;
        }

        setUploading(true);
        try {
            // 1. Upload Image
            const formData = new FormData();
            formData.append('file', selectedFile);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) {
                const err = await uploadRes.json();
                throw new Error(err.error || 'Upload failed');
            }

            const { url } = await uploadRes.json();

            // 2. Create Campground
            const res = await fetch('/api/campgrounds', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify({
                    event_id: selectedEventId,
                    name: newCampName,
                    map_image_url: url
                })
            });
            if (res.ok) {
                const data = await res.json();
                setShowCreateModal(false);
                setNewCampName('');
                setSelectedFile(null);
                await fetchCampgrounds(selectedEventId);
                if (data.campground_id) {
                    setSelectedCampgroundId(data.campground_id);
                }
            } else {
                notify('Failed to create campground', "error");
            }
        } catch (e) {
            console.error(e);
            notify('Error: ' + e.message, "error");
        } finally {
            setUploading(false);
        }
    };

    // --- Editor Handlers (Same as before) ---

    const handleBulkAdd = async (qty, prefix, startNum) => {
        if (!selectedCampgroundId) return;
        try {
            const res = await fetch(`/api/campgrounds/${selectedCampgroundId}/sites`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify({
                    count: parseInt(qty),
                    prefix,
                    start_number: startNum,
                    price: parseFloat(document.getElementById('addPrice').value) || 0,
                    full_event_price: parseFloat(document.getElementById('addFullPrice').value) || 0,
                    extra_adult_price_per_night: parseFloat(document.getElementById('addExtraDaily').value) || 0,
                    extra_adult_full_event_price: parseFloat(document.getElementById('addExtraFull').value) || 0
                })
            });
            if (res.ok) {
                fetchCampgroundData(selectedCampgroundId);
                // Clear inputs
                document.getElementById('addQty').value = '1';
            } else { alert('Failed to add sites'); }
        } catch (e) { console.error(e); alert('Error adding sites'); }
    };

    const handleSingleAdd = async (name, price) => {
        if (!selectedCampgroundId || !name) return;
        try {
            const res = await fetch(`/api/campgrounds/${selectedCampgroundId}/sites`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify({
                    count: 1, // Dummy
                    price: parseFloat(price) || 0,
                    full_event_price: parseFloat(document.getElementById('singleFullPrice').value) || 0,
                    extra_adult_price_per_night: parseFloat(document.getElementById('singleExtraDaily').value) || 0,
                    extra_adult_full_event_price: parseFloat(document.getElementById('singleExtraFull').value) || 0,
                    specific_names: [name]
                })
            });
            if (res.ok) {
                fetchCampgroundData(selectedCampgroundId);
                document.getElementById('singleName').value = '';
            } else { alert('Failed to add site'); }
        } catch (e) { console.error(e); alert('Error adding site'); }
    };

    const handleRename = (id, newName) => {
        setSites(prev => prev.map(s => s.campsite_id === id ? { ...s, site_number: newName } : s));
    };

    const handleNameBlur = async (id, newName) => {
        try {
            await fetch(`/api/campsites/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify({ site_number: newName })
            });
        } catch (e) { console.error(e); }
    };

    const handlePriceChange = (id, newPrice) => {
        setSites(prev => prev.map(s => s.campsite_id === id ? { ...s, price_per_night: newPrice } : s));
    };

    const handlePriceBlur = async (id, newPrice) => {
        try {
            await fetch(`/api/campsites/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify({ price_per_night: parseFloat(newPrice) })
            });
        } catch (e) { console.error(e); }
    };

    const handleFullPriceChange = (id, newPrice) => {
        setSites(prev => prev.map(s => s.campsite_id === id ? { ...s, full_event_price: newPrice } : s));
    };

    const handleFullPriceBlur = async (id, newPrice) => {
        try {
            await fetch(`/api/campsites/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify({ full_event_price: parseFloat(newPrice) })
            });
        } catch (e) { console.error(e); }
    };

    const handleExtraAdultPriceChange = (id, newPrice) => {
        setSites(prev => prev.map(s => s.campsite_id === id ? { ...s, extra_adult_price_per_night: newPrice } : s));
    };

    const handleExtraAdultPriceBlur = async (id, newPrice) => {
        try {
            await fetch(`/api/campsites/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify({ extra_adult_price_per_night: parseFloat(newPrice) })
            });
        } catch (e) { console.error(e); }
    };

    const handleExtraAdultFullPriceChange = (id, newPrice) => {
        setSites(prev => prev.map(s => s.campsite_id === id ? { ...s, extra_adult_full_event_price: newPrice } : s));
    };

    const handleExtraAdultFullPriceBlur = async (id, newPrice) => {
        try {
            await fetch(`/api/campsites/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify({ extra_adult_full_event_price: parseFloat(newPrice) })
            });
        } catch (e) { console.error(e); }
    };



    const handleDelete = async (id) => {
        confirm('Delete this site?', async () => {
            try {
                const res = await fetch(`/api/campsites/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Auth-Token': token
                    }
                });
                if (res.ok) {
                    setSites(prev => prev.filter(s => s.campsite_id !== id));
                    setSelectedSiteId(null);
                    notify("Site deleted", "success");
                }
            } catch (e) { console.error(e); }
        });
    };

    const handleMapClick = (e) => {
        if (!selectedSiteId) return;
        const rect = e.target.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        const xFixed = parseFloat(x.toFixed(1));
        const yFixed = parseFloat(y.toFixed(1));
        // setTempCoords({ x: xFixed, y: yFixed });
        saveCoords(selectedSiteId, { x: xFixed, y: yFixed });
    };

    const saveCoords = async (siteId, coords) => {
        try {
            const res = await fetch(`/api/campsites/${siteId}/coords`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify({ map_coordinates: coords })
            });
            if (res.ok) {
                setSites(prev => prev.map(s => s.campsite_id === siteId ? { ...s, map_coordinates: coords ? JSON.stringify(coords) : null } : s));
                // setTempCoords(null);
            } else {
                const err = await res.json();
                notify(`Failed to save: ${err.error || 'Unknown error'}`, "error");
            }
        } catch (err) { notify('Error saving: ' + err.message, "error"); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
            {/* Top Toolbar */}
            <div style={{ padding: '15px', borderBottom: '1px solid #ddd', background: '#fff', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>Admin Map Tool</h2>
                <select
                    value={selectedEventId}
                    onChange={e => setSelectedEventId(e.target.value)}
                    style={{ padding: '8px', fontSize: '1rem' }}
                >
                    <option value="">-- Select Event --</option>
                    {events.map(e => (
                        <option key={e.event_id} value={e.event_id}>{e.name}</option>
                    ))}
                </select>

                {selectedEventId && (
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        {campgrounds.length > 0 && campgrounds.map(cg => (
                            <div key={cg.campground_id} style={{ position: 'relative', display: 'flex' }}>
                                <button
                                    onClick={() => setSelectedCampgroundId(cg.campground_id)}
                                    style={{
                                        padding: '8px 16px',
                                        background: selectedCampgroundId === cg.campground_id ? 'var(--primary-color, black)' : '#eee',
                                        color: selectedCampgroundId === cg.campground_id ? 'white' : 'black',
                                        border: 'none',
                                        borderRadius: '4px 0 0 4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {cg.name}
                                </button>
                                {selectedCampgroundId === cg.campground_id && (
                                    <>
                                        <button
                                            onClick={() => handleEditCampground(cg.campground_id, cg.name)}
                                            style={{
                                                padding: '8px 10px',
                                                background: '#ffc107',
                                                color: 'black',
                                                border: 'none',
                                                cursor: 'pointer',
                                                borderLeft: '1px solid rgba(0,0,0,0.1)'
                                            }}
                                            title="Edit Campground"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCampground(cg.campground_id)}
                                            style={{
                                                padding: '8px 10px',
                                                background: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '0 4px 4px 0',
                                                cursor: 'pointer',
                                                borderLeft: '1px solid rgba(0,0,0,0.1)'
                                            }}
                                            title="Delete Campground"
                                        >
                                            🗑️
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                        <button
                            onClick={() => setShowCreateModal(true)}
                            style={{ padding: '8px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1.2rem', lineHeight: '1', marginLeft: '5px' }}
                            title="Add Campground"
                        >
                            +
                        </button>
                        {selectedSiteId && (
                            <button
                                onClick={() => {
                                    const site = sites.find(s => s.campsite_id === selectedSiteId);
                                    const selectedEvent = events.find(e => e.event_id === parseInt(selectedEventId));
                                    setLegacyModalData({
                                        campsiteId: selectedSiteId,
                                        campsiteName: site?.site_number || 'Unknown',
                                        siteNumber: site?.site_number || 'Unknown',
                                        eventId: selectedEventId,
                                        eventStartDate: selectedEvent?.start_date,
                                        eventEndDate: selectedEvent?.end_date
                                    });
                                }}
                                style={{
                                    padding: '8px 16px',
                                    background: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginLeft: '15px',
                                    fontWeight: 'bold'
                                }}
                                title="Book campsite for a returning/past attendee"
                            >
                                📋 Book Past Attendee (Site {sites.find(s => s.campsite_id === selectedSiteId)?.site_number})
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Main Content */}
            {!selectedCampgroundId ? (
                <div style={{ padding: '50px', textAlign: 'center', color: '#666' }}>
                    {selectedEventId ? 'Select a campground to edit.' : 'Please select an event to get started.'}
                </div>
            ) : loading ? (
                <div style={{ padding: '50px' }}>Loading Data...</div>
            ) : error ? (
                <div style={{ padding: '50px', color: 'red' }}>
                    <h3>Error</h3>
                    <p>{error}</p>
                </div>
            ) : !campground ? (
                <div style={{ padding: '50px' }}>Campground not found.</div>
            ) : (
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

                    {/* Sidebar Editor */}
                    <div style={{ width: '320px', minWidth: '320px', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', background: '#fafafa', flexShrink: 0, zIndex: 20, position: 'relative', boxShadow: '2px 0 5px rgba(0,0,0,0.1)', overflowY: 'auto' }}>

                        {/* Bulk Add (Styled with Labels) */}
                        <div style={{ padding: '15px', borderBottom: '1px solid #ddd', background: '#fff' }}>
                            {/* Bulk Create Section */}
                            <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#333' }}>Bulk Create</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Qty</label>
                                    <input id="addQty" type="number" defaultValue="1" style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Prefix (Opt)</label>
                                    <input id="addPrefix" type="text" style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Start #</label>
                                    <input id="addStartNum" type="number" defaultValue={nextSiteNumber} key={nextSiteNumber} style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Ex. Adult Daily</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>$</span>
                                        <input id="addExtraDaily" type="number" defaultValue="0" style={{ width: '100%', padding: '6px 6px 6px 20px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Ex. Adult Full</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>$</span>
                                        <input id="addExtraFull" type="number" defaultValue="0" style={{ width: '100%', padding: '6px 6px 6px 20px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Daily Price</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>$</span>
                                        <input id="addPrice" type="number" defaultValue="0" style={{ width: '100%', padding: '6px 6px 6px 20px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Full Event Price</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>$</span>
                                        <input id="addFullPrice" type="number" defaultValue="0" style={{ width: '100%', padding: '6px 6px 6px 20px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleBulkAdd(
                                    document.getElementById('addQty').value,
                                    document.getElementById('addPrefix').value,
                                    document.getElementById('addStartNum').value
                                )}
                                style={{ width: '100%', background: '#333', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Add Sites
                            </button>

                            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />

                            {/* Single Site Section */}
                            <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#333' }}>Single Site</h4>
                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Site Name</label>
                                <input id="singleName" type="text" placeholder="e.g. 5A" style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Ex. Adult Daily</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>$</span>
                                        <input id="singleExtraDaily" type="number" defaultValue="0" style={{ width: '100%', padding: '6px 6px 6px 20px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Ex. Adult Full</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>$</span>
                                        <input id="singleExtraFull" type="number" defaultValue="0" style={{ width: '100%', padding: '6px 6px 6px 20px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Daily Price</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>$</span>
                                        <input id="singlePrice" type="number" defaultValue="0" style={{ width: '100%', padding: '6px 6px 6px 20px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Full Event Price</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>$</span>
                                        <input id="singleFullPrice" type="number" defaultValue="0" style={{ width: '100%', padding: '6px 6px 6px 20px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleSingleAdd(
                                    document.getElementById('singleName').value,
                                    document.getElementById('singlePrice').value
                                )}
                                style={{ width: '100%', background: '#007bff', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Add Site
                            </button>
                        </div>

                        {/* Selected Site Editor */}
                        {selectedSiteId && (
                            <div style={{ padding: '20px', background: '#eef', borderBottom: '1px solid #dde' }}>
                                <h4 style={{ marginTop: 0 }}>Editing Site</h4>
                                <div style={{ marginBottom: '10px' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Name</label>
                                    <input
                                        style={{ width: '100%', padding: '5px', border: '1px solid #ced4da', borderRadius: '4px' }}
                                        value={sites.find(s => s.campsite_id === selectedSiteId)?.site_number || ''}
                                        onChange={e => handleRename(selectedSiteId, e.target.value)}
                                        onBlur={e => handleNameBlur(selectedSiteId, e.target.value)}
                                    />
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Price (Daily)</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>$</span>
                                        <input
                                            type="number"
                                            style={{ width: '100%', padding: '5px 5px 5px 25px', border: '1px solid #ced4da', borderRadius: '4px' }}
                                            value={sites.find(s => s.campsite_id === selectedSiteId)?.price_per_night || ''}
                                            onChange={e => handlePriceChange(selectedSiteId, e.target.value)}
                                            onBlur={e => handlePriceBlur(selectedSiteId, e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Full Event Price</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>$</span>
                                        <input
                                            type="number"
                                            style={{ width: '100%', padding: '5px 5px 5px 25px', border: '1px solid #ced4da', borderRadius: '4px' }}
                                            value={sites.find(s => s.campsite_id === selectedSiteId)?.full_event_price || ''}
                                            onChange={e => handleFullPriceChange(selectedSiteId, e.target.value)}
                                            onBlur={e => handleFullPriceBlur(selectedSiteId, e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Extra Adult (Daily)</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>$</span>
                                        <input
                                            type="number"
                                            style={{ width: '100%', padding: '5px 5px 5px 25px', border: '1px solid #ced4da', borderRadius: '4px' }}
                                            value={sites.find(s => s.campsite_id === selectedSiteId)?.extra_adult_price_per_night || ''}
                                            onChange={e => handleExtraAdultPriceChange(selectedSiteId, e.target.value)}
                                            onBlur={e => handleExtraAdultPriceBlur(selectedSiteId, e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Extra Adult (Full)</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>$</span>
                                        <input
                                            type="number"
                                            style={{ width: '100%', padding: '5px 5px 5px 25px', border: '1px solid #ced4da', borderRadius: '4px' }}
                                            value={sites.find(s => s.campsite_id === selectedSiteId)?.extra_adult_full_event_price || ''}
                                            onChange={e => handleExtraAdultFullPriceChange(selectedSiteId, e.target.value)}
                                            onBlur={e => handleExtraAdultFullPriceBlur(selectedSiteId, e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => handleDelete(selectedSiteId)} style={{ cursor: 'pointer', padding: '5px 10px', color: 'red' }}>Delete</button>
                                </div>
                            </div>
                        )}

                        {/* Site List */}
                        <div style={{ padding: '10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                                {sites.map(site => {
                                    const hasCoords = !!site.map_coordinates;
                                    const isSelected = selectedSiteId === site.campsite_id;
                                    const bg = hasCoords ? (orgSettings?.accent_color || '#d4edda') : '#fff3cd';

                                    return (
                                        <div
                                            key={site.campsite_id}
                                            onClick={() => setSelectedSiteId(selectedSiteId === site.campsite_id ? null : site.campsite_id)}
                                            style={{
                                                aspectRatio: '1',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.8rem',
                                                background: bg,
                                                border: isSelected ? '2px solid blue' : '1px solid #ddd',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                textAlign: 'center'
                                            }}
                                        >
                                            {site.site_number}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>


                    {/* Map Area */}
                    <div style={{ flex: 1, position: 'relative', background: '#ccc', overflow: 'hidden', minHeight: 0 }}>
                        <div style={{ width: '100%', height: '100%', overflow: 'auto', position: 'relative' }}>
                            <div style={{ position: 'relative', display: 'block', minWidth: '1500px', width: '100%' }}>
                                <img
                                    src={campground.map_image_url}
                                    onClick={handleMapClick}
                                    alt="Map"
                                    style={{
                                        display: 'block',
                                        cursor: selectedSiteId ? 'crosshair' : 'default',
                                        width: '100%',
                                        height: 'auto'
                                    }}
                                />
                                {sites.map(site => {
                                    if (!site.map_coordinates) return null;
                                    let c;
                                    try { c = JSON.parse(site.map_coordinates); } catch (_parseErr) { return null; }
                                    if (!c) return null;
                                    return (
                                        <div
                                            key={site.campsite_id}
                                            onClick={(e) => { e.stopPropagation(); setSelectedSiteId(selectedSiteId === site.campsite_id ? null : site.campsite_id); }}
                                            style={{
                                                position: 'absolute',
                                                left: `${c.x}%`,
                                                top: `${c.y}%`,
                                                width: '20px',
                                                height: '20px',
                                                background: orgSettings?.primary_color || 'blue',
                                                borderRadius: '50%',
                                                transform: selectedSiteId === site.campsite_id ? 'translate(-50%, -50%) scale(1.3)' : 'translate(-50%, -50%)',
                                                border: selectedSiteId === site.campsite_id ? '3px solid #FFD700' : '2px solid white',
                                                cursor: 'pointer',
                                                zIndex: selectedSiteId === site.campsite_id ? 100 : 1,
                                                boxShadow: selectedSiteId === site.campsite_id ? '0 0 15px #FFD700, 0 0 5px black' : '0 2px 4px rgba(0,0,0,0.5)'
                                            }}
                                            title={site.site_number}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Overlay Instructions */}

                    </div>


                </div>
            )}

            {/* Create Campground Modal */}
            {
                showCreateModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                    }}>
                        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', width: '400px' }}>
                            <h3>Add Campground</h3>
                            <div style={{ marginBottom: '10px' }}>
                                <label>Name:</label>
                                <input
                                    style={{ width: '100%', padding: '5px' }}
                                    value={newCampName}
                                    onChange={e => setNewCampName(e.target.value)}
                                    placeholder="e.g. North Field"
                                />
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <label>Map Image:</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setSelectedFile(e.target.files[0])}
                                    style={{ width: '100%', padding: '5px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button onClick={() => setShowCreateModal(false)} disabled={uploading} style={{ padding: '8px 16px' }}>Cancel</button>
                                <button onClick={handleCreateCampground} disabled={uploading} style={{ padding: '8px 16px', background: 'var(--primary-color, black)', color: 'white', border: 'none' }}>
                                    {uploading ? 'Uploading...' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Edit Campground Modal */}
            {
                showEditModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                    }}>
                        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', width: '400px' }}>
                            <h3>Edit Campground</h3>
                            <div style={{ marginBottom: '10px' }}>
                                <label>Name:</label>
                                <input
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                    value={editData.name}
                                    onChange={e => setEditData({ ...editData, name: e.target.value })}
                                />
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <label>Update Map Image (Optional):</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setEditFile(e.target.files[0])}
                                    style={{ width: '100%', padding: '5px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button onClick={() => setShowEditModal(false)} disabled={uploading} style={{ padding: '8px 16px' }}>Cancel</button>
                                <button onClick={submitEdit} disabled={uploading} style={{ padding: '8px 16px', background: 'var(--primary-color, black)', color: 'white', border: 'none' }}>
                                    {uploading ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Legacy Import Modal */}
            {legacyModalData && (
                <AdminLegacyImport
                    campsiteId={legacyModalData.campsiteId}
                    campsiteName={legacyModalData.campsiteName}
                    siteNumber={legacyModalData.siteNumber}
                    eventId={legacyModalData.eventId}
                    eventStartDate={legacyModalData.eventStartDate}
                    eventEndDate={legacyModalData.eventEndDate}
                    onClose={() => setLegacyModalData(null)}
                    onSuccess={() => {
                        // Refresh Data?
                        if (selectedCampgroundId) fetchCampgroundData(selectedCampgroundId);
                    }}
                />
            )}

        </div>
    );
}

export default AdminMapTool;
