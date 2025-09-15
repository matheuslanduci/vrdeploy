CREATE TABLE "versao" (
	"id" serial PRIMARY KEY NOT NULL,
	"semver" varchar NOT NULL,
	"descricao" varchar NOT NULL,
	"storage_key" varchar NOT NULL,
	"manifest" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
