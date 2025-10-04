// Override DATABASE_URL for tests to use test.db instead of dev.db
process.env.DATABASE_URL = 'file:./test.db';

import { PrismaClient, Prisma } from '@prisma/client';
import type { DefaultArgs } from '@prisma/client/runtime/library';

// Singleton PrismaClient for all tests
let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

export async function cleanDatabase(prisma: PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>): Promise<void> {
  // For SQLite, we need to delete in the correct order to avoid FK violations
  // Delete from child tables first, then parent tables
  await prisma.payment.deleteMany({});
  await prisma.lineItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.jobActivity.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.technician.deleteMany({});
}

// Global setup and teardown
beforeAll(async () => {
  const prisma = getPrismaClient();
  await prisma.$connect();
});

afterAll(async () => {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
});
