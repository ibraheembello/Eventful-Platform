import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HiOutlineTicket, HiOutlineBell, HiOutlineChartBar, HiOutlineCalendar, HiOutlineLogout, HiOutlineMenu, HiOutlineX, HiOutlineQrcode, HiOutlineMoon, HiOutlineSun, HiOutlineUserCircle, HiOutlineHome, HiOutlineBookmark, HiOutlineTag, HiOutlineClock, HiOutlineViewGrid, HiOutlineChevronDown } from 'react-icons/hi';
import { useState, useRef, useEffect, useCallback } from 'react';
import api from '../lib/api';

function NavDropdown({ label, icon, children }: { label: string; icon: React.ReactNode; children: (close: () => void) => React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md hover:bg-[rgb(var(--bg-secondary))] transition-colors"
      >
        {icon}
        {label}
        <HiOutlineChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-48 bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] rounded-lg shadow-lg py-1 z-50">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function DropdownLink({ to, icon, label, onClick }: { to: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 text-sm text-[rgb(var(--text-primary))] hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-[rgb(var(--bg-secondary))] transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications/in-app/unread');
      setUnreadCount(res.data.data?.count || 0);
    } catch {}
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-secondary))] transition-colors duration-200">
      <nav className="bg-[rgb(var(--bg-primary))] shadow-sm border-b border-[rgb(var(--border-primary))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">Eventful</Link>
              <div className="hidden md:flex ml-10 space-x-1">
                <Link to="/" className="flex items-center gap-1 px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md hover:bg-[rgb(var(--bg-secondary))] transition-colors">
                  <HiOutlineHome className="w-4 h-4" /> Home
                </Link>
                <Link to="/events" className="flex items-center gap-1 px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md hover:bg-[rgb(var(--bg-secondary))] transition-colors">
                  <HiOutlineCalendar className="w-4 h-4" /> Events
                </Link>
                <Link to="/categories" className="flex items-center gap-1 px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md hover:bg-[rgb(var(--bg-secondary))] transition-colors">
                  <HiOutlineViewGrid className="w-4 h-4" /> Categories
                </Link>
                {user && (
                  <>
                    <NavDropdown label="My Events" icon={<HiOutlineTicket className="w-4 h-4" />}>
                      {(close) => (
                        <>
                          <DropdownLink to="/tickets" icon={<HiOutlineTicket className="w-4 h-4" />} label="My Tickets" onClick={close} />
                          <DropdownLink to="/notifications" icon={<HiOutlineBell className="w-4 h-4" />} label="Reminders" onClick={close} />
                          <DropdownLink to="/saved" icon={<HiOutlineBookmark className="w-4 h-4" />} label="Saved" onClick={close} />
                          <DropdownLink to="/waitlists" icon={<HiOutlineClock className="w-4 h-4" />} label="Waitlists" onClick={close} />
                        </>
                      )}
                    </NavDropdown>
                    {user.role === 'CREATOR' && (
                      <NavDropdown label="Manage" icon={<HiOutlineChartBar className="w-4 h-4" />}>
                        {(close) => (
                          <>
                            <DropdownLink to="/analytics" icon={<HiOutlineChartBar className="w-4 h-4" />} label="Analytics" onClick={close} />
                            <DropdownLink to="/verify-ticket" icon={<HiOutlineQrcode className="w-4 h-4" />} label="Verify Ticket" onClick={close} />
                            <DropdownLink to="/promo-codes" icon={<HiOutlineTag className="w-4 h-4" />} label="Promo Codes" onClick={close} />
                          </>
                        )}
                      </NavDropdown>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 text-[rgb(var(--text-secondary))] hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-[rgb(var(--bg-secondary))] transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <HiOutlineMoon className="w-5 h-5" /> : <HiOutlineSun className="w-5 h-5" />}
              </button>
              {user ? (
                <>
                  <Link
                    to="/notifications/inbox"
                    className="relative p-2 text-[rgb(var(--text-secondary))] hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-[rgb(var(--bg-secondary))] transition-colors"
                    aria-label="Notifications"
                  >
                    <HiOutlineBell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/profile" className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-semibold">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                    )}
                    {user.firstName}
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-[rgb(var(--text-secondary))] hover:text-red-600 dark:hover:text-red-400">
                    <HiOutlineLogout className="w-4 h-4" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm text-[rgb(var(--text-secondary))] hover:text-emerald-600 dark:hover:text-emerald-400">Login</Link>
                  <Link to="/register" className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors">Register</Link>
                </>
              )}
            </div>
            {/* Mobile: theme toggle + hamburger */}
            <div className="md:hidden flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 text-[rgb(var(--text-secondary))] hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-[rgb(var(--bg-secondary))] transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <HiOutlineMoon className="w-5 h-5" /> : <HiOutlineSun className="w-5 h-5" />}
              </button>
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-[rgb(var(--text-primary))]">
                {menuOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-[rgb(var(--border-primary))] px-4 py-3 space-y-2 bg-[rgb(var(--bg-primary))]">
            <Link to="/" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-secondary))] rounded-md">Home</Link>
            <Link to="/events" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-secondary))] rounded-md">Events</Link>
            <Link to="/categories" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-secondary))] rounded-md">Categories</Link>
            {user ? (
              <>
                <Link to="/tickets" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-secondary))] rounded-md">My Tickets</Link>
                <Link to="/notifications/inbox" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-secondary))] rounded-md">
                  Notifications {unreadCount > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-red-500 rounded-full">{unreadCount}</span>}
                </Link>
                <Link to="/notifications" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-secondary))] rounded-md">Reminders</Link>
                <Link to="/saved" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-secondary))] rounded-md">Saved Events</Link>
                <Link to="/waitlists" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-secondary))] rounded-md">Waitlists</Link>
                {user.role === 'CREATOR' && (
                  <>
                    <div className="pt-2 border-t border-[rgb(var(--border-primary))]">
                      <p className="px-3 py-1 text-xs font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider">Creator Tools</p>
                    </div>
                    <Link to="/analytics" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-secondary))] rounded-md">Analytics</Link>
                    <Link to="/verify-ticket" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-secondary))] rounded-md">Verify Ticket</Link>
                    <Link to="/promo-codes" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-secondary))] rounded-md">Promo Codes</Link>
                  </>
                )}
                <div className="pt-2 border-t border-[rgb(var(--border-primary))]">
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-secondary))] rounded-md">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <HiOutlineUserCircle className="w-5 h-5" />
                    )}
                    My Profile
                  </Link>
                  <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-[rgb(var(--bg-secondary))] rounded-md">Logout</button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-secondary))] rounded-md">Login</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:bg-[rgb(var(--bg-secondary))] rounded-md">Register</Link>
              </>
            )}
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
