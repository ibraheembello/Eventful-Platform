import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { HiOutlineCamera, HiOutlineUser, HiOutlineMail, HiOutlineShieldCheck, HiOutlineCalendar, HiOutlineUpload, HiOutlineLink } from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|gif|webp)$/)) {
      toast.error('Please upload a JPEG, PNG, GIF, or WebP image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfileImage(res.data.data.imageUrl);
      toast.success('Image uploaded');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(profileImage && { profileImage }),
      });
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] mb-8">My Profile</h1>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Avatar Section */}
        <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4">Profile Photo</h2>
          <div className="flex items-center gap-6">
            {/* Avatar Preview */}
            <div className="relative group flex-shrink-0">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-[rgb(var(--border-primary))]"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
              )}
              {imageMode === 'upload' && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <HiOutlineCamera className="w-6 h-6 text-white" />
                </button>
              )}
            </div>

            <div className="flex-1 space-y-3">
              {/* Mode Toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setImageMode('upload')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    imageMode === 'upload'
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                      : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-tertiary))]'
                  }`}
                >
                  <HiOutlineUpload className="w-3.5 h-3.5" /> Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('url')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    imageMode === 'url'
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                      : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-tertiary))]'
                  }`}
                >
                  <HiOutlineLink className="w-3.5 h-3.5" /> Paste URL
                </button>
              </div>

              {imageMode === 'upload' ? (
                /* Upload Zone */
                <div
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer ${
                    dragOver
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-[rgb(var(--border-primary))] hover:border-emerald-400'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  {uploading ? (
                    <p className="text-sm text-[rgb(var(--text-secondary))]">Uploading...</p>
                  ) : (
                    <>
                      <p className="text-sm text-[rgb(var(--text-secondary))]">
                        Drag & drop an image or <span className="text-emerald-600 dark:text-emerald-400 font-medium">browse</span>
                      </p>
                      <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">JPEG, PNG, GIF, WebP up to 5MB</p>
                    </>
                  )}
                </div>
              ) : (
                /* URL Input */
                <div className="space-y-2">
                  <input
                    type="url"
                    placeholder="https://example.com/your-image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!imageUrl.trim() || !/^https?:\/\/.+/.test(imageUrl.trim())) {
                        toast.error('Please enter a valid image URL');
                        return;
                      }
                      setProfileImage(imageUrl.trim());
                      toast.success('Image URL set');
                    }}
                    className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Apply URL
                  </button>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />
          </div>
        </div>

        {/* Personal Info */}
        <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4">Personal Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="profileFirstName" className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
                  <HiOutlineUser className="inline w-4 h-4 mr-1" />
                  First Name
                </label>
                <input
                  id="profileFirstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]"
                />
              </div>
              <div>
                <label htmlFor="profileLastName" className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
                  <HiOutlineUser className="inline w-4 h-4 mr-1" />
                  Last Name
                </label>
                <input
                  id="profileLastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
                <HiOutlineMail className="inline w-4 h-4 mr-1" />
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-2.5 border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-tertiary))] cursor-not-allowed"
              />
              <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">Email cannot be changed</p>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4">Account Details</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <HiOutlineShieldCheck className="w-5 h-5 text-emerald-500" />
              <span className="text-sm text-[rgb(var(--text-secondary))]">Role:</span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                {user.role}
              </span>
            </div>
            {user.provider && user.provider !== 'local' && (
              <div className="flex items-center gap-3">
                {user.provider === 'google' ? (
                  <FcGoogle className="w-5 h-5" />
                ) : (
                  <FaGithub className="w-5 h-5 text-[rgb(var(--text-primary))]" />
                )}
                <span className="text-sm text-[rgb(var(--text-secondary))]">Signed in with:</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 capitalize">
                  {user.provider}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <HiOutlineCalendar className="w-5 h-5 text-emerald-500" />
              <span className="text-sm text-[rgb(var(--text-secondary))]">Member since:</span>
              <span className="text-sm text-[rgb(var(--text-primary))]">
                {format(new Date(user.createdAt), 'MMMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
