import { eq } from "drizzle-orm";
import { db, type Executor } from "@/db/client";
import { coreChallenge } from "@/models/core/challenge";
import { coreSolve } from "@/models/core/solve";
import { coreSubmission } from "@/models/core/submission";

const playerChallengeColumns = {
  id: coreChallenge.id,
  title: coreChallenge.title,
  description: coreChallenge.description,
  difficulty: coreChallenge.difficulty,
  points: coreChallenge.points,
  createdAt: coreChallenge.createdAt,
  updatedAt: coreChallenge.updatedAt,
  resourceLink: coreChallenge.resourceLink,
  category: coreChallenge.category,
};

import { coreChallengeSolveCount } from "@/models/core/views";

export async function findChallenges(executor: Executor = db) {
  const results = await executor
    .select({
      ...playerChallengeColumns,
      solvesCount: coreChallengeSolveCount.solves,
    })
    .from(coreChallenge)
    .leftJoin(coreChallengeSolveCount, eq(coreChallengeSolveCount.challengeId, coreChallenge.id));
    
  return results.map(r => ({
    ...r,
    solvesCount: Number(r.solvesCount || 0)
  }));
}

export async function findChallengeById(challengeId: string, executor: Executor = db) {
  const rows = await executor.select().from(coreChallenge).where(eq(coreChallenge.id, challengeId));
  return rows[0] ?? null;
}

export async function lockChallengeForUpdate(challengeId: string, executor: Executor = db) {
  const rows = await executor.select().from(coreChallenge).where(eq(coreChallenge.id, challengeId)).for("update");
  return rows[0] ?? null;
}

export async function createChallenge(data: {
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  points: number;
  flagHash: string;
  createdBy?: string;
}) {
  const rows = await db.insert(coreChallenge).values(data).returning();
  return rows[0]!;
}

export async function updateChallenge(
  challengeId: string,
  data: Partial<{
    title: string;
    description: string;
    difficulty: "easy" | "medium" | "hard" | "expert";
    points: number;
    flagHash: string;
    updatedBy: string;
    resourceLink: string;
  }>,
) {
  const rows = await db.update(coreChallenge).set(data).where(eq(coreChallenge.id, challengeId)).returning();
  return rows[0] ?? null;
}

export async function deleteChallenge(challengeId: string) {
  return db.transaction(async (tx) => {
    await tx.delete(coreSolve).where(eq(coreSolve.challengeId, challengeId));
    await tx.delete(coreSubmission).where(eq(coreSubmission.challengeId, challengeId));
    const rows = await tx.delete(coreChallenge).where(eq(coreChallenge.id, challengeId)).returning();
    return rows[0] ?? null;
  });
}
