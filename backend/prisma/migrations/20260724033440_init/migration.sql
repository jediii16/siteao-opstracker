-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'COMMITTEE');

-- CreateEnum
CREATE TYPE "ItemCondition" AS ENUM ('GOOD', 'FAIR', 'DAMAGED', 'UNDER_REPAIR', 'LOST');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'BORROWED', 'RETURNED');

-- CreateEnum
CREATE TYPE "ReturnCondition" AS ENUM ('GOOD', 'FAIR', 'DAMAGED', 'LOST');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('ITEM_ADDED', 'QUANTITY_INCREASED', 'QUANTITY_DECREASED', 'BORROWED', 'RETURNED', 'DAMAGED', 'LOST', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "committees" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "committees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "committee_id" UUID,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "password_changed_at" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" UUID NOT NULL,
    "item_code" VARCHAR(50) NOT NULL,
    "category_id" UUID NOT NULL,
    "item_name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "total_quantity" INTEGER NOT NULL,
    "available_quantity" INTEGER NOT NULL,
    "condition" "ItemCondition" NOT NULL,
    "storage_location" VARCHAR(150) NOT NULL,
    "google_drive_folder_link" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID NOT NULL,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "borrowing_requests" (
    "id" UUID NOT NULL,
    "request_code" VARCHAR(50) NOT NULL,
    "committee_id" UUID NOT NULL,
    "submitted_by" UUID NOT NULL,
    "requester_name" VARCHAR(150) NOT NULL,
    "requester_position" VARCHAR(100) NOT NULL,
    "purpose" TEXT NOT NULL,
    "borrow_date" DATE NOT NULL,
    "expected_return_date" DATE NOT NULL,
    "additional_notes" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "cancellation_reason" TEXT,
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "rejected_by" UUID,
    "rejected_at" TIMESTAMP(3),
    "cancelled_by" UUID,
    "cancelled_at" TIMESTAMP(3),
    "borrowed_at" TIMESTAMP(3),
    "returned_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "borrowing_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "borrowing_request_items" (
    "id" UUID NOT NULL,
    "borrowing_request_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "quantity_requested" INTEGER NOT NULL,
    "quantity_approved" INTEGER,
    "quantity_released" INTEGER,
    "quantity_returned" INTEGER NOT NULL DEFAULT 0,
    "return_condition" "ReturnCondition",
    "return_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "borrowing_request_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "borrowing_request_id" UUID,
    "performed_by" UUID NOT NULL,
    "transaction_type" "TransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "quantity_before" INTEGER NOT NULL,
    "quantity_after" INTEGER NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "committee_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" UUID,
    "description" TEXT NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "committees_name_key" ON "committees"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_committee_id_key" ON "users"("committee_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_committee_id_idx" ON "users"("committee_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "categories_created_by_idx" ON "categories"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "items_item_code_key" ON "items"("item_code");

-- CreateIndex
CREATE INDEX "items_category_id_idx" ON "items"("category_id");

-- CreateIndex
CREATE INDEX "items_created_by_idx" ON "items"("created_by");

-- CreateIndex
CREATE INDEX "items_updated_by_idx" ON "items"("updated_by");

-- CreateIndex
CREATE INDEX "items_condition_idx" ON "items"("condition");

-- CreateIndex
CREATE INDEX "items_is_active_idx" ON "items"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "borrowing_requests_request_code_key" ON "borrowing_requests"("request_code");

-- CreateIndex
CREATE INDEX "borrowing_requests_committee_id_idx" ON "borrowing_requests"("committee_id");

-- CreateIndex
CREATE INDEX "borrowing_requests_submitted_by_idx" ON "borrowing_requests"("submitted_by");

-- CreateIndex
CREATE INDEX "borrowing_requests_status_idx" ON "borrowing_requests"("status");

-- CreateIndex
CREATE INDEX "borrowing_requests_borrow_date_idx" ON "borrowing_requests"("borrow_date");

-- CreateIndex
CREATE INDEX "borrowing_requests_expected_return_date_idx" ON "borrowing_requests"("expected_return_date");

-- CreateIndex
CREATE INDEX "borrowing_request_items_borrowing_request_id_idx" ON "borrowing_request_items"("borrowing_request_id");

-- CreateIndex
CREATE INDEX "borrowing_request_items_item_id_idx" ON "borrowing_request_items"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "borrowing_request_items_borrowing_request_id_item_id_key" ON "borrowing_request_items"("borrowing_request_id", "item_id");

-- CreateIndex
CREATE INDEX "inventory_transactions_item_id_idx" ON "inventory_transactions"("item_id");

-- CreateIndex
CREATE INDEX "inventory_transactions_borrowing_request_id_idx" ON "inventory_transactions"("borrowing_request_id");

-- CreateIndex
CREATE INDEX "inventory_transactions_performed_by_idx" ON "inventory_transactions"("performed_by");

-- CreateIndex
CREATE INDEX "inventory_transactions_transaction_type_idx" ON "inventory_transactions"("transaction_type");

-- CreateIndex
CREATE INDEX "inventory_transactions_created_at_idx" ON "inventory_transactions"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_committee_id_idx" ON "audit_logs"("committee_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_idx" ON "audit_logs"("entity_type");

-- CreateIndex
CREATE INDEX "audit_logs_entity_id_idx" ON "audit_logs"("entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_committee_id_fkey" FOREIGN KEY ("committee_id") REFERENCES "committees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrowing_requests" ADD CONSTRAINT "borrowing_requests_committee_id_fkey" FOREIGN KEY ("committee_id") REFERENCES "committees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrowing_requests" ADD CONSTRAINT "borrowing_requests_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrowing_requests" ADD CONSTRAINT "borrowing_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrowing_requests" ADD CONSTRAINT "borrowing_requests_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrowing_requests" ADD CONSTRAINT "borrowing_requests_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrowing_request_items" ADD CONSTRAINT "borrowing_request_items_borrowing_request_id_fkey" FOREIGN KEY ("borrowing_request_id") REFERENCES "borrowing_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrowing_request_items" ADD CONSTRAINT "borrowing_request_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_borrowing_request_id_fkey" FOREIGN KEY ("borrowing_request_id") REFERENCES "borrowing_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_committee_id_fkey" FOREIGN KEY ("committee_id") REFERENCES "committees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
