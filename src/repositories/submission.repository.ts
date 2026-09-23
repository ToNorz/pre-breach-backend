import { and, eq } from "drizzle-orm";
import { db, type Executor } from "@/db/client";
import { coreSubmission } from "@/models/core/submission";
import { coreSolve } from "@/models/core/solve";

export async function findSolveByTeamAndChallenge(
  teamId: string,
  challengeId: string,
  executor: Executor = db,
) {
  const rows = await executor
    .select()
    .from(coreSolve)
    .where(and(eq(coreSolve.teamId, teamId), eq(coreSolve.challengeId, challengeId)));
  return rows[0] ?? null;
}

export async function createSubmission(
  data: {
    teamId: string;
    submittedBy: string;
    challengeId: string;
    rawInput: string;
    verdict: "correct" | "incorrect" | "duplicate" | "rate_limited";
  },
  executor: Executor = db,
) {
  const rows = await executor.insert(coreSubmission).values(data).returning();
  return rows[0]!;
}

export async function createSolve(
  data: {
    teamId: string;
    challengeId: string;
    solvedBy: string;
    submissionId: bigint;
    pointsAwarded: number;
  },
  executor: Executor = db,
) {
  const rows = await executor.insert(coreSolve).values(data).returning();
  return rows[0]!;
}
