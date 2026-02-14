import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { HiOutlineMoon, HiOutlineSun, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';

export default function Register() {
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'EVENTEE',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created successfully!');
      navigate('/events');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg-secondary))] transition-colors duration-200 px-4">
      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 text-[rgb(var(--text-secondary))] hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <HiOutlineMoon className="w-5 h-5" /> : <HiOutlineSun className="w-5 h-5" />}
        </button>
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
            Eventful
          </Link>
        </div>
        <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-1">Create an account</h1>
          <p className="text-[rgb(var(--text-secondary))] mb-6">Join Eventful to discover and create events</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2.5 pr-11 border border-[rgb(var(--border-primary))] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]"
                  placeholder="Min. 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">I want to</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: 'EVENTEE' })}
                  className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition ${
                    form.role === 'EVENTEE'
                      ? 'border-emerald-600 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                      : 'border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-secondary))]'
                  }`}
                >
                  Attend Events
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: 'CREATOR' })}
                  className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition ${
                    form.role === 'CREATOR'
                      ? 'border-emerald-600 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                      : 'border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-secondary))]'
                  }`}
                >
                  Create Events
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[rgb(var(--text-secondary))]">
            Already have an account? <Link to="/login" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
