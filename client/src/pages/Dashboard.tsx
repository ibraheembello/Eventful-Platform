import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  HiTicket, HiCalendar, HiCheckCircle, HiCurrencyDollar,
  HiOutlinePlus, HiOutlineChartBar, HiOutlineSearch, HiOutlineArrowSmRight,
  HiOutlineLocationMarker, HiOutlineClock, HiOutlineBell,
  HiOutlineBookmark, HiOutlineUsers, HiOutlineTicket,
  HiOutlineSwitchHorizontal, HiOutlineUserGroup, HiOutlineCalendar,
} from 'react-icons/hi';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface DashboardEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  price: number;
  imageUrl?: string;
  capacity: number;
  creator?: { id: string; firstName: string; lastName: string };
  _count?: { tickets: number };
}

interface DashboardNotification {
  id: string;
  message: string;
  link?: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface RecentSale {
  id: string;
  amount: number;
  createdAt: string;
  user: { firstName: string; lastName: string };
  event: { title: string };
}

interface DashboardData {
  ticketStats: { total: number; upcoming: number; attended: number };
  upcomingEvents: DashboardEvent[];
  recentNotifications: DashboardNotification[];
  creatorStats?: { createdEvents: number; totalRevenue: number };
  recentSales?: RecentSale[];
  eventeeStats?: { savedEvents: number; waitlists: number };
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  return format(new Date(dateStr), 'MMM d, yyyy');
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);

const notificationTypeIcons: Record<string, React.ElementType> = {
  ticket_confirmed: HiOutlineTicket,
  event_updated: HiOutlineCalendar,
  ticket_transferred: HiOutlineSwitchHorizontal,
  ticket_received: HiOutlineSwitchHorizontal,
  collaborator_invite: HiOutlineUserGroup,
};

function getNotificationIcon(type: string) {
  return notificationTypeIcons[type] || HiOutlineBell;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-primary))] p-4 animate-pulse">
      <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-700 rounded mb-3" />
      <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
      <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
}

