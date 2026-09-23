import { pgEnum } from "drizzle-orm/pg-core";

export const challengeDifficulty = pgEnum("challenge_difficulty", [
  "easy",
  "medium",
  "hard",
  "expert",
]);
export type ChallengeDifficulty = (typeof challengeDifficulty.enumValues)[number];

export const submissionVerdict = pgEnum("submission_verdict", [
  "correct",
  "incorrect",
  "duplicate",
  "rate_limited",
]);
export type SubmissionVerdict = (typeof submissionVerdict.enumValues)[number];

export const teamRole = pgEnum("team_role", ["captain", "member"]);
export type TeamRole = (typeof teamRole.enumValues)[number];
