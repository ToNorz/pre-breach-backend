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

    const pointsAwarded = challenge.points;

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
