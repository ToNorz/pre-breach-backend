import Elysia, { t } from "elysia";
import { adminGuard, authGuard } from "@/middlewares/auth-guard";
import {
  handleCreateTeam,
  handleGetMyTeam,
  handleJoinTeam,
} from "@/controllers/teams/team.controller";
import {
  deleteTeam,
  findAllTeams,
  findRecentSubmissions,
  updateTeam,
} from "@/repositories/team.repository";
import { createTeamBody, joinTeamBody } from "@/schema/dto/team.dto";

const teamParams = t.Object({ teamId: t.String() });
const updateTeamBody = t.Object({ name: t.Optional(t.String()) });
const recentSubmissionsQuery = t.Object({ limit: t.Optional(t.String()) });

export const teamRoutes = new Elysia()
  .use(authGuard)
  .get("/teams/me", ({ user }) => handleGetMyTeam(user.id))
  .post(
    "/teams",
    ({ body, user }) => handleCreateTeam(user.id, body.name),
    { body: createTeamBody },
  )
  .post(
    "/teams/join",
    ({ body, user }) => handleJoinTeam(user.id, body.name, body.joinCode),
    { body: joinTeamBody },
  );

export const adminTeamRoutes = new Elysia()
  .use(adminGuard)
  .get(
    "/admin/teams",
    () => findAllTeams(),
  )
  .patch(
    "/admin/teams/:teamId",
    ({ params, body }) => updateTeam(params.teamId, body),
    { params: teamParams, body: updateTeamBody },
  )
  .delete(
    "/admin/teams/:teamId",
    ({ params }) => deleteTeam(params.teamId),
    { params: teamParams },
  )
  .get(
    "/admin/submissions",
    ({ query }) => findRecentSubmissions(query.limit ? Number(query.limit) : 50),
    { query: recentSubmissionsQuery },
  );
