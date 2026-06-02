CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "contact_messages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(80) NOT NULL,
  "email" VARCHAR(120),
  "phone" VARCHAR(40),
  "subject" VARCHAR(120),
  "message" VARCHAR(1600) NOT NULL,
  "preferred_language" VARCHAR(40),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quote_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(80) NOT NULL,
  "email" VARCHAR(120),
  "phone" VARCHAR(40),
  "company" VARCHAR(120),
  "location" VARCHAR(120),
  "business_type" VARCHAR(80),
  "service" VARCHAR(120) NOT NULL,
  "budget" VARCHAR(80),
  "timeline" VARCHAR(80),
  "details" VARCHAR(1800) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "quote_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admins" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" VARCHAR(120) NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "name" VARCHAR(80),
  "role" VARCHAR(40) NOT NULL DEFAULT 'ADMIN',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "last_login_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "admin_id" UUID,
  "event" VARCHAR(120) NOT NULL,
  "ip_address" VARCHAR(80),
  "user_agent" VARCHAR(255),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");
CREATE INDEX "contact_messages_created_at_idx" ON "contact_messages"("created_at");
CREATE INDEX "quote_requests_created_at_idx" ON "quote_requests"("created_at");
CREATE INDEX "activity_logs_admin_id_idx" ON "activity_logs"("admin_id");
CREATE INDEX "activity_logs_event_idx" ON "activity_logs"("event");
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

ALTER TABLE "activity_logs"
  ADD CONSTRAINT "activity_logs_admin_id_fkey"
  FOREIGN KEY ("admin_id") REFERENCES "admins"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
