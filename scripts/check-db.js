const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('Checking database...\n');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      telegramChatId: true,
      telegramUsername: true,
      timezone: true
    }
  });

  console.log(`Found ${users.length} users:\n`);
  users.forEach(user => {
    console.log(`ID: ${user.id}`);
    console.log(`  Telegram Chat ID: ${user.telegramChatId || 'Not connected'}`);
    console.log(`  Telegram Username: ${user.telegramUsername || 'N/A'}`);
    console.log(`  Timezone: ${user.timezone}`);
    console.log('');
  });

  await prisma.$disconnect();
}

main().catch(console.error);
