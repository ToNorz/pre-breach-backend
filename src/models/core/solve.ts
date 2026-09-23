import { bigint, check, foreignKey, index, integer, pgTable, primaryKey, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { timestamps } from "@/models/shared/timestamp_audit";
import { coreChallenge } from "@/models/core/challenge";
import { coreTeam } from "@/models/core/team";
import { coreSubmission } from "@/models/core/submission";
import { coreTeamMember } from "@/models/core/team-member";

export const coreSolve = pgTable(
  "core_solve",
  {
    teamId: uuid("team_id").notNull(),
    challengeId: uuid("challenge_id").notNull(),
    solvedBy: uuid("solved_by"), // which teammate
    submissionId: bigint("submission_id", { mode: "bigint" }),
    pointsAwarded: integer("points_awarded").notNull(),
    solvedAt: timestamp("solved_at", { withTimezone: true }).notNull().defaultNow(),

    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.teamId, table.challengeId] }),
    check("core_solve_points_awarded_check", sql`${table.pointsAwarded} >= 0`),
    index("core_solve_challenge_solved_at_idx").on(table.challengeId, table.solvedAt),
    index("core_solve_team_idx").on(table.teamId),
    
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [coreTeam.id],
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.challengeId],
      foreignColumns: [coreChallenge.id],
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.submissionId],
      foreignColumns: [coreSubmission.id],
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.solvedBy],
      foreignColumns: [coreTeamMember.userId],
    }).onDelete("restrict"),
    unique().on(table.submissionId),
  ],
);
