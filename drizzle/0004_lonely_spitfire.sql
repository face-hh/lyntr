ALTER TABLE "messages" ADD COLUMN "referenced_lynt_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_referenced_lynt_id_lynts_id_fk" FOREIGN KEY ("referenced_lynt_id") REFERENCES "public"."lynts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
