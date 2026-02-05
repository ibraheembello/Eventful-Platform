import cron from 'node-cron';
import { NotificationService } from '../modules/notifications/notification.service';

export function startReminderJob() {
  // Run every minute to check for due reminders
  cron.schedule('* * * * *', async () => {
    try {
      const dueReminders = await NotificationService.getDueReminders();

      for (const reminder of dueReminders) {
        // In production, you would send an email/push notification here
        console.log(
          `[REMINDER] Sending to ${reminder.user.email}: ${reminder.message}`
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
