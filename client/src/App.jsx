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
import AdminMapTool from './pages/camping/AdminMapTool';
import OrderDetail from './pages/OrderDetail';
import CampingPage from './pages/camping/CampingPage';
import StorePage from './pages/StorePage';
import Checkout from './pages/Checkout';
import { CartProvider } from './context/CartContext';

function App() {
  const [orgSettings, setOrgSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/getOrganization');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setOrgSettings(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout orgSettings={orgSettings} loading={loading} error={error} />}>
              <Route index element={<Home />} />
              <Route path="events" element={<Events />} />
              <Route path="events/:slug" element={<EventDetails />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="events/:slug/purchase" element={<EventPurchase />} />
              <Route path="events/:slug/shop" element={<StorePage />} /> {/* New Store Page */}
              <Route path="camping" element={<CampingPage />} /> {/* Generic Camping Route */}
              <Route path="events/:slug/camping" element={<CampingPage />} />
              <Route path="checkout" element={<Checkout />} /> {/* Added Checkout Route */}

              <Route path="my-orders" element={<MyOrders />} />
              <Route path="orders/:orderId" element={<OrderDetail />} />
              <Route path="admin/map" element={<AdminMapTool />} />
              <Route path="admin/orders" element={<AdminOrders />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;