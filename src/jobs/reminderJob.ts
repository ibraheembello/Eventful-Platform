import cron from 'node-cron';
import { NotificationService } from '../modules/notifications/notification.service';
import { EmailService } from '../utils/emailService';

export function startReminderJob() {
  // Run every minute to check for due reminders
  cron.schedule('* * * * *', async () => {
    try {
      const dueReminders = await NotificationService.getDueReminders();

      for (const reminder of dueReminders) {
        // Send email notification
        await EmailService.sendEventReminder(
          reminder.user.email,
          reminder.user.firstName,
          reminder.event,
          reminder.message || `Reminder: "${reminder.event.title}" is coming up!`,
        );

        await NotificationService.markAsSent(reminder.id);
      }

      if (dueReminders.length > 0) {
        console.log(`[REMINDER JOB] Processed ${dueReminders.length} reminders`);
      }
    } catch (error) {
      console.error('[REMINDER JOB] Error processing reminders:', error);
    }
  });

  console.log('Reminder cron job started (runs every minute)');
}
