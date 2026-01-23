import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export default function SubeventVariationManager({ subevent, onClose }) {
    const { token } = useAuth();
    const { notify, confirm } = useNotification();
    const [variations, setVariations] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form States
    const [newVarName, setNewVarName] = useState('');
    const [newVarRequired, setNewVarRequired] = useState(true);
    const [newOptionState, setNewOptionState] = useState({}); // { [varId]: { name: '', price: '' } }


    const fetchVariations = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/subevents/${subevent.subevent_id}/variations`, {
                headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
            });
            if (res.ok) {
                setVariations(await res.json());
            }
        } catch (e) {
            console.error(e);
            notify("Failed to load variations", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVariations();
    }, [subevent]);

    const handleAddVariation = async () => {
        if (!newVarName) return;
        try {
            const res = await fetch(`/api/subevents/${subevent.subevent_id}/variations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify({ name: newVarName, isRequired: newVarRequired })
            });

            if (res.ok) {
                setNewVarName('');
                fetchVariations();
                notify("Variation Category added", "success");
            } else {
                notify("Failed to add category", "error");
            }
        } catch (e) { notify("Error adding category", "error"); }
    };

    const handleDeleteVariation = async (id) => {
        confirm("Delete this category and all its options?", async () => {
            try {
                const res = await fetch(`/api/variations/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
                });
                if (res.ok) {
                    setVariations(prev => prev.filter(v => v.id !== id));
                    notify("Deleted", "success");
                }
            } catch (e) { notify("Error deleting", "error"); }
        });
    };

    const handleAddOption = async (varId) => {
        const state = newOptionState[varId] || {};
        if (!state.name) return;

        try {
            const res = await fetch(`/api/variations/${varId}/options`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify({ name: state.name, priceAdjustment: parseFloat(state.price) || 0 })
            });

            if (res.ok) {
                setNewOptionState(prev => ({ ...prev, [varId]: { name: '', price: '' } }));
                fetchVariations(); // Refresh to show new option
                notify("Option added", "success");
            }
        } catch (e) { notify("Error adding option", "error"); }
    };

    const handleDeleteOption = async (optId) => {
        confirm("Delete this option?", async () => {
            try {
                const res = await fetch(`/api/variation-options/${optId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
                });
                if (res.ok) {
                    fetchVariations();
                    notify("Option deleted", "success");
                }
            } catch (e) { notify("Error deleting option", "error"); }
        });
    };

    const updateOptionState = (varId, field, value) => {
        setNewOptionState(prev => ({
            ...prev,
            [varId]: { ...prev[varId], [field]: value }
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Manage Variations</h2>
                        <p className="text-sm text-gray-500">For {subevent.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">

                    {/* List Existing Variations */}
                    <div className="space-y-6">
                        {loading ? <p>Loading...</p> : variations.map(v => (
                            <div key={v.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-gray-800">{v.name}</h3>
                                        {v.isRequired ? (
                                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Required</span>
                                        ) : (
                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Optional</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDeleteVariation(v.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="p-4">
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {v.options.map(opt => (
                                            <div key={opt.id} className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                                                <span className="font-medium">{opt.name}</span>
                                                {opt.priceAdjustment !== 0 && (
                                                    <span className={`text-xs font-bold ${opt.priceAdjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {opt.priceAdjustment > 0 ? '+' : ''}${opt.priceAdjustment.toFixed(2)}
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteOption(opt.id)}
                                                    className="pl-2 text-gray-400 hover:text-red-500"
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                        {v.options.length === 0 && <span className="text-sm text-gray-400 italic">No options yet.</span>}
                                    </div>

                                    {/* Add Option Form */}
                                    <div className="flex gap-2 items-center">
                                        <input
                                            placeholder="Option Name (e.g. Medium)"
                                            className="flex-1 p-2 border border-gray-200 rounded text-sm"
                                            value={newOptionState[v.id]?.name || ''}
                                            onChange={e => updateOptionState(v.id, 'name', e.target.value)}
                                        />
                                        <input
                                            placeholder="Price Adj (optional)"
                                            type="number"
                                            className="w-24 p-2 border border-gray-200 rounded text-sm"
                                            value={newOptionState[v.id]?.price || ''}
                                            onChange={e => updateOptionState(v.id, 'price', e.target.value)}
                                        />
                                        <button
                                            onClick={() => handleAddOption(v.id)}
                                            className="bg-gray-800 text-white p-2 rounded hover:bg-black transition-colors"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add New Variation Category */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <h4 className="font-bold text-gray-700 mb-3">Add New Variation Category</h4>
                        <div className="flex gap-3 items-end">
                            <div className="flex-1">
                                <label className="block text-xs text-gray-500 mb-1 uppercase font-bold tracking-wider">Name</label>
                                <input
                                    className="w-full p-2 border border-gray-300 rounded"
                                    placeholder="e.g. Cook Time"
                                    value={newVarName}
                                    onChange={e => setNewVarName(e.target.value)}
                                />
                            </div>
                            <div className="pb-2">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={newVarRequired}
                                        onChange={e => setNewVarRequired(e.target.checked)}
                                        className="w-4 h-4 text-purple-600 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Required Selection</span>
                                </label>
                            </div>
                            <button
                                onClick={handleAddVariation}
                                disabled={!newVarName}
                                className="bg-primary text-secondary px-4 py-2 rounded font-bold hover:brightness-110 disabled:opacity-50 h-[42px]"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 bg-white flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-medium transition-colors">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
