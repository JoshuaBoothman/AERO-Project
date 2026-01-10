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
    <div className="min-h-screen bg-gray-50 flex flex-col" style={themeStyles}>
      <header className="bg-primary text-secondary p-4 shadow-md sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          {/* Left Side: Logo/Name */}
          <div>
            <h1 className="text-xl font-bold m-0 leading-tight">{orgSettings?.organization_name}</h1>
            <small className="opacity-80 text-xs">Support: {orgSettings?.support_email}</small>
          </div>

          {/* Right Side: Navigation */}
          <nav className="flex gap-6 items-center">
            <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            <Link to="/events" className="hover:text-accent transition-colors">Events</Link>
            <Link to="/camping" className="hover:text-accent transition-colors">Camping</Link>

            {/* Auth Logic */}
            {user ? (
              <div className="flex gap-4 items-center pl-6 border-l border-white/20">
                <span className="hidden md:inline font-medium">Hi, {user.firstName}</span>

                {user.role === 'admin' ? (
                  /* Admin Menu */
                  <>
                    <Link to="/admin/map" className="font-bold hover:text-accent">Map</Link>
                    <Link to="/admin/orders" className="font-bold hover:text-accent">Orders</Link>
                  </>
                ) : (
                  /* User Menu */
                  <>
                    <Link to="/checkout" className="flex items-center gap-2 hover:text-accent relative">
                      <span>🛒</span>
                      {cart.length > 0 && (
                        <span className="bg-accent text-primary rounded-full px-1.5 py-0.5 text-xs font-bold absolute -top-2 -right-2 min-w-[18px] text-center">
                          {cart.length}
                        </span>
                      )}
                    </Link>
                    <Link to="/my-orders" className="font-bold hover:text-accent">My Orders</Link>
                  </>
                )}

                <button
                  onClick={handleLogout}
                  className="bg-black/20 hover:bg-black/30 text-inherit px-3 py-1.5 rounded text-sm transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-accent text-primary px-4 py-2 rounded font-bold hover:brightness-110 transition-all shadow-sm"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;