import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PublicRegistrationsReport = () => {
    const { slug } = useParams();
    const { token } = useAuth();
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ total_adults: 0, total_children: 0, total_groups: 0 });

    useEffect(() => {
        const fetchRegistrations = async () => {
            try {
                // We'll need a new API endpoint or logic to get this.
                // Assuming we might not have 'GET /api/public-registrations?eventSlug=...' yet.
                // Let's create a logic to fetch public days first, then registrations for them?
                // Or better, a dedicated endpoint. 
                // For now, let's assume `GET /api/admin/reports/public-registrations/{slug}`

                // WAIT! I haven't created this API endpoint yet.
                // I should probably create a generic report endpoint or add to `managePublicEventDays`?
                // Actually `managePublicEventDays` is for DAYS.
                // I need `GET /api/events/{slug}/public-registrations`

                const res = await fetch(`/api/events/${slug}/public-registrations`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!res.ok) throw new Error('Failed to fetch registrations');
                const data = await res.json();
                setRegistrations(data);

                // Calculate stats
                const totalGroups = data.length;
                const totalAdults = data.reduce((sum, r) => sum + r.adults_count, 0);
                const totalChildren = data.reduce((sum, r) => sum + r.children_count, 0);
                setStats({ total_groups: totalGroups, total_adults: totalAdults, total_children: totalChildren });

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (token && slug) fetchRegistrations();
    }, [slug, token]);

    if (loading) return <div className="p-4">Loading report...</div>;
    if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">Air Show Attendees</h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600 font-semibold uppercase">Total Groups</div>
                    <div className="text-2xl font-bold text-blue-900">{stats.total_groups}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-600 font-semibold uppercase">Adults</div>
                    <div className="text-2xl font-bold text-green-900">{stats.total_adults}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-purple-600 font-semibold uppercase">Children</div>
                    <div className="text-2xl font-bold text-purple-900">{stats.total_children}</div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-3 font-semibold text-gray-700">Ticket Code</th>
                            <th className="p-3 font-semibold text-gray-700">Name</th>
                            <th className="p-3 font-semibold text-gray-700">Email</th>
                            <th className="p-3 font-semibold text-gray-700">Day</th>
                            <th className="p-3 font-semibold text-gray-700">Pax</th>
                            <th className="p-3 font-semibold text-gray-700">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registrations.map((r) => (
                            <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="p-3 font-mono text-xs">{r.ticket_code}</td>
                                <td className="p-3 font-medium">{r.first_name} {r.last_name}</td>
                                <td className="p-3 text-gray-600">{r.email}</td>
                                <td className="p-3">{r.day_title}</td>
                                <td className="p-3">
                                    {r.adults_count}A, {r.children_count}C
                                </td>
                                <td className="p-3 text-gray-500">
                                    {new Date(r.created_at).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {registrations.length === 0 && (
                            <tr>
                                <td colSpan="6" className="p-4 text-center text-gray-500 italic">No registrations found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PublicRegistrationsReport;
