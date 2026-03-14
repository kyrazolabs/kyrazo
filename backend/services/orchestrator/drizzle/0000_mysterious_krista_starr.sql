CREATE TYPE "public"."server_status" AS ENUM('active', 'draining', 'down');--> statement-breakpoint
CREATE TYPE "public"."worker_status" AS ENUM('pending', 'starting', 'running', 'stopping', 'stopped', 'failed');--> statement-breakpoint
CREATE TABLE "clients" (
	"client_id" text PRIMARY KEY NOT NULL,
	"plan_max_workers" integer NOT NULL,
	"used_workers" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "servers" (
	"server_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cores" integer NOT NULL,
	"max_workers" integer NOT NULL,
	"active_workers" integer DEFAULT 0 NOT NULL,
	"status" "server_status" DEFAULT 'active' NOT NULL,
	"ipv4" text,
	"ipv6" text,
	"coolify_server_uuid" text,
	"coolify_project_uuid" text,
	"coolify_environment_uuid" text,
	"last_heartbeat" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workers" (
	"worker_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" text NOT NULL,
	"server_id" uuid NOT NULL,
	"status" "worker_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "workers" ADD CONSTRAINT "workers_client_id_clients_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("client_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workers" ADD CONSTRAINT "workers_server_id_servers_server_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("server_id") ON DELETE no action ON UPDATE no action;