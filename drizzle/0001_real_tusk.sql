CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"text" text NOT NULL,
	"tint" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "guests" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "guests" ADD COLUMN "status" text DEFAULT 'going' NOT NULL;