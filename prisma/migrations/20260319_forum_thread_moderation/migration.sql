ALTER TABLE "forum_threads"
ADD COLUMN IF NOT EXISTS "is_hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "is_locked" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "forum_threads_is_hidden_idx" ON "forum_threads"("is_hidden");
CREATE INDEX IF NOT EXISTS "forum_threads_is_locked_idx" ON "forum_threads"("is_locked");
