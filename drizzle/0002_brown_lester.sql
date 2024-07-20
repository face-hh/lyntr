ALTER TABLE "lynts" ADD COLUMN "has_image" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "profile_picture";