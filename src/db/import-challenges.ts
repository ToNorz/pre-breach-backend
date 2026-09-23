import fs from "fs";
import { createHash } from "crypto";
import { db } from "./client";
import { coreChallenge } from "@/models/core/challenge";
import type { ChallengeDifficulty } from "@/models/core/custom-types";

function hashFlag(flag: string): string {
  return createHash("sha256").update(flag.trim()).digest("hex");
}

export async function importChallenges() {
  const file = fs.readFileSync("./src/db/data/breachpoint_challenges.json", "utf8");
  const data = JSON.parse(file);

  for (const c of data) {
    await db.insert(coreChallenge).values({
      title: c.title,
      description: c.description || "",
      difficulty: (c.difficulty as ChallengeDifficulty) || "medium",
      points: c.points || 100,
      flagHash: hashFlag(c.flag || "flag{default}"),
    });
  }
  console.log("Imported challenges");
}
