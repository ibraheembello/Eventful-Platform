import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import type { WaitlistEntry } from '../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  HiOutlineCalendar, HiOutlineLocationMarker, HiOutlineUsers,
  HiOutlineCurrencyDollar, HiOutlineTag, HiOutlineClock,
  HiOutlineBell, HiOutlineArrowRight, HiOutlineTicket, HiOutlineCheck,
} from 'react-icons/hi';

export default function MyWaitlists() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchWaitlists();
  }, [page]);

  const fetchWaitlists = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/events/waitlists', { params: { page, limit: 12 } });
      const data = res.data?.data;
      const list = Array.isArray(data) ? data : (Array.isArray(data?.entries) ? data.entries : []);
      setEntries(list);
      setTotalPages(res.data?.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Waitlists fetch error:', err);
      setError('Failed to load waitlists. Please try again.');
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

      {error ? (
        <div className="glass border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <HiOutlineBell className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">Unable to Load Waitlists</h3>
          <p className="text-sm text-[rgb(var(--text-secondary))] mb-4">{error}</p>
          <button
            onClick={() => fetchWaitlists()}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : entries.length === 0 ? (
        <div className="space-y-8">
          {/* Hero empty state */}
          <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Left — Phone mockup showing the waitlist flow */}
              <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-slate-900 p-8 sm:p-12 flex justify-center items-center">
                <div className="absolute top-6 left-6 w-32 h-32 bg-amber-300/20 dark:bg-amber-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-6 right-6 w-40 h-40 bg-orange-300/20 dark:bg-orange-500/10 rounded-full blur-3xl" />
                {/* Phone frame */}
                <div className="relative w-[240px] sm:w-[260px]">
                  <div className="relative rounded-[2rem] border-[6px] border-gray-800 dark:border-gray-700 bg-gray-900 shadow-2xl overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-800 dark:bg-gray-700 rounded-b-xl z-10" />
                    <div className="bg-gray-50 dark:bg-slate-900 pt-7 pb-3 px-2.5 min-h-[380px]">
                      {/* Status bar */}
                      <div className="flex justify-between items-center px-2 mb-3">
                        <span className="text-[9px] font-semibold text-gray-800 dark:text-gray-200">9:41</span>
                        <div className="flex gap-1">
                          <div className="w-3 h-1.5 rounded-sm bg-gray-800 dark:bg-gray-200" />
                          <div className="w-3 h-1.5 rounded-sm bg-gray-800 dark:bg-gray-200" />
                        </div>
                      </div>
                      {/* App header */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Eventful</span>
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[7px] font-bold">U</div>
                      </div>

                      {/* Sold out event card */}
                      <div className="mb-2.5 rounded-lg overflow-hidden bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700">
                        <div className="h-16 bg-gradient-to-br from-amber-500 to-orange-600 relative">
                          <span className="absolute top-1.5 left-1.5 text-[7px] bg-white/20 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full">Music</span>
                          <div className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-bold">SOLD OUT</div>
                        </div>
                        <div className="p-2">
                          <p className="text-[9px] font-semibold text-gray-800 dark:text-gray-200 mb-0.5">Afro Beats Live</p>
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] text-gray-500">Mar 22 &bull; Lagos</span>
                            <span className="text-[8px] font-semibold text-red-500">500/500</span>
                          </div>
                        </div>
                      </div>

                      {/* Join waitlist button */}
                      <button className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold rounded-lg mb-2.5 shadow-md">
                        Join Waitlist
                      </button>

                      {/* Position card */}
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-2 border border-amber-200 dark:border-amber-900/40 mb-2.5">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <HiOutlineClock className="w-3 h-3 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-[8px] font-semibold text-gray-800 dark:text-gray-200">On the waitlist</p>
                            <p className="text-[7px] text-gray-500">Afro Beats Live</p>
                          </div>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded p-1.5 text-center">
                          <p className="text-[7px] text-amber-600 dark:text-amber-400 font-medium">Your Position</p>
                          <p className="text-xl font-bold text-amber-600 dark:text-amber-400">#3</p>
                          <p className="text-[7px] text-gray-500">of 12 waiting</p>
                        </div>
                      </div>

                      {/* Notification card */}
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-2 border border-emerald-200 dark:border-emerald-900/40 shadow-sm">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                            <HiOutlineBell className="w-3 h-3 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[8px] font-semibold text-emerald-700 dark:text-emerald-400">A spot opened up!</p>
                            <p className="text-[7px] text-gray-500">You can now buy a ticket</p>
                          </div>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Glow */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/15 to-orange-500/15 blur-3xl rounded-full -z-10" />
                </div>
              </div>

              {/* Right — Text content */}
              <div className="p-8 sm:p-12 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-medium mb-4 w-fit">
                  <HiOutlineClock className="w-3.5 h-3.5" /> Waitlist
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))] mb-3">
                  Never Miss a Sold-Out Event
                </h3>
                <p className="text-[rgb(var(--text-secondary))] mb-6 leading-relaxed">
                  When an event sells out, you don't have to miss out. Join the waitlist and we'll notify you the moment a spot opens up.
                </p>
                <p className="text-sm text-[rgb(var(--text-secondary))] mb-8">
                  Your waitlist entries will appear here once you join one. Head to any sold-out event and click <span className="font-semibold text-amber-600 dark:text-amber-400">"Join Waitlist"</span> to get started.
                </p>
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-fit"
                >
                  Browse Events <HiOutlineArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* How it works steps */}
          <div>
            <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-5">How Waitlists Work</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  step: '1',
                  icon: <HiOutlineTicket className="w-6 h-6" />,
                  title: 'Event sells out',
                  description: 'When all tickets are taken, a "Join Waitlist" button appears on the event page.',
                  color: 'from-red-500 to-orange-500',
                  bg: 'bg-red-50 dark:bg-red-900/20',
                },
                {
                  step: '2',
                  icon: <HiOutlineClock className="w-6 h-6" />,
                  title: 'Join & wait',
                  description: 'Click to join. You\'ll see your position in the queue and can track it here.',
                  color: 'from-amber-500 to-yellow-500',
                  bg: 'bg-amber-50 dark:bg-amber-900/20',
                },
                {
                  step: '3',
                  icon: <HiOutlineBell className="w-6 h-6" />,
                  title: 'Get notified',
                  description: 'When someone cancels, you\'re next in line. We\'ll notify you instantly so you can grab the spot.',
                  color: 'from-emerald-500 to-teal-500',
                  bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                },
              ].map((item, i) => (
                <div key={item.step} className={`glass border border-[rgb(var(--border-primary))] rounded-xl p-5 relative`}>
                  {i < 2 && (
                    <div className="hidden sm:block absolute top-1/2 -right-2 w-4 text-[rgb(var(--text-tertiary))]">
                      <HiOutlineArrowRight className="w-4 h-4" />
                    </div>
                  )}
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} text-white flex items-center justify-center mb-3 shadow-md`}>
                    {item.icon}
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-secondary))]">Step {item.step}</span>
                    <h4 className="text-sm font-semibold text-[rgb(var(--text-primary))]">{item.title}</h4>
                  </div>
                  <p className="text-xs text-[rgb(var(--text-secondary))] leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: <HiOutlineCheck className="w-4 h-4" />, text: 'Automatic position tracking — know exactly where you stand' },
              { icon: <HiOutlineCheck className="w-4 h-4" />, text: 'Instant notifications when a ticket becomes available' },
              { icon: <HiOutlineCheck className="w-4 h-4" />, text: 'Leave the waitlist anytime with one click' },
              { icon: <HiOutlineCheck className="w-4 h-4" />, text: 'Creators see waitlist analytics in their dashboard' },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-3 p-3 rounded-lg bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))]">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-emerald-600 dark:text-emerald-400">{item.icon}</span>
                </div>
                <span className="text-sm text-[rgb(var(--text-secondary))]">{item.text}</span>
              </div>
            ))}
          </div>
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
