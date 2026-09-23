import { sql } from "drizzle-orm";
import { bigint, boolean, pgView, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const coreChallengeSolveCount = pgView("core_challenge_solve_count", {
  challengeId: uuid("challenge_id"),
  solves: bigint("solves", { mode: "number" }),
}).as(sql`
  SELECT
      c.id AS challenge_id,
      count(s.team_id) AS solves
  FROM core_challenge c
  LEFT JOIN core_solve s
      ON s.challenge_id = c.id
  GROUP BY c.id
`);

export const coreLeaderboard = pgView("core_leaderboard", {
  teamId: uuid("team_id"),
  displayName: text("display_name"),
  isSolo: boolean("is_solo"),
  score: bigint("score", { mode: "number" }),
  solveCount: bigint("solve_count", { mode: "number" }),
  lastSolveAt: timestamp("last_solve_at", { withTimezone: true }),
  rank: bigint("rank", { mode: "number" }),
}).as(sql`
  SELECT
      t.id AS team_id,
      t.name AS display_name,
      t.is_solo,
      CAST(coalesce(sv.total, 0) AS BIGINT) AS score,
      coalesce(sv.solve_count, 0) AS solve_count,
      sv.last_solve_at,
      rank() OVER (
          ORDER BY CAST(coalesce(sv.total, 0) AS BIGINT) DESC,
                   sv.last_solve_at ASC NULLS LAST
      ) AS rank
  FROM core_team t
  LEFT JOIN (
      SELECT s.team_id,
             sum(s.points_awarded) AS total,
             count(*) AS solve_count,
             max(s.solved_at) AS last_solve_at
      FROM core_solve s
      GROUP BY s.team_id
  ) sv ON sv.team_id = t.id
`);
