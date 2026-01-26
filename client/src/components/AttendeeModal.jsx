import { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';

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

    const { notify } = useNotification();
    const [details, setDetails] = useState(initialDetails);
    const [productsMap, setProductsMap] = useState({}); // Cache for product details

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
                        phoneNumber: user?.phone || '',
                        country: 'Australia',
                        state: '',
                        tempId: tempId,
                        arrivalDate: event?.eventStartDate ? event.eventStartDate.split('T')[0] : '',
                        departureDate: event?.eventEndDate ? event.eventEndDate.split('T')[0] : ''
                    };
                }
            });
            setDetails(initial);
        }
    }, [cart, user]); // Run once when cart changes

    // Fetch Linked Products
    useEffect(() => {
        const fetchLinkedProducts = async () => {
            const neededIds = new Set();
            tickets.forEach(t => {
                if (t.includes_merch && t.linkedProductIds && Array.isArray(t.linkedProductIds)) {
                    t.linkedProductIds.forEach(pid => neededIds.add(pid));
                }
            });

            const newIds = [...neededIds].filter(id => !productsMap[id]);
            if (newIds.length === 0) return;

            const newProducts = {};
            await Promise.all(newIds.map(async (id) => {
                try {
                    const res = await fetch(`/api/products/${id}`);
                    if (res.ok) {
                        const data = await res.json();
                        newProducts[id] = data;
                    }
                } catch (err) {
                    console.error("Failed to load product", id, err);
                }
            }));

            if (Object.keys(newProducts).length > 0) {
                setProductsMap(prev => ({ ...prev, ...newProducts }));
            }
        };
        fetchLinkedProducts();
    }, [tickets, productsMap]);

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
                    planes: [...currentPlanes, { make: '', model: '', rego: '', isHeavy: true }]
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
            if (['pilot', 'junior_pilot'].includes(ticket?.system_role)) {
                for (let i = 0; i < quantity; i++) {
                    const key = `${ticketTypeId}_${i}`;
                    const d = details[key] || {};
                    const label = d.firstName ? `${d.firstName} ${d.lastName}` : `Attendee #${i + 1}`;

                    // Mandatory Fields Validation
                    const requiredFields = [
                        { field: 'firstName', name: 'First Name' },
                        { field: 'lastName', name: 'Last Name' },
                        { field: 'dateOfBirth', name: 'Date of Birth' },
                        { field: 'address', name: 'Address' },
                        { field: 'city', name: 'City' },
                        { field: 'state', name: 'State' },
                        { field: 'postcode', name: 'Postcode' },
                        { field: 'emergencyName', name: 'Emergency Contact Name' },
                        { field: 'emergencyPhone', name: 'Emergency Contact Phone' },
                        { field: 'phoneNumber', name: 'Phone Number' },
                        { field: 'arrivalDate', name: 'Arrival Date' },
                        { field: 'departureDate', name: 'Departure Date' }
                    ];

                    if (ticket.includes_merch) {
                        // Check if merch SKU is selected
                        // Also check if product selected if multiple exist
                        if (!d.merchSkuId) {
                            notify(`${label}: Please select your included Merchandise option.`, "error");
                            return;
                        }
                    }

                    for (const req of requiredFields) {
                        if (!d[req.field] || !d[req.field].trim()) {
                            notify(`${label}: Please enter ${req.name}.`, "error");
                            return;
                        }
                        if (!d[req.field] || !d[req.field].trim()) {
                            notify(`${label}: Please enter ${req.name}.`, "error");
                            return;
                        }
                    }

                    // Email Validation
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(d.email)) {
                        notify(`${label}: Please enter a valid Email Address.`, "error");
                        return;
                    }

                    // DOB Validation (Future Date Check)
                    const dobDate = new Date(d.dateOfBirth);
                    const today = new Date();
                    if (dobDate > today) {
                        notify(`${label}: Date of Birth cannot be in the future.`, "error");
                        return;
                    }


                    if (!d.hasReadMop) {
                        notify(`${label}: You must read and agree to the pilot declaration.`, "error");
                        return;
                    }

                    if (!d.licenseNumber || !d.licenseNumber.trim()) {
                        notify(`${label}: Please enter AUS Number.`, "error");
                        return;
                    }

                    if (d.bringingHeavyModels) {
                        const planes = d.planes || [{}];
                        for (const p of planes) {
                            if (!p.heavyCertNumber) {
                                notify(`${label}: Heavy Model requires a Certificate Number.`, "error");
                                return;
                            }
                            if (!p.heavyCertFile) {
                                notify(`${label}: Heavy Model requires a Certificate File Upload.`, "error");
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

                                    <input
                                        type="date"
                                        placeholder="Date of Birth"
                                        title="Date of Birth"
                                        value={data.dateOfBirth || ''}
                                        onChange={e => handleChange(key, 'dateOfBirth', e.target.value)}
                                        style={inputStyle}
                                    />
                                </div>
                                <input
                                    type="email" placeholder="Email"
                                    value={data.email || ''}
                                    onChange={e => handleChange(key, 'email', e.target.value)}
                                    style={inputStyle}
                                />
                                <input
                                    type="tel" placeholder="Phone Number"
                                    value={data.phoneNumber || ''}
                                    onChange={e => handleChange(key, 'phoneNumber', e.target.value)}
                                    style={inputStyle}
                                />


                                <h5 className="font-bold text-sm mb-2 mt-4 text-gray-700">Address & Contact</h5>
                                <div className="mb-4 space-y-3">
                                    <input
                                        placeholder="Address Line 1"
                                        value={data.address || ''}
                                        onChange={e => handleChange(key, 'address', e.target.value)}
                                        style={inputStyle}
                                    />
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        <input placeholder="City" value={data.city || ''} onChange={e => handleChange(key, 'city', e.target.value)} style={inputStyle} />

                                        {/* State Dropdown with Custom Input */}
                                        <div className="relative">
                                            <input
                                                list={`states-${key}`}
                                                placeholder="State"
                                                value={data.state || ''}
                                                onChange={e => handleChange(key, 'state', e.target.value)}
                                                style={inputStyle}
                                            />
                                            <datalist id={`states-${key}`}>
                                                {['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'].map(s => (
                                                    <option key={s} value={s} />
                                                ))}
                                            </datalist>
                                        </div>

                                        <input placeholder="Postcode" value={data.postcode || ''} onChange={e => handleChange(key, 'postcode', e.target.value)} style={inputStyle} />
                                    </div>
                                    <div className="mb-2">
                                        <input placeholder="Country" value={data.country || 'Australia'} onChange={e => handleChange(key, 'country', e.target.value)} style={inputStyle} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <input placeholder="Emergency Contact Name" value={data.emergencyName || ''} onChange={e => handleChange(key, 'emergencyName', e.target.value)} style={inputStyle} />
                                        <input placeholder="Emergency Phone" value={data.emergencyPhone || ''} onChange={e => handleChange(key, 'emergencyPhone', e.target.value)} style={inputStyle} />
                                    </div>
                                </div>

                                <h5 className="font-bold text-sm mb-2 mt-4 text-gray-700">Attendance Dates</h5>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="text-xs text-gray-500">Arrival Date</label>
                                        <input
                                            type="date"
                                            value={data.arrivalDate || ''}
                                            min={event?.eventStartDate ? event.eventStartDate.split('T')[0] : undefined}
                                            max={event?.eventEndDate ? event.eventEndDate.split('T')[0] : undefined}
                                            onChange={e => handleChange(key, 'arrivalDate', e.target.value)}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Departure Date</label>
                                        <input
                                            type="date"
                                            value={data.departureDate || ''}
                                            min={event?.eventStartDate ? event.eventStartDate.split('T')[0] : undefined}
                                            max={event?.eventEndDate ? event.eventEndDate.split('T')[0] : undefined}
                                            onChange={e => handleChange(key, 'departureDate', e.target.value)}
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h5 className="font-bold text-sm mb-2 text-gray-700">Dietary Requirements</h5>
                                    <textarea
                                        placeholder="e.g. Vegetarian, Gluten Free, Nut Allergy..."
                                        value={data.dietaryRequirements || ''}
                                        onChange={e => handleChange(key, 'dietaryRequirements', e.target.value)}
                                        style={{ ...inputStyle, height: '80px' }}
                                    />
                                </div>

                                {/* Included Merchandise Selection */}
                                {(() => {
                                    if (ticket.includes_merch && ticket.linkedProductIds && ticket.linkedProductIds.length > 0) {
                                        const linkedProducts = ticket.linkedProductIds
                                            .map(pid => productsMap[pid])
                                            .filter(p => p && p.product);

                                        if (linkedProducts.length === 0) return null;

                                        const selectedPid = data.selectedProductId || (linkedProducts.length === 1 ? linkedProducts[0].product.product_id : null);

                                        // Auto-select single option logic for render
                                        // Ideally we sync state, but for display we assume if 1, it's that one.

                                        return (
                                            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded">
                                                <h5 className="font-bold text-sm mb-2 text-purple-900">🎁 Included Merchandise</h5>

                                                {/* Product Selection (Radio) */}
                                                {linkedProducts.length > 1 && (
                                                    <div style={{ marginBottom: '0.75rem' }}>
                                                        <p style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem', color: '#4a148c' }}>Select Item:</p>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                            {linkedProducts.map(p => (
                                                                <label key={p.product.product_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                                                    <input
                                                                        type="radio"
                                                                        name={`merch_prod_${key}`}
                                                                        checked={selectedPid === p.product.product_id}
                                                                        onChange={() => {
                                                                            handleChange(key, 'selectedProductId', p.product.product_id);
                                                                            handleChange(key, 'merchSkuId', '');
                                                                        }}
                                                                    />
                                                                    <span style={{ fontWeight: selectedPid === p.product.product_id ? 'bold' : 'normal' }}>
                                                                        {p.product.name}
                                                                    </span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* SKU Selection */}
                                                {selectedPid && productsMap[selectedPid] && (
                                                    <div>
                                                        {linkedProducts.length === 1 && (
                                                            <p className="text-xs text-purple-700 mb-2">Included Item: <strong>{productsMap[selectedPid].product.name}</strong></p>
                                                        )}
                                                        <p className="text-xs text-purple-700 mb-1">Select Option:</p>
                                                        <select
                                                            style={inputStyle}
                                                            value={data.merchSkuId || ''}
                                                            onChange={e => {
                                                                if (!data.selectedProductId && linkedProducts.length === 1) {
                                                                    handleChange(key, 'selectedProductId', selectedPid);
                                                                }
                                                                handleChange(key, 'merchSkuId', e.target.value);
                                                            }}
                                                        >
                                                            <option value="">-- Select Option --</option>
                                                            {productsMap[selectedPid].skus
                                                                .filter(sku => sku.active)
                                                                .map(sku => (
                                                                    <option key={sku.id} value={sku.id}>
                                                                        {sku.description || sku.code}
                                                                    </option>
                                                                ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}

                                {/* Pilot Fields */}
                                {
                                    ['pilot', 'junior_pilot'].includes(ticket?.system_role) && (
                                        <div className="mt-4 p-4 bg-white border border-gray-200 rounded">
                                            <h5 className="font-bold mb-2">✈️ Pilot & Aircraft Registration</h5>

                                            {/* MOP */}
                                            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded text-sm">
                                                <p className="mb-2 text-blue-800">
                                                    Please read the Agreement.
                                                    {event && event.mop_url ? (
                                                        <a href={event.mop_url} target="_blank" rel="noopener noreferrer" className="underline ml-1 font-bold">
                                                            Read Pilot Declaration
                                                        </a>
                                                    ) : null}
                                                </p>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.hasReadMop || false}
                                                        onChange={e => handleChange(key, 'hasReadMop', e.target.checked)}
                                                    />
                                                    <span className="font-medium">I have read and agree to the pilot declaration</span>
                                                </label>
                                            </div>

                                            <input
                                                placeholder="AUS Number"
                                                value={data.licenseNumber || ''}
                                                onChange={e => handleChange(key, 'licenseNumber', e.target.value)}
                                                style={{ ...inputStyle, marginBottom: '1rem' }}
                                            />

                                            {/* Flight Line Duties (New) */}
                                            {/* Flight Line Duties - ONLY FOR PILOTS, NOT JUNIOR PILOTS */}
                                            {ticket.system_role === 'pilot' && (
                                                <div className="mb-4">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={data.flightLineDuties || false}
                                                            onChange={e => handleChange(key, 'flightLineDuties', e.target.checked)}
                                                        />
                                                        <div>
                                                            <span className="font-medium text-sm">I agree to perform flight line duties</span>
                                                            {ticket.price_no_flight_line && (
                                                                <div className="text-xs mt-1">
                                                                    {data.flightLineDuties ? (
                                                                        <span className="text-green-600 font-bold">Price: ${Number(ticket.price).toFixed(2)} (Standard)</span>
                                                                    ) : (
                                                                        <span className="text-amber-600 font-bold">Price: ${Number(ticket.price_no_flight_line).toFixed(2)} (No Duties Surcharge)</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </label>
                                                </div>
                                            )}

                                            {/* Heavy Models Toggle */}
                                            <div className="mb-4 space-y-3">
                                                {/* Are you bringing heavy models? */}
                                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                                                    <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                                                        <input
                                                            type="checkbox"
                                                            checked={data.bringingHeavyModels || false}
                                                            onChange={e => {
                                                                const newVal = e.target.checked;
                                                                handleChange(key, 'bringingHeavyModels', newVal);
                                                                if (newVal) {
                                                                    handleChange(key, 'isHeavyModelInspector', false); // Mutually exclusive UI flow usually
                                                                }
                                                            }}
                                                        />
                                                        Are you bringing any Heavy Models?
                                                    </label>
                                                </div>

                                                {/* Are you a heavy model inspector? */}
                                                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                                                    <label className="block text-xs font-bold text-blue-900 mb-1">Are you a Heavy Model Inspector?</label>
                                                    <select
                                                        style={inputStyle}
                                                        value={data.isHeavyModelInspector ? "Yes" : "No"}
                                                        onChange={e => {
                                                            const isInspector = e.target.value === "Yes";
                                                            handleChange(key, 'isHeavyModelInspector', isInspector);
                                                            if (isInspector) {
                                                                // If inspector, hide planes? Assumption: Inspectors don't register planes HERE, or it hides the requirement.
                                                                // User request: "if is_heavy_model_inspector = True, the plane section should be hidden."
                                                                handleChange(key, 'bringingHeavyModels', false);
                                                            }
                                                        }}
                                                    >
                                                        <option value="No">No</option>
                                                        <option value="Yes">Yes</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Aircraft List - Only if Bringing Heavy Models AND Not Inspector (Logic implies hidden if Inspector) */}
                                            {data.bringingHeavyModels && !data.isHeavyModelInspector && (
                                                <div>
                                                    <h6 className="font-bold text-sm mb-2">Heavy Aircraft List</h6>
                                                    {(data.planes || [{}]).map((plane, pIdx) => (
                                                        <div key={pIdx} className="mb-4 pb-4 border-b border-gray-100 last:border-0">
                                                            <div className="grid grid-cols-3 gap-2 mb-2">
                                                                <input placeholder="Make" value={plane.make || ''} onChange={e => updatePlane(key, pIdx, 'make', e.target.value)} style={inputStyle} />
                                                                <input placeholder="Model" value={plane.model || ''} onChange={e => updatePlane(key, pIdx, 'model', e.target.value)} style={inputStyle} />
                                                                <input placeholder="Rego" value={plane.rego || ''} onChange={e => updatePlane(key, pIdx, 'rego', e.target.value)} style={inputStyle} />
                                                            </div>

                                                            {/* Forced Heavy Fields */}
                                                            <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm">
                                                                <div className="mb-2">
                                                                    <label className="block text-xs font-bold mb-1">Heavy Model Cert #</label>
                                                                    <input placeholder="Cert #" value={plane.heavyCertNumber || ''} onChange={e => updatePlane(key, pIdx, 'heavyCertNumber', e.target.value)} style={inputStyle} />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-bold mb-1">Upload Certificate</label>
                                                                    {plane.heavyCertFile ? (
                                                                        <div className="text-green-600">✓ Uploaded <span className="text-red-500 cursor-pointer ml-2 hover:underline" onClick={() => updatePlane(key, pIdx, 'heavyCertFile', null)}>Remove</span></div>
                                                                    ) : (
                                                                        <input type="file" onChange={e => {
                                                                            if (e.target.files?.[0]) handleUpload(e.target.files[0]).then(url => updatePlane(key, pIdx, 'heavyCertFile', url));
                                                                        }} />
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {(data.planes || []).length > 1 && (
                                                                <button onClick={() => removePlane(key, pIdx)} className="text-red-500 text-xs underline mt-1">Remove Plane</button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <button onClick={() => addPlane(key)} className="text-primary text-sm font-bold">+ Add Aircraft</button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                }

                                {
                                    ticket?.system_role === 'pit_crew' && (
                                        <div className="mt-4 p-4 bg-white border border-gray-200 rounded">
                                            <h5 className="font-bold mb-2">🏁 Pit Crew Registration</h5>

                                            {(() => {
                                                // Calculate available pilots (Existing + In Cart)
                                                // 1. Existing Pilots
                                                const existingPilots = myPilots.map(p => ({
                                                    id: p.attendee_id,
                                                    name: `${p.first_name} ${p.last_name}`,
                                                    isNew: false
                                                }));

                                                // 2. Pilots in Cart
                                                const newPilots = [];
                                                Object.entries(cart).forEach(([tId, q]) => {
                                                    const t = tickets.find(ticket => (ticket.ticket_type_id || ticket.id) === parseInt(tId));
                                                    if (['pilot', 'junior_pilot'].includes(t?.system_role)) {
                                                        for (let i = 0; i < q; i++) {
                                                            const pKey = `${tId}_${i}`;
                                                            const pDetails = details[pKey];
                                                            if (pDetails) {
                                                                const pName = (pDetails.firstName || pDetails.lastName)
                                                                    ? `${pDetails.firstName} ${pDetails.lastName}`.trim()
                                                                    : `Pilot #${i + 1}`;
                                                                newPilots.push({
                                                                    tempId: pDetails.tempId,
                                                                    name: `${pName} (In Cart)`,
                                                                    isNew: true
                                                                });
                                                            }
                                                        }
                                                    }
                                                });

                                                const allPilots = [...existingPilots, ...newPilots];

                                                if (allPilots.length === 0) {
                                                    return (
                                                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                                                            <strong>Warning:</strong> You must have a registered Pilot to be a Pit Crew member.
                                                            Please indicate which Pilot you are crewing for. If the Pilot is new, please add their ticket to your cart first.
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div className="mb-4">
                                                        <label className="block text-sm font-bold text-gray-700 mb-1">Select Pilot you are crewing for *</label>
                                                        <select
                                                            style={inputStyle}
                                                            value={
                                                                data.linkedPilotTempId ? `new:${data.linkedPilotTempId}` :
                                                                    data.linkedPilotAttendeeId ? `existing:${data.linkedPilotAttendeeId}` :
                                                                        ""
                                                            }
                                                            onChange={e => {
                                                                const val = e.target.value;
                                                                if (!val) {
                                                                    handleChange(key, 'linkedPilotAttendeeId', null);
                                                                    handleChange(key, 'linkedPilotTempId', null);
                                                                    return;
                                                                }
                                                                const [type, id] = val.split(':');
                                                                if (type === 'existing') {
                                                                    handleChange(key, 'linkedPilotAttendeeId', parseInt(id));
                                                                    handleChange(key, 'linkedPilotTempId', null);
                                                                } else {
                                                                    handleChange(key, 'linkedPilotAttendeeId', null);
                                                                    handleChange(key, 'linkedPilotTempId', id);
                                                                }
                                                            }}
                                                        >
                                                            <option value="">-- Select Pilot --</option>
                                                            {allPilots.map(p => (
                                                                <option key={p.isNew ? `new:${p.tempId}` : `existing:${p.id}`} value={p.isNew ? `new:${p.tempId}` : `existing:${p.id}`}>
                                                                    {p.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Pit Crew members must be linked to a specific Pilot.
                                                        </p>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )
                                }
                            </div>
                        );
                    });
                })}

                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                    <button onClick={handleSubmit} className="px-6 py-2 bg-primary text-white rounded font-bold hover:brightness-110">{confirmLabel}</button>
                </div>
            </div>
        </div >
    );
}

export default AttendeeModal;
