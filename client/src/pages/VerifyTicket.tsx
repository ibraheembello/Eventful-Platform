import { useState, useEffect, useRef } from 'react';
import { HiQrcode, HiCheckCircle, HiXCircle, HiSearch, HiCamera, HiPencilAlt } from 'react-icons/hi';
import { format } from 'date-fns';
import { Html5Qrcode } from 'html5-qrcode';
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

type Tab = 'scan' | 'manual';

export default function VerifyTicket() {
  const [qrToken, setQrToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('scan');
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader';

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING
          await scannerRef.current.stop();
        }
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        try {
          const state = scannerRef.current.getState();
          if (state === 2) {
            scannerRef.current.stop().catch(() => {});
          }
        } catch {}
      }
    };
  }, []);

  const handleVerify = async (token: string) => {
    if (!token.trim()) {
      toast.error('Please enter a QR code token');
      return;
    }

    try {
      setVerifying(true);
      setResult(null);

      const response = await api.post('/tickets/verify', { qrToken: token.trim() });

      if (response.data.success) {
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
    } finally {
      setVerifying(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleVerify(qrToken);
  };

  const startScanner = async () => {
    setCameraError('');
    setResult(null);

    // Small delay to ensure DOM element is mounted
    await new Promise((r) => setTimeout(r, 100));

    const container = document.getElementById(scannerContainerId);
    if (!container) return;

    try {
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;
      setScanning(true);

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // Stop scanner on successful scan
          await stopScanner();
          // Auto-verify the scanned token
          await handleVerify(decodedText);
        },
        () => {
          // Ignore QR scan failures (happens every frame until a code is found)
        }
      );
    } catch (err: any) {
      setScanning(false);
      if (err?.toString().includes('NotAllowedError') || err?.toString().includes('Permission')) {
        setCameraError('Camera permission was denied. Please allow camera access in your browser settings, or use the manual entry tab.');
      } else if (err?.toString().includes('NotFoundError')) {
        setCameraError('No camera found on this device. Please use the manual entry tab.');
      } else {
        setCameraError('Could not start camera. Please use the manual entry tab.');
      }
    }
  };

  const handleTabChange = async (tab: Tab) => {
    if (tab === activeTab) return;
    await stopScanner();
    setCameraError('');
    setActiveTab(tab);
  };

  const resetForm = async () => {
    setQrToken('');
    setResult(null);
    setCameraError('');
    await stopScanner();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 text-center">
        <HiQrcode className="w-16 h-16 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))]">Verify Ticket</h1>
        <p className="text-[rgb(var(--text-secondary))] mt-2">Scan or enter the QR code token to verify event tickets</p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-[rgb(var(--border-primary))] mb-6">
        <button
          type="button"
          onClick={() => handleTabChange('scan')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'scan'
              ? 'bg-indigo-600 text-white'
              : 'bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-secondary))]'
          }`}
        >
          <HiCamera className="w-4 h-4" />
          Scan QR Code
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'manual'
              ? 'bg-indigo-600 text-white'
              : 'bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-secondary))]'
          }`}
        >
          <HiPencilAlt className="w-4 h-4" />
          Enter Manually
        </button>
      </div>

      {/* Scanner / Manual Input */}
      <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-8 mb-6">
        {activeTab === 'scan' ? (
          <div>
            {!scanning && !result && !cameraError && (
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mx-auto mb-4">
                  <HiCamera className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-[rgb(var(--text-secondary))] mb-6">
                  Point your camera at a ticket QR code to verify it instantly.
                </p>
                <button
                  type="button"
                  onClick={startScanner}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-md hover:shadow-lg"
                >
                  Start Camera
                </button>
              </div>
            )}

            {/* Camera viewport */}
            <div
              id={scannerContainerId}
              className={scanning ? 'rounded-xl overflow-hidden' : 'hidden'}
            />

            {scanning && (
              <div className="text-center mt-4">
                <p className="text-sm text-[rgb(var(--text-secondary))] mb-3">
                  Scanning... Point the camera at a QR code
                </p>
                <button
                  type="button"
                  onClick={stopScanner}
                  className="px-6 py-2 bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-primary))] rounded-lg hover:bg-[rgb(var(--bg-secondary))] transition-all text-sm"
                >
                  Stop Camera
                </button>
              </div>
            )}

            {cameraError && (
              <div className="text-center">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl mb-4">
                  <p className="text-sm text-amber-700 dark:text-amber-400">{cameraError}</p>
                </div>
                <button
                  type="button"
                  onClick={startScanner}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm mr-2"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('manual')}
                  className="px-6 py-2 bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-primary))] rounded-lg hover:bg-[rgb(var(--bg-secondary))] transition-all text-sm"
                >
                  Enter Manually
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-4">
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
        )}
      </div>

      {/* Verification Result */}
      {result && (
        <div
          className={`glass rounded-2xl p-8 border-2 mb-6 ${
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

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium"
            >
              Verify Another Ticket
            </button>
          </div>
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
              <span>Use the <strong>Scan QR Code</strong> tab to scan with your camera, or enter the token manually</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">3.</span>
              <span>The ticket will be verified automatically and marked as used</span>
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
