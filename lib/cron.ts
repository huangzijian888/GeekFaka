import cron from 'node-cron';
import { prisma } from './prisma';
import { deleteTrafficSubUser } from './traffic';
import { logger } from './logger';

const log = logger.child({ module: 'CronTask' });

export function initCronTasks() {
  log.info("Initializing background cron tasks...");

  // Task 1: Clean up expired traffic accounts
  // Run every minute for maximum precision
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      
      // 1. Find expired accounts
      const expiredAccounts = await prisma.trafficAccount.findMany({
        where: {
          expiresAt: {
            lt: now,
            not: null
          }
        }
      });

      if (expiredAccounts.length === 0) {
        return; // Silent return to keep logs clean when nothing to do
      }

      log.info({ count: expiredAccounts.length }, "Running expired traffic account cleanup...");

      // 2. Delete from upstream and local DB
      for (const account of expiredAccounts) {
        try {
          const success = await deleteTrafficSubUser(account.username);
          if (success) {
            await prisma.trafficAccount.delete({ where: { id: account.id } });
            log.info({ username: account.username }, "Successfully removed expired account");
          }
        } catch (err) {
          log.error({ err, username: account.username }, "Failed to remove specific account");
        }
      }

    } catch (error) {
      log.error({ err: error }, "Expired account cleanup task failed");
    }
  });

  log.info("Cron tasks scheduled.");
}
