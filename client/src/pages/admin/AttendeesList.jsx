import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Search, RotateCw, X } from 'lucide-react';

function AttendeesList() {
    const { slug } = useParams();
    const { user } = useAuth();

    // Data State
    const [attendees, setAttendees] = useState([]);
    const [eventName, setEventName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ticketTypes, setTicketTypes] = useState([]);

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [ticketTypeFilter, setTicketTypeFilter] = useState('All');
    const [stateFilter, setStateFilter] = useState('All');
    const [dutiesFilter, setDutiesFilter] = useState('All');
    const [heavyFilter, setHeavyFilter] = useState('All');
    const [dinnerFilter, setDinnerFilter] = useState('All');

    // Fetch Logic
    const fetchAttendees = useCallback(async () => {
        if (!user || !slug) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (ticketTypeFilter !== 'All') params.append('ticketType', ticketTypeFilter);
            if (stateFilter !== 'All') params.append('state', stateFilter);
            if (dutiesFilter !== 'All') params.append('duties', dutiesFilter);
            if (heavyFilter !== 'All') params.append('heavyModel', heavyFilter);
            if (dinnerFilter !== 'All') params.append('dinner', dinnerFilter);

            const res = await fetch(`/api/manage/attendees/${slug}?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                }
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to fetch attendees');
            }

            const data = await res.json();
            setAttendees(data.attendees);
            setEventName(data.eventName);

            // Extract unique ticket types for filter if not already set (or just rely on distinct from list)
            // Ideally we fetch ticket types separately or just derive. 
            // Deriving from current list handles "only what's here" but separate fetch handles "what's possible".
            // For simplicity, let's derive from unique items in list + maybe a separate call if needed.
            // Actually, best to just use unique values found in data for now to avoid extra calls.
            if (data.attendees.length > 0) {
                // We can build a unique list of ticket types from the response
                // But wait, if we filter, we lose others. 
                // So maybe we should just persist the full list if we had it, or be fine with only showing what matches current search.
                // Better pattern: fetch ticket types for event separately? 
                // Or just let backend filter handle ID and frontend display names found.
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user, slug, searchTerm, ticketTypeFilter, stateFilter, dutiesFilter, heavyFilter, dinnerFilter]);

    // Initial Fetch & Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchAttendees();
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchAttendees]);

    // Extract Ticket Types for Dropdown (from all attendees if possible, or just unique from current view?)
    // This is tricky if pagination exists, but here we return ALL attendees (no pagination in API).
    // So we can compute unique ticket types from `attendees`... INVALID if we are already filtering.
    // Ideally we assume `attendees` is the filtered list.
    // To support filter dropdown correctly, we might need a separate list of ticket types.
    // For now, let's just hardcode or fetch if needed. 
    // Let's Fetch Ticket Types for this event once.
    useEffect(() => {
        const fetchTicketTypes = async () => {
            // We can reuse getEventTicketTypes public endpoint if available, but it needs ID not slug usually.
            // Or just /api/events/{slug}/ticket-types
            try {
                const res = await fetch(`/api/events/${slug}`);
                if (res.ok) {
                    const data = await res.json();
                    setTicketTypes(data.tickets || []);
                }
            } catch (err) { console.error('Failed to fetch ticket types:', err); }
        };
        fetchTicketTypes();
    }, [slug]);


    const handleResetFilters = () => {
        setSearchTerm('');
        setTicketTypeFilter('All');
        setStateFilter('All');
        setDutiesFilter('All');
        setHeavyFilter('All');
        setDinnerFilter('All');
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Attendees: {eventName}</h1>
                    <p className="text-gray-500 text-sm">Manage and view all registered attendees</p>
                </div>
                <button
                    onClick={fetchAttendees}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                    <RotateCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Name, Email, AUS #..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Reset */}
                    <div className="flex items-end">
                        <button onClick={handleResetFilters} className="px-4 py-2 text-red-600 border border-red-200 bg-red-50 rounded hover:bg-red-100 transition-colors flex items-center gap-2">
                            <X size={16} /> Reset
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ticket Type</label>
                        <select
                            value={ticketTypeFilter}
                            onChange={e => setTicketTypeFilter(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded outline-none focus:border-blue-500"
                        >
                            <option value="All">All Tickets</option>
                            {ticketTypes.map(t => (
                                <option key={t.ticket_type_id} value={t.ticket_type_id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">State</label>
                        <select
                            value={stateFilter}
                            onChange={e => setStateFilter(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded outline-none focus:border-blue-500"
                        >
                            <option value="All">All States</option>
                            <option value="ACT">ACT</option>
                            <option value="NSW">NSW</option>
                            <option value="NT">NT</option>
                            <option value="QLD">QLD</option>
                            <option value="SA">SA</option>
                            <option value="TAS">TAS</option>
                            <option value="VIC">VIC</option>
                            <option value="WA">WA</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Flight Line</label>
                        <select
                            value={dutiesFilter}
                            onChange={e => setDutiesFilter(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded outline-none focus:border-blue-500"
                        >
                            <option value="All">Any</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Heavy Model</label>
                        <select
                            value={heavyFilter}
                            onChange={e => setHeavyFilter(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded outline-none focus:border-blue-500"
                        >
                            <option value="All">Any</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dinner</label>
                        <select
                            value={dinnerFilter}
                            onChange={e => setDinnerFilter(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded outline-none focus:border-blue-500"
                        >
                            <option value="All">Any</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            {error && <div className="p-4 bg-red-100 text-red-700 rounded mb-4">{error}</div>}

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-3 text-xs font-bold text-gray-500 uppercase">Name / Contact</th>
                                <th className="p-3 text-xs font-bold text-gray-500 uppercase">Ticket</th>
                                <th className="p-3 text-xs font-bold text-gray-500 uppercase">Location</th>
                                <th className="p-3 text-xs font-bold text-gray-500 uppercase">AUS #</th>
                                <th className="p-3 text-xs font-bold text-gray-500 uppercase text-center">Dinner</th>
                                <th className="p-3 text-xs font-bold text-gray-500 uppercase text-center">Inspec.</th>
                                <th className="p-3 text-xs font-bold text-gray-500 uppercase text-center">Duties</th>
                                <th className="p-3 text-xs font-bold text-gray-500 uppercase text-center">Heavy</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="8" className="p-8 text-center text-gray-500">Loading attendees...</td></tr>
                            ) : attendees.length === 0 ? (
                                <tr><td colSpan="8" className="p-8 text-center text-gray-500">No attendees found.</td></tr>
                            ) : (
                                attendees.map(a => (
                                    <tr key={a.attendee_id} className="hover:bg-gray-50">
                                        <td className="p-3">
                                            <div className="font-bold text-gray-900">{a.first_name} {a.last_name}</div>
                                            <div className="text-xs text-gray-500">{a.email}</div>
                                            <div className="text-xs text-gray-400">{a.mobile}</div>
                                        </td>
                                        <td className="p-3">
                                            <span className="text-sm text-gray-700">{a.ticket_name}</span>
                                            {a.status !== 'Registered' && (
                                                <span className="ml-2 px-1 py-0.5 text-xs bg-red-100 text-red-800 rounded">{a.status}</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-sm text-gray-600">
                                            <div>{a.city}, {a.state}</div>
                                            {a.camping_required ? <div className="text-xs text-green-600 font-bold">⛺ Camping</div> : null}
                                        </td>
                                        <td className="p-3 text-sm font-mono text-gray-700">
                                            {a.aus_number || '-'}
                                        </td>

                                        {/* Boolean Flags */}
                                        <td className="p-3 text-center">
                                            {a.attending_dinner ? (
                                                <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Yes</span>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            {a.is_heavy_model_inspector ? (
                                                <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Insp</span>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            {a.flight_line_duties ? (
                                                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Yes</span>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            {a.has_heavy_model === 'Yes' ? (
                                                <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">Yes</span>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-2 border-t text-xs text-gray-400 text-right">
                    Showing {attendees.length} attendees
                </div>
            </div>
        </div>
    );
}

export default AttendeesList;
