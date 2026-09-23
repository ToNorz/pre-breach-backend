import { getLiveLeaderboard } from "@/repositories/leaderboard.repository";

export async function getLeaderboard() {
  return { entries: await getLiveLeaderboard() };
}
