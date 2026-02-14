import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiChartBar, HiTicket, HiUsers, HiCurrencyDollar, HiCalendar, HiOutlineArrowSmRight } from 'react-icons/hi';
import { format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface AnalyticsOverview {
  totalEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  totalAttendees: number;
  ticketStatusBreakdown: {
    active: number;
    used: number;
    cancelled: number;
  };
}

interface EventAnalytics {
  id: string;
  title: string;
  date: string;
  ticketsSold: number;
  ticketsScanned: number;
  revenue: number;
  capacity: number;
}

const CHART_COLORS = {
  emerald: '#10b981',
  teal: '#14b8a6',
  blue: '#3b82f6',
  amber: '#f59e0b',
  red: '#ef4444',
  indigo: '#6366f1',
  purple: '#8b5cf6',
};

const PIE_COLORS = ['#10b981', '#3b82f6', '#ef4444'];

export default function Analytics() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [eventAnalytics, setEventAnalytics] = useState<EventAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [overviewRes, eventsRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/events'),
      ]);

      if (overviewRes.data.success) setOverview(overviewRes.data.data);
      if (eventsRes.data.success) setEventAnalytics(eventsRes.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);

  const shortCurrency = (amount: number) => {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
    return `${amount}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  // Chart data
  const revenueChartData = eventAnalytics
    .filter((e) => e.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map((e) => ({
      name: e.title.length > 18 ? e.title.slice(0, 18) + '...' : e.title,
      revenue: e.revenue,
      fullTitle: e.title,
    }));

  const ticketChartData = eventAnalytics
    .sort((a, b) => b.ticketsSold - a.ticketsSold)
    .slice(0, 8)
    .map((e) => ({
      name: e.title.length > 18 ? e.title.slice(0, 18) + '...' : e.title,
      sold: e.ticketsSold,
      scanned: e.ticketsScanned,
      capacity: e.capacity,
      fullTitle: e.title,
    }));

  const pieData = overview?.ticketStatusBreakdown
    ? [
        { name: 'Checked In', value: overview.ticketStatusBreakdown.used },
        { name: 'Active', value: overview.ticketStatusBreakdown.active },
        { name: 'Cancelled', value: overview.ticketStatusBreakdown.cancelled },
      ].filter((d) => d.value > 0)
    : [];

  const topEvents = [...eventAnalytics]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium text-[rgb(var(--text-primary))] mb-1">{payload[0]?.payload?.fullTitle || label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="text-xs">
            {p.name}: {p.name === 'revenue' ? formatCurrency(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] flex items-center gap-2">
          <HiChartBar className="text-emerald-600 dark:text-emerald-400" /> Analytics Dashboard
        </h1>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wide mb-1">Events</p>
                <p className="text-2xl lg:text-3xl font-bold text-[rgb(var(--text-primary))]">{overview.totalEvents}</p>
              </div>
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
                <HiCalendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>

          <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wide mb-1">Tickets Sold</p>
                <p className="text-2xl lg:text-3xl font-bold text-[rgb(var(--text-primary))]">{overview.totalTicketsSold}</p>
              </div>
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
                <HiTicket className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wide mb-1">Revenue</p>
                <p className="text-2xl lg:text-3xl font-bold text-[rgb(var(--text-primary))]">{formatCurrency(overview.totalRevenue)}</p>
              </div>
              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
                <HiCurrencyDollar className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>

          <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wide mb-1">Attendees</p>
                <p className="text-2xl lg:text-3xl font-bold text-[rgb(var(--text-primary))]">{overview.totalAttendees}</p>
              </div>
              <div className="p-2.5 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
                <HiUsers className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {eventAnalytics.length === 0 ? (
        <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-12 text-center">
          <HiChartBar className="w-16 h-16 text-[rgb(var(--text-tertiary))] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">No Events Yet</h3>
          <p className="text-[rgb(var(--text-secondary))] mb-6">Create your first event to see analytics.</p>
          <Link
            to="/events/create"
            className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg
              hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg"
          >
            Create Event
          </Link>
        </div>
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Revenue Bar Chart */}
            {revenueChartData.length > 0 && (
              <div className="lg:col-span-2 glass border border-[rgb(var(--border-primary))] rounded-2xl p-5">
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4">Revenue by Event</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueChartData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border-primary))" opacity={0.5} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: 'rgb(var(--text-tertiary))', fontSize: 11 }}
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                      height={70}
                    />
                    <YAxis
                      tick={{ fill: 'rgb(var(--text-tertiary))', fontSize: 11 }}
                      tickFormatter={(v) => shortCurrency(v)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" fill={CHART_COLORS.emerald} radius={[4, 4, 0, 0]} name="revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Ticket Status Pie Chart */}
            {pieData.length > 0 && (
              <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-5">
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4">Ticket Status</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_entry, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgb(var(--bg-primary))',
                        border: '1px solid rgb(var(--border-primary))',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      formatter={(value) => (
                        <span style={{ color: 'rgb(var(--text-secondary))', fontSize: '12px' }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Tickets Per Event Chart */}
          {ticketChartData.length > 0 && (
            <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-5 mb-8">
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4">Tickets: Sold vs Checked In</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ticketChartData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border-primary))" opacity={0.5} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'rgb(var(--text-tertiary))', fontSize: 11 }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={70}
                  />
                  <YAxis tick={{ fill: 'rgb(var(--text-tertiary))', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="sold" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} name="Sold" />
                  <Bar dataKey="scanned" fill={CHART_COLORS.emerald} radius={[4, 4, 0, 0]} name="Checked In" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Events Leaderboard + Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top Events */}
            <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[rgb(var(--border-primary))]">
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Top Events by Revenue</h2>
              </div>
              <div className="divide-y divide-[rgb(var(--border-primary))]">
                {topEvents.map((event, i) => {
                  const fillRate = (event.ticketsSold / event.capacity) * 100;
                  return (
                    <div key={event.id} className="px-5 py-3 flex items-center gap-4 hover:bg-[rgb(var(--bg-tertiary))]/50 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        i === 0 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' :
                        i === 1 ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' :
                        i === 2 ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' :
                        'bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-tertiary))]'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-[rgb(var(--text-primary))] truncate">{event.title}</p>
                        <div className="flex items-center gap-3 text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
                          <span>{event.ticketsSold} tickets</span>
                          <span>{fillRate.toFixed(0)}% filled</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(event.revenue)}
                        </p>
                      </div>
                      <Link
                        to={`/events/${event.id}/attendees`}
                        className="text-[rgb(var(--text-tertiary))] hover:text-emerald-600 transition-colors"
                        aria-label={`View attendees for ${event.title}`}
                      >
                        <HiOutlineArrowSmRight className="w-5 h-5" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl shadow-lg p-6 text-white">
              <h2 className="text-xl font-bold mb-6">Performance Summary</h2>
              <div className="space-y-5">
                <div>
                  <p className="text-emerald-100 text-xs uppercase tracking-wide mb-1">Avg Tickets Per Event</p>
                  <p className="text-3xl font-bold">
                    {overview ? Math.round(overview.totalTicketsSold / overview.totalEvents) : 0}
                  </p>
                </div>
                <div>
                  <p className="text-emerald-100 text-xs uppercase tracking-wide mb-1">Avg Revenue Per Event</p>
                  <p className="text-3xl font-bold">
                    {overview ? formatCurrency(overview.totalRevenue / overview.totalEvents) : formatCurrency(0)}
                  </p>
                </div>
                <div>
                  <p className="text-emerald-100 text-xs uppercase tracking-wide mb-1">Check-in Rate</p>
                  <p className="text-3xl font-bold">
                    {overview && overview.totalTicketsSold > 0
                      ? Math.round((overview.totalAttendees / overview.totalTicketsSold) * 100)
                      : 0}%
                  </p>
                  <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white/80 rounded-full transition-all"
                      style={{
                        width: `${overview && overview.totalTicketsSold > 0
                          ? (overview.totalAttendees / overview.totalTicketsSold) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-emerald-100 text-xs uppercase tracking-wide mb-1">Avg Fill Rate</p>
                  <p className="text-3xl font-bold">
                    {eventAnalytics.length > 0
                      ? Math.round(
                          eventAnalytics.reduce((sum, e) => sum + (e.ticketsSold / e.capacity) * 100, 0) /
                          eventAnalytics.length
                        )
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Full Events Table */}
          <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[rgb(var(--border-primary))]">
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">All Events Performance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[rgb(var(--bg-tertiary))]">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">Event</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase hidden sm:table-cell">Date</th>
                    <th className="px-5 py-3 text-center text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">Sold</th>
                    <th className="px-5 py-3 text-center text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase hidden md:table-cell">Checked In</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">Revenue</th>
                    <th className="px-5 py-3 text-center text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">Fill Rate</th>
                    <th className="px-5 py-3 text-center text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgb(var(--border-primary))]">
                  {eventAnalytics.map((event) => {
                    const fillRate = (event.ticketsSold / event.capacity) * 100;
                    return (
                      <tr key={event.id} className="hover:bg-[rgb(var(--bg-tertiary))]/50 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-medium text-[rgb(var(--text-primary))] truncate max-w-[200px]">{event.title}</p>
                        </td>
                        <td className="px-5 py-3 text-[rgb(var(--text-secondary))] whitespace-nowrap hidden sm:table-cell">
                          {format(new Date(event.date), 'MMM d, yyyy')}
                        </td>
                        <td className="px-5 py-3 text-center text-[rgb(var(--text-primary))]">
                          {event.ticketsSold}/{event.capacity}
                        </td>
                        <td className="px-5 py-3 text-center text-[rgb(var(--text-primary))] hidden md:table-cell">
                          {event.ticketsScanned}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(event.revenue)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-[rgb(var(--bg-tertiary))] rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  fillRate >= 80 ? 'bg-emerald-500' : fillRate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(fillRate, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-[rgb(var(--text-secondary))] w-8">{fillRate.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <Link
                            to={`/events/${event.id}/attendees`}
                            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            Attendees
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
