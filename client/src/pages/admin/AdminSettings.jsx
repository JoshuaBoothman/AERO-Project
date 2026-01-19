import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import OrgSettings from './settings/OrgSettings';
import AdminList from './settings/AdminList';
import UserList from './settings/UserList';
import VariantTemplates from './VariantTemplates';
import FAQManager from './settings/FAQManager';

function AdminSettings() {
    const [activeTab, setActiveTab] = useState('organization'); // 'organization' | 'admins'
    const { refreshSettings } = useOutletContext();

    return (
        <div className="container mx-auto max-w-5xl py-8">
            <h1 className="text-3xl font-bold mb-8">System Settings</h1>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-8">
                <button
                    onClick={() => setActiveTab('organization')}
                    className={`pb-3 px-6 font-bold text-lg transition-colors border-b-4 ${activeTab === 'organization'
                        ? 'border-accent text-primary'
                        : 'border-transparent text-gray-500 hover:text-primary'
                        }`}
                >
                    Organization
                </button>
                <button
                    onClick={() => setActiveTab('admins')}
                    className={`pb-3 px-6 font-bold text-lg transition-colors border-b-4 ${activeTab === 'admins'
                        ? 'border-accent text-primary'
                        : 'border-transparent text-gray-500 hover:text-primary'
                        }`}
                >
                    Manage Admins
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`pb-3 px-6 font-bold text-lg transition-colors border-b-4 ${activeTab === 'users'
                        ? 'border-accent text-primary'
                        : 'border-transparent text-gray-500 hover:text-primary'
                        }`}
                >
                    Manage Users
                </button>
                <button
                    onClick={() => setActiveTab('templates')}
                    className={`pb-3 px-6 font-bold text-lg transition-colors border-b-4 ${activeTab === 'templates'
                        ? 'border-accent text-primary'
                        : 'border-transparent text-gray-500 hover:text-primary'
                        }`}
                >
                    Merchandise Templates
                </button>
                <button
                    onClick={() => setActiveTab('faq')}
                    className={`pb-3 px-6 font-bold text-lg transition-colors border-b-4 ${activeTab === 'faq'
                        ? 'border-accent text-primary'
                        : 'border-transparent text-gray-500 hover:text-primary'
                        }`}
                >
                    FAQ
                </button>
            </div>

            {/* Content By Tab */}
            <div className="tab-content animate-fade-in">
                {activeTab === 'organization' && <OrgSettings refreshSettings={refreshSettings} />}
                {activeTab === 'admins' && <AdminList />}
                {activeTab === 'users' && <UserList />}
                {activeTab === 'templates' && <VariantTemplates />}
                {activeTab === 'faq' && <FAQManager />}
            </div>
        </div>
    );
}

export default AdminSettings;
