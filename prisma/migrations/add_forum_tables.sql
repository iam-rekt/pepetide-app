-- CreateTable for Forum Feature (SYS - Share Your Stack)
-- Run this migration on your production database

CREATE TABLE IF NOT EXISTS "forum_threads" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author_username" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stack_peptides" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "reply_count" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_threads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "forum_posts" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "author_username" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "parent_post_id" TEXT,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_posts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "forum_votes" (
    "id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "user_identifier" TEXT NOT NULL,
    "vote_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "thread_id" TEXT,
    "post_id" TEXT,

    CONSTRAINT "forum_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "forum_threads_created_at_idx" ON "forum_threads"("created_at");
CREATE INDEX IF NOT EXISTS "forum_threads_tags_idx" ON "forum_threads"("tags");
CREATE INDEX IF NOT EXISTS "forum_threads_is_pinned_idx" ON "forum_threads"("is_pinned");

CREATE INDEX IF NOT EXISTS "forum_posts_thread_id_idx" ON "forum_posts"("thread_id");
CREATE INDEX IF NOT EXISTS "forum_posts_parent_post_id_idx" ON "forum_posts"("parent_post_id");
CREATE INDEX IF NOT EXISTS "forum_posts_created_at_idx" ON "forum_posts"("created_at");

CREATE INDEX IF NOT EXISTS "forum_votes_target_id_target_type_idx" ON "forum_votes"("target_id", "target_type");
CREATE UNIQUE INDEX IF NOT EXISTS "forum_votes_target_id_user_identifier_key" ON "forum_votes"("target_id", "user_identifier");

-- AddForeignKey
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "forum_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_parent_post_id_fkey" FOREIGN KEY ("parent_post_id") REFERENCES "forum_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "forum_votes" ADD CONSTRAINT "forum_votes_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "forum_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "forum_votes" ADD CONSTRAINT "forum_votes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "forum_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
