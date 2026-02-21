import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineUsers,
  HiOutlineCalendar,
  HiOutlineTicket,
  HiOutlineCurrencyDollar,
  HiOutlineCog,
} from 'react-icons/hi';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface UsersByRole {
  role: string;
  count: number;
}

interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  totalTickets: number;
  totalRevenue: number;
  usersByRole: UsersByRole[];
  last30Days: {
    users: number;
    events: number;
    tickets: number;
  };
}

const ROLE_COLORS: Record<string, string> = {
  CREATOR: '#10b981',
  EVENTEE: '#3b82f6',
  ADMIN: '#f59e0b',
};

const ROLE_LABELS: Record<string, string> = {
  CREATOR: 'Creators',
  EVENTEE: 'Eventees',
  ADMIN: 'Admins',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load admin stats');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] flex items-center gap-2 mb-6">
          <HiOutlineCog className="text-emerald-600 dark:text-emerald-400 animate-spin" /> Admin Dashboard
        </h1>

        {/* Skeleton stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-5 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-[rgb(var(--border-primary))] rounded" />
                  <div className="h-8 w-16 bg-[rgb(var(--border-primary))] rounded" />
                </div>
                <div className="h-11 w-11 bg-[rgb(var(--border-primary))] rounded-xl" />
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton chart + last 30 days */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-6 animate-pulse">
            <div className="h-5 w-40 bg-[rgb(var(--border-primary))] rounded mb-4" />
            <div className="h-64 bg-[rgb(var(--border-primary))] rounded-xl" />
          </div>
          <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-6 animate-pulse">
            <div className="h-5 w-40 bg-[rgb(var(--border-primary))] rounded mb-4" />
            <div className="space-y-4 mt-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-[rgb(var(--border-primary))] rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        {/* Skeleton quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-6 animate-pulse"
            >
              <div className="h-5 w-32 bg-[rgb(var(--border-primary))] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-12 text-center">
        <HiOutlineCog className="w-16 h-16 text-[rgb(var(--text-tertiary))] mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">Unable to Load Stats</h3>
        <p className="text-[rgb(var(--text-secondary))]">Could not fetch admin statistics. Please try again later.</p>
      </div>
    );
  }

  const pieData = stats.usersByRole
    .filter((r) => r.count > 0)
    .map((r) => ({
      name: ROLE_LABELS[r.role] || r.role,
      value: r.count,
      color: ROLE_COLORS[r.role] || '#6b7280',
    }));

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0];
    return (
      <div className="bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium text-[rgb(var(--text-primary))]">{data.name}</p>
        <p style={{ color: data.payload.color }} className="text-xs mt-0.5">
          {data.value} user{data.value !== 1 ? 's' : ''} ({((data.value / stats.totalUsers) * 100).toFixed(1)}%)
        </p>
      </div>
    );
  };

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: HiOutlineUsers,
      bgLight: 'bg-emerald-100',
      bgDark: 'dark:bg-emerald-900/40',
      textLight: 'text-emerald-600',
      textDark: 'dark:text-emerald-400',
    },
    {
      label: 'Total Events',
      value: stats.totalEvents.toLocaleString(),
      icon: HiOutlineCalendar,
      bgLight: 'bg-indigo-100',
      bgDark: 'dark:bg-indigo-900/40',
      textLight: 'text-indigo-600',
      textDark: 'dark:text-indigo-400',
    },
    {
      label: 'Total Tickets',
      value: stats.totalTickets.toLocaleString(),
      icon: HiOutlineTicket,
      bgLight: 'bg-purple-100',
      bgDark: 'dark:bg-purple-900/40',
      textLight: 'text-purple-600',
      textDark: 'dark:text-purple-400',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: HiOutlineCurrencyDollar,
      bgLight: 'bg-amber-100',
      bgDark: 'dark:bg-amber-900/40',
      textLight: 'text-amber-600',
      textDark: 'dark:text-amber-400',
    },
  ];

  const last30DaysItems = [
    {
      label: 'New Users',
      value: stats.last30Days.users,
      icon: HiOutlineUsers,
      bgLight: 'bg-emerald-100',
      bgDark: 'dark:bg-emerald-900/40',
      textLight: 'text-emerald-600',
      textDark: 'dark:text-emerald-400',
    },
    {
      label: 'New Events',
      value: stats.last30Days.events,
      icon: HiOutlineCalendar,
      bgLight: 'bg-indigo-100',
      bgDark: 'dark:bg-indigo-900/40',
      textLight: 'text-indigo-600',
      textDark: 'dark:text-indigo-400',
    },
    {
      label: 'Tickets Sold',
      value: stats.last30Days.tickets,
      icon: HiOutlineTicket,
      bgLight: 'bg-purple-100',
      bgDark: 'dark:bg-purple-900/40',
      textLight: 'text-purple-600',
      textDark: 'dark:text-purple-400',
    },
  ];

  return (
    <div>
      {/* Header */}
      <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] flex items-center gap-2 mb-6">
        <HiOutlineCog className="text-emerald-600 dark:text-emerald-400" /> Admin Dashboard
      </h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wide mb-1">
                  {card.label}
                </p>
                <p className="text-2xl lg:text-3xl font-bold text-[rgb(var(--text-primary))]">
                  {card.value}
                </p>
              </div>
              <div className={`p-2.5 ${card.bgLight} ${card.bgDark} rounded-xl`}>
                <card.icon className={`w-6 h-6 ${card.textLight} ${card.textDark}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pie Chart + Last 30 Days */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Users by Role Pie Chart */}
        <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4">Users by Role</h2>
          {pieData.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex justify-center gap-6 mt-4">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-[rgb(var(--text-secondary))]">
                      {entry.name} ({entry.value})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-[rgb(var(--text-tertiary))]">
              No user data available
            </div>
          )}
        </div>

        {/* Last 30 Days */}
        <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4">Last 30 Days</h2>
          <div className="space-y-4 mt-2">
            {last30DaysItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-4 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))]"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 ${item.bgLight} ${item.bgDark} rounded-xl`}>
                    <item.icon className={`w-5 h-5 ${item.textLight} ${item.textDark}`} />
                  </div>
                  <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{item.label}</span>
                </div>
                <span className="text-2xl font-bold text-[rgb(var(--text-primary))]">
                  {item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/admin/users"
          className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-6 flex items-center gap-4
            hover:border-emerald-500 dark:hover:border-emerald-400 transition-colors group"
        >
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl group-hover:scale-110 transition-transform">
            <HiOutlineUsers className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Manage Users</h3>
            <p className="text-sm text-[rgb(var(--text-secondary))]">View, edit, and manage all platform users</p>
          </div>
        </Link>

        <Link
          to="/admin/events"
          className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-6 flex items-center gap-4
            hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors group"
        >
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl group-hover:scale-110 transition-transform">
            <HiOutlineCalendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Manage Events</h3>
            <p className="text-sm text-[rgb(var(--text-secondary))]">View, moderate, and manage all platform events</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
