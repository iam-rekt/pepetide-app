ALTER TABLE "forum_threads"
ADD COLUMN IF NOT EXISTS "author_wallet_hash" TEXT,
ADD COLUMN IF NOT EXISTS "author_wallet_handle" TEXT,
ADD COLUMN IF NOT EXISTS "author_holder_tier" TEXT,
ADD COLUMN IF NOT EXISTS "author_token_balance" DOUBLE PRECISION;

ALTER TABLE "forum_posts"
ADD COLUMN IF NOT EXISTS "author_wallet_hash" TEXT,
ADD COLUMN IF NOT EXISTS "author_wallet_handle" TEXT,
ADD COLUMN IF NOT EXISTS "author_holder_tier" TEXT,
ADD COLUMN IF NOT EXISTS "author_token_balance" DOUBLE PRECISION;

ALTER TABLE "forum_votes"
ADD COLUMN IF NOT EXISTS "vote_weight" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "voter_wallet_hash" TEXT;

CREATE INDEX IF NOT EXISTS "forum_threads_author_wallet_hash_idx" ON "forum_threads"("author_wallet_hash");
CREATE INDEX IF NOT EXISTS "forum_posts_author_wallet_hash_idx" ON "forum_posts"("author_wallet_hash");
CREATE INDEX IF NOT EXISTS "forum_votes_voter_wallet_hash_idx" ON "forum_votes"("voter_wallet_hash");
