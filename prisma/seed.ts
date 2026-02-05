import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create a sample creator
  const creatorPassword = await bcrypt.hash('password123', 12);
  const creator = await prisma.user.upsert({
    where: { email: 'creator@eventful.com' },
    update: {},
    create: {
      email: 'creator@eventful.com',
      password: creatorPassword,
      firstName: 'Event',
      lastName: 'Creator',
      role: 'CREATOR',
    },
  });

  // Create a sample eventee
  const eventeePassword = await bcrypt.hash('password123', 12);
  const eventee = await prisma.user.upsert({
    where: { email: 'eventee@eventful.com' },
    update: {},
    create: {
      email: 'eventee@eventful.com',
      password: eventeePassword,
      firstName: 'Happy',
      lastName: 'Eventee',
      role: 'EVENTEE',
    },
  });

  // Create sample events
  const events = [
    {
      title: 'Lagos Music Festival 2026',
      description: 'The biggest music festival in Lagos featuring top Nigerian and international artists.',
      date: new Date('2026-06-15T18:00:00Z'),
      location: 'Eko Atlantic, Lagos',
      price: 15000,
      capacity: 5000,
      category: 'Music',
      imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800',
      defaultReminderValue: 1,
      defaultReminderUnit: 'DAYS' as const,
      creatorId: creator.id,
    },
    {
      title: 'Tech Conference Abuja',
      description: 'Annual technology conference bringing together developers, designers, and entrepreneurs.',
      date: new Date('2026-07-20T09:00:00Z'),
      location: 'International Conference Centre, Abuja',
      price: 25000,
      capacity: 1000,
      category: 'Technology',
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      defaultReminderValue: 1,
      defaultReminderUnit: 'WEEKS' as const,
      creatorId: creator.id,
    },
    {
      title: 'Art Exhibition - Modern Africa',
      description: 'A curated exhibition showcasing contemporary African art from emerging artists.',
      date: new Date('2026-08-10T10:00:00Z'),
      location: 'Nike Art Gallery, Lekki',
      price: 5000,
      capacity: 200,
      category: 'Art',
      imageUrl: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800',
      defaultReminderValue: 2,
      defaultReminderUnit: 'DAYS' as const,
      creatorId: creator.id,
    },
    {
      title: 'Stand-Up Comedy Night',
      description: 'An evening of laughter with Nigeria\'s funniest comedians.',
      date: new Date('2026-05-25T20:00:00Z'),
      location: 'Terra Kulture, Victoria Island',
      price: 10000,
      capacity: 300,
      category: 'Entertainment',
      imageUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800',
      defaultReminderValue: 3,
      defaultReminderUnit: 'HOURS' as const,
      creatorId: creator.id,
    },
  ];

  for (const eventData of events) {
    await prisma.event.create({ data: eventData });
  }

  console.log('Seed data created:');
  console.log(`  Creator: ${creator.email} (password: password123)`);
  console.log(`  Eventee: ${eventee.email} (password: password123)`);
  console.log(`  Events: ${events.length} events created`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
