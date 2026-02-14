import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { HiOutlinePhotograph } from 'react-icons/hi';

const CATEGORIES = ['Music', 'Technology', 'Art', 'Entertainment', 'Sports', 'Education', 'Business', 'Food & Drink', 'Health', 'Other'];

export default function CreateEvent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    capacity: 100,
    price: 0,
    imageUrl: '',
    category: '',
    defaultReminderValue: '',
    defaultReminderUnit: 'HOURS',
  });

  useEffect(() => {
    if (isEdit) {
      api.get(`/events/${id}`).then((res) => {
        const e = res.data.data;
        setForm({
          title: e.title,
          description: e.description,
          date: new Date(e.date).toISOString().slice(0, 16),
          location: e.location,
          capacity: e.capacity,
          price: e.price,
          imageUrl: e.imageUrl || '',
          category: e.category || '',
          defaultReminderValue: e.defaultReminderValue?.toString() || '',
          defaultReminderUnit: e.defaultReminderUnit || 'HOURS',
        });
      });
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        title: form.title,
        description: form.description,
        date: new Date(form.date).toISOString(),
        location: form.location,
        capacity: Number(form.capacity),
        price: Number(form.price),
      };
      if (form.imageUrl) payload.imageUrl = form.imageUrl;
      if (form.category) payload.category = form.category;
      if (form.defaultReminderValue) {
        payload.defaultReminderValue = Number(form.defaultReminderValue);
        payload.defaultReminderUnit = form.defaultReminderUnit;
      }

      if (isEdit) {
        await api.put(`/events/${id}`, payload);
        toast.success('Event updated!');
      } else {
        const res = await api.post('/events', payload);
        toast.success('Event created!');
        navigate(`/events/${res.data.data.id}`);
        return;
      }
      navigate(`/events/${id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-6">{isEdit ? 'Edit Event' : 'Create Event'}</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]"
              placeholder="Event title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Description</label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition resize-none bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]"
              placeholder="Describe your event"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              <HiOutlinePhotograph className="inline w-4 h-4 mr-1" />
              Event Image URL (optional)
            </label>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="w-full px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]"
              placeholder="https://example.com/image.jpg"
            />
            {form.imageUrl && (
              <div className="mt-2 rounded-lg overflow-hidden h-32 bg-[rgb(var(--bg-tertiary))]">
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Category (optional)</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]"
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Date & Time</label>
              <input
                type="datetime-local"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Location</label>
              <input
                type="text"
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]"
                placeholder="Event venue"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Capacity</label>
              <input
                type="number"
                required
                min={1}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Price (NGN)</label>
              <input
                type="number"
                required
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]"
              />
            </div>
          </div>

          <div className="border-t border-[rgb(var(--border-primary))] pt-5">
            <p className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-3">Default Reminder (optional)</p>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                min={1}
                value={form.defaultReminderValue}
                onChange={(e) => setForm({ ...form, defaultReminderValue: e.target.value })}
                className="w-full px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]"
                placeholder="e.g. 1"
              />
              <select
                value={form.defaultReminderUnit}
                onChange={(e) => setForm({ ...form, defaultReminderUnit: e.target.value })}
                className="w-full px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]"
              >
                <option value="MINUTES">Minutes</option>
                <option value="HOURS">Hours</option>
                <option value="DAYS">Days</option>
                <option value="WEEKS">Weeks</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="flex-1 py-2.5 border border-[rgb(var(--border-primary))] rounded-lg text-[rgb(var(--text-primary))] font-medium hover:bg-[rgb(var(--bg-secondary))] transition">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition">
              {loading ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
