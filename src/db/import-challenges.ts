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

  const existing = await db.select({ id: coreChallenge.id }).from(coreChallenge).limit(1);
  if (existing.length > 0) {
    console.log("Challenges already exist, skipping import");
    return;
  }

  for (const raw of data) {
    // Normalize keys to lowercase for robust importing
    const c: any = {};
    for (const key in raw) {
      c[key.toLowerCase().replace(/\\s+/g, '')] = raw[key];
    }

    // Attempt common variations
    const title = c.title || "Untitled";
    const description = c.description || "";
    const difficultyStr = (c.difficulty || "medium").toLowerCase();
    const difficulty = (["easy", "medium", "hard", "expert"].includes(difficultyStr) ? difficultyStr : "medium") as ChallengeDifficulty;
    
    // Normalize category (trim spaces and Title Case it to prevent duplicates in UI)
    let rawCategory = (c.category || "Misc").trim();
    const category = rawCategory.split(' ').map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');

    const points = Number(c.points || 100);
    const flag = c.flag || "flag{default}";
    const resourceLink = c.resourcelink || c.resourselink || null;

    await db.insert(coreChallenge).values({
      title,
      description,
      difficulty,
      category,
      points,
      flagHash: hashFlag(flag),
      resourceLink,
    });
  }
  console.log("Imported challenges");
}
