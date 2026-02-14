import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  HiOutlineSearch, HiOutlineDownload, HiOutlineCheckCircle,
  HiOutlineUsers, HiOutlineArrowLeft, HiOutlineFilter,
  HiCheckCircle, HiXCircle,
} from 'react-icons/hi';

interface Attendee {
  id: string;
  status: 'ACTIVE' | 'USED' | 'CANCELLED';
  scannedAt: string | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string };
}

interface Stats {
  totalTickets: number;
  checkedIn: number;
  remaining: number;
  cancelled: number;
}

export default function AttendeeList() {
  const { id: eventId } = useParams<{ id: string }>();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [stats, setStats] = useState<Stats>({ totalTickets: 0, checkedIn: 0, remaining: 0, cancelled: 0 });
  const [eventTitle, setEventTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  useEffect(() => {
    api.get(`/events/${eventId}`)
      .then((res) => setEventTitle(res.data.data.title))
      .catch(() => {});
  }, [eventId]);

  useEffect(() => {
    fetchAttendees();
  }, [eventId, page, search, statusFilter, sortBy, sortOrder]);

  const fetchAttendees = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, limit: 50 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;

      const res = await api.get(`/events/${eventId}/attendees`, { params });
      setAttendees(res.data.data);
      setStats(res.data.stats);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load attendees');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (ticketId: string) => {
    setCheckingIn(ticketId);
    try {
      await api.post(`/events/${eventId}/check-in`, { ticketId });
      // Update local state
      setAttendees((prev) =>
        prev.map((a) =>
          a.id === ticketId ? { ...a, status: 'USED', scannedAt: new Date().toISOString() } : a
        )
      );
      setStats((prev) => ({
        ...prev,
        checkedIn: prev.checkedIn + 1,
        remaining: prev.remaining - 1,
      }));
      toast.success('Attendee checked in');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setCheckingIn(null);
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Ticket ID', 'Status', 'Purchase Date', 'Check-in Time'];
    const rows = attendees.map((a) => [
      `${a.user.firstName} ${a.user.lastName}`,
      a.user.email,
      a.id,
      a.status,
      format(new Date(a.createdAt), 'yyyy-MM-dd HH:mm'),
      a.scannedAt ? format(new Date(a.scannedAt), 'yyyy-MM-dd HH:mm') : '',
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendees-${eventId?.slice(0, 8)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <span className="text-[rgb(var(--text-tertiary))] ml-1">&uarr;&darr;</span>;
    return <span className="text-emerald-500 ml-1">{sortOrder === 'asc' ? '\u2191' : '\u2193'}</span>;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Link
            to={`/events/${eventId}`}
            className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 hover:underline mb-2"
          >
            <HiOutlineArrowLeft className="w-4 h-4" /> Back to Event
          </Link>
          <h1 className="text-2xl lg:text-3xl font-bold text-[rgb(var(--text-primary))] flex items-center gap-2">
            <HiOutlineUsers className="text-emerald-600 dark:text-emerald-400" /> Attendees
          </h1>
          {eventTitle && (
            <p className="text-[rgb(var(--text-secondary))] mt-1">{eventTitle}</p>
          )}
        </div>
        <button
          type="button"
          onClick={exportCSV}
          disabled={attendees.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-xl text-sm font-medium
            bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))]
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <HiOutlineDownload className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="glass border border-[rgb(var(--border-primary))] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[rgb(var(--text-primary))]">{stats.totalTickets}</p>
          <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wide mt-1">Total Tickets</p>
        </div>
        <div className="glass border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center bg-emerald-50/50 dark:bg-emerald-900/20">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.checkedIn}</p>
          <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wide mt-1">Checked In</p>
        </div>
        <div className="glass border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center bg-blue-50/50 dark:bg-blue-900/20">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.remaining}</p>
          <p className="text-xs text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wide mt-1">Remaining</p>
        </div>
        <div className="glass border border-[rgb(var(--border-primary))] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[rgb(var(--text-tertiary))]">{stats.cancelled}</p>
          <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wide mt-1">Cancelled</p>
        </div>
      </div>

      {/* Check-in Progress Bar */}
      {stats.totalTickets > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-[rgb(var(--text-secondary))]">Check-in Progress</span>
            <span className="font-medium text-[rgb(var(--text-primary))]">
              {Math.round((stats.checkedIn / stats.totalTickets) * 100)}%
            </span>
          </div>
          <div className="h-2.5 bg-[rgb(var(--bg-tertiary))] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500 rounded-full"
              style={{ width: `${(stats.checkedIn / stats.totalTickets) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--text-tertiary))]" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-xl text-sm
              focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none
              bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <HiOutlineFilter className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            aria-label="Filter by status"
            className="px-3 py-2.5 border border-[rgb(var(--border-primary))] rounded-xl text-sm
              bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] outline-none
              focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="USED">Checked In</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent"></div>
        </div>
      ) : attendees.length === 0 ? (
        <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-12 text-center">
          <HiOutlineUsers className="w-12 h-12 text-[rgb(var(--text-tertiary))] mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-1">No attendees found</h3>
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            {search || statusFilter ? 'Try adjusting your search or filters.' : 'No one has purchased tickets yet.'}
          </p>
        </div>
      ) : (
        <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-tertiary))]">
                  <th
                    className="text-left px-4 py-3 font-semibold text-[rgb(var(--text-secondary))] cursor-pointer hover:text-emerald-600 transition-colors"
                    onClick={() => toggleSort('name')}
                  >
                    Name <SortIcon field="name" />
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-[rgb(var(--text-secondary))] hidden sm:table-cell">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-[rgb(var(--text-secondary))] hidden md:table-cell">
                    Ticket ID
                  </th>
                  <th
                    className="text-left px-4 py-3 font-semibold text-[rgb(var(--text-secondary))] cursor-pointer hover:text-emerald-600 transition-colors hidden lg:table-cell"
                    onClick={() => toggleSort('date')}
                  >
                    Purchased <SortIcon field="date" />
                  </th>
                  <th
                    className="text-center px-4 py-3 font-semibold text-[rgb(var(--text-secondary))] cursor-pointer hover:text-emerald-600 transition-colors"
                    onClick={() => toggleSort('status')}
                  >
                    Status <SortIcon field="status" />
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-[rgb(var(--text-secondary))]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {attendees.map((attendee) => (
                  <tr
                    key={attendee.id}
                    className="border-b border-[rgb(var(--border-primary))] last:border-0 hover:bg-[rgb(var(--bg-tertiary))]/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {attendee.user.firstName[0]}{attendee.user.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-[rgb(var(--text-primary))]">
                            {attendee.user.firstName} {attendee.user.lastName}
                          </p>
                          <p className="text-xs text-[rgb(var(--text-tertiary))] sm:hidden">{attendee.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[rgb(var(--text-secondary))] hidden sm:table-cell">
                      {attendee.user.email}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <code className="text-xs bg-[rgb(var(--bg-tertiary))] px-2 py-1 rounded text-[rgb(var(--text-secondary))]">
                        {attendee.id.slice(0, 8)}...
                      </code>
                    </td>
                    <td className="px-4 py-3 text-[rgb(var(--text-secondary))] hidden lg:table-cell">
                      {format(new Date(attendee.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {attendee.status === 'USED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                          <HiCheckCircle className="w-3.5 h-3.5" /> Checked In
                        </span>
                      ) : attendee.status === 'CANCELLED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                          <HiXCircle className="w-3.5 h-3.5" /> Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {attendee.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          onClick={() => handleCheckIn(attendee.id)}
                          disabled={checkingIn === attendee.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg
                            hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                          {checkingIn === attendee.id ? '...' : 'Check In'}
                        </button>
                      ) : attendee.status === 'USED' && attendee.scannedAt ? (
                        <span className="text-xs text-[rgb(var(--text-tertiary))]">
                          {format(new Date(attendee.scannedAt), 'h:mm a')}
                        </span>
                      ) : (
                        <span className="text-xs text-[rgb(var(--text-tertiary))]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 p-4 border-t border-[rgb(var(--border-primary))]">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[rgb(var(--bg-secondary))]"
              >
                Previous
              </button>
              <span className="text-sm text-[rgb(var(--text-secondary))]">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[rgb(var(--bg-secondary))]"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
