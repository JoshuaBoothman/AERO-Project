import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

function Layout({ orgSettings, loading, error }) {
  const { user, logout } = useAuth(); // <--- Get user state
  const { cart } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) return <div>Loading settings...</div>;
  if (error) return <div>Error: {error}</div>;

  const themeStyles = {
    '--primary-color': orgSettings?.primary_color || '#000000',
    '--secondary-color': orgSettings?.secondary_color || '#FFFFFF',
    '--accent-color': orgSettings?.accent_color || '#FFD700',
  };

  return (
    <div className="app-container" style={themeStyles}>
      <header style={{
        backgroundColor: 'var(--primary-color)',
        color: 'var(--secondary-color)',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>

        {/* Left Side: Logo/Name */}
        <div>
          <h1 style={{ margin: 0 }}>{orgSettings?.organization_name}</h1>
          <small>Support: {orgSettings?.support_email}</small>
        </div>

        {/* Right Side: Navigation */}
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <Link to="/events" style={{ color: 'inherit', textDecoration: 'none' }}>Events</Link>
          <Link to="/camping" style={{ color: 'inherit', textDecoration: 'none' }}>Camping</Link>

          {/* Auth Logic */}
          {user ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '1rem' }}>
              <span>Hi, {user.firstName}</span>

              {user.role === 'admin' ? (
                /* Admin Menu */
                <>
                  <Link to="/admin/map" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 'bold' }}>Map</Link>
                  <Link to="/admin/orders" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 'bold' }}>Orders</Link>
                </>
              ) : (
                /* User Menu */
                <>
                  <Link to="/checkout" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>🛒</span>
                    {cart.length > 0 && (
                      <span style={{ background: 'var(--accent-color)', color: 'black', borderRadius: '50%', padding: '2px 6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {cart.length}
                      </span>
                    )}
                  </Link>
                  <Link to="/my-orders" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 'bold' }}>My Orders</Link>
                </>
              )}

              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: 'none',
                  color: 'inherit',
                  padding: '5px 10px',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              style={{
                backgroundColor: 'var(--accent-color)',
                color: 'var(--primary-color)',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                textDecoration: 'none',
                fontWeight: 'bold'
              }}
            >
              Login
            </Link>
          )}
        </nav>

      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;