import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { HiOutlineMoon, HiOutlineSun, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';
import { LogoFull } from '../components/Logo';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || '';

export default function Login() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleGoogleLogin = () => {
    sessionStorage.removeItem('google_oauth_role');
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('openid email profile')}&access_type=offline&prompt=select_account`;
  };

  const handleGitHubLogin = () => {
    sessionStorage.removeItem('github_oauth_role');
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
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
          <Link to="/"><LogoFull size={32} /></Link>
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
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2.5 pr-11 border border-[rgb(var(--border-primary))] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]"
                  placeholder="Enter your password"
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
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Social Login Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgb(var(--border-primary))]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-tertiary))]">or continue with</span>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="space-y-3">
            {GOOGLE_CLIENT_ID && (
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-[rgb(var(--border-primary))] rounded-lg font-medium hover:bg-[rgb(var(--bg-secondary))] disabled:opacity-50 transition text-[rgb(var(--text-primary))]"
              >
                <FcGoogle className="w-5 h-5" />
                Sign in with Google
              </button>
            )}
            {GITHUB_CLIENT_ID && (
              <button
                type="button"
                onClick={handleGitHubLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-[rgb(var(--border-primary))] rounded-lg font-medium hover:bg-[rgb(var(--bg-secondary))] disabled:opacity-50 transition text-[rgb(var(--text-primary))]"
              >
                <FaGithub className="w-5 h-5" />
                Sign in with GitHub
              </button>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-[rgb(var(--text-secondary))]">
            Don't have an account? <Link to="/register" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
