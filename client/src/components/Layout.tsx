import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HiOutlineTicket, HiOutlineBell, HiOutlineChartBar, HiOutlineCalendar, HiOutlineLogout, HiOutlineMenu, HiOutlineX, HiOutlineQrcode, HiOutlineMoon, HiOutlineSun } from 'react-icons/hi';
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
              <Link to="/" className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Eventful</Link>
              <div className="hidden md:flex ml-10 space-x-4">
                <Link to="/events" className="flex items-center gap-1 px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-[rgb(var(--bg-secondary))] transition-colors">
                  <HiOutlineCalendar className="w-4 h-4" /> Events
                </Link>
                {user && (
                  <>
                    <Link to="/tickets" className="flex items-center gap-1 px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-[rgb(var(--bg-secondary))] transition-colors">
                      <HiOutlineTicket className="w-4 h-4" /> My Tickets
                    </Link>
                    <Link to="/notifications" className="flex items-center gap-1 px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-[rgb(var(--bg-secondary))] transition-colors">
                      <HiOutlineBell className="w-4 h-4" /> Reminders
                    </Link>
                    {user.role === 'CREATOR' && (
                      <>
                        <Link to="/analytics" className="flex items-center gap-1 px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-[rgb(var(--bg-secondary))] transition-colors">
                          <HiOutlineChartBar className="w-4 h-4" /> Analytics
                        </Link>
                        <Link to="/verify-ticket" className="flex items-center gap-1 px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-[rgb(var(--bg-secondary))] transition-colors">
                          <HiOutlineQrcode className="w-4 h-4" /> Verify Ticket
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
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <HiOutlineMoon className="w-5 h-5" /> : <HiOutlineSun className="w-5 h-5" />}
              </button>
              {user ? (
                <>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{user.firstName} ({user.role})</span>
                  <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400">
                    <HiOutlineLogout className="w-4 h-4" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">Login</Link>
                  <Link to="/register" className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors">Register</Link>
                </>
              )}
            </div>
            <div className="md:hidden flex items-center">
              <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-700">
                {menuOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 px-4 py-3 space-y-2">
            <Link to="/events" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">Events</Link>
            {user ? (
              <>
                <Link to="/tickets" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">My Tickets</Link>
                <Link to="/notifications" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">Reminders</Link>
                {user.role === 'CREATOR' && (
                  <>
                    <Link to="/analytics" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">Analytics</Link>
                    <Link to="/verify-ticket" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">Verify Ticket</Link>
                  </>
                )}
                <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50 rounded-md">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">Login</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-indigo-600 hover:bg-gray-50 rounded-md">Register</Link>
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
