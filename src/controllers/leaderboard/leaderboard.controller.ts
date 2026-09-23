import { getLeaderboard } from "@/services/leaderboard/leaderboard.service";

export async function handleGetLeaderboard() {
  return getLeaderboard();
}
