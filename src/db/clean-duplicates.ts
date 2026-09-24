import { db } from "./client";
import { coreChallenge } from "@/models/core/challenge";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Deleting duplicate challenges...");
  
  // Keep only the first challenge with a given title
  await db.execute(sql`
    DELETE FROM core_challenge
    WHERE id NOT IN (
      SELECT id
      FROM (
        SELECT id, ROW_NUMBER() OVER(PARTITION BY title ORDER BY created_at ASC) as rn
        FROM core_challenge
      ) t
      WHERE t.rn = 1
    )
  `);
  
  console.log("Done.");
  process.exit(0);
}

run().catch(console.error);
