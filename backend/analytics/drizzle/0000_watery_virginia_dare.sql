CREATE TABLE "analytics_dispatch_day" (
	"project_id" varchar(50) NOT NULL,
	"target_id" varchar(50),
	"event_type" varchar(100),
	"response_code" integer,
	"bucket_day" date NOT NULL,
	"total_deliveries" bigint NOT NULL,
	"successful_deliveries" bigint NOT NULL,
	"failed_deliveries" bigint NOT NULL,
	"pending_deliveries" bigint NOT NULL,
	"avg_delivery_time_ms" integer,
	CONSTRAINT "analytics_dispatch_day_project_id_bucket_day_target_id_event_type_response_code_pk" PRIMARY KEY("project_id","bucket_day","target_id","event_type","response_code")
);
--> statement-breakpoint
CREATE TABLE "analytics_ingest_day" (
	"project_id" varchar(50) NOT NULL,
	"source_id" varchar(50),
	"processing_status" smallint,
	"bucket_day" date NOT NULL,
	"total_events" bigint NOT NULL,
	"successful_events" bigint NOT NULL,
	"failed_events" bigint NOT NULL,
	"pending_events" bigint NOT NULL,
	CONSTRAINT "analytics_ingest_day_project_id_bucket_day_source_id_processing_status_pk" PRIMARY KEY("project_id","bucket_day","source_id","processing_status")
);
--> statement-breakpoint
CREATE INDEX "dispatch_day_project_idx" ON "analytics_dispatch_day" USING btree ("project_id","bucket_day");--> statement-breakpoint
CREATE INDEX "ingest_day_project_idx" ON "analytics_ingest_day" USING btree ("project_id","bucket_day");