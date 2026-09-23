import Elysia, { t } from "elysia";
import { authGuard, adminGuard } from "@/middlewares/auth-guard";
import {
  handleCreateChallenge,
  handleDeleteChallenge,
  handleListChallengesAdmin,
  handleListChallengesPlayer,
  handleSubmitFlag,
  handleUpdateChallenge,
} from "@/controllers/challenges/challenge.controller";
import { createChallengeBody, submitFlagBody, updateChallengeBody } from "@/schema/dto/challenge.dto";

const challengeParams = t.Object({ challengeId: t.String() });

export const challengeRoutes = new Elysia()
  .use(authGuard)
  .get(
    "/challenges",
    () => handleListChallengesPlayer(),
  )
  .post(
    "/challenges/:challengeId/submit",
    ({ params, body, user }) => handleSubmitFlag(user.id, params.challengeId, body.flag),
    { params: challengeParams, body: submitFlagBody },
  );

export const adminChallengeRoutes = new Elysia()
  .use(adminGuard)
  .get(
    "/admin/challenges",
    () => handleListChallengesAdmin(),
  )
  .post(
    "/admin/challenges",
    ({ body, user }) => handleCreateChallenge(user.id, body),
    { body: createChallengeBody },
  )
  .patch(
    "/admin/challenges/:challengeId",
    ({ params, body, user }) => handleUpdateChallenge(params.challengeId, user.id, body),
    { params: challengeParams, body: updateChallengeBody },
  )
  .delete(
    "/admin/challenges/:challengeId",
    ({ params }) => handleDeleteChallenge(params.challengeId),
    { params: challengeParams },
  );
