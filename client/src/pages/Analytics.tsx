import { useEffect, useState } from 'react';
import { HiChartBar, HiTicket, HiUsers, HiCurrencyDollar, HiCalendar } from 'react-icons/hi';
import { format } from 'date-fns';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface AnalyticsOverview {
  totalEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  totalAttendees: number;
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

      console.log('Fetching analytics...');

      const [overviewRes, eventsRes] = await Promise.all([
        api.get('/analytics/overview').catch(err => {
          console.error('Overview API error:', err.response?.status, err.response?.data);
          throw err;
        }),
        api.get('/analytics/events').catch(err => {
          console.error('Events API error:', err.response?.status, err.response?.data);
          throw err;
        }),
      ]);

      console.log('Overview response:', overviewRes.data);
      console.log('Events response:', eventsRes.data);

      if (overviewRes.data.success) {
        setOverview(overviewRes.data.data);
      }

      if (eventsRes.data.success) {
        setEventAnalytics(eventsRes.data.data || []);
      }

      console.log('Analytics loaded successfully');
    } catch (error: any) {
      console.error('Analytics error:', error);
      toast.error(error.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] flex items-center gap-2">
          <HiChartBar className="text-indigo-600 dark:text-indigo-400" /> Analytics Dashboard
        </h1>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--text-secondary))] mb-1">Total Events</p>
                <p className="text-3xl font-bold text-[rgb(var(--text-primary))]">{overview.totalEvents}</p>
              </div>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <HiCalendar className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>

          <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--text-secondary))] mb-1">Total Tickets Sold</p>
                <p className="text-3xl font-bold text-[rgb(var(--text-primary))]">{overview.totalTicketsSold}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <HiTicket className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--text-secondary))] mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-[rgb(var(--text-primary))]">{formatCurrency(overview.totalRevenue)}</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <HiCurrencyDollar className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--text-secondary))] mb-1">Total Attendees</p>
                <p className="text-3xl font-bold text-[rgb(var(--text-primary))]">{overview.totalAttendees}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <HiUsers className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Events Analytics Table */}
      <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[rgb(var(--border-primary))]">
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Event Performance</h2>
        </div>

        {eventAnalytics.length === 0 ? (
          <div className="p-12 text-center">
            <HiChartBar className="w-16 h-16 text-[rgb(var(--text-tertiary))] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">No Events Yet</h3>
            <p className="text-[rgb(var(--text-secondary))] mb-6">Create your first event to see analytics.</p>
            <a
              href="/events/create"
              className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg
                hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              Create Event
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[rgb(var(--border-primary))]">
              <thead className="bg-[rgb(var(--bg-tertiary))]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                    Event Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                    Tickets Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                    Attendees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                    Fill Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[rgb(var(--bg-primary))] divide-y divide-[rgb(var(--border-primary))]">
                {eventAnalytics.map((event) => {
                  const fillRate = (event.ticketsSold / event.capacity) * 100;

                  return (
                    <tr key={event.id} className="hover:bg-[rgb(var(--bg-tertiary))] transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-[rgb(var(--text-primary))]">
                          {event.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[rgb(var(--text-primary))]">
                          {format(new Date(event.date), 'PPP')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[rgb(var(--text-primary))]">{event.ticketsSold}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[rgb(var(--text-primary))]">{event.capacity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[rgb(var(--text-primary))]">{event.ticketsScanned}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                          {formatCurrency(event.revenue)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-[rgb(var(--bg-tertiary))] rounded-full h-2 max-w-[80px]">
                            <div
                              className={`h-2 rounded-full ${
                                fillRate >= 80
                                  ? 'bg-green-500'
                                  : fillRate >= 50
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(fillRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-[rgb(var(--text-secondary))]">
                            {fillRate.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Section */}
      {eventAnalytics.length > 0 && (
        <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Performance Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-indigo-100 text-sm mb-1">Average Tickets Per Event</p>
              <p className="text-3xl font-bold">
                {overview ? Math.round(overview.totalTicketsSold / overview.totalEvents) : 0}
              </p>
            </div>
            <div>
              <p className="text-indigo-100 text-sm mb-1">Average Revenue Per Event</p>
              <p className="text-3xl font-bold">
                {overview ? formatCurrency(overview.totalRevenue / overview.totalEvents) : formatCurrency(0)}
              </p>
            </div>
            <div>
              <p className="text-indigo-100 text-sm mb-1">Average Attendance Rate</p>
              <p className="text-3xl font-bold">
                {overview && overview.totalTicketsSold > 0
                  ? Math.round((overview.totalAttendees / overview.totalTicketsSold) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
