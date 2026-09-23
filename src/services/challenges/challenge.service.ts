import { createHash } from "crypto";
import { NotFoundError } from "@/errors/error-types";
import {
  createChallenge,
  deleteChallenge,
  findChallengeById,
  findChallenges,
  updateChallenge,
} from "@/repositories/challenge.repository";

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

export async function addChallenge(
  userId: string,
  body: {
    title: string;
    description: string;
    difficulty: "easy" | "medium" | "hard" | "expert";
    points: number;
    flag: string;
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
