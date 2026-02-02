import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Search, User, UserPlus } from 'lucide-react';

export default function SubeventModal({ subevent, onClose, onAddToCart, myPilots = [], cart = [], onSearchAttendees }) {
    const [selections, setSelections] = useState({});

    // Combobox State
    const [inputValue, setInputValue] = useState("");
    const [selectedOption, setSelectedOption] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const dropdownRef = useRef(null);

    // Initial Defaults (My Pilots + Cart)
    const [defaultOptions, setDefaultOptions] = useState([]);

    useEffect(() => {
        const list = [];
        // Existing Attendees
        myPilots.forEach(p => {
            const label = p.pilot_name || `${p.first_name} ${p.last_name}`;
            list.push({
                key: `existing-${p.attendee_id}`,
                label: `${label} (My Attendee)`,
                value: { attendeeId: p.attendee_id, name: label },
                type: 'existing'
            });
        });

        // Cart Tickets
        cart.filter(item => item.type === 'TICKET').forEach((ticket) => {
            let label = ticket.name;
            if (ticket.attendees && ticket.attendees[0]) {
                const att = ticket.attendees[0];
                if (att.firstName && att.lastName) {
                    label = `${att.firstName} ${att.lastName} (${ticket.name})`;
                }
            }
            const tempId = ticket.attendees?.[0]?.tempId;
            if (tempId) {
                list.push({
                    key: `cart-${tempId}`,
                    label: `New Ticket: ${label}`,
                    value: { attendeeTempId: tempId, name: label },
                    type: 'cart'
                });
            }
        });
        setDefaultOptions(list);
    }, [myPilots, cart]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Search Debounce
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (inputValue.length >= 2 && onSearchAttendees) {
                setIsSearching(true);
                const results = await onSearchAttendees(inputValue);
                setSearchResults(results.map(r => ({
                    key: `search-${r.attendee_id}`,
                    label: `${r.name} (${r.ticketType})`,
                    value: { attendeeId: r.attendee_id, name: r.name },
                    type: 'search'
                })));
                setIsSearching(false);
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [inputValue, onSearchAttendees]);

    const handleSelectOption = (opt) => {
        setSelectedOption(opt);
        setInputValue(opt.label); // Or just name?
        setIsDropdownOpen(false);
    };

    const handleGuestNameSelect = () => {
        const guestName = inputValue.trim();
        if (!guestName) return;
        const opt = {
            key: `guest-${Date.now()}`,
            label: `${guestName} (Guest Name)`,
            value: { guestName: guestName, name: `${guestName} (Guest)` },
            type: 'guest'
        };
        setSelectedOption(opt);
        setIsDropdownOpen(false);
    };

    // Calculate variations price
    const calculateTotal = () => {
        let total = subevent.price;
        Object.values(selections).forEach(optId => {
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

    const handleSelectionChange = (variationId, optionId) => {
        setSelections(prev => ({ ...prev, [variationId]: optionId }));
    };

    const isValid = () => {
        if (!selectedOption) return false;
        if (!subevent.variations) return true;
        return subevent.variations.every(v => {
            if (!v.isRequired) return true;
            return selections[v.id] !== undefined;
        });
    };

    const handleSubmit = () => {
        if (isValid()) {
            onAddToCart(subevent, selections, calculateTotal(), selectedOption.value);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90dvh]">

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

                {/* Content */}
                <div className="p-6 overflow-y-auto min-h-0 flex-1">
                    <div className="space-y-6">

                        {/* Custom Combobox */}
                        <div className="space-y-3 relative" ref={dropdownRef}>
                            <label className="block text-sm font-semibold text-gray-700">
                                Who is this for? <span className="text-red-500 ml-1">*</span>
                            </label>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="Search attendees or enter Guest Name..."
                                    value={inputValue}
                                    onChange={(e) => {
                                        setInputValue(e.target.value);
                                        setSelectedOption(null); // Clear selection on edit
                                        setIsDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsDropdownOpen(true)}
                                />
                            </div>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 max-h-60 overflow-y-auto z-10">
                                    {/* Default Options (My Pilots + Cart) */}
                                    {defaultOptions.length > 0 && searchResults.length === 0 && inputValue.length < 2 && (
                                        <div className="py-2">
                                            <div className="px-3 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">My Attendees / Cart</div>
                                            {defaultOptions.map(opt => (
                                                <button
                                                    key={opt.key}
                                                    onClick={() => handleSelectOption(opt)}
                                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <User size={16} className="text-primary" />
                                                    <span className="truncate">{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Search Results */}
                                    {searchResults.length > 0 && (
                                        <div className="py-2 border-t border-gray-50">
                                            <div className="px-3 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Search Results</div>
                                            {searchResults.map(opt => (
                                                <button
                                                    key={opt.key}
                                                    onClick={() => handleSelectOption(opt)}
                                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <User size={16} className="text-blue-500" />
                                                    <span className="truncate">{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Guest Option */}
                                    {inputValue.length > 0 && (
                                        <div className="py-2 border-t border-gray-50">
                                            <button
                                                onClick={handleGuestNameSelect}
                                                className="w-full text-left px-4 py-3 hover:bg-amber-50 flex items-center gap-2 text-amber-700 font-medium"
                                            >
                                                <UserPlus size={16} />
                                                <span>Use "{inputValue}" as Guest Name</span>
                                            </button>
                                        </div>
                                    )}

                                    {/* Loading State */}
                                    {isSearching && (
                                        <div className="p-4 text-center text-gray-400 text-sm">Searching...</div>
                                    )}
                                </div>
                            )}

                            {/* Selected Indicator */}
                            {selectedOption && (
                                <div className="mt-2 text-sm text-green-600 flex items-center gap-1 font-medium bg-green-50 px-3 py-2 rounded">
                                    <Check size={16} />
                                    Selected: {selectedOption.label}
                                </div>
                            )}
                        </div>

                        {subevent.variations && subevent.variations.length > 0 && <hr className="border-gray-100" />}

                        {/* Variations Logic (Preserved) */}
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
