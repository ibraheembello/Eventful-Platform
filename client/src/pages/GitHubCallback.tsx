import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function GitHubCallback() {
  const { socialLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('GitHub authorization was denied.');
      toast.error('GitHub authorization was denied');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (!code) {
      setError('No authorization code received from GitHub.');
      toast.error('GitHub login failed');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    const role = sessionStorage.getItem('github_oauth_role') || undefined;
    sessionStorage.removeItem('github_oauth_role');

    const payload: Record<string, string> = { code };
    if (role) payload.role = role;

    socialLogin('github', payload)
      .then(() => {
        toast.success(role ? 'Account created successfully!' : 'Welcome back!');
        navigate('/events');
      })
      .catch((err: any) => {
        const message = err.response?.data?.message || 'GitHub login failed';
        setError(message);
        toast.error(message);
        setTimeout(() => navigate(role ? '/register' : '/login'), 2000);
      });
  }, [searchParams, socialLogin, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg-secondary))]">
      <div className="text-center">
        {error ? (
          <div>
            <p className="text-red-500 text-lg font-medium mb-2">{error}</p>
            <p className="text-[rgb(var(--text-secondary))] text-sm">Redirecting...</p>
          </div>
        ) : (
          <div>
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[rgb(var(--text-primary))] font-medium">Completing GitHub sign-in...</p>
          </div>
        )}
      </div>
    </div>
  );
}
