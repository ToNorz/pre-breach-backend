CREATE TYPE "public"."challenge_difficulty" AS ENUM('easy', 'medium', 'hard', 'expert');--> statement-breakpoint
CREATE TYPE "public"."submission_verdict" AS ENUM('correct', 'incorrect', 'duplicate', 'rate_limited');--> statement-breakpoint
CREATE TYPE "public"."team_role" AS ENUM('captain', 'member');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "core_challenge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"difficulty" "challenge_difficulty" NOT NULL,
	"points" integer NOT NULL,
	"flag_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "core_challenge_flag_check" CHECK ("core_challenge"."flag_hash" <> ''),
	CONSTRAINT "core_challenge_points_check" CHECK ("core_challenge"."points" > 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "core_solve" (
	"team_id" uuid NOT NULL,
	"challenge_id" uuid NOT NULL,
	"solved_by" uuid,
	"submission_id" bigint,
	"points_awarded" integer NOT NULL,
	"solved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "core_solve_team_id_challenge_id_pk" PRIMARY KEY("team_id","challenge_id"),
	CONSTRAINT "core_solve_submission_id_unique" UNIQUE("submission_id"),
	CONSTRAINT "core_solve_points_awarded_check" CHECK ("core_solve"."points_awarded" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "core_submission" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"team_id" uuid NOT NULL,
	"submitted_by" uuid,
	"challenge_id" uuid NOT NULL,
	"raw_input" text NOT NULL,
	"verdict" "submission_verdict" NOT NULL,
	"ip_address" "inet",
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "core_team_member" (
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "team_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "core_team_member_team_id_user_id_pk" PRIMARY KEY("team_id","user_id"),
	CONSTRAINT "core_team_member_user_uq" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "core_team" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"is_solo" boolean DEFAULT false NOT NULL,
	"join_code" text,
	"created_by_user" uuid,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "core_team_name_unique" UNIQUE("name"),
	CONSTRAINT "core_team_join_code_unique" UNIQUE("join_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "core_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text,
	"password_hash" text NOT NULL,
	"display_name" text,
	"is_admin" boolean DEFAULT false NOT NULL,
	"is_banned" boolean DEFAULT false NOT NULL,
	"banned_at" timestamp with time zone,
	"banned_reason" text,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "core_challenge" ADD CONSTRAINT "core_challenge_created_by_core_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."core_user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "core_challenge" ADD CONSTRAINT "core_challenge_updated_by_core_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."core_user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "core_solve" ADD CONSTRAINT "core_solve_team_id_core_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."core_team"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "core_solve" ADD CONSTRAINT "core_solve_challenge_id_core_challenge_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."core_challenge"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "core_solve" ADD CONSTRAINT "core_solve_submission_id_core_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."core_submission"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "core_solve" ADD CONSTRAINT "core_solve_solved_by_core_team_member_user_id_fk" FOREIGN KEY ("solved_by") REFERENCES "public"."core_team_member"("user_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "core_submission" ADD CONSTRAINT "core_submission_team_id_core_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."core_team"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "core_submission" ADD CONSTRAINT "core_submission_challenge_id_core_challenge_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."core_challenge"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "core_submission" ADD CONSTRAINT "core_submission_submitted_by_core_team_member_user_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."core_team_member"("user_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "core_team_member" ADD CONSTRAINT "core_team_member_team_id_core_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."core_team"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "core_team_member" ADD CONSTRAINT "core_team_member_user_id_core_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."core_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "core_team" ADD CONSTRAINT "core_team_created_by_user_core_user_id_fk" FOREIGN KEY ("created_by_user") REFERENCES "public"."core_user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "core_solve_challenge_solved_at_idx" ON "core_solve" USING btree ("challenge_id","solved_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "core_solve_team_idx" ON "core_solve" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "core_submission_team_challenge_idx" ON "core_submission" USING btree ("team_id","challenge_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "core_submission_challenge_verdict_idx" ON "core_submission" USING btree ("challenge_id","verdict");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "core_submission_rate_limit_idx" ON "core_submission" USING btree ("team_id","submitted_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "core_team_one_captain" ON "core_team_member" USING btree ("team_id") WHERE "core_team_member"."role" = 'captain';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "core_team_member_user_idx" ON "core_team_member" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "core_user_username_uq" ON "core_user" USING btree (lower("username"));--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "core_user_email_uq" ON "core_user" USING btree (lower("email"));--> statement-breakpoint
CREATE VIEW "public"."core_challenge_solve_count" AS (
  SELECT
      c.id AS challenge_id,
      count(s.team_id) AS solves
  FROM core_challenge c
  LEFT JOIN core_solve s
      ON s.challenge_id = c.id
  GROUP BY c.id
);--> statement-breakpoint
CREATE VIEW "public"."core_leaderboard" AS (
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
);