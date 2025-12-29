import { PrismaClient } from '@prisma/client'
import { initCronTasks } from './cron'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  cronInitialized: boolean | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Initialize Cron Tasks only once
if (!globalForPrisma.cronInitialized) {
  // We check if we are in a server context
  if (typeof window === 'undefined') {
    initCronTasks();
    globalForPrisma.cronInitialized = true;
  }
}
