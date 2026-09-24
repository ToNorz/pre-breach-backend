import fs from "fs";
import { db } from "./client";
import { coreChallenge } from "@/models/core/challenge";
import { eq } from "drizzle-orm";

async function run() {
  const file = fs.readFileSync("./src/db/data/breachpoint_challenges.json", "utf8");
  const data = JSON.parse(file);
  
  for (const c of data) {
    await db.update(coreChallenge)
      .set({ 
        description: c.description,
        points: c.points,
        resourceLink: c.resourceLink,
        category: c.category || "Misc"
      })
      .where(eq(coreChallenge.title, c.title));
  }
  
  console.log("Updated challenges with new descriptions and links.");
  process.exit(0);
}

run().catch(console.error);
