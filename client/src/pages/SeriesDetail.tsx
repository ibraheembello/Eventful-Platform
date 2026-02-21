import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import type { Event, EventSeries } from '../types';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  HiOutlineRefresh, HiOutlineCalendar, HiOutlineLocationMarker,
  HiOutlineUsers, HiOutlineCurrencyDollar, HiOutlineTrash,
} from 'react-icons/hi';

const PATTERN_LABELS: Record<string, string> = {
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Biweekly',
  MONTHLY: 'Monthly',
};

export default function SeriesDetail() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [series, setSeries] = useState<EventSeries | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    api.get(`/events/series/${seriesId}`, { params: { page, limit } })
      .then((res) => {
        setSeries(res.data.data.series);
        setEvents(res.data.data.events || []);
        setTotal(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      })
      .catch(() => toast.error('Series not found'))
      .finally(() => setLoading(false));
  }, [seriesId, page]);

  const handleDeleteSeries = async () => {
    setDeleting(true);
    try {
      const res = await api.delete(`/events/series/${seriesId}`);
      toast.success(res.data.message || 'Series deleted');
      navigate('/events');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete series');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const isCreator = user?.id === series?.creator?.id;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-8 mb-6">
          <div className="h-8 shimmer rounded w-1/2 mb-4" />
          <div className="h-4 shimmer rounded w-1/3 mb-2" />
          <div className="h-4 shimmer rounded w-1/4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass border border-[rgb(var(--border-primary))] rounded-xl overflow-hidden">
              <div className="h-32 shimmer" />
              <div className="p-4 space-y-2">
                <div className="h-5 shimmer rounded w-3/4" />
                <div className="h-4 shimmer rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-[rgb(var(--text-secondary))]">Series not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Series Header */}
      <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-6 lg:p-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <HiOutlineRefresh className="w-5 h-5" />
              </div>
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                  {PATTERN_LABELS[series.recurrencePattern] || series.recurrencePattern} Series
                </span>
              </div>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[rgb(var(--text-primary))] mb-2">
              {series.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[rgb(var(--text-secondary))]">
              <span>{total} occurrences</span>
              {series.creator && (
                <span>
                  by {series.creator.firstName} {series.creator.lastName}
                </span>
              )}
              <span>Created {format(new Date(series.createdAt), 'MMM d, yyyy')}</span>
            </div>
          </div>

          {isCreator && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-xl font-medium
                hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 text-sm flex-shrink-0"
            >
              <HiOutlineTrash className="w-4 h-4" />
              Delete Series
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div
            className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[rgb(var(--text-primary))] mb-2">Delete Entire Series?</h3>
            <p className="text-sm text-[rgb(var(--text-secondary))] mb-4">
              This will permanently delete all {total} events in this series, including all tickets and payments.
              Ticket holders will be notified via email.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 border border-[rgb(var(--border-primary))] rounded-lg text-[rgb(var(--text-primary))] font-medium hover:bg-[rgb(var(--bg-secondary))] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSeries}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition"
              >
                {deleting ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="text-center py-16">
          <HiOutlineRefresh className="w-12 h-12 text-[rgb(var(--text-tertiary))] mx-auto mb-3" />
          <p className="text-[rgb(var(--text-secondary))]">No events in this series</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => {
              const soldOut = (event._count?.tickets || 0) >= event.capacity;
              const isPast = new Date(event.date) < new Date();

              return (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="card-hover glass border border-[rgb(var(--border-primary))] rounded-xl overflow-hidden group"
                >
                  {/* Mini Image/Banner */}
                  <div className="relative h-32 bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 overflow-hidden">
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-4xl font-bold opacity-20">{event.title[0]}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    {/* Occurrence Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600/90 text-white">
                        <HiOutlineRefresh className="w-3 h-3" />
                        {event.seriesOccurrence}/{series.totalOccurrences}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute bottom-2.5 right-2.5">
                      {isPast ? (
                        <span className="px-2 py-0.5 rounded-full bg-gray-500/90 text-white text-[10px] font-semibold">Past</span>
                      ) : soldOut ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/90 text-white text-[10px] font-semibold">Sold Out</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-semibold">Upcoming</span>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-sm text-[rgb(var(--text-primary))] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2 line-clamp-1">
                      {event.title}
                    </h3>

                    <div className="space-y-1.5 text-xs text-[rgb(var(--text-secondary))]">
                      <div className="flex items-center gap-1.5">
                        <HiOutlineCalendar className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                        <span>{format(new Date(event.date), 'EEE, MMM d, yyyy • h:mm a')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <HiOutlineLocationMarker className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[rgb(var(--border-primary))]">
                      <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-secondary))]">
                        <HiOutlineUsers className="w-3.5 h-3.5" />
                        <span>{event._count?.tickets || 0}/{event.capacity}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <HiOutlineCurrencyDollar className="w-3.5 h-3.5" />
                        <span>{event.price > 0 ? event.price.toLocaleString() : 'Free'}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg
                  hover:bg-[rgb(var(--bg-tertiary))] disabled:opacity-50 disabled:cursor-not-allowed
                  bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] transition-colors"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm text-[rgb(var(--text-secondary))]">
                {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg
                  hover:bg-[rgb(var(--bg-tertiary))] disabled:opacity-50 disabled:cursor-not-allowed
                  bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] transition-colors"
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
