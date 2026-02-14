import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { HiOutlineMoon, HiOutlineSun } from 'react-icons/hi';

export default function Login() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/events');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
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
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-1">Welcome back</h1>
          <p className="text-[rgb(var(--text-secondary))] mb-6">Sign in to your Eventful account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]"
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[rgb(var(--text-secondary))]">
            Don't have an account? <Link to="/register" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
