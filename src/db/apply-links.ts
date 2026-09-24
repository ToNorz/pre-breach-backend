import fs from "fs";
import { db } from "./client";
import { coreChallenge } from "@/models/core/challenge";
import { eq } from "drizzle-orm";

async function run() {
  const file = fs.readFileSync("./src/db/data/breachpoint_challenges.json", "utf8");
  const data = JSON.parse(file);
  
  for (const c of data) {
    if (c.resourceLink) {
      await db.update(coreChallenge)
        .set({ resourceLink: c.resourceLink })
        .where(eq(coreChallenge.title, c.title));
    }
  }
  
  console.log("Updated challenges with resource links.");
  process.exit(0);
}

run().catch(console.error);
