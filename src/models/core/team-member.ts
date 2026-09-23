import { foreignKey, index, pgTable, primaryKey, uniqueIndex, unique, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { timestamps } from "@/models/shared/timestamp_audit";
import { teamRole } from "@/models/core/custom-types";
import { coreTeam } from "@/models/core/team";
import { coreUser } from "@/models/core/user";

export const coreTeamMember = pgTable(
  "core_team_member",
  {
    teamId: uuid("team_id").notNull(),
    userId: uuid("user_id").notNull(),
    role: teamRole("role").notNull().default("member"),

    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.teamId, table.userId] }),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [coreTeam.id],
    }).onDelete("cascade"),
    foreignKey({ columns: [table.userId], foreignColumns: [coreUser.id] }).onDelete("cascade"),
    unique("core_team_member_user_uq").on(table.userId),
    uniqueIndex("core_team_one_captain")
      .on(table.teamId)
      .where(sql`${table.role} = 'captain'`),
    index("core_team_member_user_idx").on(table.userId),
  ],
);
