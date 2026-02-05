import prisma from '../src/config/database';

async function checkUsers() {
  console.log('\n📋 Listing all users in database:\n');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      _count: {
        select: {
          events: true,
          tickets: true,
        },
      },
    },
  });

  console.log(`Found ${users.length} users:\n`);

  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Events Created: ${user._count.events}`);
    console.log(`   Tickets: ${user._count.tickets}`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkUsers();
