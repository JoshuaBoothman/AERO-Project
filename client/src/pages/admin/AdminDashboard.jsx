import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [selectedCampgroundId, setSelectedCampgroundId] = useState('');

    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchStats();
    }, [selectedEventId]);

    // When stats load, set default campground if needed
    useEffect(() => {
        if (stats && stats.camping && stats.camping.length > 0 && !selectedCampgroundId) {
            setSelectedCampgroundId(stats.camping[0].campground_id);
        }
    }, [stats]);

    async function fetchStats() {
        setLoading(true);
        try {
            let url = '/api/dashboard/admin-stats';
            if (selectedEventId) {
                url += `?eventId=${selectedEventId}`;
            }

            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Auth-Token': localStorage.getItem('token') // Bypass Azure EasyAuth
                }
            });

            if (!res.ok) throw new Error('Failed to fetch dashboard stats');
            const data = await res.json();
            setStats(data);

            // If we didn't have an event selected, update state to match what API returned
            if (!selectedEventId && data.event) {
                setSelectedEventId(data.event.event_id);
            }
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const handleEventChange = (e) => {
        setSelectedEventId(e.target.value);
        // Reset campground selection so it defaults to first of new event
        setSelectedCampgroundId('');
    };

    if (loading && !stats) return <div className="json-container p-8">Loading Dashboard...</div>;
    if (error) return <div className="json-container p-8 text-red-500">Error: {error}</div>;

    if (!stats || !stats.event) return <div className="json-container p-8">No events found.</div>;

    const { event, attendees, camping, subevents, merch, assets } = stats;

    // Helpers
    const totalAttendees = attendees.reduce((acc, curr) => acc + curr.count, 0);

    // Camping Calc
    const selectedCampground = camping.find(c => c.campground_id == selectedCampgroundId) || (camping.length > 0 ? camping[0] : null);
    const totalSites = camping.reduce((acc, c) => acc + c.capacity, 0);
    // Simple "booked" metric for summary (sum of unique sites booked? backend didn't send that explicitly, it sent daily. 
    // Let's use max daily occupancy as a rough proxy for "peak booking" or just show capacity on the card)
    // Actually, let's just show Total Capacity for now on the card, and leave booking detail to the chart.

    // Subevent Calc
    const totalSubeventCap = subevents.reduce((acc, s) => acc + s.capacity, 0);
    const totalSubeventReg = subevents.reduce((acc, s) => acc + s.registered, 0);

    return (
        <div className="json-container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--accent-color)]">
                        Admin Dashboard
                    </h1>
                    <div className="flex items-center gap-4 mt-1">
                        <p className="text-gray-500">
                            Overview for <span className="font-semibold text-gray-900">{event.name}</span>
                        </p>
                        {/* Public Reports Link */}


                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-zinc-400">Switch Event:</label>
                    <select
                        value={selectedEventId}
                        onChange={handleEventChange}
                        className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent outline-none transition-all"
                    >
                        {stats.eventsList.map(e => (
                            <option key={e.event_id} value={e.event_id}>
                                {e.name} ({new Date(e.start_date).getFullYear()})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 1. ATTENDEES (Donut/List) */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-[var(--accent-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        Attendees
                    </h3>
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="text-5xl font-bold text-gray-900 mb-2 text-center">{totalAttendees}</div>
                        <div className="text-center text-gray-500 mb-6">Total Registered</div>

                        <div className="space-y-3">
                            {attendees.map(t => (
                                <div key={t.ticket_name} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                                    <span className="text-gray-700 font-medium">{t.ticket_name}</span>
                                    <span className="text-gray-900 font-bold bg-white px-2 py-1 rounded text-sm border border-gray-200">{t.count}</span>
                                </div>
                            ))}
                            {attendees.length === 0 && <div className="text-gray-400 text-center italic">No attendees yet.</div>}
                        </div>
                    </div>
                </div>

                {/* 2. CAMPING (Chart) */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-[var(--accent-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                Camping
                            </h3>
                            <Link
                                to="/admin/reports/camping"
                                className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200 font-bold hover:bg-green-100 transition-colors uppercase tracking-wide"
                            >
                                Availability Report
                            </Link>
                        </div>
                        <select
                            value={selectedCampgroundId}
                            onChange={(e) => setSelectedCampgroundId(e.target.value)}
                            className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-1 text-sm text-gray-700 outline-none focus:border-[var(--accent-color)]"
                        >
                            {camping.map(c => <option key={c.campground_id} value={c.campground_id}>{c.name}</option>)}
                            {camping.length === 0 && <option>No Campgrounds</option>}
                        </select>
                    </div>

                    {selectedCampground ? (
                        <div className="flex-1 flex flex-col">
                            <div className="flex justify-between text-sm text-gray-500 mb-4">
                                <span>Capacity: <span className="text-gray-900 font-mono">{selectedCampground.capacity}</span> sites</span>
                                <span>Daily Occupancy</span>
                            </div>

                            {/* Bar Chart Container */}
                            <div className="flex-1 flex items-end gap-2 h-48 pt-10 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                <style>{`
                                    div::-webkit-scrollbar {
                                        display: none;
                                    }
                                `}</style>
                                {selectedCampground.daily.map((day, i) => {
                                    const percent = selectedCampground.capacity > 0
                                        ? Math.min(100, (day.booked / selectedCampground.capacity) * 100)
                                        : 0;
                                    const dateLabel = new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });

                                    return (
                                        <div key={i} className="flex flex-col justify-end items-center group h-full relative min-w-[3rem]">
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none border border-white/10 shadow-lg">
                                                {day.booked} / {selectedCampground.capacity}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                                            </div>
                                            {/* Bar */}
                                            <div
                                                className="w-full bg-[var(--accent-color)] opacity-60 group-hover:opacity-80 border-t border-x border-gray-300 rounded-t-sm transition-all relative"
                                                style={{ height: `${percent}%` }}
                                            >
                                                <div className="absolute bottom-0 w-full bg-black/5 h-full animate-pulse-slow"></div>
                                            </div>
                                            {/* X Axis Label */}
                                            <div className="text-[10px] text-gray-500 mt-2 rotate-0 truncate w-full text-center">{dateLabel}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-10">No camping data available.</div>
                    )}
                </div>

                {/* 3. SUBEVENTS (Progress Bars) */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-[var(--accent-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Subevents
                    </h3>

                    <div className="flex justify-between mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{totalSubeventReg}</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Registrations</div>
                        </div>
                        <div className="text-center border-l border-gray-200 pl-6">
                            <div className="text-2xl font-bold text-gray-600">{totalSubeventCap}</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Capacity</div>
                        </div>
                    </div>

                    <div className="space-y-5 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                        {subevents.map(s => {
                            const pct = s.capacity > 0 ? (s.registered / s.capacity) * 100 : 0;
                            return (
                                <div key={s.subevent_id} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-700">{s.name}</span>
                                        <span className="text-gray-500">{s.registered} / {s.capacity}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[var(--accent-color)] rounded-full transition-all duration-1000"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {subevents.length === 0 && <div className="text-gray-400 text-center italic">No subevents.</div>}
                    </div>
                </div>

                {/* 4. FINANCIALS / ASSETS */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col gap-6">
                    {/* Merch */}
                    <div className="flex-1 bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col justify-center items-center text-center">
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-2">Merchandise</h4>
                        <div className="text-4xl font-bold text-gray-900 mb-1">
                            ${(merch.revenue || 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-[var(--primary-color)] bg-[var(--accent-color)] px-4 py-1.5 rounded-full font-bold shadow-sm">
                            {merch.items_sold} Items Sold
                        </div>
                    </div>

                    {/* Assets */}
                    <div className="flex-1 bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col justify-center items-center text-center">
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-2">Asset Hires</h4>
                        <div className="text-4xl font-bold text-gray-900 mb-1">
                            {assets.total_hires}
                        </div>
                        <div className="text-sm text-[var(--primary-color)] bg-[var(--accent-color)] px-4 py-1.5 rounded-full font-bold shadow-sm">
                            Active Bookings
                        </div>
                    </div>
                </div>

                {/* 5. AIR SHOW ATTENDEES (Public Registrations) */}
                <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5 text-[var(--accent-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            Air Show Attendees
                        </h3>
                        <p className="text-gray-500 text-sm">Overview of public ticket registrations.</p>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{stats.publicRegistrations?.total_attendees || 0}</div>
                            <div className="text-xs text-gray-500 uppercase">Total</div>
                        </div>
                        <div className="text-center border-l border-gray-200 pl-8">
                            <div className="text-2xl font-bold text-gray-900">{stats.publicRegistrations?.total_adults || 0}</div>
                            <div className="text-xs text-gray-500 uppercase">Adults</div>
                        </div>
                        <div className="text-center border-l border-gray-200 pl-8">
                            <div className="text-2xl font-bold text-gray-900">{stats.publicRegistrations?.total_children || 0}</div>
                            <div className="text-xs text-gray-500 uppercase">Children</div>
                        </div>
                    </div>

                    <Link
                        to={`/admin/reports/public-registrations/${event.slug}`}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        View Air Show Attendees
                    </Link>
                </div>

            </div>
        </div>
    );
}

export default AdminDashboard;
