import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import type { WaitlistEntry } from '../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  HiOutlineCalendar, HiOutlineLocationMarker, HiOutlineUsers,
  HiOutlineCurrencyDollar, HiOutlineTag, HiOutlineClock,
} from 'react-icons/hi';

export default function MyWaitlists() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchWaitlists();
  }, [page]);

  const fetchWaitlists = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events/waitlists', { params: { page, limit: 12 } });
      setEntries(res.data.data?.entries || res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      toast.error('Failed to load waitlists');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveWaitlist = async (e: React.MouseEvent, eventId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setRemovingId(eventId);
    try {
      await api.delete(`/events/${eventId}/waitlist`);
      setEntries((prev) => prev.filter((entry) => entry.eventId !== eventId));
      toast.success('Left waitlist');
    } catch {
      toast.error('Failed to leave waitlist');
    } finally {
      setRemovingId(null);
    }
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] flex items-center gap-2">
          <HiOutlineClock className="text-amber-600 dark:text-amber-400" /> My Waitlists
        </h1>
        <p className="text-[rgb(var(--text-secondary))] mt-1">Events you're waiting for a spot on</p>
      </div>

      {entries.length === 0 ? (
        <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgb(var(--bg-tertiary))] mb-4">
            <HiOutlineClock className="w-8 h-8 text-[rgb(var(--text-tertiary))]" />
          </div>
          <h3 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">No Waitlists</h3>
          <p className="text-[rgb(var(--text-secondary))] mb-6">
            You're not on any waitlists yet. Join a waitlist when an event is sold out.
          </p>
          <Link
            to="/events"
            className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.map((entry) => {
              const event = entry.event;
              if (!event) return null;

              return (
                <Link
                  key={entry.id}
                  to={`/events/${event.id}`}
                  className={`card-hover glass border border-[rgb(var(--border-primary))] rounded-2xl overflow-hidden group transition-all duration-300 ${
                    removingId === entry.eventId ? 'opacity-0 scale-95' : ''
                  }`}
                >
                  <div className="relative h-48 bg-gradient-to-br from-amber-500 via-orange-600 to-red-700 overflow-hidden">
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-6xl font-bold opacity-20">
                          {event.title[0]}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    {event.category && (
                      <div className="absolute top-3 left-3">
                        <div className="glass-light px-3 py-1 rounded-full flex items-center gap-1.5">
                          <HiOutlineTag className="w-3.5 h-3.5 text-white" />
                          <span className="text-xs font-medium text-white">{event.category}</span>
                        </div>
                      </div>
                    )}

                    {/* Position Badge */}
                    <div className="absolute top-3 right-3">
                      <div className="px-3 py-1 rounded-full bg-amber-500/90 text-white text-xs font-semibold flex items-center gap-1">
                        <HiOutlineClock className="w-3.5 h-3.5" />
                        Position #{entry.position}
                      </div>
                    </div>

                    {entry.notified && (
                      <div className="absolute bottom-3 right-3">
                        <div className="px-3 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-semibold">
                          Spot Available!
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="font-semibold text-lg text-[rgb(var(--text-primary))] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-2 line-clamp-2">
                      {event.title}
                    </h3>

                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]">
                        <HiOutlineCalendar className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>{format(new Date(event.date), 'MMM d, yyyy • h:mm a')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]">
                        <HiOutlineLocationMarker className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[rgb(var(--border-primary))]">
                        <div className="flex items-center gap-2 text-sm">
                          <HiOutlineUsers className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                          <span className="text-[rgb(var(--text-secondary))]">
                            {event._count?.tickets || 0}/{event.capacity}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <HiOutlineCurrencyDollar className="w-4 h-4" />
                          <span>{event.price > 0 ? `${event.price.toLocaleString()}` : 'Free'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Leave Waitlist Button */}
                    <button
                      type="button"
                      onClick={(e) => handleLeaveWaitlist(e, entry.eventId)}
                      className="mt-4 w-full px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition font-medium"
                    >
                      Leave Waitlist
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[rgb(var(--bg-secondary))]"
              >
                Previous
              </button>
              <span className="text-[rgb(var(--text-secondary))]">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[rgb(var(--bg-secondary))]"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
