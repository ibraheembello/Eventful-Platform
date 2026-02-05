import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HiCheckCircle, HiXCircle, HiClock } from 'react-icons/hi';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [ticket, setTicket] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference');

      if (!reference) {
        setStatus('failed');
        setError('No payment reference found');
        return;
      }

      try {
        const response = await api.get(`/payments/verify/${reference}`);

        if (response.data.success && response.data.data.payment.status === 'SUCCESS') {
          setStatus('success');
          setTicket(response.data.data.ticket);
          toast.success('Payment successful! Your ticket has been generated.');
        } else {
          setStatus('failed');
          setError(response.data.message || 'Payment verification failed');
          toast.error('Payment verification failed');
        }
      } catch (err: any) {
        setStatus('failed');
        setError(err.response?.data?.message || 'Failed to verify payment');
        toast.error('Failed to verify payment');
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full glass border border-[rgb(var(--border-primary))] rounded-2xl shadow-lg p-8">
        {status === 'verifying' && (
          <div className="text-center">
            <HiClock className="w-16 h-16 text-blue-500 dark:text-blue-400 mx-auto animate-spin" />
            <h2 className="mt-4 text-2xl font-bold text-[rgb(var(--text-primary))]">Verifying Payment</h2>
            <p className="mt-2 text-[rgb(var(--text-secondary))]">Please wait while we confirm your payment...</p>
          </div>
        )}

        {status === 'success' && ticket && (
          <div className="text-center">
            <HiCheckCircle className="w-16 h-16 text-green-500 dark:text-green-400 mx-auto animate-bounce" />
            <h2 className="mt-4 text-3xl font-bold text-[rgb(var(--text-primary))]">Congratulations! 🎉</h2>
            <p className="mt-2 text-lg font-semibold text-green-600 dark:text-green-400">Payment Successful!</p>
            <p className="mt-2 text-[rgb(var(--text-secondary))]">
              Your ticket has been generated successfully. Get ready for an amazing experience!
            </p>

            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg text-left">
              <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-3 flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                Ticket Details
              </h3>
              <p className="text-sm text-[rgb(var(--text-secondary))]">Ticket ID: <span className="font-mono text-[rgb(var(--text-primary))]">{ticket.id}</span></p>
              <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">Status: <span className="text-green-600 dark:text-green-400 font-semibold">{ticket.status}</span></p>
              <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                  💡 Your ticket is ready! Check your email for confirmation and save your QR code.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => navigate('/tickets')}
                className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
              >
                View My Tickets
              </button>
              <button
                onClick={() => navigate('/events')}
                className="w-full px-4 py-2 bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-primary))] border border-[rgb(var(--border-primary))] rounded-lg hover:bg-[rgb(var(--bg-secondary))] transition-all"
              >
                Browse More Events
              </button>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="text-center">
            <HiXCircle className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto" />
            <h2 className="mt-4 text-2xl font-bold text-[rgb(var(--text-primary))]">Payment Failed</h2>
            <p className="mt-2 text-[rgb(var(--text-secondary))]">{error || 'We could not verify your payment.'}</p>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => navigate('/events')}
                className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
              >
                Back to Events
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-primary))] border border-[rgb(var(--border-primary))] rounded-lg hover:bg-[rgb(var(--bg-secondary))] transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
