import { loadEnvVariables } from "@/initializers/load-env";
import { connectToDB } from "@/initializers/connect-db";
import { logger } from "@/loggers/logger";
import { importChallenges } from "@/db/import-challenges";
import { seedAdmins } from "@/db/seed-admins";

/**
 * Runs the full startup sequence. Called once from `index.ts` before
 * the Elysia app starts listening.
 */
export async function init(): Promise<void> {
  loadEnvVariables();
  await connectToDB();

  if (process.env.AUTO_SEED !== "false") {
    try {
      await importChallenges();
      logger.info("Auto-seed: challenges synced successfully");
    } catch (err) {
      logger.error({ err: err instanceof Error ? err.message : err }, "Auto-seed: failed to sync challenges");
    }
    try {
      await seedAdmins();
      logger.info("Auto-seed: admins seeded successfully");
    } catch (err) {
      logger.error({ err: err instanceof Error ? err.message : err }, "Auto-seed: failed to seed admins");
    }
  }

  logger.info("Initialization complete");
}
