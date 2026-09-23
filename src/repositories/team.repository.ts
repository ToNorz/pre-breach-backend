import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { db, type Executor } from "@/db/client";
import { coreTeam } from "@/models/core/team";
import { coreTeamMember } from "@/models/core/team-member";
import { coreUser } from "@/models/core/user";
import { coreSolve } from "@/models/core/solve";
import { coreSubmission } from "@/models/core/submission";
import { coreChallenge } from "@/models/core/challenge";

export async function findTeamByName(name: string, executor: Executor = db) {
  const rows = await executor
    .select()
    .from(coreTeam)
    .where(sql`lower(${coreTeam.name}) = lower(${name.trim()})`);
  return rows[0] ?? null;
}

export async function findTeamByJoinCode(joinCode: string, executor: Executor = db) {
  const rows = await executor
    .select()
    .from(coreTeam)
    .where(sql`upper(${coreTeam.joinCode}) = upper(${joinCode.trim()})`);
  return rows[0] ?? null;
}

export async function findUserTeamMembership(userId: string, executor: Executor = db) {
  const rows = await executor
    .select({ teamId: coreTeamMember.teamId, role: coreTeamMember.role })
    .from(coreTeamMember)
    .where(eq(coreTeamMember.userId, userId));
  return rows[0] ?? null;
}

export async function getTeamMemberCount(teamId: string, executor: Executor = db) {
  const rows = await executor
    .select({ count: count() })
    .from(coreTeamMember)
    .where(eq(coreTeamMember.teamId, teamId));
  return Number(rows[0]?.count ?? 0);
}

export async function createTeam(data: {
  name: string;
  joinCode: string;
  createdByUser: string;
}, executor: Executor = db) {
  const rows = await executor
    .insert(coreTeam)
    .values(data)
    .onConflictDoNothing({ target: coreTeam.joinCode })
    .returning();
  return rows[0] ?? null;
}

export async function addTeamMember(data: {
  teamId: string;
  userId: string;
  role: "captain" | "member";
}, executor: Executor = db) {
  const rows = await executor.insert(coreTeamMember).values(data).returning();
  return rows[0]!;
}

export async function lockTeamById(teamId: string, executor: Executor = db) {
  const rows = await executor.select().from(coreTeam).where(eq(coreTeam.id, teamId)).for("update");
  return rows[0] ?? null;
}

export async function findTeamById(teamId: string, executor: Executor = db) {
  const rows = await executor.select().from(coreTeam).where(eq(coreTeam.id, teamId));
  return rows[0] ?? null;
}

export async function getTeamMembers(teamId: string, executor: Executor = db) {
  return executor
    .select({
      userId: coreTeamMember.userId,
      role: coreTeamMember.role,
      username: coreUser.username,
      displayName: coreUser.displayName,
    })
    .from(coreTeamMember)
    .innerJoin(coreUser, eq(coreTeamMember.userId, coreUser.id))
    .where(eq(coreTeamMember.teamId, teamId));
}

export async function findAllTeams(executor: Executor = db) {
  const teams = await executor
    .select()
    .from(coreTeam)
    .orderBy(asc(coreTeam.createdAt));

  const result = [];
  for (const t of teams) {
    const members = await getTeamMembers(t.id, executor);
    const solves = await executor
      .select({
        totalPoints: sql<number>`COALESCE(SUM(${coreSolve.pointsAwarded}), 0)`,
        solveCount: count(coreSolve.challengeId),
      })
      .from(coreSolve)
      .where(eq(coreSolve.teamId, t.id));
    result.push({
      ...t,
      members,
      score: Number(solves[0]?.totalPoints ?? 0),
      solveCount: Number(solves[0]?.solveCount ?? 0),
    });
  }
  return result;
}

export async function updateTeam(
  teamId: string,
  data: Partial<{ name: string }>,
  executor: Executor = db,
) {
  const rows = await executor
    .update(coreTeam)
    .set(data)
    .where(eq(coreTeam.id, teamId))
    .returning();
  return rows[0] ?? null;
}

export async function deleteTeam(teamId: string) {
  return db.transaction(async (tx) => {
    await tx.delete(coreSolve).where(eq(coreSolve.teamId, teamId));
    await tx.delete(coreSubmission).where(eq(coreSubmission.teamId, teamId));
    await tx.delete(coreTeamMember).where(eq(coreTeamMember.teamId, teamId));
    const rows = await tx
      .delete(coreTeam)
      .where(eq(coreTeam.id, teamId))
      .returning();
    return rows[0] ?? null;
  });
}

export async function findRecentSubmissions(limit = 50, executor: Executor = db) {
  const rows = await executor
    .select({
      id: coreSubmission.id,
      teamId: coreSubmission.teamId,
      teamName: coreTeam.name,
      challengeId: coreSubmission.challengeId,
      challengeTitle: coreChallenge.title,
      flag: coreSubmission.rawInput,
      verdict: coreSubmission.verdict,
      submittedAt: coreSubmission.submittedAt,
    })
    .from(coreSubmission)
    .innerJoin(coreTeam, eq(coreSubmission.teamId, coreTeam.id))
    .innerJoin(coreChallenge, eq(coreSubmission.challengeId, coreChallenge.id))
    .orderBy(desc(coreSubmission.submittedAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r,
    id: r.id.toString(),
  }));
}
