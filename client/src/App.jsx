import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import EventPurchase from './pages/EventPurchase';

import MyOrders from './pages/MyOrders';
import AdminOrders from './pages/admin/AdminOrders';
import EventForm from './pages/admin/EventForm';
import AdminMapTool from './pages/camping/AdminMapTool';
import MerchandiseList from './pages/admin/MerchandiseList';
import ProductEditor from './pages/admin/ProductEditor';
import AssetDashboard from './pages/admin/AssetDashboard';
import AdminSubevents from './pages/admin/AdminSubevents';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSettings from './pages/admin/AdminSettings';

import OrderDetail from './pages/OrderDetail';
import CampingPage from './pages/camping/CampingPage';
import StorePage from './pages/StorePage';
import Checkout from './pages/Checkout';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';

function App() {
  const [orgSettings, setOrgSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = async () => {
    // 1. Check Cache (only on initial load really, but fine to keep logic if we want)
    // Actually, for a refresh, we want to bypass cache or update it.
    // The original logic checked cache first. 
    // Let's modify it to accept a 'force' param or just always fetch if called explicitly.
    // But for simplicity, let's just keep the logic but we need to ensure it updates state.

    try {
      // 2. Fetch Fresh
      const response = await fetch('/api/getOrganization');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();

      // 3. Update Cache & State
      localStorage.setItem('orgSettings', JSON.stringify(data));
      setOrgSettings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load - check cache first to avoid flicker?
    // The original code checked cache inside the function.
    // Let's preserve the exact behavior but make it callable.

    const initSettings = async () => {
      const cached = localStorage.getItem('orgSettings');
      if (cached) {
        setOrgSettings(JSON.parse(cached));
        setLoading(false);
      }
      await fetchSettings();
    };

    initSettings();
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout orgSettings={orgSettings} loading={loading} error={error} refreshSettings={fetchSettings} />}>
                <Route index element={<Home />} />
                <Route path="events" element={<Events />} />
                <Route path="events/new" element={<EventForm />} />
                <Route path="events/:slug" element={<EventDetails />} />
                <Route path="events/:slug/edit" element={<EventForm />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="events/:slug/purchase" element={<EventPurchase />} />
                <Route path="events/:slug/shop" element={<StorePage />} /> {/* New Store Page */}
                <Route path="camping" element={<CampingPage />} /> {/* Generic Camping Route */}
                <Route path="events/:slug/camping" element={<CampingPage />} />
                <Route path="checkout" element={<Checkout />} /> {/* Added Checkout Route */}

                <Route path="my-orders" element={<MyOrders />} />
                <Route path="orders/:orderId" element={<OrderDetail />} />
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="admin/map" element={<AdminMapTool />} />
                <Route path="admin/orders" element={<AdminOrders />} />
                <Route path="admin/merchandise" element={<MerchandiseList />} />
                <Route path="admin/merchandise/:id" element={<ProductEditor />} />
                <Route path="admin/assets" element={<AssetDashboard />} />
                <Route path="admin/subevents" element={<AdminSubevents />} />
                <Route path="admin/settings" element={<AdminSettings />} />

              </Route>
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;