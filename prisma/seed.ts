import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const hash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { passwordHash: hash, role: Role.ADMIN },
    create: {
      email: 'admin@example.com',
      passwordHash: hash,
      role: Role.ADMIN,
    },
  });

  await prisma.profile.upsert({
    where: { userId: admin.id },
    create: { userId: admin.id },
    update: {},
  });

  const content = await prisma.user.upsert({
    where: { email: 'content@example.com' },
    update: { passwordHash: hash, role: Role.CONTENT_MANAGER },
    create: {
      email: 'content@example.com',
      passwordHash: hash,
      role: Role.CONTENT_MANAGER,
    },
  });

  await prisma.profile.upsert({
    where: { userId: content.id },
    create: { userId: content.id },
    update: {},
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
