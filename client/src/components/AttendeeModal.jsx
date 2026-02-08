import { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import { formatDateForDisplay } from '../utils/dateHelpers';

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
    token,
    myPilots = [],
    event,
    confirmLabel = "Confirm"
}) {


    const { notify } = useNotification();

    // Helper to get email from token if user object is missing it
    const getUserEmail = () => {
        if (user?.email) return user.email;
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                return JSON.parse(jsonPayload).email || '';
            } catch (e) {
                console.error("Failed to decode token email", e);
                return '';
            }
        }
        return '';
    };

    const userEmail = getUserEmail();
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
                        email: '', // CHANGED: Do not auto-fill user email to prevent overwrites
                        phoneNumber: user?.phone || '',
                        country: 'Australia',
                        state: '',
                        tempId: tempId,
                        arrivalDate: '',
                        departureDate: ''
                    };
                }
            });
            setDetails(initial);
        }
        // eslint-disable-next-line
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
            const currentPlanes = prev[key]?.planes || [{ isHeavy: true }];
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

            for (let i = 0; i < quantity; i++) {
                const key = `${ticketTypeId}_${i}`;
                const d = details[key] || {};
                const label = d.firstName ? `${d.firstName} ${d.lastName}` : `Attendee #${i + 1}`;

                // Common Mandatory Fields for ALL Tickets
                const requiredFields = [
                    { field: 'firstName', name: 'First Name' },
                    { field: 'lastName', name: 'Last Name' },
                    { field: 'dateOfBirth', name: 'Date of Birth' },
                    { field: 'address', name: 'Address' },
                    { field: 'city', name: 'City' },
                    { field: 'state', name: 'State' },
                    { field: 'postcode', name: 'Postcode' },
                    { field: 'country', name: 'Country' },
                    { field: 'emergencyName', name: 'Emergency Contact Name' },
                    { field: 'emergencyPhone', name: 'Emergency Contact Phone' },
                    { field: 'phoneNumber', name: 'Phone Number' },
                    { field: 'arrivalDate', name: 'Arrival Date' },
                    { field: 'departureDate', name: 'Departure Date' }
                ];

                for (const req of requiredFields) {
                    if (!d[req.field] || !d[req.field].trim()) {
                        notify(`${label}: Please enter ${req.name}.`, "error");
                        return;
                    }
                }

                // Date Range Validation (Strict)
                if (event && event.eventStartDate && event.eventEndDate) {
                    const eventStart = event.eventStartDate.split('T')[0];
                    const eventEnd = event.eventEndDate.split('T')[0];

                    if (d.arrivalDate < eventStart) {
                        notify(`${label}: Arrival date cannot be before ${formatDateForDisplay(event.eventStartDate)}`, "error");
                        return;
                    }
                    if (d.departureDate > eventEnd) {
                        notify(`${label}: Departure date cannot be after ${formatDateForDisplay(event.eventEndDate)}`, "error");
                        return;
                    }
                    if (d.arrivalDate > d.departureDate) {
                        notify(`${label}: Arrival date cannot be after Departure date.`, "error");
                        return;
                    }
                }

                // Email Validation (Optional for Guests)
                if (d.email && d.email.trim() !== '') {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(d.email)) {
                        notify(`${label}: Please enter a valid Email Address.`, "error");
                        return;
                    }
                }
                // PROFILE OVERWRITE PROTECTION
                // If the user enters THEIR OWN email, they must be entering THEIR OWN name.
                if (userEmail && d.email && d.email.toLowerCase() === userEmail.toLowerCase()) {
                    const uFirst = (user.firstName || '').toLowerCase();
                    const uLast = (user.lastName || '').toLowerCase();
                    const pFirst = d.firstName.toLowerCase();
                    const pLast = d.lastName.toLowerCase();

                    // Check if name is significantly different
                    // Allowing simple variations (e.g. Josh vs Joshua), but blocking "Bingo"
                    if (uFirst && pFirst && uFirst.slice(0, 2) !== pFirst.slice(0, 2)) {
                        notify(`Do not use your email (${userEmail}) for other attendees. Either enter the attendee's email address or leave blank if they don't have one.`, "error");
                        return;
                    }
                }

                // DOB Validation (Future Date Check)
                const dobDate = new Date(d.dateOfBirth);
                const today = new Date();
                if (dobDate > today) {
                    notify(`${label}: Date of Birth cannot be in the future.`, "error");
                    return;
                }

                // Merch Check
                if (ticket.includes_merch) {
                    if (!d.merchSkuId) {
                        notify(`${label}: Please select your included Merchandise option.`, "error");
                        return;
                    }
                }

                // Pilot Specific Validation
                if (['pilot', 'junior_pilot'].includes(ticket?.system_role)) {
                    if (!d.hasReadMop) {
                        notify(`${label}: You must read and agree to the pilot declaration.`, "error");
                        return;
                    }

                    if (!d.licenseNumber || !d.licenseNumber.trim()) {
                        notify(`${label}: Please enter AUS Number.`, "error");
                        return;
                    }

                    if (d.bringingHeavyModels && !d.isHeavyModelInspector) {
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

                // Pit Crew Specific Validation
                if (ticket?.system_role === 'pit_crew') {
                    if (d.pilotEntryMode === 'manual') {
                        if (!d.pilotName || !d.pilotName.trim()) {
                            notify(`${label}: Please enter Pilot Name.`, "error");
                            return;
                        }
                    } else {
                        if (!d.linkedPilotAttendeeId && !d.linkedPilotTempId) {
                            notify(`${label}: Please select a Pilot to crew for.`, "error");
                            return;
                        }
                    }
                }
            }
        }

        onConfirm(details);
    };

    // Reusable styles
    const inputStyle = { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' };

    if (!show) return null;

    return (
        <div className="modal-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
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
                                <div className="flex justify-between items-center border-b pb-2 mb-3">
                                    <h4 className="font-bold">{ticketName} #{idx + 1}</h4>
                                    <button
                                        onClick={() => {
                                            setDetails(prev => ({
                                                ...prev,
                                                [key]: {
                                                    ...prev[key],
                                                    firstName: user.firstName || '',
                                                    lastName: user.lastName || '',
                                                    email: userEmail, // Use resolved email (from user obj or token)
                                                    phoneNumber: user.phone || '',
                                                    address: user.address || prev[key].address,
                                                    city: user.city || prev[key].city,
                                                    state: user.state || prev[key].state,
                                                    postcode: user.postcode || prev[key].postcode,
                                                    country: user.country || 'Australia'
                                                }
                                            }));
                                        }}
                                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                                    >
                                        I am this attendee
                                    </button>
                                </div>
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

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            Date of Birth
                                        </label>
                                        <input
                                            type="date"
                                            placeholder="Date of Birth"
                                            title="Date of Birth"
                                            value={data.dateOfBirth || ''}
                                            onChange={e => handleChange(key, 'dateOfBirth', e.target.value)}
                                            style={inputStyle}
                                        />
                                    </div>
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

                                {/* Day Pass Price Preview */}
                                {(() => {
                                    if (!ticket.is_day_pass || !data.arrivalDate || !data.departureDate) {
                                        return null;
                                    }

                                    const arrival = new Date(data.arrivalDate);
                                    const departure = new Date(data.departureDate);
                                    const dayCount = Math.ceil((departure - arrival) / (1000 * 60 * 60 * 24)) + 1;
                                    const totalPrice = ticket.price * dayCount;

                                    return (
                                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                                            <h5 className="font-bold text-sm mb-1 text-green-900">💰 Day Pass Pricing</h5>
                                            <div className="text-sm text-green-800">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{dayCount} {dayCount === 1 ? 'day' : 'days'}</span>
                                                    <span>×</span>
                                                    <span className="font-medium">${Number(ticket.price).toFixed(2)}/day</span>
                                                    <span>=</span>
                                                    <span className="font-bold text-green-900 text-base">${totalPrice.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}


                                {event?.dinner_date && !ticket.is_day_pass && (
                                    <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded">
                                        <h5 className="font-bold text-sm mb-2 text-indigo-900">🍽️ Official Dinner</h5>
                                        <label className="flex items-center gap-2 cursor-pointer text-indigo-900 font-medium">
                                            <input
                                                type="checkbox"
                                                checked={data.attendingDinner || false}
                                                onChange={e => handleChange(key, 'attendingDinner', e.target.checked)}
                                            />
                                            I will be attending (tick if yes) - Official Dinner on {new Date(event.dinner_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} (free with this ticket)
                                        </label>
                                    </div>
                                )}

                                {!ticket.is_day_pass && data.attendingDinner && (
                                    <div className="mb-4">
                                        <h5 className="font-bold text-sm mb-2 text-gray-700">Dietary Requirements</h5>
                                        <textarea
                                            placeholder="e.g. Vegetarian, Gluten Free, Nut Allergy..."
                                            value={data.dietaryRequirements || ''}
                                            onChange={e => handleChange(key, 'dietaryRequirements', e.target.value)}
                                            style={{ ...inputStyle, height: '80px' }}
                                        />
                                    </div>
                                )}

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
                                                <h5 className="font-bold text-sm mb-2 text-purple-900">🎁 Included Merchandise (free with this ticket)</h5>

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
                                {/* Flight Line Duties Section (Moved from inside Pilot & Aircraft Registration) */}
                                {ticket.system_role === 'pilot' && (() => {
                                    // Calculate duration for Day Pass visibility check
                                    let showFlightLine = true;
                                    if (ticket.is_day_pass && data.arrivalDate && data.departureDate) {
                                        const arrival = new Date(data.arrivalDate);
                                        const departure = new Date(data.departureDate);
                                        const daysDiff = Math.ceil((departure - arrival) / (1000 * 60 * 60 * 24)) + 1; // +1 for inclusive
                                        showFlightLine = daysDiff >= 3;
                                    }

                                    if (!showFlightLine) return null;

                                    return (
                                        <div className="mb-6 p-4 bg-white border border-gray-200 rounded shadow-sm">
                                            <h5 className="font-bold mb-3 text-lg border-b pb-2">Flight Line Duties</h5>

                                            <p className="text-sm text-gray-600 mb-4">
                                                Please select your preference regarding flight line duties.
                                            </p>

                                            <div className="space-y-3">
                                                {/* Option 1: Agree */}
                                                <label className={`flex items-center justify-between p-3 border rounded cursor-pointer transition-colors ${data.flightLineDuties !== false ? 'bg-green-50 border-green-500 ring-1 ring-green-500' : 'border-gray-300 hover:border-green-300'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="radio"
                                                            name={`fld_${key}`}
                                                            checked={data.flightLineDuties !== false}
                                                            onChange={() => handleChange(key, 'flightLineDuties', true)}
                                                            className="w-5 h-5 text-green-600"
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-800">I agree to perform flight line duties</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block font-bold text-green-600 text-lg">
                                                            ${Number(ticket.price).toFixed(2)}
                                                        </span>
                                                        <span className="text-xs text-gray-400">Standard Price</span>
                                                    </div>
                                                </label>

                                                {/* Option 2: Disagree */}
                                                <label className={`flex items-center justify-between p-3 border rounded cursor-pointer transition-colors ${data.flightLineDuties === false ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500' : 'border-gray-300 hover:border-amber-300'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="radio"
                                                            name={`fld_${key}`}
                                                            checked={data.flightLineDuties === false}
                                                            onChange={() => handleChange(key, 'flightLineDuties', false)}
                                                            className="w-5 h-5 text-amber-600"
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-800">I DO NOT agree</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block font-bold text-amber-600 text-lg">
                                                            ${Number(ticket.price_no_flight_line || ticket.price).toFixed(2)}
                                                        </span>
                                                        {ticket.price_no_flight_line && (
                                                            <span className="text-xs text-gray-400">Includes Surcharge</span>
                                                        )}
                                                    </div>
                                                </label>
                                            </div>

                                            {ticket.is_day_pass && (
                                                <div className="mt-2 text-xs text-gray-500 italic">
                                                    * Day Pass tickets have fixed per-day pricing.
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

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

                                            {/* Flight Line Duties Logic Moved Above */}

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
                                                        I am bringing Heavy Models
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
                                                            // Logic Update: We longer uncheck bringingHeavyModels here.
                                                            // The UI below simply hides the plane list if inspector is true.
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

                                            {/* AUS Number & Flight Line Duties */}
                                            <div className="mb-4">
                                                <label className="block text-sm font-bold text-gray-700 mb-1">AUS Number (Optional)</label>
                                                <input
                                                    placeholder="AUS Number"
                                                    value={data.licenseNumber || ''}
                                                    onChange={e => handleChange(key, 'licenseNumber', e.target.value)}
                                                    style={inputStyle}
                                                />
                                            </div>

                                            {data.licenseNumber && data.licenseNumber.trim().length > 0 && (
                                                <div className="mb-4 bg-green-50 p-3 rounded border border-green-100">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={data.flightLineDuties || false}
                                                            onChange={e => handleChange(key, 'flightLineDuties', e.target.checked)}
                                                        />
                                                        <div>
                                                            <span className="font-medium text-sm text-green-900">I agree to perform flight line duties</span>
                                                            <div className="text-xs mt-1 text-green-700">
                                                                Thank you for volunteering! This helps us run a safe event.
                                                            </div>
                                                        </div>
                                                    </label>
                                                </div>
                                            )}

                                            <div className="border-t border-gray-100 my-4 pt-2"></div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Pilot Association</label>
                                            <div className="flex gap-4 mb-3 text-sm">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={`pilot_mode_${key}`}
                                                        checked={data.pilotEntryMode !== 'manual'}
                                                        onChange={() => {
                                                            handleChange(key, 'pilotEntryMode', 'link');
                                                            handleChange(key, 'pilotName', '');
                                                        }}
                                                    />
                                                    Link to Registered Pilot
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={`pilot_mode_${key}`}
                                                        checked={data.pilotEntryMode === 'manual'}
                                                        onChange={() => {
                                                            handleChange(key, 'pilotEntryMode', 'manual');
                                                            handleChange(key, 'linkedPilotAttendeeId', null);
                                                            handleChange(key, 'linkedPilotTempId', null);
                                                        }}
                                                    />
                                                    Enter Pilot Name Manually
                                                </label>
                                            </div>

                                            {data.pilotEntryMode === 'manual' ? (
                                                <div className="mb-4">
                                                    <label className="block text-sm font-bold text-gray-700 mb-1">Pilot Name *</label>
                                                    <input
                                                        style={inputStyle}
                                                        placeholder="Enter Pilot's Name"
                                                        value={data.pilotName || ''}
                                                        onChange={e => handleChange(key, 'pilotName', e.target.value)}
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Enter the name of the pilot you are crewing for.
                                                    </p>
                                                </div>
                                            ) : (
                                                (() => {
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
                                                                <strong>Warning:</strong> No registered pilots found.
                                                                Please add a Pilot ticket to your cart or select "Enter Pilot Name Manually".
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div className="mb-4">
                                                            <label className="block text-sm font-bold text-gray-700 mb-1">Select Pilot *</label>
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
                                                        </div>
                                                    );
                                                })()
                                            )}
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
