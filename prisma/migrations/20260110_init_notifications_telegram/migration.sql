-- CreateTable
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "telegram_chat_id" TEXT,
    "telegram_username" TEXT,
    "push_subscription" JSONB,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "synced_protocols" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "local_id" TEXT NOT NULL,
    "peptide_name" TEXT NOT NULL,
    "other_peptides" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "frequency" TEXT NOT NULL,
    "dose_amount" DOUBLE PRECISION NOT NULL,
    "dose_unit" TEXT NOT NULL,
    "time_of_day" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "synced_protocols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "synced_logs" (
    "id" TEXT NOT NULL,
    "synced_protocol_id" TEXT NOT NULL,
    "local_id" TEXT NOT NULL,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "taken_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "synced_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_telegram_chat_id_key" ON "users"("telegram_chat_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "synced_protocols_user_id_local_id_key" ON "synced_protocols"("user_id", "local_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "synced_logs_synced_protocol_id_local_id_key" ON "synced_logs"("synced_protocol_id", "local_id");

-- AddForeignKey
ALTER TABLE "synced_protocols" ADD CONSTRAINT IF NOT EXISTS "synced_protocols_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "synced_logs" ADD CONSTRAINT IF NOT EXISTS "synced_logs_synced_protocol_id_fkey" FOREIGN KEY ("synced_protocol_id") REFERENCES "synced_protocols"("id") ON DELETE CASCADE ON UPDATE CASCADE;
