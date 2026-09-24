import { createHash } from "crypto";
import { NotFoundError } from "@/errors/error-types";
import {
  createChallenge,
  deleteChallenge,
  findChallengeById,
  findChallenges,
  updateChallenge,
} from "@/repositories/challenge.repository";
import { db } from "@/db/client";
import { coreSolve } from "@/models/core/solve";
import { eq } from "drizzle-orm";
import { getMyTeam } from "@/services/teams/team.service";
import { getLeaderboard } from "@/services/leaderboard/leaderboard.service";

function hashFlag(flag: string): string {
  return createHash("sha256").update(flag.trim()).digest("hex");
}

async function ensureChallengeExists(challengeId: string) {
  const challenge = await findChallengeById(challengeId);
  if (!challenge) throw new NotFoundError("Challenge not found");
  return challenge;
}

export async function listChallengesAdmin() {
  return findChallenges();
}

export async function listChallengesPlayer() {
  return findChallenges();
}

export async function getPlayerBoard(userId: string) {
  const team = await getMyTeam(userId);
  if (!team) throw new NotFoundError("Team not found");

  const leaderboard = await getLeaderboard();
  const entry = leaderboard.entries.find(e => e.teamId === team.id);

  const challenges = await findChallenges();
  const solves = await db.select().from(coreSolve).where(eq(coreSolve.teamId, team.id));
  const solvedMap = new Map(solves.map(s => [s.challengeId, s.pointsAwarded]));

  return {
    team: { id: team.id, name: team.name },
    score: entry?.score ?? 0,
    rank: entry?.rank ?? null,
    solveCount: entry?.solveCount ?? 0,
    challenges: challenges.map(c => {
      let displayPoints = c.points;
      const isSolved = solvedMap.has(c.id);
      
      if (!isSolved) {
        let initialPoints = 500;
        let minPoints = 300;
        if (c.difficulty === "easy") { initialPoints = 250; minPoints = 100; }
        else if (c.difficulty === "medium") { initialPoints = 500; minPoints = 300; }
        else if (c.difficulty === "hard") { initialPoints = 750; minPoints = 450; }
        else if (c.difficulty === "expert") { initialPoints = 1000; minPoints = 600; }
        
        const decay = 10;
        const currentSolves = (c as any).solvesCount || 0;
        const newSolvesCount = currentSolves + 1;
        const drop = (initialPoints - minPoints) / decay;
        displayPoints = Math.max(minPoints, Math.floor(initialPoints - ((newSolvesCount - 1) * drop)));
      } else {
        displayPoints = solvedMap.get(c.id) ?? c.points;
      }

      return {
        id: c.id,
        title: c.title,
        description: c.description,
        difficulty: c.difficulty,
        category: c.category,
        points: displayPoints,
        status: isSolved ? "solved" : "open",
        resourceLink: c.resourceLink,
        solvesCount: (c as any).solvesCount || 0,
      };
    })
  };
}

export async function addChallenge(
  userId: string,
  body: {
    title: string;
    description: string;
    difficulty: "easy" | "medium" | "hard" | "expert";
    points: number;
    flag: string;
    resourceLink?: string;
  },
) {
  const { flag, ...rest } = body;
  return createChallenge({ ...rest, flagHash: hashFlag(flag), createdBy: userId });
}

export async function editChallenge(
  challengeId: string,
  userId: string,
  body: {
    title?: string;
    description?: string;
    difficulty?: "easy" | "medium" | "hard" | "expert";
    points?: number;
    flag?: string;
    resourceLink?: string;
  },
) {
  await ensureChallengeExists(challengeId);

  const { flag, ...rest } = body;
  const data: Parameters<typeof updateChallenge>[1] = { ...rest, updatedBy: userId };
  if (flag) data.flagHash = hashFlag(flag);

  const updated = await updateChallenge(challengeId, data);
  if (!updated) throw new NotFoundError("Challenge not found");
  return updated;
}

export async function removeChallenge(challengeId: string) {
  await ensureChallengeExists(challengeId);
  return deleteChallenge(challengeId);
}
