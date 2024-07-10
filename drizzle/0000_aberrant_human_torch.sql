CREATE TABLE IF NOT EXISTS "followers" (
	"user_id" uuid NOT NULL,
	"follower_id" uuid NOT NULL,
	CONSTRAINT "followers_pkey" PRIMARY KEY("user_id","follower_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "history" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"lynt_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "likes" (
	"lynt_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "likes_pkey" PRIMARY KEY("lynt_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lynts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"content" text NOT NULL,
	"views" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"has_link" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"reposted" boolean DEFAULT false,
	"parent" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" varchar(60) NOT NULL,
	"handle" varchar(32) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"iq" integer NOT NULL,
	"profile_picture" text DEFAULT 'default',
	"verified" boolean DEFAULT false,
	CONSTRAINT "users_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "followers" ADD CONSTRAINT "followers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "followers" ADD CONSTRAINT "followers_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "history" ADD CONSTRAINT "history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "history" ADD CONSTRAINT "history_lynt_id_lynts_id_fk" FOREIGN KEY ("lynt_id") REFERENCES "public"."lynts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "likes" ADD CONSTRAINT "likes_lynt_id_lynts_id_fk" FOREIGN KEY ("lynt_id") REFERENCES "public"."lynts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lynts" ADD CONSTRAINT "lynts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lynts" ADD CONSTRAINT "lynts_parent_lynts_id_fk" FOREIGN KEY ("parent") REFERENCES "public"."lynts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
