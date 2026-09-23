import { db, type Executor } from "@/db/client";
import { isUniqueViolation } from "@/errors/db-errors";
import { ConflictError, NotFoundError, ValidationError } from "@/errors/error-types";
import {
  addTeamMember,
  createTeam,
  findTeamByName,
  findTeamByJoinCode,
  findTeamById,
  findUserTeamMembership,
  getTeamMemberCount,
  getTeamMembers,
  lockTeamById,
} from "@/repositories/team.repository";

const MAX_TEAM_SIZE = 4;

const JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const JOIN_CODE_LENGTH = 6;
const JOIN_CODE_ATTEMPTS = 5;

function generateJoinCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(JOIN_CODE_LENGTH));
  let code = "";
  for (const byte of bytes) code += JOIN_CODE_ALPHABET[byte % JOIN_CODE_ALPHABET.length];
  return code;
}

export async function createTeamForUser(userId: string, name: string) {
  const trimmedName = name.trim();
  if (!trimmedName) throw new ValidationError("Team name cannot be empty");

  const existing = await findUserTeamMembership(userId);
  if (existing) throw new ConflictError("You are already in a team");

  const nameConflict = await findTeamByName(trimmedName);
  if (nameConflict) throw new ConflictError("A team with that name already exists");

  try {
    const team = await db.transaction(async (tx) => {
      let created: Awaited<ReturnType<typeof createTeam>> = null;
      for (let attempt = 0; attempt < JOIN_CODE_ATTEMPTS && !created; attempt += 1) {
        created = await createTeam(
          { name: trimmedName, joinCode: generateJoinCode(), createdByUser: userId },
          tx,
        );
      }
      if (!created) throw new ConflictError("Could not allocate a join code — please try again");

      await addTeamMember({ teamId: created.id, userId, role: "captain" }, tx);

      return created;
    });

    const members = await getTeamMembers(team.id);
    return { ...team, role: "captain" as const, myRole: "captain" as const, members };
  } catch (error) {
    if (isUniqueViolation(error)) throw new ConflictError("A team with that name already exists");
    throw error;
  }
}

export async function joinTeamByCode(
  userId: string,
  name: string,
  joinCode: string,
) {
  const existing = await findUserTeamMembership(userId);
  if (existing) throw new ConflictError("You are already in a team");

  const cleanName = name.trim();
  const cleanCode = joinCode.trim();

  try {
    const team = await db.transaction(async (tx) => {
      const found = await findTeamByJoinCode(cleanCode, tx);
      if (!found || found.name.trim().toLowerCase() !== cleanName.toLowerCase())
        throw new NotFoundError("Team not found or join code is incorrect");

      await lockTeamById(found.id, tx);

      const memberCount = await getTeamMemberCount(found.id, tx);
      if (memberCount >= MAX_TEAM_SIZE)
        throw new ValidationError(`Team is full (max ${MAX_TEAM_SIZE} members)`);

      await addTeamMember({ teamId: found.id, userId, role: "member" }, tx);
      return found;
    });

    const members = await getTeamMembers(team.id);
    return { ...team, role: "member" as const, myRole: "member" as const, members };
  } catch (error) {
    if (isUniqueViolation(error))
      throw new ConflictError("You are already in a team");
    throw error;
  }
}

export async function getMyTeam(userId: string) {
  const membership = await findUserTeamMembership(userId);
  if (!membership) throw new NotFoundError("You are not in a team");

  const team = await findTeamById(membership.teamId);
  if (!team) throw new NotFoundError("Team not found");

  const members = await getTeamMembers(team.id);

  return { ...team, myRole: membership.role, members };
}
