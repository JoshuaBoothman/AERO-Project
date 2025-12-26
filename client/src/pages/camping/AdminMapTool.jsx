import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

function AdminMapTool() {
    const { token } = useAuth();
    const [campground, setCampground] = useState(null);
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSiteId, setSelectedSiteId] = useState(null);
    const [tempCoords, setTempCoords] = useState(null); // { x, y } in percentages

    // const CAMPGROUND_ID = 1;

    useEffect(() => {
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
                setSelectedSiteId(null);
            } else {
                alert('Failed to save coordinates');
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
            <div style={{ width: '300px', flexShrink: 0 }}>
                <h2>Map Builder</h2>
                <p>Select a site, then click on the map.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '80vh', overflowY: 'auto' }}>
                    {sites.map(site => {
                        const hasCoords = !!site.map_coordinates;
                        const isSelected = selectedSiteId === site.campsite_id;

                        // Parse existing coords for display status
                        let coordsText = 'Unmapped';
                        if (hasCoords) {
                            try {
                                const c = JSON.parse(site.map_coordinates);
                                coordsText = `${c.x}%, ${c.y}%`;
                            } catch (e) { coordsText = 'Invalid JSON'; }
                        }

                        return (
                            <div
                                key={site.campsite_id}
                                onClick={() => setSelectedSiteId(site.campsite_id)}
                                style={{
                                    padding: '10px',
                                    border: isSelected ? '2px solid blue' : '1px solid #ddd',
                                    borderRadius: '4px',
                                    background: hasCoords ? '#e6ffe6' : '#fffbc6',
                                    cursor: 'pointer'
                                }}
                            >
                                <strong>{site.site_number}</strong>
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>{coordsText}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Map Area */}
            <div style={{ flexGrow: 1, position: 'relative', border: '2px solid #333' }}>
                <img
                    src={campground.map_image_url}
                    alt="Map"
                    onClick={handleMapClick}
                    style={{
                        width: '100%',
                        display: 'block',
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
                            style={{
                                position: 'absolute',
                                left: `${c.x}%`,
                                top: `${c.y}%`,
                                width: '20px',
                                height: '20px',
                                background: 'blue',
                                borderRadius: '50%',
                                transform: 'translate(-50%, -50%)',
                                border: '2px solid white',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                pointerEvents: 'none' // Let clicks pass through to map if needed, or clickable to re-select
                            }}
                            title={site.site_number}
                        />
                    );
                })}
            </div>
        </div>
    );
}

export default AdminMapTool;
