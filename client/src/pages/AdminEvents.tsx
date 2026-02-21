import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  HiOutlineSearch, HiOutlineTrash, HiOutlineExternalLink,
  HiOutlineCalendar, HiOutlineX,
} from 'react-icons/hi';

interface AdminEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  status: 'DRAFT' | 'PUBLISHED';
  price: number;
  capacity: number;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  _count: {
    tickets: number;
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminEvents() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [deleteTarget, setDeleteTarget] = useState<AdminEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;

      const res = await api.get('/admin/events', { params });
      setEvents(res.data.data || []);
      setPagination(res.data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/events/${deleteTarget.id}`);
      setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
      toast.success(`"${deleteTarget.title}" deleted`);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  const startIndex = (pagination.page - 1) * pagination.limit + 1;
  const endIndex = Math.min(pagination.page * pagination.limit, pagination.total);

  // Loading skeleton rows
  const SkeletonRow = () => (
    <tr className="border-b border-[rgb(var(--border-primary))] last:border-0">
      <td className="px-4 py-3"><div className="h-4 w-40 bg-[rgb(var(--bg-tertiary))] rounded animate-pulse" /></td>
      <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-28 bg-[rgb(var(--bg-tertiary))] rounded animate-pulse" /></td>
      <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-24 bg-[rgb(var(--bg-tertiary))] rounded animate-pulse" /></td>
      <td className="px-4 py-3 hidden sm:table-cell"><div className="h-4 w-28 bg-[rgb(var(--bg-tertiary))] rounded animate-pulse" /></td>
      <td className="px-4 py-3 text-center hidden sm:table-cell"><div className="h-4 w-8 bg-[rgb(var(--bg-tertiary))] rounded animate-pulse mx-auto" /></td>
      <td className="px-4 py-3 text-center"><div className="h-5 w-16 bg-[rgb(var(--bg-tertiary))] rounded-full animate-pulse mx-auto" /></td>
      <td className="px-4 py-3 text-center"><div className="h-8 w-20 bg-[rgb(var(--bg-tertiary))] rounded animate-pulse mx-auto" /></td>
    </tr>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[rgb(var(--text-primary))] flex items-center gap-2">
            <HiOutlineCalendar className="text-emerald-600 dark:text-emerald-400" /> Manage Events
          </h1>
          <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">
            View and manage all events on the platform
          </p>
        </div>
        {pagination.total > 0 && (
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            {pagination.total} event{pagination.total !== 1 ? 's' : ''} total
          </p>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--text-tertiary))]" />
          <input
            type="text"
            placeholder="Search by title or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-xl text-sm
              focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none
              bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] transition-all"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-tertiary))]">
                  <th className="text-left px-4 py-3 font-semibold text-[rgb(var(--text-secondary))]">Title</th>
                  <th className="text-left px-4 py-3 font-semibold text-[rgb(var(--text-secondary))] hidden md:table-cell">Creator</th>
                  <th className="text-left px-4 py-3 font-semibold text-[rgb(var(--text-secondary))] hidden lg:table-cell">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-[rgb(var(--text-secondary))] hidden sm:table-cell">Location</th>
                  <th className="text-center px-4 py-3 font-semibold text-[rgb(var(--text-secondary))] hidden sm:table-cell">Tickets</th>
                  <th className="text-center px-4 py-3 font-semibold text-[rgb(var(--text-secondary))]">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-[rgb(var(--text-secondary))]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-12 text-center">
          <HiOutlineCalendar className="w-12 h-12 text-[rgb(var(--text-tertiary))] mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-1">No events found</h3>
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            {search ? 'Try adjusting your search query.' : 'No events have been created yet.'}
          </p>
        </div>
      ) : (
        <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl overflow-hidden">
          {/* Results count */}
          <div className="px-4 py-2.5 border-b border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-secondary))]">
            <p className="text-xs text-[rgb(var(--text-tertiary))]">
              Showing {startIndex}–{endIndex} of {pagination.total} events
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-tertiary))]">
                  <th className="text-left px-4 py-3 font-semibold text-[rgb(var(--text-secondary))]">Title</th>
                  <th className="text-left px-4 py-3 font-semibold text-[rgb(var(--text-secondary))] hidden md:table-cell">Creator</th>
                  <th className="text-left px-4 py-3 font-semibold text-[rgb(var(--text-secondary))] hidden lg:table-cell">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-[rgb(var(--text-secondary))] hidden sm:table-cell">Location</th>
                  <th className="text-center px-4 py-3 font-semibold text-[rgb(var(--text-secondary))] hidden sm:table-cell">Tickets</th>
                  <th className="text-center px-4 py-3 font-semibold text-[rgb(var(--text-secondary))]">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-[rgb(var(--text-secondary))]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-[rgb(var(--border-primary))] last:border-0 hover:bg-[rgb(var(--bg-tertiary))]/50 transition-colors"
                  >
                    {/* Title */}
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-[rgb(var(--text-primary))] line-clamp-1">{event.title}</p>
                        <p className="text-xs text-[rgb(var(--text-tertiary))] md:hidden mt-0.5">
                          {event.creator.firstName} {event.creator.lastName}
                        </p>
                      </div>
                    </td>

                    {/* Creator */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div>
                        <p className="text-[rgb(var(--text-primary))]">
                          {event.creator.firstName} {event.creator.lastName}
                        </p>
                        <p className="text-xs text-[rgb(var(--text-tertiary))]">{event.creator.email}</p>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-[rgb(var(--text-secondary))] hidden lg:table-cell">
                      {format(new Date(event.date), 'MMM d, yyyy')}
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3 text-[rgb(var(--text-secondary))] hidden sm:table-cell">
                      <span className="line-clamp-1">{event.location}</span>
                    </td>

                    {/* Tickets */}
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className="font-medium text-[rgb(var(--text-primary))]">{event._count.tickets}</span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      {event.status === 'PUBLISHED' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                          Draft
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/events/${event.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg
                            border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]
                            hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
                          title="View event"
                        >
                          <HiOutlineExternalLink className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">View</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(event)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg
                            border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400
                            hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                          title="Delete event"
                        >
                          <HiOutlineTrash className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 p-4 border-t border-[rgb(var(--border-primary))]">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[rgb(var(--bg-secondary))]"
              >
                Previous
              </button>
              <span className="text-sm text-[rgb(var(--text-secondary))]">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-4 py-2 border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[rgb(var(--bg-secondary))]"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteTarget(null)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] rounded-2xl shadow-xl p-6">
            <button
              type="button"
              onClick={() => !deleting && setDeleteTarget(null)}
              className="absolute top-4 right-4 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
              disabled={deleting}
            >
              <HiOutlineX className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <HiOutlineTrash className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">Delete Event</h3>
              <p className="text-sm text-[rgb(var(--text-secondary))] mb-1">
                Are you sure you want to delete this event?
              </p>
              <p className="text-sm font-medium text-[rgb(var(--text-primary))] mb-6">
                "{deleteTarget.title}"
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-xl text-sm font-medium
                    bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))]
                    disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl
                    hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
