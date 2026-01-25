import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Menu, X, ShoppingCart, ChevronDown } from 'lucide-react';

function Layout({ orgSettings, loading, error, refreshSettings }) {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasPlanes, setHasPlanes] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
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

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Check if user has planes (for My Planes menu) - REMOVED: Always show for authenticated users
  // useEffect(() => { ... }, [user]);

  if (loading) return <div>Loading settings...</div>;
  if (error) return <div>Error: {error}</div>;

  const NavLink = ({ to, children, className = "" }) => (
    <Link
      to={to}
      className={`hover:text-accent transition-colors font-medium ${className} ${location.pathname === to ? 'text-accent' : ''}`}
      onClick={() => setIsMobileMenuOpen(false)}
    >
      {children}
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-primary text-secondary p-4 shadow-md sticky top-0 z-50 transition-colors duration-300">
        <div className="container mx-auto flex flex-wrap justify-between items-center">

          {/* Logo - Always Left */}
          <Link to="/" className="flex items-center hover:opacity-90 transition-opacity z-50" onClick={() => setIsMobileMenuOpen(false)}>
            {orgSettings?.logo_url && (
              <img
                src={orgSettings.logo_url}
                alt="Logo"
                className="h-10 w-auto object-contain bg-white/10 rounded-sm"
              />
            )}
            {!orgSettings?.logo_url && (
              <span className="text-2xl font-bold">Logo</span>
            )}
          </Link>

          {/* Mobile Actions (Cart & Toggle) - Always Right on Mobile */}
          <div className="flex items-center gap-4 md:hidden z-50">
            {(!user || user.role !== 'admin') && (
              <Link to="/checkout" className="flex items-center hover:text-accent relative" onClick={() => setIsMobileMenuOpen(false)}>
                <ShoppingCart size={24} />
                {cart.length > 0 && (
                  <span className="bg-accent text-primary rounded-full px-1.5 py-0.5 text-[10px] font-bold absolute -top-2 -right-2 min-w-[16px] text-center">
                    {cart.length}
                  </span>
                )}
              </Link>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1 hover:text-accent transition-colors"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

          {/* Organization Name - Full Width on Mobile (Row 2), Next to Logo on Desktop */}
          <div className="w-full md:w-auto md:flex-1 md:ml-6 text-center md:text-left mt-3 md:mt-0 order-last md:order-none">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
              <h1 className="text-xl md:text-2xl font-bold leading-tight hover:text-accent transition-colors">
                {orgSettings?.organization_name}
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6 items-center">
            {user && user.role === 'admin' ? (
              /* ================= ADMIN NAVIGATION ================= */
              <div className="flex items-center gap-4">
                <NavLink to="/admin">Home</NavLink>
                <NavLink to="/events">Events</NavLink>
                <NavLink to="/admin/merchandise">Merchandise</NavLink>
                <NavLink to="/admin/assets">Assets</NavLink>
                <NavLink to="/admin/subevents">Subevents</NavLink>
                <NavLink to="/admin/map">Camping</NavLink>
                <NavLink to="/admin/orders">Orders</NavLink>
                <NavLink to="/admin/settings">Settings</NavLink>

                <button
                  onClick={handleLogout}
                  className="bg-accent text-primary px-4 py-2 rounded font-bold hover:brightness-110 transition-all shadow-sm ml-4 cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              /* ================= PUBLIC / USER NAVIGATION ================= */
              <>
                {/* Public Nav - Only show Home/Events if not logged in. Show rest if User. */}
                <NavLink to="/">Home</NavLink>
                <NavLink to="/events">Events</NavLink>


                {/* Protected Menus */}
                {user && (
                  <>
                    {/* Information Dropdown */}
                    <div className="relative group z-50">
                      <button className="flex items-center hover:text-accent transition-colors font-medium h-full px-1">
                        Information
                      </button>
                      <div className="absolute top-full left-0 mt-0 w-56 bg-white text-gray-800 rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden border border-gray-100 transform origin-top scale-95 group-hover:scale-100">
                        <div className="py-1 flex flex-col">
                          <Link
                            to="/my-roster-events"
                            className="px-4 py-3 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0 hover:text-accent font-medium"
                          >
                            Flight Line Duties
                          </Link>
                          <Link
                            to="/faq"
                            className="px-4 py-3 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0 hover:text-accent font-medium"
                          >
                            FAQ
                          </Link>
                          <Link
                            to="#"
                            className="px-4 py-3 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0 hover:text-accent font-medium"
                          >
                            Event Schedule
                          </Link>
                        </div>
                      </div>
                    </div>

                    <NavLink to="/shop">Shop</NavLink>

                    {/* Cart Icon - Desktop */}
                    <Link to="/checkout" className="flex items-center gap-2 hover:text-accent relative px-2">
                      <ShoppingCart size={20} />
                      {cart.length > 0 && (
                        <span className="bg-accent text-primary rounded-full px-1.5 py-0.5 text-xs font-bold absolute -top-2 -right-2 min-w-[18px] text-center">
                          {cart.length}
                        </span>
                      )}
                    </Link>

                    <div className="flex gap-4 items-center pl-6 border-l border-white/20">
                      <span className="font-medium">Hi, {user.firstName}</span>

                      <NavLink to="/my-orders">My Orders</NavLink>
                      <NavLink to="/my-planes">My Planes</NavLink>

                      <button
                        onClick={handleLogout}
                        className="bg-black/20 hover:bg-black/30 text-inherit px-3 py-1.5 rounded text-sm transition-colors cursor-pointer"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                )}

                {!user && (
                  <Link
                    to="/login"
                    className="bg-accent text-primary px-4 py-2 rounded font-bold hover:brightness-110 transition-all shadow-sm ml-4"
                  >
                    Login
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Mobile Navigation Overlay */}
          <div className={`fixed inset-0 bg-primary/95 z-40 flex flex-col items-center justify-center gap-8 transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>

            {user && user.role === 'admin' ? (
              <>
                <NavLink to="/admin" className="text-2xl">Home</NavLink>
                <NavLink to="/events" className="text-2xl">Events</NavLink>
                <NavLink to="/admin/merchandise" className="text-2xl">Merchandise</NavLink>
                <NavLink to="/admin/assets" className="text-2xl">Assets</NavLink>
                <NavLink to="/admin/subevents" className="text-2xl">Subevents</NavLink>
                <NavLink to="/admin/map" className="text-2xl">Camping</NavLink>
                <NavLink to="/admin/orders" className="text-2xl">Orders</NavLink>
                <NavLink to="/admin/settings" className="text-2xl">Settings</NavLink>
                <button onClick={handleLogout} className="text-2xl text-accent font-bold mt-4">Logout</button>
              </>
            ) : (
              <>
                <NavLink to="/" className="text-2xl">Home</NavLink>
                <NavLink to="/events" className="text-2xl">Events</NavLink>

                {user && (
                  <>
                    <NavLink to="/shop" className="text-2xl">Shop</NavLink>

                    <div className="w-16 h-1 bg-white/10 my-1"></div>
                    <span className="text-sm font-bold text-accent uppercase tracking-wider">Information</span>
                    <NavLink to="/my-roster-events" className="text-xl">Flight Line Duties</NavLink>
                    <NavLink to="/faq" className="text-xl">FAQ</NavLink>
                    <NavLink to="#" className="text-xl">Event Schedule</NavLink>

                    <div className="w-16 h-1 bg-white/20 my-2"></div>
                    <span className="text-xl opacity-75">Hi, {user.firstName}</span>
                    <NavLink to="/my-orders" className="text-2xl">My Orders</NavLink>
                    <NavLink to="/my-planes" className="text-2xl">My Planes</NavLink>
                    <button onClick={handleLogout} className="text-2xl text-accent font-bold mt-4">Logout</button>
                  </>
                )}

                {!user && (
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="bg-accent text-primary px-8 py-3 rounded text-xl font-bold hover:brightness-110 transition-all shadow-sm mt-4"
                  >
                    Login
                  </Link>
                )}
              </>
            )}
          </div>

        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-8">
        <Outlet context={{ refreshSettings }} />
      </main>
    </div>
  );
}

export default Layout;