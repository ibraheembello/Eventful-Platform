import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import type { Event, ShareLinks, Comment } from '../types';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { HiOutlineCalendar, HiOutlineLocationMarker, HiOutlineUsers, HiOutlineShare, HiOutlinePencil, HiOutlineTrash, HiOutlineClock, HiOutlineTag, HiOutlineBookmark, HiBookmark, HiOutlineBell, HiOutlineStar, HiStar, HiOutlinePhotograph, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineX } from 'react-icons/hi';
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
  const [bookmarked, setBookmarked] = useState(false);
  const [waitlistStatus, setWaitlistStatus] = useState<{ onWaitlist: boolean; position: number | null; total: number }>({ onWaitlist: false, position: null, total: 0 });
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentTotal, setCommentTotal] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [commentPage, setCommentPage] = useState(1);
  const [commentTotalPages, setCommentTotalPages] = useState(1);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [hasTicket, setHasTicket] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplying, setPromoApplying] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState<{
    discountType: string;
    discountValue: number;
    discountAmount: number;
    originalPrice: number;
    finalPrice: number;
  } | null>(null);

  useEffect(() => {
    api.get(`/events/${id}`)
      .then((res) => setEvent(res.data.data))
      .catch(() => toast.error('Event not found'))
      .finally(() => setLoading(false));
    if (user) {
      api.get('/events/bookmarks/ids')
        .then((res) => {
          const ids: string[] = res.data.data || [];
          setBookmarked(ids.includes(id!));
        })
        .catch(() => {});
      api.get(`/events/${id}/waitlist`)
        .then((res) => setWaitlistStatus(res.data.data))
        .catch(() => {});
      // Check if user has a ticket
      api.get('/tickets', { params: { limit: 100 } })
        .then((res) => {
          const tickets = res.data.data || [];
          setHasTicket(tickets.some((t: any) => t.event?.id === id));
        })
        .catch(() => {});
    }
  }, [id, user]);

  // Fetch comments
  useEffect(() => {
    api.get(`/events/${id}/comments`, { params: { page: commentPage, limit: 10 } })
      .then((res) => {
        setComments(res.data.data || []);
        setCommentTotal(res.data.pagination?.total || 0);
        setCommentTotalPages(res.data.pagination?.totalPages || 1);
        setAverageRating(res.data.averageRating || 0);
      })
      .catch(() => {});
  }, [id, commentPage]);

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
      const body: any = { eventId: id };
      if (promoDiscount && promoCode) body.promoCode = promoCode;
      const res = await api.post('/payments/initialize', body);
      if (res.data.data.free) {
        toast.success('Ticket claimed successfully!');
        navigate('/tickets');
      } else {
        window.location.href = res.data.data.authorizationUrl;
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoApplying(true);
    try {
      const res = await api.post('/promo-codes/validate', { code: promoCode.trim(), eventId: id });
      setPromoDiscount(res.data.data);
      toast.success('Promo code applied!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid promo code');
      setPromoDiscount(null);
    } finally {
      setPromoApplying(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setPromoDiscount(null);
    setShowPromoInput(false);
  };

  const handleBookmark = async () => {
    if (!user) { navigate('/login'); return; }
    const was = bookmarked;
    setBookmarked(!was);
    try {
      await api.post(`/events/${id}/bookmark`);
    } catch {
      setBookmarked(was);
      toast.error('Failed to update bookmark');
    }
  };

  const handleJoinWaitlist = async () => {
    if (!user) { navigate('/login'); return; }
    setJoiningWaitlist(true);
    try {
      const res = await api.post(`/events/${id}/waitlist`);
      setWaitlistStatus({ onWaitlist: true, position: res.data.data.position, total: (res.data.data.totalAhead || 0) + 1 });
      toast.success('You\'ve been added to the waitlist!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to join waitlist');
    } finally {
      setJoiningWaitlist(false);
    }
  };

  const handleLeaveWaitlist = async () => {
    try {
      await api.delete(`/events/${id}/waitlist`);
      setWaitlistStatus({ onWaitlist: false, position: null, total: 0 });
      toast.success('Removed from waitlist');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to leave waitlist');
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || newRating === 0) return;
    setSubmittingComment(true);
    try {
      const res = await api.post(`/events/${id}/comments`, { content: newComment.trim(), rating: newRating });
      setComments((prev) => [res.data.data, ...prev]);
      setCommentTotal((prev) => prev + 1);
      setNewComment('');
      setNewRating(0);
      toast.success('Review submitted!');
      // Refresh to get updated average
      const refresh = await api.get(`/events/${id}/comments`, { params: { page: 1, limit: 10 } });
      setAverageRating(refresh.data.averageRating || 0);
      setCommentTotalPages(refresh.data.pagination?.totalPages || 1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.delete(`/events/${id}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentTotal((prev) => prev - 1);
      toast.success('Review deleted');
      // Refresh average
      const refresh = await api.get(`/events/${id}/comments`, { params: { page: commentPage, limit: 10 } });
      setAverageRating(refresh.data.averageRating || 0);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete review');
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
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent" />
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
  const isPast = new Date(event.date) < new Date();
  const canReview = isPast && hasTicket && !isCreator && !comments.some((c) => c.userId === user?.id);

  // Build gallery: main image + additional gallery images
  const galleryImages: { url: string; caption?: string }[] = [];
  if (event.imageUrl) galleryImages.push({ url: event.imageUrl, caption: 'Cover image' });
  if (event.images?.length) {
    event.images.forEach((img) => galleryImages.push({ url: img.url, caption: img.caption || undefined }));
  }
  const hasGallery = galleryImages.length > 1;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Desktop: Two-column layout, Mobile: Single column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Event Image & Quick Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Event Cover / Gallery */}
          <div className="relative overflow-hidden rounded-2xl h-64 lg:h-80 group cursor-pointer"
            onClick={() => galleryImages.length > 0 && setLightboxOpen(true)}
          >
            {galleryImages.length > 0 ? (
              <img
                src={galleryImages[activeImage]?.url}
                alt={galleryImages[activeImage]?.caption || event.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 flex items-center justify-center">
                <span className="text-white text-8xl font-bold opacity-20 group-hover:scale-110 transition-transform duration-300">
                  {event.title[0]}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Gallery Nav Arrows */}
            {hasGallery && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setActiveImage((prev) => (prev - 1 + galleryImages.length) % galleryImages.length); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 glass-light p-2 rounded-full hover:bg-white/30 transition-all z-10"
                  aria-label="Previous image"
                >
                  <HiOutlineChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setActiveImage((prev) => (prev + 1) % galleryImages.length); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 glass-light p-2 rounded-full hover:bg-white/30 transition-all z-10"
                  aria-label="Next image"
                >
                  <HiOutlineChevronRight className="w-5 h-5 text-white" />
                </button>
                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 glass-light px-3 py-1.5 rounded-full flex items-center gap-1.5 z-10">
                  <HiOutlinePhotograph className="w-4 h-4 text-white" />
                  <span className="text-xs font-medium text-white">{activeImage + 1} / {galleryImages.length}</span>
                </div>
              </>
            )}

            {/* Action Buttons Overlay */}
            <div className="absolute top-4 right-4 flex gap-2 z-10" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={handleBookmark}
                aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark event'}
                className="glass-light p-2.5 rounded-lg hover:bg-white/30 transition-all duration-200"
              >
                {bookmarked ? (
                  <HiBookmark className="w-5 h-5 text-emerald-400" />
                ) : (
                  <HiOutlineBookmark className="w-5 h-5 text-white" />
                )}
              </button>
              <button
                type="button"
                onClick={handleShare}
                aria-label="Share event"
                className="glass-light p-2.5 rounded-lg hover:bg-white/30 transition-all duration-200"
              >
                <HiOutlineShare className="w-5 h-5 text-white" />
              </button>
              {isCreator && (
                <>
                  <Link
                    to={`/events/${id}/attendees`}
                    aria-label="View attendees"
                    className="glass-light p-2.5 rounded-lg hover:bg-white/30 transition-all duration-200"
                  >
                    <HiOutlineUsers className="w-5 h-5 text-white" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => navigate(`/events/${id}/edit`)}
                    aria-label="Edit event"
                    className="glass-light p-2.5 rounded-lg hover:bg-white/30 transition-all duration-200"
                  >
                    <HiOutlinePencil className="w-5 h-5 text-white" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    aria-label="Delete event"
                    className="glass-light p-2.5 rounded-lg hover:bg-red-500/80 transition-all duration-200"
                  >
                    <HiOutlineTrash className="w-5 h-5 text-white" />
                  </button>
                </>
              )}
            </div>

            {/* Category Badge */}
            {event.category && (
              <div className="absolute bottom-4 left-4 z-10">
                <div className="glass-light px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <HiOutlineTag className="w-4 h-4 text-white" />
                  <span className="text-sm font-medium text-white">{event.category}</span>
                </div>
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {hasGallery && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === activeImage
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={img.caption || `Image ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Lightbox */}
          {lightboxOpen && galleryImages.length > 0 && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors z-50"
                aria-label="Close lightbox"
              >
                <HiOutlineX className="w-8 h-8" />
              </button>
              {hasGallery && (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setActiveImage((prev) => (prev - 1 + galleryImages.length) % galleryImages.length); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-50"
                    aria-label="Previous image"
                  >
                    <HiOutlineChevronLeft className="w-8 h-8" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setActiveImage((prev) => (prev + 1) % galleryImages.length); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-50"
                    aria-label="Next image"
                  >
                    <HiOutlineChevronRight className="w-8 h-8" />
                  </button>
                </>
              )}
              <div className="max-w-5xl max-h-[85vh] px-4" onClick={(e) => e.stopPropagation()}>
                <img
                  src={galleryImages[activeImage]?.url}
                  alt={galleryImages[activeImage]?.caption || event.title}
                  className="max-w-full max-h-[80vh] object-contain mx-auto rounded-lg"
                />
                {galleryImages[activeImage]?.caption && (
                  <p className="text-center text-white/80 text-sm mt-3">{galleryImages[activeImage].caption}</p>
                )}
                <p className="text-center text-white/50 text-xs mt-1">{activeImage + 1} of {galleryImages.length}</p>
              </div>
            </div>
          )}

          {/* Share Modal */}
          {showShare && shareLinks && (
            <div className="glass border border-[rgb(var(--border-primary))] rounded-xl p-5 space-y-3">
              <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Share this event</p>
              <div className="flex gap-3">
                <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Share on Twitter" className="p-3 rounded-lg bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 hover:scale-110 transition-transform">
                  <FaTwitter size={18} />
                </a>
                <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook" className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:scale-110 transition-transform">
                  <FaFacebook size={18} />
                </a>
                <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn" className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:scale-110 transition-transform">
                  <FaLinkedin size={18} />
                </a>
                <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp" className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:scale-110 transition-transform">
                  <FaWhatsapp size={18} />
                </a>
                <a href={shareLinks.email} aria-label="Share via email" className="p-3 rounded-lg bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-secondary))] hover:scale-110 transition-transform">
                  <FaEnvelope size={18} />
                </a>
              </div>
            </div>
          )}

          {/* Quick Info Card - Desktop only */}
          <div className="hidden lg:block glass border border-[rgb(var(--border-primary))] rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <HiOutlineCalendar className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
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
              <HiOutlineLocationMarker className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wide">Location</p>
                <p className="text-sm font-medium text-[rgb(var(--text-primary))] mt-1">{event.location}</p>
              </div>
            </div>

            <div className="h-px bg-[rgb(var(--border-primary))]" />

            <div className="flex items-start gap-3">
              <HiOutlineUsers className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wide">Availability</p>
                <p className="text-sm font-medium text-[rgb(var(--text-primary))] mt-1">
                  {availableTickets > 0 ? `${availableTickets} tickets left` : 'Sold out'}
                </p>
                <div className="mt-2 h-2 bg-[rgb(var(--bg-tertiary))] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500"
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
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold">
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
              <HiOutlineCalendar className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase">Date</p>
              <p className="text-sm font-medium text-[rgb(var(--text-primary))] mt-1">
                {format(new Date(event.date), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="glass border border-[rgb(var(--border-primary))] rounded-xl p-4 text-center">
              <HiOutlineLocationMarker className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase">Location</p>
              <p className="text-sm font-medium text-[rgb(var(--text-primary))] mt-1 truncate">{event.location}</p>
            </div>
            <div className="glass border border-[rgb(var(--border-primary))] rounded-xl p-4 text-center">
              <HiOutlineUsers className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
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
            <div className="glass border border-[rgb(var(--border-primary))] rounded-xl p-6 lg:p-8 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wide mb-1">
                    Ticket Price
                  </p>
                  {promoDiscount ? (
                    <div>
                      <p className="text-lg text-[rgb(var(--text-tertiary))] line-through">
                        NGN {promoDiscount.originalPrice.toLocaleString()}
                      </p>
                      <p className="text-3xl font-bold text-[rgb(var(--text-primary))]">
                        {promoDiscount.finalPrice > 0 ? (
                          <>
                            <span className="text-lg">NGN</span> {promoDiscount.finalPrice.toLocaleString()}
                          </>
                        ) : (
                          'Free'
                        )}
                      </p>
                    </div>
                  ) : (
                    <p className="text-3xl font-bold text-[rgb(var(--text-primary))]">
                      {event.price > 0 ? (
                        <>
                          <span className="text-lg">NGN</span> {event.price.toLocaleString()}
                        </>
                      ) : (
                        'Free'
                      )}
                    </p>
                  )}
                  {!soldOut && availableTickets > 0 && availableTickets <= 10 && (
                    <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                      Only {availableTickets} tickets left!
                    </p>
                  )}
                </div>
                {soldOut ? (
                  waitlistStatus.onWaitlist ? (
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 justify-end">
                          <HiOutlineBell className="w-4 h-4" />
                          You're on the waitlist
                        </p>
                        <p className="text-xs text-[rgb(var(--text-secondary))] mt-0.5">
                          Position #{waitlistStatus.position} of {waitlistStatus.total}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleLeaveWaitlist}
                        className="px-6 py-2.5 border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-xl font-medium
                          hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 text-sm"
                      >
                        Leave Waitlist
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-sm text-[rgb(var(--text-secondary))]">Event is sold out</p>
                      <button
                        type="button"
                        onClick={handleJoinWaitlist}
                        disabled={joiningWaitlist}
                        className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold
                          hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed
                          transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5
                          disabled:transform-none flex items-center gap-2"
                      >
                        <HiOutlineBell className="w-5 h-5" />
                        {joiningWaitlist ? 'Joining...' : 'Join Waitlist'}
                      </button>
                    </div>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={handleBuyTicket}
                    disabled={paying}
                    className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold
                      hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5
                      disabled:transform-none"
                  >
                    {paying ? 'Processing...' : 'Get Ticket'}
                  </button>
                )}
              </div>

              {/* Promo Code Section */}
              {event.price > 0 && !soldOut && (
                <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-800/40">
                  {promoDiscount ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                          <HiOutlineTag className="w-4 h-4" />
                          {promoCode.toUpperCase()} &mdash;{' '}
                          {promoDiscount.discountType === 'PERCENTAGE'
                            ? `${promoDiscount.discountValue}% off`
                            : `NGN ${promoDiscount.discountAmount.toLocaleString()} off`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-xs text-red-500 hover:text-red-600 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ) : showPromoInput ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Enter promo code"
                        className="flex-1 px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-xl bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none uppercase tracking-wider font-mono text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={promoApplying || !promoCode.trim()}
                        className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {promoApplying ? 'Checking...' : 'Apply'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowPromoInput(false); setPromoCode(''); }}
                        className="px-3 py-2.5 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
                      >
                        <HiOutlineX className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPromoInput(true)}
                      className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium flex items-center gap-1.5"
                    >
                      <HiOutlineTag className="w-4 h-4" />
                      Have a promo code?
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reviews Section */}
          <div className="glass border border-[rgb(var(--border-primary))] rounded-xl p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Reviews</h2>
                <div className="flex items-center gap-2 mt-1">
                  {averageRating > 0 ? (
                    <>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <HiStar
                            key={star}
                            className={`w-4 h-4 ${star <= Math.round(averageRating) ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{averageRating.toFixed(1)}</span>
                      <span className="text-sm text-[rgb(var(--text-secondary))]">({commentTotal} {commentTotal === 1 ? 'review' : 'reviews'})</span>
                    </>
                  ) : (
                    <span className="text-sm text-[rgb(var(--text-tertiary))]">No reviews yet</span>
                  )}
                </div>
              </div>
            </div>

            {/* Review Form */}
            {canReview && (
              <div className="mb-6 p-4 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))]">
                <p className="text-sm font-medium text-[rgb(var(--text-primary))] mb-3">Leave a review</p>
                {/* Star Rating Input */}
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-0.5 transition-transform hover:scale-110"
                      aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >
                      {star <= (hoverRating || newRating) ? (
                        <HiStar className="w-7 h-7 text-yellow-500" />
                      ) : (
                        <HiOutlineStar className="w-7 h-7 text-gray-300 dark:text-gray-600" />
                      )}
                    </button>
                  ))}
                  {newRating > 0 && (
                    <span className="text-sm text-[rgb(var(--text-secondary))] ml-2">{newRating}/5</span>
                  )}
                </div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your experience... (min 10 characters)"
                  rows={3}
                  className="w-full px-4 py-3 border border-[rgb(var(--border-primary))] rounded-xl text-sm
                    bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))]
                    focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-[rgb(var(--text-tertiary))]">{newComment.length}/10 min characters</span>
                  <button
                    type="button"
                    onClick={handleSubmitComment}
                    disabled={submittingComment || newComment.trim().length < 10 || newRating === 0}
                    className="px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg
                      hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submittingComment ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </div>
            )}

            {isPast && hasTicket && !canReview && !isCreator && (
              <p className="text-sm text-[rgb(var(--text-tertiary))] mb-4 italic">You have already reviewed this event.</p>
            )}

            {!isPast && (
              <p className="text-sm text-[rgb(var(--text-tertiary))] mb-4 italic">Reviews will be available after the event ends.</p>
            )}

            {/* Comments List */}
            {comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-4 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {comment.user.profileImage ? (
                          <img src={comment.user.profileImage} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-semibold">
                            {comment.user.firstName[0]}{comment.user.lastName[0]}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                            {comment.user.firstName} {comment.user.lastName}
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <HiStar
                                  key={star}
                                  className={`w-3.5 h-3.5 ${star <= comment.rating ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-[rgb(var(--text-tertiary))]">
                              {format(new Date(comment.createdAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                      {(comment.userId === user?.id || isCreator) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-[rgb(var(--text-tertiary))] hover:text-red-500 transition-colors p-1"
                          aria-label="Delete review"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-[rgb(var(--text-secondary))] mt-3 leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                ))}

                {/* Comment Pagination */}
                {commentTotalPages > 1 && (
                  <div className="flex justify-center gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setCommentPage((p) => Math.max(1, p - 1))}
                      disabled={commentPage === 1}
                      className="px-4 py-2 text-xs border border-[rgb(var(--border-primary))] rounded-lg
                        hover:bg-[rgb(var(--bg-tertiary))] disabled:opacity-50 disabled:cursor-not-allowed
                        bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] transition-colors"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 text-xs text-[rgb(var(--text-secondary))]">
                      {commentPage} of {commentTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCommentPage((p) => Math.min(commentTotalPages, p + 1))}
                      disabled={commentPage === commentTotalPages}
                      className="px-4 py-2 text-xs border border-[rgb(var(--border-primary))] rounded-lg
                        hover:bg-[rgb(var(--bg-tertiary))] disabled:opacity-50 disabled:cursor-not-allowed
                        bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            ) : isPast ? (
              <div className="text-center py-8">
                <HiOutlineStar className="w-10 h-10 text-[rgb(var(--text-tertiary))] mx-auto mb-2" />
                <p className="text-sm text-[rgb(var(--text-tertiary))]">No reviews yet. Be the first to share your experience!</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
