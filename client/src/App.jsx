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
    <BrowserRouter>
      <Routes>
        {/* The Layout wraps all routes inside it */}
        <Route path="/" element={<Layout orgSettings={orgSettings} loading={loading} error={error} />}>
          
          {/* The "index" route is what renders when you visit "/" */}
          <Route index element={<Home />} />
          
          <Route path="events" element={<Events />} />

          <Route path="events/:slug" element={<EventDetails />} />
          
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        
// ...
      </Routes>
      </BrowserRouter>
      </AuthProvider>
  );
}

export default App;