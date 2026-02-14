import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { HiOutlineTicket, HiOutlineShieldCheck, HiOutlineChartBar, HiOutlineBell, HiOutlineQrcode, HiOutlineCurrencyDollar, HiOutlineMoon, HiOutlineSun, HiOutlineCalendar, HiOutlineLocationMarker, HiOutlineArrowRight } from 'react-icons/hi';
import api from '../lib/api';
import type { Event } from '../types';
import { format } from 'date-fns';

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);

  useEffect(() => {
    api.get('/events', { params: { limit: 6 } })
      .then((res) => setFeaturedEvents(res.data.data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] transition-colors duration-200">
      {/* Navbar */}
      <nav className="border-b border-[rgb(var(--border-primary))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
            Eventful
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-[rgb(var(--text-secondary))] hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-[rgb(var(--bg-secondary))] transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <HiOutlineMoon className="w-5 h-5" /> : <HiOutlineSun className="w-5 h-5" />}
            </button>
            {user ? (
              <>
                <Link to="/events" className="text-sm font-medium text-[rgb(var(--text-secondary))] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Dashboard
                </Link>
                <Link to="/profile" className="flex items-center gap-2">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-semibold">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                  )}
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-[rgb(var(--text-secondary))] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Login
                </Link>
                <Link to="/register" className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-slate-900" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Your event management platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[rgb(var(--text-primary))] leading-tight mb-6">
              Create, Discover &{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                Experience
              </span>{' '}
              Unforgettable Events
            </h1>
            <p className="text-lg sm:text-xl text-[rgb(var(--text-secondary))] mb-10 max-w-2xl mx-auto">
              From concert halls to conference rooms, Eventful makes it easy to manage events, sell tickets with secure QR codes, and track everything in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link
                  to="/events"
                  className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Start for Free
                  </Link>
                  <Link
                    to="/events"
                    className="w-full sm:w-auto px-8 py-3.5 border border-[rgb(var(--border-secondary))] text-[rgb(var(--text-primary))] font-semibold rounded-xl hover:bg-[rgb(var(--bg-secondary))] transition-all"
                  >
                    Browse Events
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[rgb(var(--bg-secondary))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[rgb(var(--text-primary))] mb-4">
              Everything you need to run events
            </h2>
            <p className="text-[rgb(var(--text-secondary))] text-lg max-w-2xl mx-auto">
              Built for creators and attendees alike, with powerful tools that just work.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <HiOutlineQrcode className="w-6 h-6" />,
                title: 'QR Code Tickets',
                description: 'Every ticket comes with a unique QR code for seamless check-in at your events.',
              },
              {
                icon: <HiOutlineCurrencyDollar className="w-6 h-6" />,
                title: 'Secure Payments',
                description: 'Integrated with Paystack for safe, instant payment processing.',
              },
              {
                icon: <HiOutlineChartBar className="w-6 h-6" />,
                title: 'Analytics Dashboard',
                description: 'Track ticket sales, revenue, and attendee data with real-time analytics.',
              },
              {
                icon: <HiOutlineShieldCheck className="w-6 h-6" />,
                title: 'Ticket Verification',
                description: 'Scan and verify tickets instantly at the door. No fakes, no duplicates.',
              },
              {
                icon: <HiOutlineBell className="w-6 h-6" />,
                title: 'Event Reminders',
                description: 'Automatic reminders so your attendees never miss their events.',
              },
              {
                icon: <HiOutlineTicket className="w-6 h-6" />,
                title: 'Easy Ticket Management',
                description: 'View, download, and manage all your tickets from one clean dashboard.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-6 hover:shadow-lg transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">{feature.title}</h3>
                <p className="text-[rgb(var(--text-secondary))] text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      {featuredEvents.length > 0 && (
        <section className="py-20 bg-[rgb(var(--bg-primary))]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-[rgb(var(--text-primary))] mb-4">
                Featured Events
              </h2>
              <p className="text-[rgb(var(--text-secondary))] text-lg max-w-2xl mx-auto">
                Discover upcoming events happening near you
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.map((event) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="glass border border-[rgb(var(--border-primary))] rounded-2xl overflow-hidden group hover:shadow-lg transition-all duration-200"
                >
                  <div className="relative h-48 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 overflow-hidden">
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-6xl font-bold opacity-20">
                          {event.title[0]}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    {event.category && (
                      <div className="absolute top-3 left-3">
                        <div className="glass-light px-3 py-1 rounded-full">
                          <span className="text-xs font-medium text-white">{event.category}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-lg text-[rgb(var(--text-primary))] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-2 line-clamp-1">
                      {event.title}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]">
                        <HiOutlineCalendar className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>{format(new Date(event.date), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]">
                        <HiOutlineLocationMarker className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[rgb(var(--border-primary))] flex items-center justify-between">
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {event.price > 0 ? `$${event.price.toLocaleString()}` : 'Free'}
                      </span>
                      <span className="text-xs text-[rgb(var(--text-tertiary))]">
                        {event._count?.tickets || 0}/{event.capacity} spots
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link
                to="/events"
                className="inline-flex items-center gap-2 px-6 py-3 border border-[rgb(var(--border-secondary))] text-[rgb(var(--text-primary))] font-semibold rounded-xl hover:bg-[rgb(var(--bg-secondary))] transition-all"
              >
                View All Events <HiOutlineArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-20 bg-[rgb(var(--bg-primary))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[rgb(var(--text-primary))] mb-4">
              How it works
            </h2>
            <p className="text-[rgb(var(--text-secondary))] text-lg">Three simple steps to get started</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Create your account', description: 'Sign up as an event creator or attendee in seconds.' },
              { step: '2', title: 'Create or discover events', description: 'Publish your event or browse amazing events near you.' },
              { step: '3', title: 'Get tickets & attend', description: 'Purchase tickets securely and check in with your QR code.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-5">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">{item.title}</h3>
                <p className="text-sm text-[rgb(var(--text-secondary))]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-teal-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to create something amazing?
          </h2>
          <p className="text-emerald-100 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of event creators and attendees on the Eventful platform.
          </p>
          <Link
            to="/register"
            className="inline-block px-8 py-3.5 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-all shadow-lg"
          >
            Get Started - It's Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[rgb(var(--bg-primary))] border-t border-[rgb(var(--border-primary))] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                Eventful
              </span>
              <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
                Your event management platform
              </p>
            </div>
            <div className="flex gap-8 text-sm text-[rgb(var(--text-secondary))]">
              <Link to="/events" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Events</Link>
              <Link to="/login" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Login</Link>
              <Link to="/register" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Register</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-[rgb(var(--border-primary))] text-center">
            <p className="text-sm text-[rgb(var(--text-tertiary))]">
              Built by Ibrahim Bello &mdash; AltSchool Africa
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
