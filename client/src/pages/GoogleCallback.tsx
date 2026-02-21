import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { HiX } from 'react-icons/hi';

export default function GoogleCallback() {
  const { socialLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [googleCode, setGoogleCode] = useState('');
  const [loading, setLoading] = useState(false);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('Google authorization was denied.');
      toast.error('Google authorization was denied');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (!code) {
      setError('No authorization code received from Google.');
      toast.error('Google login failed');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    const role = sessionStorage.getItem('google_oauth_role') || undefined;
    sessionStorage.removeItem('google_oauth_role');

    const payload: Record<string, string> = { code };
    if (role) payload.role = role;

    api.post('/auth/google', payload)
      .then((res) => {
        const data = res.data.data;
        if (data.needsRole) {
          // New user without role — show role selection
          setGoogleCode(code);
          setShowRoleModal(true);
        } else {
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          toast.success(role ? 'Account created successfully!' : 'Welcome back!');
          window.location.href = '/events';
        }
      })
      .catch((err: any) => {
        const message = err.response?.data?.message || 'Google login failed';
        if (message.toLowerCase().includes('role is required') || message.toLowerCase().includes('sign up first')) {
          setGoogleCode(code);
          setShowRoleModal(true);
        } else {
          setError(message);
          toast.error(message);
          setTimeout(() => navigate(role ? '/register' : '/login'), 2000);
        }
      });
  }, [searchParams, navigate]);

  const handleRoleSelect = async (role: string) => {
    setShowRoleModal(false);
    setLoading(true);
    try {
      await socialLogin('google', { code: googleCode, role });
      toast.success('Account created successfully!');
      navigate('/events');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Sign-up failed');
      navigate('/register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg-secondary))]">
      <div className="text-center">
        {showRoleModal ? (
          <div className="w-full max-w-sm bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] rounded-2xl p-6 shadow-xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[rgb(var(--text-primary))]">Welcome to Eventful!</h2>
              <button
                type="button"
                onClick={() => { setShowRoleModal(false); navigate('/login'); }}
                className="p-1 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-[rgb(var(--text-secondary))] mb-5">
              It looks like you're new here. How would you like to use Eventful?
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleRoleSelect('EVENTEE')}
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border border-[rgb(var(--border-primary))] hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition text-left disabled:opacity-50"
              >
                <span className="font-semibold text-[rgb(var(--text-primary))]">Attend Events</span>
                <p className="text-xs text-[rgb(var(--text-secondary))] mt-0.5">Discover and buy tickets to events</p>
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('CREATOR')}
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border border-[rgb(var(--border-primary))] hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition text-left disabled:opacity-50"
              >
                <span className="font-semibold text-[rgb(var(--text-primary))]">Create Events</span>
                <p className="text-xs text-[rgb(var(--text-secondary))] mt-0.5">Host and manage your own events</p>
              </button>
            </div>
          </div>
        ) : error ? (
          <div>
            <p className="text-red-500 text-lg font-medium mb-2">{error}</p>
            <p className="text-[rgb(var(--text-secondary))] text-sm">Redirecting...</p>
          </div>
        ) : (
          <div>
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[rgb(var(--text-primary))] font-medium">Completing Google sign-in...</p>
          </div>
        )}
      </div>
    </div>
  );
}
