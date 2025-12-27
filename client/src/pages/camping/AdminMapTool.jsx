import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

function AdminMapTool() {
    const { token } = useAuth();
    const [campground, setCampground] = useState(null);
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSiteId, setSelectedSiteId] = useState(null);
    const [tempCoords, setTempCoords] = useState(null); // { x, y } in percentages
    const [orgSettings, setOrgSettings] = useState(null);

    // const CAMPGROUND_ID = 1;

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/getOrganization');
                if (res.ok) {
                    const data = await res.json();
                    setOrgSettings(data);
                }
            } catch (e) { console.error(e); }
        };
        fetchSettings();
        fetchCampgrounds();
    }, []);

    const fetchCampgrounds = async () => {
        try {
            const res = await fetch('/api/campgrounds');
            if (res.ok) {
                const list = await res.json();
                if (list.length > 0) {
                    fetchData(list[0].campground_id);
                } else {
                    alert('No campgrounds found.');
                    setLoading(false);
                }
            } else {
                alert('Failed to list campgrounds');
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const fetchData = async (id) => {
        try {
            const res = await fetch(`/api/campgrounds/${id}/sites`);
            if (res.ok) {
                const data = await res.json();
                setCampground(data.campground);
                setSites(data.sites);
            } else {
                alert('Failed to load campground data');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkAdd = async (qty, prefix) => {
        if (!campground) return;
        try {
            const res = await fetch(`/api/campgrounds/${campground.campground_id}/sites`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ count: parseInt(qty), prefix })
            });
            if (res.ok) {
                fetchData(campground.campground_id);
                document.getElementById('addQty').value = '';
            } else {
                alert('Failed to add sites');
            }
        } catch (e) {
            console.error(e);
            alert('Error adding sites');
        }
    };

    const handleRename = (id, newName) => {
        setSites(prev => prev.map(s => s.campsite_id === id ? { ...s, site_number: newName } : s));
    };

    const handleNameBlur = async (id, newName) => {
        try {
            const res = await fetch(`/api/campsites/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ site_number: newName })
            });
            if (!res.ok) alert('Failed to update name');
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
            } else {
                alert('Failed to delete');
            }
        } catch (e) { console.error(e); }
    };

    const handleMapClick = (e) => {
        if (!selectedSiteId) return;

        const rect = e.target.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // Round to 1 decimal place for cleaner DB values
        const xFixed = parseFloat(x.toFixed(1));
        const yFixed = parseFloat(y.toFixed(1));

        setTempCoords({ x: xFixed, y: yFixed });

        // Auto-save or ask for confirmation? Let's auto-save for speed.
        saveCoords(selectedSiteId, { x: xFixed, y: yFixed });
    };

    const saveCoords = async (siteId, coords) => {
        try {
            const res = await fetch(`/api/campsites/${siteId}/coords`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ map_coordinates: coords })
            });

            if (res.ok) {
                // Update local state
                setSites(prev => prev.map(s =>
                    s.campsite_id === siteId
                        ? { ...s, map_coordinates: JSON.stringify(coords) }
                        : s
                ));
                setTempCoords(null);
                // setSelectedSiteId(null); // Keep selected for rapid adjustments
            } else {
                const err = await res.json();
                alert(`Failed to save coordinates: ${res.status} - ${err.error || 'Unknown error'}`);
            }
        } catch (err) {
            alert('Error saving: ' + err.message);
        }
    };

    if (loading) return <div>Loading Map Tool...</div>;
    if (!campground) return <div>Campground not found.</div>;

    return (
        <div style={{ padding: '20px', display: 'flex', gap: '20px' }}>
            {/* Sidebar List */}
            <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <h2>Map Builder</h2>
                    {/* Bulk Add Section */}
                    <div style={{ padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
                        <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Add Sites</h3>
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                            <input
                                type="number"
                                min="1"
                                placeholder="Qty"
                                id="addQty"
                                style={{ width: '50px', padding: '4px' }}
                            />
                            <input
                                type="text"
                                placeholder="Prefix"
                                id="addPrefix"
                                defaultValue="Site "
                                style={{ width: '80px', padding: '4px' }}
                            />
                            <button onClick={() => {
                                const qty = document.getElementById('addQty').value;
                                const prefix = document.getElementById('addPrefix').value;
                                if (qty) handleBulkAdd(qty, prefix);
                            }} style={{ height: '28px' }}>Add</button>
                        </div>
                    </div>
                </div>

                {selectedSiteId && (
                    <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', background: '#eef' }}>
                        <h4 style={{ margin: '0 0 10px 0' }}>Edit Selected</h4>
                        <div style={{ marginBottom: '10px' }}>
                            <input
                                type="text"
                                value={sites.find(s => s.campsite_id === selectedSiteId)?.site_number || ''}
                                onChange={(e) => handleRename(selectedSiteId, e.target.value)}
                                onBlur={(e) => handleNameBlur(selectedSiteId, e.target.value)}
                                style={{ width: '100%', marginBottom: '5px', padding: '5px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            <button onClick={() => handleUnmap(selectedSiteId)} style={{ fontSize: '0.8rem' }}>Unmap</button>
                            <button onClick={() => handleDelete(selectedSiteId)} style={{ fontSize: '0.8rem', color: 'red' }}>Delete</button>
                        </div>
                    </div>
                )}

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '8px',
                    maxHeight: '50vh',
                    overflowY: 'auto',
                    flexGrow: 1
                }}>
                    {sites.map(site => {
                        const hasCoords = !!site.map_coordinates;
                        const isSelected = selectedSiteId === site.campsite_id;

                        // Theme Colors
                        const primary = orgSettings?.primary_color || 'blue';
                        const secondary = orgSettings?.secondary_color || '#fffbc6';
                        const accent = orgSettings?.accent_color || '#e6ffe6';

                        // Logic:
                        // Unmapped: Secondary color (or default yellow if not mapped) - actually let's stick to status.
                        // Mapped: Primary tint or Green. 
                        // Selected: Border color = Primary.

                        // Let's refine based on "primary/secondary/accent" usually being Brand Colors.
                        // Primary = Main Brand (e.g. Black). Secondary = Text on primary? Accent = Highlights (Gold).

                        let bg = '#fffbc6'; // Default unmapped (Yellowish)
                        if (hasCoords) bg = accent; // Mapped = Accent (Gold?) or Green? Let's use Accent if mapped.

                        // If we want to use the org colors strictly:
                        // Unmapped = Light Grey/Secondary? Mapped = Accent. Selected = Primary Border.

                        if (orgSettings) {
                            if (hasCoords) {
                                bg = orgSettings.accent_color; // e.g. Gold
                            } else {
                                bg = orgSettings.secondary_color; // e.g. White
                            }
                        } else {
                            // Fallback
                            bg = hasCoords ? '#e6ffe6' : '#fffbc6';
                        }

                        return (
                            <div
                                key={site.campsite_id}
                                onClick={() => setSelectedSiteId(site.campsite_id)}
                                style={{
                                    aspectRatio: '1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '4px',
                                    border: isSelected ? `3px solid ${orgSettings?.primary_color || 'blue'}` : '1px solid #ddd',
                                    borderRadius: '4px',
                                    background: bg,
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    textAlign: 'center',
                                    wordBreak: 'break-word',
                                    fontWeight: isSelected ? 'bold' : 'normal',
                                    color: (hasCoords && orgSettings) ? '#000' : 'inherit' // Ensure text is visible
                                }}
                                title={site.site_number}
                            >
                                {site.site_number}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Map Area */}
            <div style={{ flexGrow: 1, position: 'relative', border: '2px solid #333', overflow: 'auto', background: '#ccc' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                        src={campground.map_image_url}
                        alt="Map"
                        onClick={handleMapClick}
                        style={{
                            display: 'block',
                            maxWidth: '100%',
                            cursor: selectedSiteId ? 'crosshair' : 'default'
                        }}
                    />

                    {/* Render Existing Pins */}
                    {sites.map(site => {
                        if (!site.map_coordinates) return null;
                        let c;
                        try { c = JSON.parse(site.map_coordinates); } catch (e) { return null; }

                        return (
                            <div
                                key={site.campsite_id}
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent map click
                                    setSelectedSiteId(site.campsite_id);
                                }}
                                style={{
                                    position: 'absolute',
                                    left: `${c.x}%`,
                                    top: `${c.y}%`,
                                    width: '20px',
                                    height: '20px',
                                    background: orgSettings?.primary_color || 'blue',
                                    borderRadius: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    border: '2px solid white',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                    pointerEvents: 'auto', // Allow clicking
                                    cursor: 'pointer'
                                }}
                                title={site.site_number}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default AdminMapTool;
