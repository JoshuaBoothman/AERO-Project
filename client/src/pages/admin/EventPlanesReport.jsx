import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FileText, ArrowLeft, Download, Eye } from 'lucide-react';

const EventPlanesReport = () => {
    const { eventId } = useParams();
    const { token } = useAuth();
    const [planes, setPlanes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPlanes = async () => {
            try {
                // Use the new endpoint
                const res = await fetch(`/api/manual/reports/event-planes?eventId=${eventId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Auth-Token': token
                    }
                });

                if (!res.ok) throw new Error('Failed to fetch event planes');
                const data = await res.json();
                setPlanes(data);

            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (token && eventId) fetchPlanes();
    }, [eventId, token]);

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-color)]"></div>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg border border-red-200 mx-auto max-w-2xl mt-8">
            <h3 className="font-bold mb-2">Error Loading Report</h3>
            <p>{error}</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link to="/admin" className="text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-2 text-sm">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-[var(--accent-color)]">Event Planes Report</h1>
                    <p className="text-gray-500">Overview of all planes attending this event.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm text-sm font-medium text-gray-700">
                    Total Planes: <span className="font-bold text-[var(--accent-color)] ml-1">{planes.length}</span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700">Pilot Name</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Plane Name</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Model</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Weight (kg)</th>

                                <th className="px-6 py-4 font-semibold text-gray-700 text-center">Certificate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {planes.map((plane) => (
                                <tr key={plane.plane_id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {plane.first_name} {plane.last_name}
                                        <div className="text-xs text-gray-400 font-normal">{plane.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700">{plane.plane_name}</td>
                                    <td className="px-6 py-4 text-gray-600">{plane.model_type}</td>
                                    <td className="px-6 py-4 font-mono text-gray-600">{plane.weight_kg ? Number(plane.weight_kg).toFixed(2) : '-'}</td>

                                    <td className="px-6 py-4 text-center">
                                        {plane.heavy_model_cert_image_url ? (
                                            <a
                                                href={plane.heavy_model_cert_image_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-[var(--accent-color)] hover:border-[var(--accent-color)] transition-all"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                View Cert
                                            </a>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">No Cert Uploaded</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {planes.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400 italic">
                                        No planes found for attendees of this event.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EventPlanesReport;