function SkeletonStatCard() {
  return (
    <div className="rounded-xl p-5 animate-pulse bg-gray-200 dark:bg-gray-800">
      <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded mb-3" />
      <div className="h-8 w-16 bg-gray-300 dark:bg-gray-700 rounded mb-2" />
      <div className="h-3 w-24 bg-gray-200 dark:bg-gray-600 rounded" />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const isCreator = user?.role === 'CREATOR';

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  // --- Loading skeleton ---
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Welcome skeleton */}
        <div className="animate-pulse">
          <div className="h-8 w-72 bg-gray-300 dark:bg-gray-700 rounded mb-2" />
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>

        {/* Stat cards skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>

        {/* Upcoming events skeleton */}
        <div>
          <div className="h-6 w-48 bg-gray-300 dark:bg-gray-700 rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-primary))] overflow-hidden animate-pulse">
                <div className="h-40 bg-gray-300 dark:bg-gray-700" />
                <div className="p-4 space-y-2">
                  <div className="h-5 w-3/4 bg-gray-300 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-600 rounded" />
                  <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-600 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications skeleton */}
        <div>
          <div className="h-6 w-48 bg-gray-300 dark:bg-gray-700 rounded mb-4 animate-pulse" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-[rgb(var(--text-secondary))]">Unable to load dashboard data.</p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Tickets',
      value: data.ticketStats.total,
      icon: HiTicket,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Upcoming Events',
      value: data.ticketStats.upcoming,
      icon: HiCalendar,
      gradient: 'from-teal-500 to-cyan-600',
    },
    {
      label: 'Events Attended',
      value: data.ticketStats.attended,
      icon: HiCheckCircle,
      gradient: 'from-cyan-500 to-blue-600',
    },
  ];

  if (isCreator && data.creatorStats) {
    statCards.push(
      {
        label: 'Created Events',
        value: data.creatorStats.createdEvents,
        icon: HiOutlinePlus,
        gradient: 'from-indigo-500 to-purple-600',
      },
      {
        label: 'Total Revenue',
        value: data.creatorStats.totalRevenue,
        icon: HiCurrencyDollar,
        gradient: 'from-amber-500 to-orange-600',
      },
    );
  }

  if (!isCreator && data.eventeeStats) {
    statCards.push(
      {
        label: 'Saved Events',
        value: data.eventeeStats.savedEvents,
        icon: HiOutlineBookmark,
        gradient: 'from-pink-500 to-rose-600',
      },
      {
        label: 'Waitlists',
        value: data.eventeeStats.waitlists,
        icon: HiOutlineUsers,
        gradient: 'from-violet-500 to-purple-600',
      },
    );
  }

  const quickActions = [
    { label: 'Browse Events', href: '/events', icon: HiOutlineSearch },
    { label: 'My Tickets', href: '/tickets', icon: HiOutlineTicket },
  ];

  if (isCreator) {
    quickActions.push(
      { label: 'Create Event', href: '/events/create', icon: HiOutlinePlus },
      { label: 'Analytics', href: '/analytics', icon: HiOutlineChartBar },
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-1 text-[rgb(var(--text-secondary))]">
          {isCreator
            ? 'Here is an overview of your events and ticket sales.'
            : 'Here is a summary of your upcoming events and activity.'}
        </p>
      </div>

      {/* Stat Cards */}
      <div className={`grid gap-4 ${statCards.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'}`}>
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const displayValue =
            stat.label === 'Total Revenue'
              ? formatCurrency(stat.value)
              : stat.value.toLocaleString();

          return (
            <div
              key={stat.label}
              className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${stat.gradient} p-5 text-white shadow-lg`}
            >
              <div className="absolute top-3 right-3 opacity-20">
                <Icon className="h-10 w-10" />
              </div>
              <p className="text-sm font-medium text-white/80">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold">{displayValue}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              to={action.href}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] hover:border-emerald-500 hover:text-emerald-600 transition-colors text-sm font-medium"
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </Link>
          );
        })}
      </div>

      {/* Upcoming Events */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
            Upcoming Events
          </h2>
          {data.upcomingEvents.length > 0 && (
            <Link
              to="/events"
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium inline-flex items-center gap-1"
            >
              View all <HiOutlineArrowSmRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {data.upcomingEvents.length === 0 ? (
          <div className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-primary))] p-8 text-center">
            <HiCalendar className="h-12 w-12 mx-auto text-[rgb(var(--text-secondary))] opacity-40 mb-3" />
            <p className="text-[rgb(var(--text-secondary))] font-medium">No upcoming events</p>
            <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">
              Browse events to find something interesting.
            </p>
            <Link
              to="/events"
              className="inline-flex items-center gap-1 mt-4 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <HiOutlineSearch className="h-4 w-4" />
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.upcomingEvents.slice(0, 6).map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="group rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-primary))] overflow-hidden hover:shadow-lg hover:border-emerald-500/50 transition-all"
              >
                {/* Event Image */}
                <div className="relative h-40 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <HiCalendar className="h-12 w-12 text-emerald-400 opacity-50" />
                    </div>
                  )}
                  {event.price > 0 && (
                    <span className="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      {formatCurrency(event.price)}
                    </span>
                  )}
                  {event.price === 0 && (
                    <span className="absolute top-3 right-3 bg-teal-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      Free
                    </span>
                  )}
                </div>

                {/* Event Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-[rgb(var(--text-primary))] line-clamp-1 group-hover:text-emerald-600 transition-colors">
                    {event.title}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-sm text-[rgb(var(--text-secondary))]">
                      <HiOutlineClock className="h-4 w-4 flex-shrink-0" />
                      <span>{format(new Date(event.date), 'EEE, MMM d, yyyy - h:mm a')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-[rgb(var(--text-secondary))]">
                      <HiOutlineLocationMarker className="h-4 w-4 flex-shrink-0" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Creator: Recent Sales */}
      {isCreator && data.recentSales && data.recentSales.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
              Recent Sales
            </h2>
            <Link
              to="/analytics"
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium inline-flex items-center gap-1"
            >
              Full analytics <HiOutlineArrowSmRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-primary))] divide-y divide-[rgb(var(--border-primary))]">
            {data.recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center gap-4 p-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <HiCurrencyDollar className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                    {sale.user.firstName} {sale.user.lastName}
                  </p>
                  <p className="text-xs text-[rgb(var(--text-secondary))] truncate">
                    {sale.event.title}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-emerald-600">
                    {formatCurrency(sale.amount)}
                  </p>
                  <p className="text-xs text-[rgb(var(--text-secondary))]">
                    {formatRelativeTime(sale.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Notifications */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
            Recent Notifications
          </h2>
          <Link
            to="/notifications/inbox"
            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium inline-flex items-center gap-1"
          >
            View all <HiOutlineArrowSmRight className="h-4 w-4" />
          </Link>
        </div>

        {data.recentNotifications.length === 0 ? (
          <div className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-primary))] p-8 text-center">
            <HiOutlineBell className="h-12 w-12 mx-auto text-[rgb(var(--text-secondary))] opacity-40 mb-3" />
            <p className="text-[rgb(var(--text-secondary))] font-medium">No notifications yet</p>
            <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">
              You will see ticket purchases, event updates, and more here.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-primary))] divide-y divide-[rgb(var(--border-primary))]">
            {data.recentNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              return (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-4 ${
                    notification.link ? 'cursor-pointer hover:bg-[rgb(var(--bg-primary))]/80' : ''
                  }`}
                  onClick={() => {
                    if (notification.link) {
                      window.location.href = notification.link;
                    }
                  }}
                >
                  {/* Unread dot */}
                  <div className="flex-shrink-0 mt-1.5 relative">
                    <Icon className="h-5 w-5 text-[rgb(var(--text-secondary))]" />
                    {!notification.read && (
                      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-[rgb(var(--bg-primary))]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        notification.read
                          ? 'text-[rgb(var(--text-secondary))]'
                          : 'text-[rgb(var(--text-primary))] font-medium'
                      }`}
                    >
                      {notification.message}
                    </p>
                    <p className="text-xs text-[rgb(var(--text-secondary))] mt-0.5">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
