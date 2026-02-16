import { useState, useEffect } from 'react';
import api from '../lib/api';
import type { PromoCode, Event } from '../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { HiOutlineTag, HiOutlinePlus, HiOutlineTrash, HiOutlineX } from 'react-icons/hi';

export default function PromoCodes() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);

  // Form state
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [eventId, setEventId] = useState('');

  const fetchPromoCodes = () => {
    setLoading(true);
    api.get('/promo-codes', { params: { page, limit: 10 } })
      .then((res) => {
        setPromoCodes(res.data.data || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
      })
      .catch(() => toast.error('Failed to load promo codes'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPromoCodes(); }, [page]);

  useEffect(() => {
    // Load creator's events for the dropdown
    api.get('/events/creator', { params: { limit: 100 } })
      .then((res) => setEvents(res.data.data || []))
      .catch(() => {});
  }, []);

  const resetForm = () => {
    setCode('');
    setDiscountType('PERCENTAGE');
    setDiscountValue('');
    setMaxUses('');
    setExpiresAt('');
    setEventId('');
    setShowForm(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: any = {
        code: code.toUpperCase(),
        discountType,
        discountValue: parseFloat(discountValue),
      };
      if (maxUses) body.maxUses = parseInt(maxUses);
      if (expiresAt) body.expiresAt = new Date(expiresAt).toISOString();
      if (eventId) body.eventId = eventId;

      await api.post('/promo-codes', body);
      toast.success('Promo code created!');
      resetForm();
      fetchPromoCodes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0] || 'Failed to create promo code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (promoCode: PromoCode) => {
    try {
      await api.put(`/promo-codes/${promoCode.id}`, { isActive: !promoCode.isActive });
      setPromoCodes((prev) =>
        prev.map((p) => (p.id === promoCode.id ? { ...p, isActive: !p.isActive } : p))
      );
      toast.success(promoCode.isActive ? 'Promo code deactivated' : 'Promo code activated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this promo code?')) return;
    try {
      await api.delete(`/promo-codes/${id}`);
      setPromoCodes((prev) => prev.filter((p) => p.id !== id));
      toast.success('Promo code deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const getStatusBadge = (promo: PromoCode) => {
    if (!promo.isActive) {
      return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">Inactive</span>;
    }
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">Expired</span>;
    }
    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">Maxed Out</span>;
    }
    return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">Active</span>;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Promo Codes</h1>
          <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">Create discount codes to boost ticket sales</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors"
        >
          {showForm ? <HiOutlineX className="w-4 h-4" /> : <HiOutlinePlus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Create New'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="glass border border-[rgb(var(--border-primary))] rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4">New Promo Code</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Code</label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. EARLY20"
                  required
                  minLength={3}
                  maxLength={20}
                  className="w-full px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-xl bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none uppercase tracking-wider font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Discount Type</label>
                <div className="flex rounded-xl overflow-hidden border border-[rgb(var(--border-primary))]">
                  <button
                    type="button"
                    onClick={() => setDiscountType('PERCENTAGE')}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                      discountType === 'PERCENTAGE'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-secondary))]'
                    }`}
                  >
                    % Percentage
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('FIXED')}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                      discountType === 'FIXED'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-secondary))]'
                    }`}
                  >
                    NGN Fixed
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="discountValue" className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
                  Discount Value {discountType === 'PERCENTAGE' ? '(%)' : '(NGN)'}
                </label>
                <input
                  id="discountValue"
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 1000'}
                  required
                  min={1}
                  max={discountType === 'PERCENTAGE' ? 100 : undefined}
                  step="any"
                  className="w-full px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-xl bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="maxUses" className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Max Uses (optional)</label>
                <input
                  id="maxUses"
                  type="number"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="Unlimited"
                  min={1}
                  className="w-full px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-xl bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="expiresAt" className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Expiry Date (optional)</label>
                <input
                  id="expiresAt"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-xl bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="eventId" className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Event (optional)</label>
                <select
                  id="eventId"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-xl bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="">All my events</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Creating...' : 'Create Promo Code'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Promo Codes List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : promoCodes.length === 0 ? (
        <div className="text-center py-20">
          <HiOutlineTag className="w-16 h-16 text-[rgb(var(--text-tertiary))] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">No promo codes yet</h3>
          <p className="text-sm text-[rgb(var(--text-secondary))] mb-6">Create your first promo code to offer discounts on your events.</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Create Promo Code
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {promoCodes.map((promo) => (
              <div
                key={promo.id}
                className="glass border border-[rgb(var(--border-primary))] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                      {promo.code}
                    </span>
                    {getStatusBadge(promo)}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[rgb(var(--text-secondary))]">
                    <span>
                      {promo.discountType === 'PERCENTAGE'
                        ? `${promo.discountValue}% off`
                        : `NGN ${promo.discountValue.toLocaleString()} off`}
                    </span>
                    <span>
                      Used: {promo.usedCount}{promo.maxUses ? `/${promo.maxUses}` : ' / unlimited'}
                    </span>
                    {promo.event && (
                      <span className="text-xs px-2 py-0.5 bg-[rgb(var(--bg-secondary))] rounded-full">
                        {promo.event.title}
                      </span>
                    )}
                    {!promo.eventId && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                        All events
                      </span>
                    )}
                    {promo.expiresAt && (
                      <span className="text-xs">
                        Expires: {format(new Date(promo.expiresAt), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(promo)}
                    className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                      promo.isActive
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                    }`}
                  >
                    {promo.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(promo.id)}
                    className="p-2 text-[rgb(var(--text-tertiary))] hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    aria-label="Delete promo code"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg hover:bg-[rgb(var(--bg-tertiary))] disabled:opacity-50 disabled:cursor-not-allowed bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] transition-colors"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm text-[rgb(var(--text-secondary))]">
                {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg hover:bg-[rgb(var(--bg-tertiary))] disabled:opacity-50 disabled:cursor-not-allowed bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] transition-colors"
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
