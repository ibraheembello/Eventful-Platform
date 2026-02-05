import { useState } from 'react';
import { HiQrcode, HiCheckCircle, HiXCircle, HiSearch } from 'react-icons/hi';
import { format } from 'date-fns';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface VerificationResult {
  valid: boolean;
  ticket?: {
    id: string;
    qrToken: string;
    status: string;
    scannedAt: string | null;
    event: {
      id: string;
      title: string;
      date: string;
      location: string;
    };
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  message: string;
}

export default function VerifyTicket() {
  const [qrToken, setQrToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!qrToken.trim()) {
      toast.error('Please enter a QR code token');
      return;
    }

    try {
      setVerifying(true);
      setResult(null);

      const response = await api.post('/tickets/verify', { qrToken: qrToken.trim() });

      if (response.data.success) {
        // Backend returns the ticket object directly in data, mark it as valid
        setResult({
          valid: true,
          ticket: response.data.data,
          message: response.data.message || 'Ticket verified successfully!'
        });
        toast.success('Ticket verified successfully!');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to verify ticket';
      toast.error(errorMessage);
      // Don't set result here - let the error toast be the only feedback for errors
      // This prevents showing "Invalid Ticket" when the real message is "already used"
    } finally {
      setVerifying(false);
    }
  };

  const resetForm = () => {
    setQrToken('');
    setResult(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 text-center">
        <HiQrcode className="w-16 h-16 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))]">Verify Ticket</h1>
        <p className="text-[rgb(var(--text-secondary))] mt-2">Scan or enter the QR code token to verify event tickets</p>
      </div>

      {/* Verification Form */}
      <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-8 mb-6">
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-2">
              QR Code Token
            </label>
            <div className="relative">
              <input
                type="text"
                value={qrToken}
                onChange={(e) => setQrToken(e.target.value)}
                placeholder="Enter QR code token..."
                className="w-full px-4 py-3 pr-12 border border-[rgb(var(--border-primary))] rounded-lg
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none
                  bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]
                  placeholder:text-[rgb(var(--text-tertiary))] font-mono text-sm transition-all"
                disabled={verifying}
              />
              <HiSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[rgb(var(--text-tertiary))]" />
            </div>
            <p className="text-xs text-[rgb(var(--text-tertiary))] mt-2">
              Enter the QR code token from the ticket
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={verifying || !qrToken.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg
                hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50
                disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg"
            >
              {verifying ? 'Verifying...' : 'Verify Ticket'}
            </button>
            {result && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-primary))] rounded-lg
                  hover:bg-[rgb(var(--bg-secondary))] transition-all"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Verification Result */}
      {result && (
        <div
          className={`glass rounded-2xl p-8 border-2 ${
            result.valid
              ? 'border-green-500 dark:border-green-400'
              : 'border-red-500 dark:border-red-400'
          }`}
        >
          <div className="text-center mb-6">
            {result.valid ? (
              <HiCheckCircle className="w-20 h-20 text-green-500 dark:text-green-400 mx-auto mb-4" />
            ) : (
              <HiXCircle className="w-20 h-20 text-red-500 dark:text-red-400 mx-auto mb-4" />
            )}
            <h2
              className={`text-2xl font-bold mb-2 ${
                result.valid
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {result.valid ? 'Valid Ticket' : 'Invalid Ticket'}
            </h2>
            <p
              className={`text-lg ${
                result.valid
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {result.message}
            </p>
          </div>

          {result.valid && result.ticket && (
            <div className="glass border border-[rgb(var(--border-primary))] rounded-xl p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[rgb(var(--text-tertiary))] mb-1">Event</h3>
                <p className="text-lg font-bold text-[rgb(var(--text-primary))]">{result.ticket.event.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-[rgb(var(--text-tertiary))] mb-1">Date</h3>
                  <p className="text-[rgb(var(--text-primary))]">{format(new Date(result.ticket.event.date), 'PPP')}</p>
                  <p className="text-[rgb(var(--text-secondary))] text-sm">{format(new Date(result.ticket.event.date), 'p')}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[rgb(var(--text-tertiary))] mb-1">Location</h3>
                  <p className="text-[rgb(var(--text-primary))]">{result.ticket.event.location}</p>
                </div>
              </div>

              <div className="border-t border-[rgb(var(--border-primary))] pt-4">
                <h3 className="text-sm font-semibold text-[rgb(var(--text-tertiary))] mb-2">Ticket Holder</h3>
                <p className="text-[rgb(var(--text-primary))] font-semibold">
                  {result.ticket.user.firstName} {result.ticket.user.lastName}
                </p>
                <p className="text-[rgb(var(--text-secondary))] text-sm">{result.ticket.user.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-[rgb(var(--border-primary))] pt-4">
                <div>
                  <h3 className="text-sm font-semibold text-[rgb(var(--text-tertiary))] mb-1">Ticket ID</h3>
                  <p className="text-[rgb(var(--text-primary))] font-mono text-sm">{result.ticket.id}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[rgb(var(--text-tertiary))] mb-1">Status</h3>
                  <span
                    className={`inline-block px-3 py-1 text-sm rounded-full font-semibold ${
                      result.ticket.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : result.ticket.status === 'USED'
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {result.ticket.status}
                  </span>
                </div>
              </div>

              {result.ticket.scannedAt && (
                <div className="bg-[rgb(var(--bg-tertiary))] rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-[rgb(var(--text-tertiary))] mb-1">Previously Scanned</h3>
                  <p className="text-[rgb(var(--text-primary))]">
                    {format(new Date(result.ticket.scannedAt), 'PPP p')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {!result && (
        <div className="glass border border-indigo-200 dark:border-indigo-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-3">How to Verify Tickets</h3>
          <ol className="space-y-2 text-[rgb(var(--text-secondary))]">
            <li className="flex items-start gap-2">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">1.</span>
              <span>Ask the attendee to show their ticket QR code</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">2.</span>
              <span>Scan the QR code or manually enter the token displayed on the ticket</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">3.</span>
              <span>Click "Verify Ticket" to check if the ticket is valid</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">4.</span>
              <span>If valid, allow the attendee to enter the event</span>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
