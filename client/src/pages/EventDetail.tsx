import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import type { Event, ShareLinks } from '../types';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { HiOutlineCalendar, HiOutlineLocationMarker, HiOutlineUsers, HiOutlineShare, HiOutlinePencil, HiOutlineTrash, HiOutlineClock, HiOutlineTag } from 'react-icons/hi';
import { FaTwitter, FaFacebook, FaLinkedin, FaWhatsapp, FaEnvelope } from 'react-icons/fa';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [shareLinks, setShareLinks] = useState<ShareLinks | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    api.get(`/events/${id}`)
      .then((res) => setEvent(res.data.data))
      .catch(() => toast.error('Event not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = async () => {
    if (shareLinks) { setShowShare(!showShare); return; }
    try {
      const res = await api.get(`/events/${id}/share`);
      setShareLinks(res.data.data);
      setShowShare(true);
    } catch {
      toast.error('Failed to load share links');
    }
  };

  const handleBuyTicket = async () => {
    if (!user) { navigate('/login'); return; }
    setPaying(true);
    try {
      const res = await api.post('/payments/initialize', { eventId: id });
      window.location.href = res.data.data.authorizationUrl;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.delete(`/events/${id}`);
      toast.success('Event deleted');
      navigate('/events');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-[rgb(var(--text-secondary))]">Event not found</p>
      </div>
    );
  }

  const isCreator = user?.id === event.creatorId;
  const soldOut = (event._count?.tickets || 0) >= event.capacity;
  const availableTickets = event.capacity - (event._count?.tickets || 0);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Desktop: Two-column layout, Mobile: Single column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Event Image & Quick Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Event Cover with Glassmorphism Effect */}
          <div className="relative overflow-hidden rounded-2xl h-64 lg:h-80 group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex items-center justify-center">
              <span className="text-white text-8xl font-bold opacity-20 group-hover:scale-110 transition-transform duration-300">
                {event.title[0]}
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Action Buttons Overlay */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="glass-light p-2.5 rounded-lg hover:bg-white/30 transition-all duration-200"
              >
                <HiOutlineShare className="w-5 h-5 text-white" />
              </button>
              {isCreator && (
                <>
                  <button
                    type="button"
                    onClick={() => navigate(`/events/${id}/edit`)}
                    className="glass-light p-2.5 rounded-lg hover:bg-white/30 transition-all duration-200"
                  >
                    <HiOutlinePencil className="w-5 h-5 text-white" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="glass-light p-2.5 rounded-lg hover:bg-red-500/80 transition-all duration-200"
                  >
                    <HiOutlineTrash className="w-5 h-5 text-white" />
                  </button>
                </>
              )}
            </div>

            {/* Category Badge */}
            <div className="absolute bottom-4 left-4">
              <div className="glass-light px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <HiOutlineTag className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">{event.category}</span>
              </div>
            </div>
          </div>

          {/* Share Modal */}
          {showShare && shareLinks && (
            <div className="glass border border-[rgb(var(--border-primary))] rounded-xl p-5 space-y-3 animate-fade-in">
              <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Share this event</p>
              <div className="flex gap-3">
                <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-3 rounded-lg bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 hover:scale-110 transition-transform">
                  <FaTwitter size={18} />
                </a>
                <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:scale-110 transition-transform">
                  <FaFacebook size={18} />
                </a>
                <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:scale-110 transition-transform">
                  <FaLinkedin size={18} />
                </a>
                <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:scale-110 transition-transform">
                  <FaWhatsapp size={18} />
                </a>
                <a href={shareLinks.email} className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:scale-110 transition-transform">
                  <FaEnvelope size={18} />
                </a>
              </div>
            </div>
          )}

          {/* Quick Info Card - Desktop only */}
          <div className="hidden lg:block glass border border-[rgb(var(--border-primary))] rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <HiOutlineCalendar className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wide">Date & Time</p>
                <p className="text-sm font-medium text-[rgb(var(--text-primary))] mt-1">
                  {format(new Date(event.date), 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-sm text-[rgb(var(--text-secondary))] flex items-center gap-1 mt-0.5">
                  <HiOutlineClock className="w-4 h-4" />
                  {format(new Date(event.date), 'h:mm a')}
                </p>
              </div>
            </div>

            <div className="h-px bg-[rgb(var(--border-primary))]" />

            <div className="flex items-start gap-3">
              <HiOutlineLocationMarker className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wide">Location</p>
                <p className="text-sm font-medium text-[rgb(var(--text-primary))] mt-1">{event.location}</p>
              </div>
            </div>

            <div className="h-px bg-[rgb(var(--border-primary))]" />

            <div className="flex items-start gap-3">
              <HiOutlineUsers className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wide">Availability</p>
                <p className="text-sm font-medium text-[rgb(var(--text-primary))] mt-1">
                  {availableTickets > 0 ? `${availableTickets} tickets left` : 'Sold out'}
                </p>
                <div className="mt-2 h-2 bg-[rgb(var(--bg-tertiary))] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                    style={{ width: `${((event._count?.tickets || 0) / event.capacity) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
                  {event._count?.tickets || 0} of {event.capacity} tickets sold
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Event Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Organizer Card */}
          <div className="glass border border-[rgb(var(--border-primary))] rounded-xl p-6 lg:p-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-[rgb(var(--text-primary))] mb-4">
              {event.title}
            </h1>

            {event.creator && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {event.creator.firstName[0]}{event.creator.lastName[0]}
                </div>
                <div>
                  <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wide">Organized by</p>
                  <p className="font-medium text-[rgb(var(--text-primary))]">
                    {event.creator.firstName} {event.creator.lastName}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Info - Mobile only */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass border border-[rgb(var(--border-primary))] rounded-xl p-4 text-center">
              <HiOutlineCalendar className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
              <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase">Date</p>
              <p className="text-sm font-medium text-[rgb(var(--text-primary))] mt-1">
                {format(new Date(event.date), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="glass border border-[rgb(var(--border-primary))] rounded-xl p-4 text-center">
              <HiOutlineLocationMarker className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
              <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase">Location</p>
              <p className="text-sm font-medium text-[rgb(var(--text-primary))] mt-1 truncate">{event.location}</p>
            </div>
            <div className="glass border border-[rgb(var(--border-primary))] rounded-xl p-4 text-center">
              <HiOutlineUsers className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
              <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase">Capacity</p>
              <p className="text-sm font-medium text-[rgb(var(--text-primary))] mt-1">
                {event._count?.tickets || 0}/{event.capacity}
              </p>
            </div>
          </div>

          {/* Description Card */}
          <div className="glass border border-[rgb(var(--border-primary))] rounded-xl p-6 lg:p-8">
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4">About this event</h2>
            <p className="text-[rgb(var(--text-secondary))] leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          </div>

          {/* Ticket Purchase Card - Eventees Only */}
          {!isCreator && (
            <div className="glass border border-[rgb(var(--border-primary))] rounded-xl p-6 lg:p-8 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium uppercase tracking-wide mb-1">
                    Ticket Price
                  </p>
                  <p className="text-3xl font-bold text-[rgb(var(--text-primary))]">
                    {event.price > 0 ? (
                      <>
                        <span className="text-lg">NGN</span> {event.price.toLocaleString()}
                      </>
                    ) : (
                      'Free'
                    )}
                  </p>
                  {availableTickets > 0 && availableTickets <= 10 && (
                    <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                      Only {availableTickets} tickets left!
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleBuyTicket}
                  disabled={paying || soldOut}
                  className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold
                    hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5
                    disabled:transform-none"
                >
                  {soldOut ? 'Sold Out' : paying ? 'Processing...' : 'Get Ticket'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
