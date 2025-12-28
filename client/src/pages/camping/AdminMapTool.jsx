import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function AdminMapTool() {
    const { user, token } = useAuth();
    const navigate = useNavigate();

    // Route Protection
    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login');
        }
    }, [user, navigate]);

    if (!user || user.role !== 'admin') return null; // Prevent flicker

    // Selection State
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [campgrounds, setCampgrounds] = useState([]);
    const [selectedCampgroundId, setSelectedCampgroundId] = useState(null);

    // Map/Editor State
    // Map/Editor State
    const [campground, setCampground] = useState(null);
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSiteId, setSelectedSiteId] = useState(null);
    const [tempCoords, setTempCoords] = useState(null);
    const [orgSettings, setOrgSettings] = useState(null);

    // Create Campground Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newCampName, setNewCampName] = useState('');
    const [newCampMapUrl, setNewCampMapUrl] = useState('');

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

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/getOrganization');
            if (res.ok) setOrgSettings(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchEvents = async () => {
        try {
            const res = await fetch('/api/getEvents');
            if (res.ok) {
                const list = await res.json();
                setEvents(list);
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
        try {
            const res = await fetch(`/api/campgrounds/${id}/sites`);
            if (res.ok) {
                const data = await res.json();
                setCampground(data.campground);
                setSites(data.sites);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleCreateCampground = async () => {
        if (!newCampName || !selectedEventId) {
            alert('Name and Event are required');
            return;
        }
        try {
            const res = await fetch('/api/campgrounds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    event_id: selectedEventId,
                    name: newCampName,
                    map_image_url: newCampMapUrl
                })
            });
            if (res.ok) {
                setShowCreateModal(false);
                setNewCampName('');
                setNewCampMapUrl('');
                fetchCampgrounds(selectedEventId); // Refresh list
            } else {
                alert('Failed to create campground');
            }
        } catch (e) { console.error(e); }
    };

    // --- Editor Handlers (Same as before) ---

    const handleBulkAdd = async (qty, prefix) => {
        if (!selectedCampgroundId) return;
        try {
            const res = await fetch(`/api/campgrounds/${selectedCampgroundId}/sites`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ count: parseInt(qty), prefix })
            });
            if (res.ok) {
                fetchCampgroundData(selectedCampgroundId);
                document.getElementById('addQty').value = '';
            } else { alert('Failed to add sites'); }
        } catch (e) { alert('Error adding sites'); }
    };

    const handleRename = (id, newName) => {
        setSites(prev => prev.map(s => s.campsite_id === id ? { ...s, site_number: newName } : s));
    };

    const handleNameBlur = async (id, newName) => {
        try {
            await fetch(`/api/campsites/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ price_per_night: parseFloat(newPrice) })
            });
        } catch (e) { console.error(e); }
    };

    const handleUnmap = async (id) => {
        if (!window.confirm('Unmap this site?')) return;
        saveCoords(id, null);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this site?')) return;
        try {
            const res = await fetch(`/api/campsites/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setSites(prev => prev.filter(s => s.campsite_id !== id));
                setSelectedSiteId(null);
            }
        } catch (e) { console.error(e); }
    };

    const handleMapClick = (e) => {
        if (!selectedSiteId) return;
        const rect = e.target.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        const xFixed = parseFloat(x.toFixed(1));
        const yFixed = parseFloat(y.toFixed(1));
        setTempCoords({ x: xFixed, y: yFixed });
        saveCoords(selectedSiteId, { x: xFixed, y: yFixed });
    };

    const saveCoords = async (siteId, coords) => {
        try {
            const res = await fetch(`/api/campsites/${siteId}/coords`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ map_coordinates: coords })
            });
            if (res.ok) {
                setSites(prev => prev.map(s => s.campsite_id === siteId ? { ...s, map_coordinates: JSON.stringify(coords) } : s));
                setTempCoords(null);
            } else {
                const err = await res.json();
                alert(`Failed to save: ${err.error || 'Unknown error'}`);
            }
        } catch (err) { alert('Error saving: ' + err.message); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            {/* Top Toolbar */}
            <div style={{ padding: '15px', borderBottom: '1px solid #ddd', background: '#fff', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <h2>Admin Map Tool</h2>
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
                            <button
                                key={cg.campground_id}
                                onClick={() => setSelectedCampgroundId(cg.campground_id)}
                                style={{
                                    padding: '8px 16px',
                                    background: selectedCampgroundId === cg.campground_id ? 'var(--primary-color, black)' : '#eee',
                                    color: selectedCampgroundId === cg.campground_id ? 'white' : 'black',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                {cg.name}
                            </button>
                        ))}
                        <button
                            onClick={() => setShowCreateModal(true)}
                            style={{ padding: '8px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1.2rem', lineHeight: '1' }}
                            title="Add Campground"
                        >
                            +
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content */}
            {!selectedCampgroundId ? (
                <div style={{ padding: '50px', textAlign: 'center', color: '#666' }}>
                    {selectedEventId ? 'Select a campground to edit.' : 'Please select an event to get started.'}
                </div>
            ) : loading || !campground ? (
                <div style={{ padding: '50px' }}>Loading Data...</div>
            ) : (
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                    {/* Sidebar Editor */}
                    <div style={{ width: '320px', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>

                        {/* Selected Site Editor */}
                        {selectedSiteId && (
                            <div style={{ padding: '20px', background: '#eef', borderBottom: '1px solid #dde' }}>
                                <h4 style={{ marginTop: 0 }}>Editing Site</h4>
                                <div style={{ marginBottom: '10px' }}>
                                    <label style={{ fontSize: '0.8rem' }}>Name</label>
                                    <input
                                        style={{ width: '100%', padding: '5px' }}
                                        value={sites.find(s => s.campsite_id === selectedSiteId)?.site_number || ''}
                                        onChange={e => handleRename(selectedSiteId, e.target.value)}
                                        onBlur={e => handleNameBlur(selectedSiteId, e.target.value)}
                                    />
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label style={{ fontSize: '0.8rem' }}>Price</label>
                                    <input
                                        type="number"
                                        style={{ width: '100%', padding: '5px' }}
                                        value={sites.find(s => s.campsite_id === selectedSiteId)?.price_per_night || ''}
                                        onChange={e => handlePriceChange(selectedSiteId, e.target.value)}
                                        onBlur={e => handlePriceBlur(selectedSiteId, e.target.value)}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => handleUnmap(selectedSiteId)} style={{ cursor: 'pointer', padding: '5px 10px' }}>Unmap</button>
                                    <button onClick={() => handleDelete(selectedSiteId)} style={{ cursor: 'pointer', padding: '5px 10px', color: 'red' }}>Delete</button>
                                </div>
                            </div>
                        )}

                        {/* Site List */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                                {sites.map(site => {
                                    const hasCoords = !!site.map_coordinates;
                                    const isSelected = selectedSiteId === site.campsite_id;
                                    const bg = hasCoords ? (orgSettings?.accent_color || '#d4edda') : '#fff3cd';

                                    return (
                                        <div
                                            key={site.campsite_id}
                                            onClick={() => setSelectedSiteId(site.campsite_id)}
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

                        {/* Bulk Add */}
                        <div style={{ padding: '15px', borderTop: '1px solid #ddd', background: '#fff' }}>
                            <h4 style={{ margin: '0 0 10px 0' }}>Bulk Create</h4>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <input id="addQty" type="number" placeholder="Qty" style={{ width: '60px', padding: '5px' }} />
                                <input id="addPrefix" type="text" placeholder="Prefix" defaultValue="Site " style={{ flex: 1, padding: '5px' }} />
                                <button
                                    onClick={() => handleBulkAdd(
                                        document.getElementById('addQty').value,
                                        document.getElementById('addPrefix').value
                                    )}
                                    style={{ background: 'black', color: 'white', border: 'none', padding: '0 15px', cursor: 'pointer' }}
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Map Area */}
                    <div style={{ flex: 1, position: 'relative', background: '#ccc', overflow: 'hidden' }}>
                        <div style={{ width: '100%', height: '100%', overflow: 'auto', position: 'relative' }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <img
                                    src={campground.map_image_url}
                                    onClick={handleMapClick}
                                    alt="Map"
                                    style={{
                                        display: 'block',
                                        cursor: selectedSiteId ? 'crosshair' : 'default',
                                        maxWidth: '100%',  // Fix overflow
                                        // height: 'auto'     // Maintain aspect ratio
                                    }}
                                />
                                {sites.map(site => {
                                    if (!site.map_coordinates) return null;
                                    let c;
                                    try { c = JSON.parse(site.map_coordinates); } catch (e) { return null; }
                                    return (
                                        <div
                                            key={site.campsite_id}
                                            onClick={(e) => { e.stopPropagation(); setSelectedSiteId(site.campsite_id); }}
                                            style={{
                                                position: 'absolute',
                                                left: `${c.x}%`,
                                                top: `${c.y}%`,
                                                width: '20px',
                                                height: '20px',
                                                background: orgSettings?.primary_color || 'blue',
                                                borderRadius: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                border: selectedSiteId === site.campsite_id ? '2px solid yellow' : '2px solid white',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                            }}
                                            title={site.site_number}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Overlay Instructions */}
                        {selectedSiteId && (
                            <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.8)', color: 'white', padding: '5px 15px', borderRadius: '20px', pointerEvents: 'none' }}>
                                Click map to place <strong>{sites.find(s => s.campsite_id === selectedSiteId)?.site_number}</strong>
                            </div>
                        )}
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
                                <label>Map Image URL:</label>
                                <input
                                    style={{ width: '100%', padding: '5px' }}
                                    value={newCampMapUrl}
                                    onChange={e => setNewCampMapUrl(e.target.value)}
                                    placeholder="/path/to/image.png"
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button onClick={() => setShowCreateModal(false)} style={{ padding: '8px 16px' }}>Cancel</button>
                                <button onClick={handleCreateCampground} style={{ padding: '8px 16px', background: 'var(--primary-color, black)', color: 'white', border: 'none' }}>Create</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

export default AdminMapTool;
