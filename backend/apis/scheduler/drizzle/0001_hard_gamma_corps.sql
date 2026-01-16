CREATE TABLE "clients" (
	"client_id" text PRIMARY KEY NOT NULL,
	"plan_max_workers" integer NOT NULL,
	"used_workers" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "server_commands" ADD COLUMN "signature" text NOT NULL;--> statement-breakpoint
ALTER TABLE "server_commands" ADD COLUMN "nonce" text NOT NULL;--> statement-breakpoint
ALTER TABLE "server_commands" ADD COLUMN "timestamp" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "workers" ADD COLUMN "client_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "workers" ADD CONSTRAINT "workers_client_id_clients_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("client_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workers" ADD CONSTRAINT "workers_server_id_servers_server_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("server_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servers" DROP COLUMN "ip";--> statement-breakpoint
ALTER TABLE "workers" DROP COLUMN "workspace_id";