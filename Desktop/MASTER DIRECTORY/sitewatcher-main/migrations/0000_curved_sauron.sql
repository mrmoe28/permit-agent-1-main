CREATE TABLE "analyses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" varchar NOT NULL,
	"seo_score" integer,
	"page_speed" integer,
	"issues" integer DEFAULT 0,
	"status" text DEFAULT 'pending' NOT NULL,
	"progress" integer DEFAULT 0,
	"status_message" text,
	"raw_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "keywords" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" varchar NOT NULL,
	"term" text NOT NULL,
	"rank" integer,
	"volume" integer,
	"change" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"priority" text NOT NULL,
	"type" text NOT NULL,
	"implementation_guide" text,
	"code_example" text,
	"effort_score" integer DEFAULT 5,
	"impact_score" integer DEFAULT 5,
	"estimated_time" text,
	"status" text DEFAULT 'pending',
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"domain" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sites_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"username" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_analysis_id_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."analyses"("id") ON DELETE cascade ON UPDATE no action;