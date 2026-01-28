import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Loader2, Trash2, X, Edit } from 'lucide-react';

export default function VariantTemplates() {
    const { user, token } = useAuth();
    const { notify } = useNotification();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: '', options: [] });
    const [editingId, setEditingId] = useState(null);

    // For new option input
    const [newOptionCategory, setNewOptionCategory] = useState('');
    const [newOptionValue, setNewOptionValue] = useState('');

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/manage/variant-templates', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                }
            });
            if (!res.ok) throw new Error('Failed to fetch templates');
            const data = await res.json();
            setTemplates(data);
        } catch (error) {
            notify('Error loading templates: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this template?')) return;

        try {
            const res = await fetch(`/api/manage/variant-templates/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                }
            });
            if (!res.ok) throw new Error('Failed to delete template');

            notify('Template deleted successfully', 'success');
            setTemplates(templates.filter(t => t.template_id !== id));
            if (editingId === id) {
                setEditingId(null);
                setNewTemplate({ name: '', options: [] });
                setIsModalOpen(false);
            }
        } catch (error) {
            notify('Error deleting template: ' + error.message, 'error');
        }
    };

    const handleEdit = async (template) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/manage/variant-templates/${template.template_id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                }
            });
            if (!res.ok) throw new Error('Failed to load template details');
            const data = await res.json();

            setNewTemplate({
                name: data.name,
                options: data.options || []
            });
            setEditingId(template.template_id);
            setIsModalOpen(true);
        } catch (error) {
            notify('Error loading template for edit: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingId(null);
        setNewTemplate({ name: '', options: [] });
        setIsModalOpen(true);
    };

    const handleAddOption = () => {
        if (!newOptionCategory || !newOptionValue) {
            notify('Category and Option Name are required', 'error');
            return;
        }
        setNewTemplate({
            ...newTemplate,
            options: [...newTemplate.options, {
                category_name: newOptionCategory,
                option_name: newOptionValue
            }]
        });
        setNewOptionValue('');
        // Keep category for rapid entry
    };

    const handleRemoveOption = (index) => {
        const updated = [...newTemplate.options];
        updated.splice(index, 1);
        setNewTemplate({ ...newTemplate, options: updated });
    };

    const handleCreateTemplate = async () => {
        if (!newTemplate.name) {
            notify('Template Name is required', 'error');
            return;
        }
        if (newTemplate.options.length === 0) {
            notify('Add at least one option', 'error');
            return;
        }

        try {
            const url = editingId
                ? `/api/manage/variant-templates/${editingId}`
                : '/api/manage/variant-templates';

            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify(newTemplate),
            });
            if (!res.ok) throw new Error(`Failed to ${editingId ? 'update' : 'create'} template`);

            notify(`Template ${editingId ? 'updated' : 'created'} successfully`, 'success');
            setIsModalOpen(false);
            setNewTemplate({ name: '', options: [] });
            setNewOptionCategory('');
            setNewOptionValue('');
            setEditingId(null);
            fetchTemplates();
        } catch (error) {
            notify(`Error ${editingId ? 'updating' : 'creating'} template: ` + error.message, 'error');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Variant Templates</h1>
                <button
                    onClick={openCreateModal}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-bold"
                >
                    New Template
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : (
                <div className="bg-white rounded shadow overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4">Template Name</th>
                                <th className="p-4">Option Count</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {templates.length === 0 ? (
                                <tr><td colSpan="3" className="p-8 text-center text-gray-500">No templates found. Create one to get started.</td></tr>
                            ) : (
                                templates.map(t => (
                                    <tr key={t.template_id} className="border-b hover:bg-gray-50">
                                        <td className="p-4 font-medium">{t.name}</td>
                                        <td className="p-4">{t.option_count}</td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleEdit(t)}
                                                className="text-blue-600 hover:text-blue-800 p-1 mr-2"
                                                title="Edit Template"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(t.template_id)}
                                                className="text-red-600 hover:text-red-800 p-1"
                                                title="Delete Template"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* CREATE MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold">{editingId ? 'Edit Variant Template' : 'Create Variant Template'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-1">Template Name</label>
                                <input
                                    type="text"
                                    value={newTemplate.name}
                                    onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                    className="w-full border rounded p-2"
                                    placeholder="e.g. Mens T-Shirt Sizes"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Options</label>

                                {/* Add Option Inputs */}
                                <div className="flex gap-2 mb-4 items-end bg-gray-50 p-3 rounded">
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-500 mb-1 block">Category</label>
                                        <input
                                            type="text"
                                            value={newOptionCategory}
                                            onChange={e => setNewOptionCategory(e.target.value)}
                                            className="w-full border rounded p-1"
                                            placeholder="Size"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-500 mb-1 block">Value</label>
                                        <input
                                            type="text"
                                            value={newOptionValue}
                                            onChange={e => setNewOptionValue(e.target.value)}
                                            className="w-full border rounded p-1"
                                            placeholder="S, M, L..."
                                            onKeyDown={e => { if (e.key === 'Enter') handleAddOption(); }}
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddOption}
                                        className="bg-green-600 text-white p-2 rounded hover:bg-green-700 h-[34px] font-bold"
                                    >
                                        ADD
                                    </button>
                                </div>

                                {/* Option List */}
                                <div className="border rounded bg-white">
                                    {newTemplate.options.length === 0 ? (
                                        <div className="p-4 text-center text-gray-400 italic">No options added yet.</div>
                                    ) : (
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="p-2 text-left">Category</th>
                                                    <th className="p-2 text-left">Option</th>
                                                    <th className="p-2 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {newTemplate.options.map((opt, idx) => (
                                                    <tr key={idx} className="border-t">
                                                        <td className="p-2">{opt.category_name}</td>
                                                        <td className="p-2">{opt.option_name}</td>
                                                        <td className="p-2 text-right">
                                                            <button onClick={() => handleRemoveOption(idx)} className="text-red-500 hover:text-red-700">
                                                                <X size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>

                        </div>

                        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateTemplate}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-bold"
                            >
                                {editingId ? 'Update Template' : 'Save Template'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
