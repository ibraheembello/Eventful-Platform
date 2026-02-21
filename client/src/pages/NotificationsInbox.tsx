import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  HiOutlineBell,
  HiOutlineTicket,
  HiOutlineCalendar,
  HiOutlineSwitchHorizontal,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import api from '../lib/api';
import type { InAppNotification } from '../types';

const typeIcons: Record<string, React.ElementType> = {
  ticket_confirmed: HiOutlineTicket,
  event_updated: HiOutlineCalendar,
  ticket_transferred: HiOutlineSwitchHorizontal,
  ticket_received: HiOutlineSwitchHorizontal,
  collaborator_invite: HiOutlineUserGroup,
};

function getIcon(type: string) {
  return typeIcons[type] || HiOutlineBell;
}

export default function NotificationsInbox() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications/in-app', { params: { page, limit: 20 } });
      setNotifications(res.data.data);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleClick = async (notification: InAppNotification) => {
    if (!notification.read) {
      try {
        await api.put(`/notifications/in-app/${notification.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
      } catch {
        // silent — navigation still happens
      }
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.put('/notifications/in-app/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark notifications as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] flex items-center gap-2">
            <HiOutlineBell className="text-emerald-600 dark:text-emerald-400" /> Notifications
          </h1>
          <p className="text-[rgb(var(--text-secondary))] mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'You\'re all caught up'}
          </p>
        </div>

        {notifications.length > 0 && unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-secondary))] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <HiOutlineCheckCircle className="w-4 h-4" />
            {markingAll ? 'Marking...' : 'Mark All Read'}
          </button>
        )}
      </div>

      {/* Empty State */}
      {notifications.length === 0 ? (
        <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgb(var(--bg-tertiary))] mb-4">
            <HiOutlineBell className="w-8 h-8 text-[rgb(var(--text-tertiary))]" />
          </div>
          <h3 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">
            No notifications yet
          </h3>
          <p className="text-[rgb(var(--text-secondary))]">
            When something happens — ticket purchases, event updates, or invites — you'll see it here.
          </p>
        </div>
      ) : (
        <>
          {/* Notification List */}
          <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl overflow-hidden divide-y divide-[rgb(var(--border-primary))]">
            {notifications.map((notification) => {
              const Icon = getIcon(notification.type);

              return (
                <button
                  key={notification.id}
                  onClick={() => handleClick(notification)}
                  className={`w-full flex items-start gap-4 p-4 text-left transition hover:bg-[rgb(var(--bg-secondary))] ${
                    !notification.read
                      ? 'border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : 'border-l-4 border-l-transparent'
                  } ${notification.link ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      !notification.read
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                        : 'bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-tertiary))]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-relaxed ${
                        !notification.read
                          ? 'font-medium text-[rgb(var(--text-primary))]'
                          : 'text-[rgb(var(--text-secondary))]'
                      }`}
                    >
                      {notification.message}
                    </p>
                    <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notification.read && (
                    <div className="flex-shrink-0 mt-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Pagination */}
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
