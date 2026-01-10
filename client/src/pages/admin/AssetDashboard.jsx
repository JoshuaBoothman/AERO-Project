import { useState } from 'react';
import AssetTypes from './assets/AssetTypes';
import AssetItems from './assets/AssetItems';
import AssetHires from './assets/AssetHires';

function AssetDashboard() {
    const [activeTab, setActiveTab] = useState('types');

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Asset Management</h1>

            <div className="flex border-b border-gray-200 mb-6">
                <button
                    className={`py-2 px-4 font-medium transition-colors ${activeTab === 'types' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black'}`}
                    onClick={() => setActiveTab('types')}
                >
                    Asset Types
                </button>
                <button
                    className={`py-2 px-4 font-medium transition-colors ${activeTab === 'items' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black'}`}
                    onClick={() => setActiveTab('items')}
                >
                    Inventory
                </button>
                <button
                    className={`py-2 px-4 font-medium transition-colors ${activeTab === 'hires' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black'}`}
                    onClick={() => setActiveTab('hires')}
                >
                    Hires
                </button>
            </div>

            <div className="bg-white rounded shadow p-6">
                {activeTab === 'types' && <AssetTypes />}
                {activeTab === 'items' && <AssetItems />}
                {activeTab === 'hires' && <AssetHires />}
            </div>
        </div>
    );
}

export default AssetDashboard;
