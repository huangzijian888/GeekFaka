import cron from 'node-cron';
import { prisma } from './prisma';
import { deleteTrafficSubUser } from './traffic';
import { logger } from './logger';

const log = logger.child({ module: 'CronTask' });

export function initCronTasks() {
  log.info("Initializing background cron tasks...");

  // Task 1: Clean up expired traffic accounts
  // Run every hour at the 0th minute
  cron.schedule('0 * * * *', async () => {
    log.info("Running expired traffic account cleanup...");
    
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
        log.info("No expired accounts found.");
        return;
      }

      log.info({ count: expiredAccounts.length }, "Found expired accounts to remove");

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
