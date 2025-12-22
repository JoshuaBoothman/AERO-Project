import { Outlet } from 'react-router-dom';

function Layout({ orgSettings, loading, error }) {
  if (loading) return <div>Loading settings...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    // We apply the dynamic accent color to the wrapper
    <div className="app-container" style={{ '--accent-color': orgSettings?.accent_color }}>
      <header>
        <h1>{orgSettings?.organization_name}</h1>
        <p>Support: {orgSettings?.support_email}</p>
      </header>
      
      {/* <Outlet /> is where the content of the specific page (Home, Events, etc.) will render */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;