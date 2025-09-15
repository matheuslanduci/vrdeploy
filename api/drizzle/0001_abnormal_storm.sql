CREATE TABLE "agente" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_pdv" bigint,
	"endereco_mac" char(17) NOT NULL,
	"sistema_operacional" varchar NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"situacao" varchar NOT NULL,
	"chave_secreta" char(48) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
