import app from './app';
import prisma from './config/database';
import { startReminderJob } from './jobs/reminderJob';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Database connected successfully');

    // Start reminder cron job
    startReminderJob();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API docs available at http://localhost:${PORT}/api/docs`);
      console.log(`Health check at http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
