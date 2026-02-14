import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { HiOutlinePhotograph, HiOutlineUpload, HiOutlineLink, HiX } from 'react-icons/hi';

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

  // Image upload state
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEdit) {
      api.get(`/events/${id}`).then((res) => {
        const e = res.data.data;
        const existingUrl = e.imageUrl || '';
        setForm({
          title: e.title,
          description: e.description,
          date: new Date(e.date).toISOString().slice(0, 16),
          location: e.location,
          capacity: e.capacity,
          price: e.price,
          imageUrl: existingUrl,
          category: e.category || '',
          defaultReminderValue: e.defaultReminderValue?.toString() || '',
          defaultReminderUnit: e.defaultReminderUnit || 'HOURS',
        });
        if (existingUrl) {
          setImagePreview(existingUrl);
          setImageMode(existingUrl.startsWith('/uploads/') ? 'upload' : 'url');
        }
      });
    }
  }, [id, isEdit]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setForm({ ...form, imageUrl: '' });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
    setForm({ ...form, imageUrl: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) return '';
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      return data.data.imageUrl;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalImageUrl = form.imageUrl;

      // Upload file if one is selected
      if (imageMode === 'upload' && imageFile) {
        finalImageUrl = await uploadImage();
      }

      const payload: any = {
        title: form.title,
        description: form.description,
        date: new Date(form.date).toISOString(),
        location: form.location,
        capacity: Number(form.capacity),
        price: Number(form.price),
      };
      if (finalImageUrl) payload.imageUrl = finalImageUrl;
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
      toast.error(err.response?.data?.message || err.message || 'Failed to save event');
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

          {/* Event Image */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
              <HiOutlinePhotograph className="inline w-4 h-4 mr-1" />
              Event Image (optional)
            </label>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => { setImageMode('upload'); clearImage(); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition ${
                  imageMode === 'upload'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-secondary))]'
                }`}
              >
                <HiOutlineUpload className="w-4 h-4" />
                Upload File
              </button>
              <button
                type="button"
                onClick={() => { setImageMode('url'); clearImage(); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition ${
                  imageMode === 'url'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-secondary))]'
                }`}
              >
                <HiOutlineLink className="w-4 h-4" />
                Paste URL
              </button>
            </div>

            {imageMode === 'upload' ? (
              <>
                {/* Drag & Drop Zone */}
                {!imagePreview && (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
                      dragActive
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-[rgb(var(--border-primary))] hover:border-emerald-500/50 hover:bg-[rgb(var(--bg-secondary))]'
                    }`}
                  >
                    <HiOutlineUpload className="w-8 h-8 mx-auto mb-2 text-[rgb(var(--text-tertiary))]" />
                    <p className="text-sm text-[rgb(var(--text-secondary))]">
                      Drag & drop an image here, or <span className="text-emerald-500 font-medium">click to browse</span>
                    </p>
                    <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">JPEG, PNG, GIF, WebP up to 5MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                    />
                  </div>
                )}

                {/* Preview */}
                {imagePreview && (
                  <div className="relative rounded-lg overflow-hidden h-40 bg-[rgb(var(--bg-tertiary))]">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition"
                    >
                      <HiX className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => {
                    setForm({ ...form, imageUrl: e.target.value });
                    setImagePreview(e.target.value);
                  }}
                  className="w-full px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]"
                  placeholder="https://example.com/image.jpg"
                />
                {form.imageUrl && (
                  <div className="mt-2 relative rounded-lg overflow-hidden h-32 bg-[rgb(var(--bg-tertiary))]">
                    <img
                      src={form.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition"
                    >
                      <HiX className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Category (optional)</label>
            <select
              id="category"
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
              <label htmlFor="date" className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Date & Time</label>
              <input
                id="date"
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
              <label htmlFor="capacity" className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Capacity</label>
              <input
                id="capacity"
                type="number"
                required
                min={1}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]"
              />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Price (NGN)</label>
              <input
                id="price"
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
                aria-label="Reminder unit"
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
            <button type="submit" disabled={loading || uploading} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition">
              {uploading ? 'Uploading image...' : loading ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
