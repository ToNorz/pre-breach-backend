import Elysia from "elysia";
import { authGuard } from "@/middlewares/auth-guard";
import { handleGetLeaderboard } from "@/controllers/leaderboard/leaderboard.controller";

export const leaderboardRoutes = new Elysia()
  .use(authGuard)
  .get(
    "/scoreboard",
    () => handleGetLeaderboard(),
  );
