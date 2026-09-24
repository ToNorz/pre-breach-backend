import { logger } from "@/loggers/logger";
import {
  addChallenge,
  editChallenge,
  removeChallenge,
  listChallengesAdmin,
  listChallengesPlayer,
  getPlayerBoard,
} from "@/services/challenges/challenge.service";
import { submitFlag } from "@/services/challenges/submission.service";

export async function handleListChallengesAdmin() {
  return listChallengesAdmin();
}

export async function handleGetPlayerBoard(userId: string) {
  return getPlayerBoard(userId);
}

export async function handleListChallengesPlayer() {
  return listChallengesPlayer();
}

export async function handleCreateChallenge(userId: string, body: Parameters<typeof addChallenge>[1]) {
  logger.info({ title: body.title }, "Creating challenge");
  const challenge = await addChallenge(userId, body);
  logger.info({ challengeId: challenge.id }, "Challenge created");
  return challenge;
}

export async function handleUpdateChallenge(
  challengeId: string,
  userId: string,
  body: Parameters<typeof editChallenge>[2],
) {
  return editChallenge(challengeId, userId, body);
}

export async function handleDeleteChallenge(challengeId: string) {
  logger.info({ challengeId }, "Deleting challenge");
  return removeChallenge(challengeId);
}

export async function handleSubmitFlag(
  userId: string,
  challengeId: string,
  flag: string,
) {
  logger.info({ userId, challengeId }, "Flag submission");
  const result = await submitFlag(userId, challengeId, flag);
  logger.info({ challengeId, verdict: result.verdict }, "Submission verdict");
  return result;
}
