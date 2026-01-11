import { useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

function Layout({ orgSettings, loading, error, refreshSettings }) {
  const { user, logout } = useAuth(); // <--- Get user state
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    if (orgSettings) {
      const root = document.documentElement;
      root.style.setProperty('--primary-color', orgSettings.primary_color || '#000000');
      root.style.setProperty('--secondary-color', orgSettings.secondary_color || '#FFFFFF');
      root.style.setProperty('--accent-color', orgSettings.accent_color || '#FFD700');
    }
  }, [orgSettings]);

  if (loading) return <div>Loading settings...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-primary text-secondary p-4 shadow-md sticky top-0 z-50 transition-colors duration-300">
        <div className="container mx-auto flex justify-between items-center">
          {/* Left Side: Logo/Name */}
          <div className="flex items-center gap-4">
            {orgSettings?.logo_url && (
              <img
                src={orgSettings.logo_url}
                alt="Logo"
                className="h-10 w-auto object-contain bg-white/10 rounded-sm"
              />
            )}
            <div>
              <h1 className="text-xl font-bold m-0 leading-tight">{orgSettings?.organization_name}</h1>
              <small className="opacity-80 text-xs block">Support: {orgSettings?.support_email}</small>
            </div>
          </div>

          {/* Right Side: Navigation */}
          <nav className="flex gap-6 items-center">
            {user && user.role === 'admin' ? (
              /* ================= ADMIN NAVIGATION ================= */
              <div className="flex items-center gap-4">
                <Link to="/admin" className="hover:text-accent transition-colors font-medium">Home</Link>
                <Link to="/events" className="hover:text-accent transition-colors font-medium">Events</Link>
                <Link to="/admin/merchandise" className={`font-bold ${location.pathname.startsWith('/admin/merchandise') ? 'text-accent' : 'hover:text-accent'}`}>Merchandise</Link>
                <Link to="/admin/assets" className={`font-bold ${location.pathname.startsWith('/admin/assets') ? 'text-accent' : 'hover:text-accent'}`}>Assets</Link>
                <Link to="/admin/subevents" className={`font-bold ${location.pathname.startsWith('/admin/subevents') ? 'text-accent' : 'hover:text-accent'}`}>Subevents</Link>
                <Link to="/admin/subevents" className={`font-bold ${location.pathname.startsWith('/admin/subevents') ? 'text-accent' : 'hover:text-accent'}`}>Subevents</Link>
                <Link to="/shop" className="hover:text-accent transition-colors font-medium">Shop</Link>
                <Link to="/admin/orders" className={`font-bold ${location.pathname.startsWith('/admin/orders') ? 'text-accent' : 'hover:text-accent'}`}>Orders</Link>
                <Link to="/admin/settings" className={`font-bold ${location.pathname.startsWith('/admin/settings') ? 'text-accent' : 'hover:text-accent'}`}>Settings</Link>

                <button
                  onClick={handleLogout}
                  className="bg-accent text-primary px-4 py-2 rounded font-bold hover:brightness-110 transition-all shadow-sm ml-4"
                >
                  Logout
                </button>
              </div>
            ) : (
              /* ================= PUBLIC / USER NAVIGATION ================= */
              <>
                <Link to="/" className="hover:text-accent transition-colors">Home</Link>
                <Link to="/events" className="hover:text-accent transition-colors">Events</Link>
                <Link to="/shop" className="hover:text-accent transition-colors">Shop</Link>

                {user ? (
                  <div className="flex gap-4 items-center pl-6 border-l border-white/20">
                    <span className="hidden md:inline font-medium">Hi, {user.firstName}</span>

                    <Link to="/checkout" className="flex items-center gap-2 hover:text-accent relative">
                      <span>🛒</span>
                      {cart.length > 0 && (
                        <span className="bg-accent text-primary rounded-full px-1.5 py-0.5 text-xs font-bold absolute -top-2 -right-2 min-w-[18px] text-center">
                          {cart.length}
                        </span>
                      )}
                    </Link>
                    <Link to="/my-orders" className="font-bold hover:text-accent">My Orders</Link>

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
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-8">
        <Outlet context={{ refreshSettings }} />
      </main>
    </div>
  );
}

export default Layout;