CREATE TABLE "loja" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_rede" bigint NOT NULL,
	"nome" varchar NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
