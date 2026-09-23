import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "@/models/shared/timestamp_audit";
import { coreUser } from "@/models/core/user";

export const coreTeam = pgTable(
  "core_team",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    isSolo: boolean("is_solo").notNull().default(false),
    joinCode: text("join_code").unique(), // NULL for solo teams
    createdByUser: uuid("created_by_user").references(() => coreUser.id, { onDelete: "set null" }),

    registeredAt: timestamp("registered_at", { withTimezone: true }).notNull().defaultNow(),

    ...timestamps,
  }
);
