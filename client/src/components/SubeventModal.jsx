import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

export default function SubeventModal({ subevent, onClose, onAddToCart, myPilots = [], cart = [] }) {
    const [selections, setSelections] = useState({});
    const [selectedAttendeeKey, setSelectedAttendeeKey] = useState("");

    // Aggregate Available Attendees
    const getAvailableAttendees = () => {
        const list = [];

        // Existing Attendees
        myPilots.forEach(p => {
            const label = p.pilot_name || `${p.first_name} ${p.last_name}`;
            list.push({
                key: `existing-${p.attendee_id}`,
                label: `${label} (Existing)`,
                value: { attendeeId: p.attendee_id, name: label }
            });
        });

        // Cart Tickets
        cart.filter(item => item.type === 'TICKET').forEach((ticket, index) => {
            // Use ticket name or person name if available
            let label = ticket.name;
            if (ticket.attendees && ticket.attendees[0]) {
                const att = ticket.attendees[0];
                if (att.firstName && att.lastName) {
                    label = `${att.firstName} ${att.lastName} (${ticket.name})`;
                }
            }

            // We need a unique ID. Using tempId if available, else index fallback (risky but handled in StorePage now)
            const tempId = ticket.attendees?.[0]?.tempId;
            if (tempId) {
                list.push({
                    key: `cart-${tempId}`,
                    label: `New Ticket: ${label}`,
                    value: { attendeeTempId: tempId, name: label }
                });
            }
        });

        return list;
    };

    const attendees = getAvailableAttendees();

    // Auto-select if only one option?
    // useEffect(() => {
    //     if (attendees.length === 1 && !selectedAttendeeKey) {
    //         setSelectedAttendeeKey(attendees[0].key);
    //     }
    // }, [attendees]);

    const handleSelectionChange = (variationId, optionId) => {
        setSelections(prev => ({
            ...prev,
            [variationId]: optionId
        }));
    };

    const calculateTotal = () => {
        let total = subevent.price;
        // Iterate over selections
        Object.values(selections).forEach(optId => {
            // Find option across all variations
            if (subevent.variations) {
                for (const v of subevent.variations) {
                    const opt = v.options.find(o => o.id === optId);
                    if (opt) {
                        total += opt.priceAdjustment;
                        break;
                    }
                }
            }
        });
        return total;
    };

    const isValid = () => {
        if (!selectedAttendeeKey) return false;

        if (!subevent.variations) return true;
        return subevent.variations.every(v => {
            if (!v.isRequired) return true;
            return selections[v.id] !== undefined;
        });
    };

    const handleSubmit = () => {
        if (isValid()) {
            const selectedAtt = attendees.find(a => a.key === selectedAttendeeKey)?.value;
            onAddToCart(subevent, selections, calculateTotal(), selectedAtt);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{subevent.name}</h2>
                        <p className="text-gray-500 mt-1">{subevent.description}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto">
                    <div className="space-y-6">

                        {/* Attendee Selection */}
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-gray-700">
                                Who is this for? <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedAttendeeKey}
                                    onChange={(e) => setSelectedAttendeeKey(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                >
                                    <option value="">-- Select Attendee --</option>
                                    {attendees.map(att => (
                                        <option key={att.key} value={att.key}>{att.label}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                </div>
                            </div>
                            {attendees.length === 0 && (
                                <p className="text-sm text-red-500">No attendees found. Please add a ticket to your cart first.</p>
                            )}
                        </div>

                        {subevent.variations && subevent.variations.length > 0 && <hr className="border-gray-100" />}

                        {subevent.variations && subevent.variations.map(variation => (
                            <div key={variation.id} className="space-y-3">
                                <label className="block text-sm font-semibold text-gray-700">
                                    {variation.name}
                                    {variation.isRequired && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {variation.options.map(option => {
                                        const isSelected = selections[variation.id] === option.id;
                                        return (
                                            <div
                                                key={option.id}
                                                onClick={() => handleSelectionChange(variation.id, option.id)}
                                                className={`
                                                    cursor-pointer p-3 rounded-lg border-2 transition-all flex justify-between items-center
                                                    ${isSelected
                                                        ? 'border-accent bg-accent/5 text-primary'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                    }
                                                `}
                                            >
                                                <span className="font-medium">{option.name}</span>
                                                {option.priceAdjustment !== 0 && (
                                                    <span className="text-sm text-gray-500">
                                                        {option.priceAdjustment > 0 ? '+' : ''}${option.priceAdjustment.toFixed(2)}
                                                    </span>
                                                )}
                                                {isSelected && <Check size={16} className="text-primary" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {(!subevent.variations || subevent.variations.length === 0) && attendees.length > 0 && (
                            <p className="text-gray-500 text-sm italic">This item has no additional options to configure.</p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-600 font-medium">Total Price:</span>
                        <span className="text-2xl font-bold text-primary">${calculateTotal().toFixed(2)}</span>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid()}
                        className={`
                            w-full py-3 rounded-lg font-bold text-lg shadow-sm transition-all
                            ${isValid()
                                ? 'bg-accent text-primary hover:brightness-105 hover:shadow-md'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }
                        `}
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
}
