import { useEffect, useState } from 'react';
import { HiTicket, HiDownload, HiQrcode, HiCheckCircle, HiXCircle } from 'react-icons/hi';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import type { Ticket } from '../types';

export default function MyTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    fetchTickets();
  }, [page]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tickets', {
        params: { page, limit: 10 }
      });

      if (response.data.success) {
        setTickets(response.data.data);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const downloadTicket = (ticket: Ticket) => {
    const ticketData = `
EVENTFUL TICKET
================
Event: ${ticket.event.title}
Date: ${format(new Date(ticket.event.date), 'PPP p')}
Location: ${ticket.event.location}
Ticket ID: ${ticket.id}
Status: ${ticket.status}
================
    `.trim();

    const blob = new Blob([ticketData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${ticket.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Ticket downloaded!');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] flex items-center gap-2">
          <HiTicket className="text-emerald-600 dark:text-emerald-400" /> My Tickets
        </h1>
      </div>

      {tickets.length === 0 ? (
        <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgb(var(--bg-tertiary))] mb-4">
            <HiTicket className="w-8 h-8 text-[rgb(var(--text-tertiary))]" />
          </div>
          <h3 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">No Tickets Yet</h3>
          <p className="text-[rgb(var(--text-secondary))] mb-6">You haven't purchased any tickets yet.</p>
          <a
            href="/events"
            className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            Browse Events
          </a>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="glass border border-[rgb(var(--border-primary))] rounded-2xl overflow-hidden card-hover">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] line-clamp-2">
                      {ticket.event.title}
                    </h3>
                    <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                      ticket.status === 'ACTIVE' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                      ticket.status === 'USED' ? 'bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-secondary))]' :
                      'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-[rgb(var(--text-secondary))] mb-4">
                    <p>
                      <span className="font-semibold text-[rgb(var(--text-primary))]">Date:</span>{' '}
                      {format(new Date(ticket.event.date), 'PPP')}
                    </p>
                    <p>
                      <span className="font-semibold text-[rgb(var(--text-primary))]">Time:</span>{' '}
                      {format(new Date(ticket.event.date), 'p')}
                    </p>
                    <p>
                      <span className="font-semibold text-[rgb(var(--text-primary))]">Location:</span>{' '}
                      {ticket.event.location}
                    </p>
                    {ticket.scannedAt && (
                      <p className="text-[rgb(var(--text-tertiary))]">
                        <span className="font-semibold">Scanned:</span>{' '}
                        {format(new Date(ticket.scannedAt), 'PPP p')}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      className="flex-1 px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-1"
                    >
                      <HiQrcode className="w-4 h-4" /> View QR
                    </button>
                    <button
                      onClick={() => downloadTicket(ticket)}
                      className="px-3 py-2 bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-secondary))] text-sm rounded-lg hover:bg-[rgb(var(--border-primary))] transition"
                    >
                      <HiDownload className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[rgb(var(--bg-secondary))]"
              >
                Previous
              </button>
              <span className="text-[rgb(var(--text-secondary))]">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[rgb(var(--bg-secondary))]"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* QR Code Modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-4">
                {selectedTicket.event.title}
              </h3>

              {selectedTicket.qrCodeData ? (
                <>
                  <div className="bg-white p-4 rounded-lg mb-4 inline-block">
                    <QRCodeSVG
                      value={selectedTicket.qrCodeData}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <div className="bg-[rgb(var(--bg-tertiary))] rounded-lg p-3 mb-4 max-w-md mx-auto">
                    <p className="text-xs text-[rgb(var(--text-tertiary))] mb-1">QR Token (for manual entry):</p>
                    <p className="text-xs font-mono text-[rgb(var(--text-primary))] break-all select-all">
                      {selectedTicket.qrCodeData}
                    </p>
                  </div>
                </>
              ) : (
                <div className="bg-[rgb(var(--bg-tertiary))] p-4 rounded-lg mb-4 inline-block w-[232px] h-[232px] flex items-center justify-center">
                  <p className="text-sm text-[rgb(var(--text-tertiary))]">QR Code not available</p>
                </div>
              )}

              <p className="text-sm text-[rgb(var(--text-secondary))] mb-2">Ticket ID: {selectedTicket.id}</p>

              <div className="flex items-center justify-center gap-2 mb-4">
                {selectedTicket.status === 'ACTIVE' ? (
                  <>
                    <HiCheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
                  </>
                ) : selectedTicket.status === 'USED' ? (
                  <>
                    <HiCheckCircle className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
                    <span className="font-semibold text-[rgb(var(--text-secondary))]">Used</span>
                  </>
                ) : (
                  <>
                    <HiXCircle className="w-5 h-5 text-red-500" />
                    <span className="font-semibold text-red-600 dark:text-red-400">Cancelled</span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
