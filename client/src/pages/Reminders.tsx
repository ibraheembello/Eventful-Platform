import { useEffect, useState } from 'react';
import { HiBell, HiPlus, HiTrash, HiPencil, HiX } from 'react-icons/hi';
import { format } from 'date-fns';
import api from '../lib/api';
import toast from 'react-hot-toast';
import type { Notification, Event } from '../types';

type ReminderUnit = 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS';

export default function Reminders() {
  const [reminders, setReminders] = useState<Notification[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Notification | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    eventId: '',
    reminderValue: 1,
    reminderUnit: 'DAYS' as ReminderUnit,
  });

  useEffect(() => {
    fetchReminders();
    fetchEvents();
  }, [page]);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications', {
        params: { page, limit: 10 }
      });

      if (response.data.success) {
        setReminders(response.data.data);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      if (response.data.success) {
        setEvents(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to load events:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.eventId) {
      toast.error('Please select an event');
      return;
    }

    try {
      if (editingReminder) {
        const response = await api.patch(`/notifications/${editingReminder.id}`, {
          reminderValue: formData.reminderValue,
          reminderUnit: formData.reminderUnit,
        });

        if (response.data.success) {
          toast.success('Reminder updated successfully');
          fetchReminders();
          closeModal();
        }
      } else {
        const response = await api.post('/notifications', formData);

        if (response.data.success) {
          toast.success('Reminder created successfully');
          fetchReminders();
          closeModal();
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save reminder');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    try {
      const response = await api.delete(`/notifications/${id}`);

      if (response.data.success) {
        toast.success('Reminder deleted successfully');
        fetchReminders();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete reminder');
    }
  };

  const openModal = (reminder?: Notification) => {
    if (reminder) {
      setEditingReminder(reminder);
      setFormData({
        eventId: reminder.eventId,
        reminderValue: reminder.reminderValue,
        reminderUnit: reminder.reminderUnit,
      });
    } else {
      setEditingReminder(null);
      setFormData({
        eventId: '',
        reminderValue: 1,
        reminderUnit: 'DAYS',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingReminder(null);
    setFormData({
      eventId: '',
      reminderValue: 1,
      reminderUnit: 'DAYS',
    });
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
          <HiBell className="text-indigo-600 dark:text-indigo-400" /> My Reminders
        </h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white
            rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
        >
          <HiPlus className="w-5 h-5" /> Add Reminder
        </button>
      </div>

      {reminders.length === 0 ? (
        <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-12 text-center">
          <HiBell className="w-16 h-16 text-[rgb(var(--text-tertiary))] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">No Reminders Set</h3>
          <p className="text-[rgb(var(--text-secondary))] mb-6">You haven't set any event reminders yet.</p>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600
              text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
          >
            <HiPlus className="w-5 h-5" /> Create Reminder
          </button>
        </div>
      ) : (
        <>
          <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl overflow-hidden">
            <table className="min-w-full divide-y divide-[rgb(var(--border-primary))]">
              <thead className="bg-[rgb(var(--bg-tertiary))]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                    Reminder Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                    Event Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[rgb(var(--bg-primary))] divide-y divide-[rgb(var(--border-primary))]">
                {reminders.map((reminder) => (
                  <tr key={reminder.id} className="hover:bg-[rgb(var(--bg-tertiary))] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[rgb(var(--text-primary))]">
                        {reminder.event.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[rgb(var(--text-primary))]">
                        {reminder.reminderValue} {reminder.reminderUnit.toLowerCase()} before
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[rgb(var(--text-primary))]">
                        {format(new Date(reminder.event.date), 'PPP')}
                      </div>
                      <div className="text-xs text-[rgb(var(--text-secondary))]">
                        {format(new Date(reminder.event.date), 'p')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        reminder.sent
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {reminder.sent ? 'Sent' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(reminder)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                        >
                          <HiPencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(reminder.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        >
                          <HiTrash className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 glass border border-[rgb(var(--border-primary))] rounded-lg
                  disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[rgb(var(--bg-tertiary))]
                  text-[rgb(var(--text-primary))] transition-all"
              >
                Previous
              </button>
              <span className="text-[rgb(var(--text-secondary))]">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 glass border border-[rgb(var(--border-primary))] rounded-lg
                  disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[rgb(var(--bg-tertiary))]
                  text-[rgb(var(--text-primary))] transition-all"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Reminder Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[rgb(var(--text-primary))]">
                {editingReminder ? 'Edit Reminder' : 'Create Reminder'}
              </h2>
              <button onClick={closeModal} className="text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]">
                <HiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-1">
                  Select Event
                </label>
                <select
                  value={formData.eventId}
                  onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                  disabled={!!editingReminder}
                  className="w-full px-3 py-2 border border-[rgb(var(--border-primary))] rounded-lg
                    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none
                    bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]
                    disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">Choose an event...</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} - {format(new Date(event.date), 'PPP')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-1">
                    Remind Me
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.reminderValue}
                    onChange={(e) => setFormData({ ...formData, reminderValue: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-[rgb(var(--border-primary))] rounded-lg
                      focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none
                      bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-1">
                    Unit
                  </label>
                  <select
                    value={formData.reminderUnit}
                    onChange={(e) => setFormData({ ...formData, reminderUnit: e.target.value as ReminderUnit })}
                    className="w-full px-3 py-2 border border-[rgb(var(--border-primary))] rounded-lg
                      focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none
                      bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]"
                  >
                    <option value="MINUTES">Minutes</option>
                    <option value="HOURS">Hours</option>
                    <option value="DAYS">Days</option>
                    <option value="WEEKS">Weeks</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))]
                    rounded-lg hover:bg-[rgb(var(--bg-tertiary))] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg
                    hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                >
                  {editingReminder ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
