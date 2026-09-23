import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { coreLeaderboard } from "@/models/core/views";

export async function getLiveLeaderboard() {
  return db
    .select()
    .from(coreLeaderboard)
    .orderBy(coreLeaderboard.rank);
}

export async function getTeamStanding(teamId: string) {
  const rows = await db
    .select()
    .from(coreLeaderboard)
    .where(eq(coreLeaderboard.teamId, teamId));

  const row = rows[0];
  if (!row) return null;
  return {
    score: Number(row.score ?? 0),
    solveCount: Number(row.solveCount ?? 0),
    rank: Number(row.rank ?? 0),
    lastSolveAt: row.lastSolveAt,
  };
}
