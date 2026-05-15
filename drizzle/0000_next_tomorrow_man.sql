CREATE TABLE "guests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"party_size" integer DEFAULT 1 NOT NULL,
	"message" text,
	"dietary_restrictions" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
