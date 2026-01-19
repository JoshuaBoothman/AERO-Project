import { useState, useEffect } from 'react';

/**
 * Reusable Modal for collecting Attendee Details (Pilots, Crew, etc.)
 * 
 * Props:
 * - show: boolean
 * - onClose: function
 * - onConfirm: function(attendeeDetailsMap)
 * - tickets: Array of ticket definitions [{ ticket_type_id, name, is_pilot, ... }]
 * - cart: Object { ticket_type_id: quantity } defining the slots
 * - initialDetails: Object (optional)
 * - user: Object (currentUser)
 * - myPilots: Array (optional, list of previous pilots)
 * - event: Object (optional, for MOP/rules)
 */
function AttendeeModal({
    show,
    onClose,
    onConfirm,
    tickets,
    cart,
    initialDetails = {},
    user,
    myPilots = [],
    event,
    confirmLabel = "Confirm"
}) {
    if (!show) return null;

    const [details, setDetails] = useState(initialDetails);

    // Initialize slots if empty
    useEffect(() => {
        if (Object.keys(details).length === 0 && Object.keys(cart).length > 0) {
            const initial = {};
            Object.entries(cart).forEach(([ticketId, qty]) => {
                for (let i = 0; i < qty; i++) {
                    const tempId = Math.random().toString(36).substr(2, 9);
                    initial[`${ticketId}_${i}`] = {
                        firstName: '',
                        lastName: '',
                        email: user?.email || '',
                        tempId: tempId
                    };
                }
            });
            setDetails(initial);
        }
    }, [cart, user]); // Run once when cart changes

    const handleChange = (key, field, value) => {
        setDetails(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
    };

    const handleUpload = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        return data.url;
    };

    // Plane Actions
    const updatePlane = (key, index, field, value) => {
        setDetails(prev => {
            const currentPlanes = prev[key]?.planes || [{}];
            const newPlanes = [...currentPlanes];
            if (!newPlanes[index]) newPlanes[index] = {};
            newPlanes[index] = { ...newPlanes[index], [field]: value };
            return {
                ...prev,
                [key]: { ...prev[key], planes: newPlanes }
            };
        });
    };

    const addPlane = (key) => {
        setDetails(prev => {
            const currentPlanes = prev[key]?.planes || [];
            return {
                ...prev,
                [key]: {
                    ...prev[key],
                    planes: [...currentPlanes, { make: '', model: '', rego: '', isHeavy: false }]
                }
            };
        });
    };

    const removePlane = (key, index) => {
        setDetails(prev => {
            const currentPlanes = prev[key]?.planes || [];
            const newPlanes = currentPlanes.filter((_, i) => i !== index);
            return {
                ...prev,
                [key]: { ...prev[key], planes: newPlanes }
            };
        });
    };

    // Validation & Submit
    const handleSubmit = () => {
        // Validate
        for (const [ticketTypeId, quantity] of Object.entries(cart)) {
            const ticket = tickets.find(t => (t.ticket_type_id || t.id) === parseInt(ticketTypeId));
            if (ticket?.is_pilot) {
                for (let i = 0; i < quantity; i++) {
                    const key = `${ticketTypeId}_${i}`;
                    const d = details[key] || {};
                    const label = d.firstName ? `${d.firstName} (Pilot)` : `Pilot #${i + 1}`;

                    if (!d.hasReadMop) {
                        alert(`${label}: You must read and agree to the Monitor of Procedures (MOP).`);
                        return;
                    }

                    const planes = d.planes || [{}];
                    for (const p of planes) {
                        if (p.isHeavy) {
                            if (!p.heavyCertNumber) {
                                alert(`${label}: Heavy Model requires a Certificate Number.`);
                                return;
                            }
                            if (!p.heavyCertFile) {
                                alert(`${label}: Heavy Model requires a Certificate File Upload.`);
                                return;
                            }
                        }
                    }
                }
            }
        }

        onConfirm(details);
    };

    // Reusable styles
    const inputStyle = { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' };

    return (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="modal-content bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Attendee Details</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                </div>

                {Object.entries(cart).map(([ticketId, qty]) => {
                    const ticket = tickets.find(t => (t.ticket_type_id || t.id) === parseInt(ticketId));
                    const ticketName = ticket?.name;

                    return Array.from({ length: qty }).map((_, idx) => {
                        const key = `${ticketId}_${idx}`;
                        const data = details[key] || {};

                        return (
                            <div key={key} className="mb-6 p-4 bg-gray-50 rounded border border-gray-100">
                                <h4 className="font-bold mb-3 border-b pb-2">{ticketName} #{idx + 1}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <input
                                        placeholder="First Name"
                                        value={data.firstName || ''}
                                        onChange={e => handleChange(key, 'firstName', e.target.value)}
                                        style={inputStyle}
                                    />
                                    <input
                                        placeholder="Last Name"
                                        value={data.lastName || ''}
                                        onChange={e => handleChange(key, 'lastName', e.target.value)}
                                        style={inputStyle}
                                    />
                                </div>
                                <input
                                    type="email" placeholder="Email"
                                    value={data.email || ''}
                                    onChange={e => handleChange(key, 'email', e.target.value)}
                                    style={{ ...inputStyle, marginBottom: '1rem' }}
                                />

                                {/* Pilot Fields */}
                                {ticket?.is_pilot && (
                                    <div className="mt-4 p-4 bg-white border border-gray-200 rounded">
                                        <h5 className="font-bold mb-2">✈️ Pilot & Aircraft Registration</h5>

                                        {/* MOP */}
                                        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded text-sm">
                                            <p className="mb-2 text-blue-800">
                                                Please read the Agreement.
                                                {/* <a href="#" className="underline"> View MOP</a> */}
                                            </p>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={data.hasReadMop || false}
                                                    onChange={e => handleChange(key, 'hasReadMop', e.target.checked)}
                                                />
                                                <span className="font-medium">I have read and agree to the MOP</span>
                                            </label>
                                        </div>

                                        <input
                                            placeholder="CASA License / ARN"
                                            value={data.licenseNumber || ''}
                                            onChange={e => handleChange(key, 'licenseNumber', e.target.value)}
                                            style={{ ...inputStyle, marginBottom: '1rem' }}
                                        />

                                        <h6 className="font-bold text-sm mb-2">Aircraft List</h6>
                                        {(data.planes || [{}]).map((plane, pIdx) => (
                                            <div key={pIdx} className="mb-4 pb-4 border-b border-gray-100 last:border-0">
                                                <div className="grid grid-cols-3 gap-2 mb-2">
                                                    <input placeholder="Make" value={plane.make || ''} onChange={e => updatePlane(key, pIdx, 'make', e.target.value)} style={inputStyle} />
                                                    <input placeholder="Model" value={plane.model || ''} onChange={e => updatePlane(key, pIdx, 'model', e.target.value)} style={inputStyle} />
                                                    <input placeholder="Rego" value={plane.rego || ''} onChange={e => updatePlane(key, pIdx, 'rego', e.target.value)} style={inputStyle} />
                                                </div>
                                                <label className="flex items-center gap-2 text-sm mb-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={plane.isHeavy || false}
                                                        onChange={e => updatePlane(key, pIdx, 'isHeavy', e.target.checked)}
                                                    />
                                                    Is Heavy Model (&gt; 7kg)?
                                                </label>

                                                {plane.isHeavy && (
                                                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                                                        <div className="mb-2">
                                                            <label>Height Cert #</label>
                                                            <input placeholder="Cert #" value={plane.heavyCertNumber || ''} onChange={e => updatePlane(key, pIdx, 'heavyCertNumber', e.target.value)} style={inputStyle} />
                                                        </div>
                                                        <div>
                                                            <label>Upload Certificate</label>
                                                            {plane.heavyCertFile ? (
                                                                <div className="text-green-600">✓ Uploaded <span className="text-red-500 cursor-pointer ml-2" onClick={() => updatePlane(key, pIdx, 'heavyCertFile', null)}>Remove</span></div>
                                                            ) : (
                                                                <input type="file" onChange={e => {
                                                                    if (e.target.files?.[0]) handleUpload(e.target.files[0]).then(url => updatePlane(key, pIdx, 'heavyCertFile', url));
                                                                }} />
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {(data.planes || []).length > 1 && (
                                                    <button onClick={() => removePlane(key, pIdx)} className="text-red-500 text-xs underline mt-1">Remove Plane</button>
                                                )}
                                            </div>
                                        ))}
                                        <button onClick={() => addPlane(key)} className="text-primary text-sm font-bold">+ Add Aircraft</button>
                                    </div>
                                )}
                            </div>
                        );
                    });
                })}

                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                    <button onClick={handleSubmit} className="px-6 py-2 bg-primary text-white rounded font-bold hover:brightness-110">{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
}

export default AttendeeModal;
