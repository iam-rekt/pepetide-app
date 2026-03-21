'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bookmark, MessageSquare, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ForumThread, ViewMode } from '@/types';
import { loadBookmarkedThreadIds, loadLastViewedThread, setPendingThreadOpen } from '@/lib/community-storage';

interface DashboardThreadsPreviewProps {
  onNavigate: (view: ViewMode) => void;
}

export default function DashboardThreadsPreview({ onNavigate }: DashboardThreadsPreviewProps) {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [lastViewedThreadId, setLastViewedThreadId] = useState<string | null>(null);
  const [bookmarkedThreadIds, setBookmarkedThreadIds] = useState<string[]>([]);

  useEffect(() => {
    const lastViewedThread = loadLastViewedThread();
    setLastViewedThreadId(lastViewedThread?.id || null);
    setBookmarkedThreadIds(loadBookmarkedThreadIds());
    void loadThreads();
  }, []);

  const featuredThreads = useMemo(() => {
    return [...threads]
      .sort((a, b) => {
        const aScore =
          a.upvotes - a.downvotes + a.replyCount * 2 - (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        const bScore =
          b.upvotes - b.downvotes + b.replyCount * 2 - (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24);

        return bScore - aScore;
      })
      .slice(0, 3);
  }, [threads]);

  const continueThread = useMemo(() => {
    return threads.find(thread => thread.id === lastViewedThreadId) || null;
  }, [threads, lastViewedThreadId]);

  const savedThreads = useMemo(() => {
    return bookmarkedThreadIds
      .map(threadId => threads.find(thread => thread.id === threadId))
      .filter((thread): thread is ForumThread => Boolean(thread))
      .slice(0, 3);
  }, [bookmarkedThreadIds, threads]);

  async function loadThreads() {
    try {
      setLoading(true);
      const response = await fetch('/api/forum/threads');

      if (!response.ok) {
        throw new Error('Failed to load threads');
      }

      const data = await response.json();
      const nextThreads = Array.isArray(data) ? data : data.threads || [];

      setConfigured(Array.isArray(data) ? true : data.configured !== false);
      setThreads(nextThreads);
    } catch (error) {
      console.error('Failed to load dashboard threads:', error);
      setConfigured(false);
    } finally {
      setLoading(false);
    }
  }

  function openThread(threadId: string) {
    setPendingThreadOpen(threadId);
    onNavigate('sys');
  }

  function formatTimeAgo(date: Date) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;

    return `${Math.floor(seconds / 2592000)}mo ago`;
  }

  if (!configured) {
    return null;
  }

  return (
    <Card className="bg-white/5 dark:bg-slate-900/5 backdrop-blur-sm border-white/20 dark:border-slate-700/30">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Threads
            </CardTitle>
            <CardDescription>
              Anonymous discussion, stack logs, and useful questions from the community.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => onNavigate('sys')}>
            Open Threads
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {continueThread && (
          <button
            onClick={() => openThread(continueThread.id)}
            className="w-full rounded-xl border border-cyan-200/60 bg-cyan-50/70 p-4 text-left transition-colors hover:bg-cyan-100/70 dark:border-cyan-900/60 dark:bg-cyan-950/20 dark:hover:bg-cyan-950/30"
          >
            <div className="text-xs font-medium text-cyan-700 dark:text-cyan-300">
              Continue Reading
            </div>
            <div className="mt-1 font-medium text-slate-800 dark:text-slate-100">
              {continueThread.title}
            </div>
            <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              {continueThread.authorUsername} • {continueThread.replyCount} replies
            </div>
          </button>
        )}

        {savedThreads.length > 0 && (
          <div className="rounded-xl border border-slate-200/80 bg-white/60 p-4 dark:border-slate-700 dark:bg-slate-900/50">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
              <Bookmark className="h-4 w-4" />
              Saved Threads
            </div>
            <div className="space-y-2">
              {savedThreads.map((thread) => (
                <button
                  key={`saved-${thread.id}`}
                  onClick={() => openThread(thread.id)}
                  className="w-full rounded-lg border border-slate-200 p-3 text-left transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
                >
                  <div className="line-clamp-1 font-medium text-slate-900 dark:text-white">
                    {thread.title}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {thread.authorUsername} • {thread.replyCount} replies
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-sm text-slate-500">Loading threads...</div>
        ) : featuredThreads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
            No threads yet. Start one when you want to share a stack, ask a question, or post an update.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {featuredThreads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => openThread(thread.id)}
                className="group rounded-xl border border-slate-200 bg-white/60 p-4 text-left transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:bg-slate-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <TrendingUp className="h-3 w-3" />
                    Trending
                  </span>
                  <span className="text-xs text-slate-400">{formatTimeAgo(thread.createdAt)}</span>
                </div>
                <h3 className="mt-3 line-clamp-2 font-semibold text-slate-900 dark:text-white">
                  {thread.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                  {thread.content}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>{thread.authorUsername}</span>
                  <span>{thread.replyCount} replies</span>
                </div>
                <div className="mt-3 flex items-center text-xs font-medium text-cyan-600 dark:text-cyan-400">
                  Read Thread
                  <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
