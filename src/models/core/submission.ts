import { bigserial, foreignKey, index, inet, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { submissionVerdict } from "@/models/core/custom-types";
import { coreChallenge } from "@/models/core/challenge";
import { coreTeam } from "@/models/core/team";
import { coreTeamMember } from "@/models/core/team-member";

export const coreSubmission = pgTable(
  "core_submission",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    teamId: uuid("team_id").notNull(),
    submittedBy: uuid("submitted_by"), // which teammate
    challengeId: uuid("challenge_id").notNull(),
    rawInput: text("raw_input").notNull(),
    verdict: submissionVerdict("verdict").notNull(),
    ipAddress: inet("ip_address"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("core_submission_team_challenge_idx").on(table.teamId, table.challengeId),
    index("core_submission_challenge_verdict_idx").on(table.challengeId, table.verdict),
    index("core_submission_rate_limit_idx").on(table.teamId, table.submittedAt),
    
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [coreTeam.id],
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.challengeId],
      foreignColumns: [coreChallenge.id],
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.submittedBy],
      foreignColumns: [coreTeamMember.userId],
    }).onDelete("restrict"),
  ],
);
