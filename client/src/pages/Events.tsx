import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import type { Event } from '../types';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { HiOutlineCalendar, HiOutlineLocationMarker, HiOutlineUsers, HiOutlineCurrencyDollar, HiOutlineSearch, HiOutlinePlus, HiOutlineTag } from 'react-icons/hi';

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const limit = 12;

  useEffect(() => {
    setLoading(true);
    api.get('/events', { params: { page, limit, search: search || undefined } })
      .then((res) => {
        setEvents(res.data.data);
        setTotalPages(res.data.pagination?.pages || 1);
        setTotalEvents(res.data.pagination?.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search]);

  return (
    <div>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-[rgb(var(--text-primary))] mb-2">
            Discover Events
          </h1>
          <p className="text-[rgb(var(--text-secondary))]">Find your next unforgettable experience</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--text-tertiary))]" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10 pr-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-xl text-sm
                focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none w-full sm:w-64
                bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] transition-all"
            />
          </div>

          {/* Create Event Button - Creators Only */}
          {user?.role === 'CREATOR' && (
            <Link
              to="/events/create"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600
                text-white text-sm font-medium rounded-xl hover:from-emerald-700 hover:to-teal-700
                transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <HiOutlinePlus className="w-5 h-5" />
              <span className="hidden sm:inline">Create Event</span>
            </Link>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="glass border border-[rgb(var(--border-primary))] rounded-2xl overflow-hidden">
              <div className="h-48 shimmer" />
              <div className="p-6 space-y-3">
                <div className="h-6 shimmer rounded" />
                <div className="h-4 shimmer rounded w-3/4" />
                <div className="space-y-2 pt-2">
                  <div className="h-4 shimmer rounded w-1/2" />
                  <div className="h-4 shimmer rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgb(var(--bg-tertiary))] mb-4">
            <HiOutlineCalendar className="w-8 h-8 text-[rgb(var(--text-tertiary))]" />
          </div>
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">No events found</h3>
          <p className="text-[rgb(var(--text-secondary))] mb-4">Try adjusting your search or check back later.</p>
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Results Count */}
          <p className="text-sm text-[rgb(var(--text-secondary))] mb-4">
            Showing {(page - 1) * limit + 1}&ndash;{Math.min(page * limit, totalEvents)} of {totalEvents} events
          </p>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const soldOut = (event._count?.tickets || 0) >= event.capacity;
              const almostSoldOut = (event._count?.tickets || 0) / event.capacity > 0.8;

              return (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="card-hover glass border border-[rgb(var(--border-primary))] rounded-2xl overflow-hidden group"
                >
                  {/* Event Image/Banner */}
                  <div className="relative h-48 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 overflow-hidden">
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-6xl font-bold opacity-20 group-hover:scale-125 transition-transform duration-300">
                          {event.title[0]}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    {/* Category Badge */}
                    {event.category && (
                      <div className="absolute top-3 left-3">
                        <div className="glass-light px-3 py-1 rounded-full flex items-center gap-1.5">
                          <HiOutlineTag className="w-3.5 h-3.5 text-white" />
                          <span className="text-xs font-medium text-white">{event.category}</span>
                        </div>
                      </div>
                    )}

                    {/* Status Badges */}
                    {soldOut && (
                      <div className="absolute top-3 right-3">
                        <div className="px-3 py-1 rounded-full bg-red-500/90 text-white text-xs font-semibold">
                          Sold Out
                        </div>
                      </div>
                    )}
                    {!soldOut && almostSoldOut && (
                      <div className="absolute top-3 right-3">
                        <div className="px-3 py-1 rounded-full bg-orange-500/90 text-white text-xs font-semibold">
                          Almost Full
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Event Info */}
                  <div className="p-5">
                    <h3 className="font-semibold text-lg text-[rgb(var(--text-primary))] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-sm text-[rgb(var(--text-secondary))] line-clamp-2 mb-4">
                      {event.description}
                    </p>

                    {/* Event Meta */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]">
                        <HiOutlineCalendar className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>{format(new Date(event.date), 'MMM d, yyyy • h:mm a')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]">
                        <HiOutlineLocationMarker className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>

                      {/* Footer - Capacity & Price */}
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

                      {/* Progress Bar */}
                      <div className="mt-2">
                        <div className="h-1.5 bg-[rgb(var(--bg-tertiary))] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500"
                            style={{ width: `${((event._count?.tickets || 0) / event.capacity) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Creator Info */}
                    {event.creator && (
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[rgb(var(--border-primary))]">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-semibold">
                          {event.creator.firstName?.[0]}{event.creator.lastName?.[0]}
                        </div>
                        <span className="text-xs text-[rgb(var(--text-tertiary))]">
                          by {event.creator.firstName} {event.creator.lastName}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-12">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-5 py-2.5 text-sm border border-[rgb(var(--border-primary))] rounded-lg
                  hover:bg-[rgb(var(--bg-tertiary))] disabled:opacity-50 disabled:cursor-not-allowed
                  bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                          : 'border border-[rgb(var(--border-primary))] hover:bg-[rgb(var(--bg-tertiary))] bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-5 py-2.5 text-sm border border-[rgb(var(--border-primary))] rounded-lg
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
