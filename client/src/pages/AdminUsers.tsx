import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  HiOutlineSearch, HiOutlineFilter, HiOutlineUsers,
  HiOutlineShieldCheck, HiOutlineBan, HiOutlineRefresh,
  HiOutlineCalendar, HiOutlineMail, HiOutlineTicket,
} from 'react-icons/hi';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CREATOR' | 'EVENTEE' | 'ADMIN';
  provider: string;
  suspended: boolean;
  profileImage: string | null;
  createdAt: string;
  _count: {
    events: number;
    tickets: number;
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;

      const res = await api.get('/admin/users', { params });
      setUsers(res.data.data || []);
      setPagination(res.data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUser(userId);
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success('Role updated successfully');
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleSuspendToggle = async (userId: string, currentSuspended: boolean) => {
    setUpdatingUser(userId);
    try {
      await api.put(`/admin/users/${userId}/suspend`, { suspended: !currentSuspended });
      toast.success(currentSuspended ? 'User unsuspended' : 'User suspended');
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update suspension status');
    } finally {
      setUpdatingUser(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
            <HiOutlineShieldCheck className="w-3.5 h-3.5" /> Admin
          </span>
        );
      case 'CREATOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
            Creator
          </span>
        );
      case 'EVENTEE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
            Eventee
          </span>
        );
      default:
        return null;
    }
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'google':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
            Google
          </span>
        );
      case 'github':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            GitHub
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-secondary))]">
            Email
          </span>
        );
    }
  };

  // Loading skeleton rows
  const SkeletonRow = () => (
    <tr className="border-b border-[rgb(var(--border-primary))] last:border-0">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-[rgb(var(--bg-tertiary))] rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[rgb(var(--text-primary))] flex items-center gap-2">
            <HiOutlineUsers className="text-emerald-600 dark:text-emerald-400" /> Manage Users
          </h1>
          <p className="text-[rgb(var(--text-secondary))] mt-1">
            {pagination.total > 0 ? `${pagination.total} total users` : 'Loading...'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchUsers()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-xl text-sm font-medium
            bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))]
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <HiOutlineRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="glass border border-[rgb(var(--border-primary))] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[rgb(var(--text-primary))]">{pagination.total}</p>
          <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wide mt-1">Total Users</p>
        </div>
        <div className="glass border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center bg-emerald-50/50 dark:bg-emerald-900/20">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {users.filter((u) => u.role === 'CREATOR').length}
          </p>
          <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wide mt-1">Creators</p>
        </div>
        <div className="glass border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center bg-blue-50/50 dark:bg-blue-900/20">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {users.filter((u) => u.role === 'EVENTEE').length}
          </p>
          <p className="text-xs text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wide mt-1">Eventees</p>
        </div>
        <div className="glass border border-red-200 dark:border-red-800 rounded-xl p-4 text-center bg-red-50/50 dark:bg-red-900/20">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {users.filter((u) => u.suspended).length}
          </p>
          <p className="text-xs text-red-600/70 dark:text-red-400/70 uppercase tracking-wide mt-1">Suspended</p>
        </div>
      </div>

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
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            aria-label="Filter by role"
            className="px-3 py-2.5 border border-[rgb(var(--border-primary))] rounded-xl text-sm
              bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] outline-none
              focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">All Roles</option>
            <option value="CREATOR">Creator</option>
            <option value="EVENTEE">Eventee</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>

      {/* Showing count */}
      {!loading && users.length > 0 && (
        <p className="text-sm text-[rgb(var(--text-secondary))] mb-3">
          Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total} users
        </p>
      )}

      {/* Table */}
      {loading ? (
        <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-tertiary))]">
                  <th className="text-left px-4 py-3 font-semibold text-[rgb(var(--text-secondary))]">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-[rgb(var(--text-secondary))] hidden sm:table-cell">Email</th>
                  <th className="text-center px-4 py-3 font-semibold text-[rgb(var(--text-secondary))]">Role</th>
                  <th className="text-center px-4 py-3 font-semibold text-[rgb(var(--text-secondary))] hidden md:table-cell">Provider</th>
                  <th className="text-center px-4 py-3 font-semibold text-[rgb(var(--text-secondary))] hidden md:table-cell">Suspended</th>
                  <th className="text-center px-4 py-3 font-semibold text-[rgb(var(--text-secondary))] hidden lg:table-cell">Joined</th>
                  <th className="text-center px-4 py-3 font-semibold text-[rgb(var(--text-secondary))] hidden lg:table-cell">Events</th>
                  <th className="text-center px-4 py-3 font-semibold text-[rgb(var(--text-secondary))] hidden lg:table-cell">Tickets</th>
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
      ) : users.length === 0 ? (
        <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-12 text-center">
          <HiOutlineUsers className="w-12 h-12 text-[rgb(var(--text-tertiary))] mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-1">No users found</h3>
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            {search || roleFilter ? 'Try adjusting your search or filters.' : 'No users registered yet.'}
          </p>
        </div>
      ) : (
        <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-tertiary))]">
                  <th className="text-left px-4 py-3 font-semibold text-[rgb(var(--text-secondary))]">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-[rgb(var(--text-secondary))] hidden sm:table-cell">Email</th>
                  <th className="text-center px-4 py-3 font-semibold text-[rgb(var(--text-secondary))]">Role</th>
                  <th className="text-center px-4 py-3 font-semibold text-[rgb(var(--text-secondary))] hidden md:table-cell">Provider</th>
                  <th className="text-center px-4 py-3 font-semibold text-[rgb(var(--text-secondary))] hidden md:table-cell">Suspended</th>
                  <th className="text-center px-4 py-3 font-semibold text-[rgb(var(--text-secondary))] hidden lg:table-cell">Joined</th>
                  <th className="text-center px-4 py-3 font-semibold text-[rgb(var(--text-secondary))] hidden lg:table-cell">Events</th>
                  <th className="text-center px-4 py-3 font-semibold text-[rgb(var(--text-secondary))] hidden lg:table-cell">Tickets</th>
                  <th className="text-center px-4 py-3 font-semibold text-[rgb(var(--text-secondary))]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className={`border-b border-[rgb(var(--border-primary))] last:border-0 hover:bg-[rgb(var(--bg-tertiary))]/50 transition-colors ${
                      user.suspended ? 'bg-red-50/30 dark:bg-red-900/10' : ''
                    }`}
                  >
                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.profileImage ? (
                          <img
                            src={user.profileImage}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-[rgb(var(--text-primary))]">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-[rgb(var(--text-tertiary))] sm:hidden">{user.email}</p>
                          {user.suspended && (
                            <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 sm:hidden">
                              <HiOutlineBan className="w-3 h-3" /> Suspended
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-[rgb(var(--text-secondary))] hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <HiOutlineMail className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))] flex-shrink-0" />
                        <span className="truncate max-w-[200px]">{user.email}</span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3 text-center">
                      {getRoleBadge(user.role)}
                    </td>

                    {/* Provider */}
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      {getProviderBadge(user.provider)}
                    </td>

                    {/* Suspended */}
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      {user.suspended ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                          <HiOutlineBan className="w-3.5 h-3.5" /> Yes
                        </span>
                      ) : (
                        <span className="text-xs text-[rgb(var(--text-tertiary))]">--</span>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-center text-[rgb(var(--text-secondary))] hidden lg:table-cell">
                      <div className="flex items-center justify-center gap-1.5">
                        <HiOutlineCalendar className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" />
                        {format(new Date(user.createdAt), 'MMM d, yyyy')}
                      </div>
                    </td>

                    {/* Events Count */}
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      <span className="text-[rgb(var(--text-primary))] font-medium">{user._count.events}</span>
                    </td>

                    {/* Tickets Count */}
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        <HiOutlineTicket className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" />
                        <span className="text-[rgb(var(--text-primary))] font-medium">{user._count.tickets}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {/* Role Dropdown */}
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={updatingUser === user.id}
                          aria-label={`Change role for ${user.firstName} ${user.lastName}`}
                          className="px-2 py-1.5 border border-[rgb(var(--border-primary))] rounded-lg text-xs
                            bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] outline-none
                            focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                            disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <option value="EVENTEE">Eventee</option>
                          <option value="CREATOR">Creator</option>
                          <option value="ADMIN">Admin</option>
                        </select>

                        {/* Suspend Toggle */}
                        <button
                          type="button"
                          onClick={() => handleSuspendToggle(user.id, user.suspended)}
                          disabled={updatingUser === user.id}
                          aria-label={user.suspended ? `Unsuspend ${user.firstName}` : `Suspend ${user.firstName}`}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg
                            disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                              user.suspended
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                        >
                          <HiOutlineBan className="w-3.5 h-3.5" />
                          {updatingUser === user.id ? '...' : user.suspended ? 'Unsuspend' : 'Suspend'}
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
    </div>
  );
}
