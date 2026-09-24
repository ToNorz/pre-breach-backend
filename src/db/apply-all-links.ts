import { db } from "./client";
import { coreChallenge } from "@/models/core/challenge";

async function run() {
  await db.update(coreChallenge)
    .set({ resourceLink: "https://example.com/target" });
  
  console.log("Updated ALL challenges with a resource link.");
  process.exit(0);
}

run().catch(console.error);
