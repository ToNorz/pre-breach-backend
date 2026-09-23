import { t } from "elysia";

export const createChallengeBody = t.Object({
  title: t.String({ minLength: 1 }),
  description: t.String({ minLength: 1 }),
  difficulty: t.Union([t.Literal("easy"), t.Literal("medium"), t.Literal("hard"), t.Literal("expert")]),
  points: t.Number({ minimum: 1 }),
  flag: t.String({ minLength: 1 }),
});

export const updateChallengeBody = t.Object({
  title: t.Optional(t.String({ minLength: 1 })),
  description: t.Optional(t.String()),
  difficulty: t.Optional(t.Union([t.Literal("easy"), t.Literal("medium"), t.Literal("hard"), t.Literal("expert")])),
  points: t.Optional(t.Number({ minimum: 1 })),
  flag: t.Optional(t.String({ minLength: 1 })),
});

export const submitFlagBody = t.Object({
  flag: t.String({ minLength: 1 }),
});
