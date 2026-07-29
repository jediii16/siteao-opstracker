-- CreateTable
CREATE TABLE "system_settings" (
    "id" VARCHAR(32) NOT NULL DEFAULT 'siteao',
    "siteao_governor_name" VARCHAR(150) NOT NULL DEFAULT 'HON. JHERMIE P. LICAROS',
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "system_settings_updated_by_idx" ON "system_settings"("updated_by");

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed the singleton organization settings row
INSERT INTO "system_settings" ("id", "siteao_governor_name")
VALUES ('siteao', 'HON. JHERMIE P. LICAROS');
