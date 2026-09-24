import { createHash } from "crypto";
import { db } from "@/db/client";
import { NotFoundError, ValidationError } from "@/errors/error-types";
import { findChallengeById, lockChallengeForUpdate } from "@/repositories/challenge.repository";
import {
  createSolve,
  createSubmission,
  findSolveByTeamAndChallenge,
} from "@/repositories/submission.repository";
import { findUserTeamMembership } from "@/repositories/team.repository";
import { eq, sql } from "drizzle-orm";
import { coreSolve } from "@/models/core/solve";
import { coreChallenge } from "@/models/core/challenge";

function hashFlag(flag: string): string {
  return createHash("sha256").update(flag.trim()).digest("hex");
}

export async function submitFlag(
  userId: string,
  challengeId: string,
  rawFlag: string,
) {
  const membership = await findUserTeamMembership(userId);
  if (!membership) throw new ValidationError("You must be in a team to submit flags");

  const challenge = await findChallengeById(challengeId);
  if (!challenge) throw new NotFoundError("Challenge not found");

  const existingSolve = await findSolveByTeamAndChallenge(membership.teamId, challengeId);
  if (existingSolve) {
    await createSubmission({ teamId: membership.teamId, submittedBy: userId, challengeId, rawInput: rawFlag, verdict: "duplicate" });
    return { verdict: "duplicate", message: "Your team has already solved this challenge" };
  }

  const isCorrect = hashFlag(rawFlag) === challenge.flagHash;

  if (!isCorrect) {
    await createSubmission({ teamId: membership.teamId, submittedBy: userId, challengeId, rawInput: rawFlag, verdict: "incorrect" });
    return { verdict: "incorrect", message: "Incorrect flag" };
  }

  const result = await db.transaction(async (tx) => {
    await lockChallengeForUpdate(challengeId, tx);

    const alreadySolved = await findSolveByTeamAndChallenge(membership.teamId, challengeId, tx);
    if (alreadySolved) {
      await createSubmission(
        { teamId: membership.teamId, submittedBy: userId, challengeId, rawInput: rawFlag, verdict: "duplicate" },
        tx,
      );
      return { kind: "duplicate" as const };
    }

    // Calculate dynamic points
    const solvesQuery = await tx.select({ count: sql<number>`count(*)` }).from(coreSolve).where(eq(coreSolve.challengeId, challengeId));
    const currentSolves = Number(solvesQuery[0]?.count || 0);
    const newSolvesCount = currentSolves + 1;
    
    let initialPoints = 500;
    let minPoints = 300;
    if (challenge.difficulty === "easy") { initialPoints = 250; minPoints = 100; }
    else if (challenge.difficulty === "medium") { initialPoints = 500; minPoints = 300; }
    else if (challenge.difficulty === "hard") { initialPoints = 750; minPoints = 450; }
    else if (challenge.difficulty === "expert") { initialPoints = 1000; minPoints = 600; }
    
    const decay = 10;
    let pointsAwarded = initialPoints;
    if (newSolvesCount >= decay) {
      pointsAwarded = minPoints;
    } else {
      const drop = (initialPoints - minPoints) / decay;
      pointsAwarded = Math.max(minPoints, Math.floor(initialPoints - ((newSolvesCount - 1) * drop)));
    }

    // Update the challenge with the new points so it displays correctly
    await tx.update(coreChallenge)
      .set({ points: pointsAwarded })
      .where(eq(coreChallenge.id, challengeId));



    const submission = await createSubmission(
      { teamId: membership.teamId, submittedBy: userId, challengeId, rawInput: rawFlag, verdict: "correct" },
      tx,
    );

    await createSolve(
      {
        teamId: membership.teamId,
        challengeId,
        solvedBy: userId,
        submissionId: submission.id,
        pointsAwarded,
      },
      tx,
    );

    return { kind: "solved" as const, pointsAwarded };
  });

  if (result.kind === "duplicate") {
    return { verdict: "duplicate", message: "Your team has already solved this challenge" };
  }

  return {
    verdict: "correct",
    message: "Correct flag!",
    pointsAwarded: result.pointsAwarded,
  };
}
