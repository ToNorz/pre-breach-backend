import { check, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { authorship } from "@/models/shared/authorship";
import { timestamps } from "@/models/shared/timestamp_audit";
import { challengeDifficulty } from "@/models/core/custom-types";

export const coreChallenge = pgTable(
  "core_challenge",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull().default("Misc"),
    difficulty: challengeDifficulty("difficulty").notNull(),
    points: integer("points").notNull(),
    flagHash: text("flag_hash").notNull(),
    resourceLink: text("resource_link"),

    ...timestamps,
    ...authorship,
  },
  (table) => [
    check("core_challenge_flag_check", sql`${table.flagHash} <> ''`),
    check("core_challenge_points_check", sql`${table.points} > 0`),
  ],
);
