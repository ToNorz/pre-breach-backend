import { Elysia } from "elysia";
import { authRoutes } from "@/routes/auth/auth.routes";
import { teamRoutes, adminTeamRoutes } from "@/routes/teams/team.routes";
import { leaderboardRoutes } from "@/routes/leaderboard/leaderboard.routes";
import { challengeRoutes, adminChallengeRoutes } from "@/routes/challenges/challenge.routes";

export const router = new Elysia()
  .use(authRoutes)
  .use(teamRoutes)
  .use(adminTeamRoutes)
  .use(leaderboardRoutes)
  .use(challengeRoutes)
  .use(adminChallengeRoutes);
