import { Outlet } from 'react-router-dom';

function Layout({ orgSettings, loading, error }) {
  if (loading) return <div>Loading settings...</div>;
  if (error) return <div>Error: {error}</div>;

  // We create a style object that defines all our CSS variables dynamically
  const themeStyles = {
    '--primary-color': orgSettings?.primary_color || '#000000',
    '--secondary-color': orgSettings?.secondary_color || '#FFFFFF',
    '--accent-color': orgSettings?.accent_color || '#FFD700',
  };

  return (
    // Apply the themeStyles object to the wrapper
    <div className="app-container" style={themeStyles}>
      <header style={{ 
          backgroundColor: 'var(--primary-color)', 
          color: 'var(--secondary-color)' 
        }}>
        <h1>{orgSettings?.organization_name}</h1>
        <p>Support: {orgSettings?.support_email}</p>
      </header>
      
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;