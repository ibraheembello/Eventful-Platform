import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HiOutlineTicket, HiOutlineBell, HiOutlineChartBar, HiOutlineCalendar, HiOutlineLogout, HiOutlineMenu, HiOutlineX, HiOutlineQrcode, HiOutlineMoon, HiOutlineSun, HiOutlineUserCircle, HiOutlineHome, HiOutlineBookmark, HiOutlineTag, HiOutlineClock } from 'react-icons/hi';
import { useState } from 'react';

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

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
              <div className="hidden md:flex ml-10 space-x-4">
                <Link to="/" className="flex items-center gap-1 px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md hover:bg-[rgb(var(--bg-secondary))] transition-colors">
                  <HiOutlineHome className="w-4 h-4" /> Home
                </Link>
                <Link to="/events" className="flex items-center gap-1 px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md hover:bg-[rgb(var(--bg-secondary))] transition-colors">
                  <HiOutlineCalendar className="w-4 h-4" /> Events
                </Link>
                {user && (
                  <>
                    <Link to="/tickets" className="flex items-center gap-1 px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md hover:bg-[rgb(var(--bg-secondary))] transition-colors">
                      <HiOutlineTicket className="w-4 h-4" /> My Tickets
                    </Link>
                    <Link to="/notifications" className="flex items-center gap-1 px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md hover:bg-[rgb(var(--bg-secondary))] transition-colors">
                      <HiOutlineBell className="w-4 h-4" /> Reminders
                    </Link>
                    <Link to="/saved" className="flex items-center gap-1 px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md hover:bg-[rgb(var(--bg-secondary))] transition-colors">
                      <HiOutlineBookmark className="w-4 h-4" /> Saved
                    </Link>
                    <Link to="/waitlists" className="flex items-center gap-1 px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md hover:bg-[rgb(var(--bg-secondary))] transition-colors">
                      <HiOutlineClock className="w-4 h-4" /> Waitlists
                    </Link>
                    {user.role === 'CREATOR' && (
                      <>
                        <Link to="/analytics" className="flex items-center gap-1 px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md hover:bg-[rgb(var(--bg-secondary))] transition-colors">
                          <HiOutlineChartBar className="w-4 h-4" /> Analytics
                        </Link>
                        <Link to="/verify-ticket" className="flex items-center gap-1 px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md hover:bg-[rgb(var(--bg-secondary))] transition-colors">
                          <HiOutlineQrcode className="w-4 h-4" /> Verify Ticket
                        </Link>
                        <Link to="/promo-codes" className="flex items-center gap-1 px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md hover:bg-[rgb(var(--bg-secondary))] transition-colors">
                          <HiOutlineTag className="w-4 h-4" /> Promo Codes
                        </Link>
                      </>
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
            {user ? (
              <>
                <Link to="/tickets" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-secondary))] rounded-md">My Tickets</Link>
                <Link to="/notifications" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-secondary))] rounded-md">Reminders</Link>
                <Link to="/saved" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-secondary))] rounded-md">Saved Events</Link>
                <Link to="/waitlists" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-secondary))] rounded-md">Waitlists</Link>
                {user.role === 'CREATOR' && (
                  <>
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
