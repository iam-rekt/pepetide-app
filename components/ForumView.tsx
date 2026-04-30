'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Search, TrendingUp, Clock, Tag, ArrowUp, ArrowDown, MessageSquare, Eye, Image as ImageIcon, Bookmark } from 'lucide-react';
import type { ForumThread } from '@/types';
import HolderBadge from '@/components/HolderBadge';
import CreateThreadDialog from './CreateThreadDialog';
import ThreadDetail from './ThreadDetail';
import { consumePendingThreadOpen, hasPreparedThreadDraft, loadBookmarkedThreadIds, toggleBookmarkedThread } from '@/lib/community-storage';
import { getAdminHeaders, validateStoredAdminKey } from '@/lib/admin-mode';

type SortMode = 'hot' | 'new' | 'top';

export default function ForumView() {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [filteredThreads, setFilteredThreads] = useState<ForumThread[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('hot');
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
  const [bookmarkedThreadIds, setBookmarkedThreadIds] = useState<string[]>([]);
  const [adminMode, setAdminMode] = useState(false);

  // Available tags for filtering
  const availableTags = ['cutting', 'bulking', 'anti-aging', 'recovery', 'cognitive', 'longevity', 'performance'];

  // Filter and sort threads
  useEffect(() => {
    let filtered = [...threads];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(thread =>
        thread.title.toLowerCase().includes(query) ||
        thread.content.toLowerCase().includes(query) ||
        thread.authorUsername.toLowerCase().includes(query) ||
        thread.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        thread.stackPeptides?.some(peptide =>
          peptide.peptideName.toLowerCase().includes(query) ||
          peptide.frequency.toLowerCase().includes(query) ||
          peptide.notes?.toLowerCase().includes(query)
        )
      );
    }

    // Apply tag filter
    if (selectedTag) {
      filtered = filtered.filter(thread => thread.tags?.includes(selectedTag));
    }

    if (showSavedOnly) {
      filtered = filtered.filter(thread => bookmarkedThreadIds.includes(thread.id));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortMode === 'hot') {
        // Hot: combination of upvotes and recency
        const aScore = (a.upvotes - a.downvotes) + (a.replyCount * 2) - (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        const bScore = (b.upvotes - b.downvotes) + (b.replyCount * 2) - (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return bScore - aScore;
      } else if (sortMode === 'new') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortMode === 'top') {
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      }
      return 0;
    });

    // Keep pinned threads at top
    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

    setFilteredThreads(filtered);
  }, [threads, searchQuery, selectedTag, sortMode, showSavedOnly, bookmarkedThreadIds]);

  const loadThreads = useCallback(async (useAdmin = adminMode) => {
    try {
      setLoading(true);
      const pendingThreadId = consumePendingThreadOpen();
      const response = await fetch('/api/forum/threads', {
        headers: useAdmin ? getAdminHeaders() : undefined
      });
      if (response.ok) {
        const data = await response.json();
        const nextThreads = Array.isArray(data) ? data : data.threads || [];
        setConfigured(Array.isArray(data) ? true : data.configured !== false);
        setThreads(nextThreads);

        if (pendingThreadId) {
          const matchedThread = nextThreads.find((thread: ForumThread) => thread.id === pendingThreadId);
          if (matchedThread) {
            setSelectedThread(matchedThread);
          }
        }
      } else {
        setConfigured(false);
      }
    } catch (error) {
      console.error('Failed to load threads:', error);
      setConfigured(false);
    } finally {
      setLoading(false);
    }
  }, [adminMode]);

  // Load threads from API
  useEffect(() => {
    const initializeThreads = async () => {
      setBookmarkedThreadIds(loadBookmarkedThreadIds());

      const isAdmin = await validateStoredAdminKey();
      setAdminMode(isAdmin);
      await loadThreads(isAdmin);

      if (hasPreparedThreadDraft()) {
        setShowCreateDialog(true);
      }
    };

    void initializeThreads();
  }, [loadThreads]);

  const handleThreadCreated = (newThread: ForumThread) => {
    setThreads(prev => [newThread, ...prev]);
    setShowCreateDialog(false);
  };

  const handleThreadClick = (thread: ForumThread) => {
    setSelectedThread(thread);
    // Increment view count
    fetch(`/api/forum/threads/${thread.id}/view`, { method: 'POST' }).catch(console.error);
  };

  const handleBackToList = () => {
    setSelectedThread(null);
    setBookmarkedThreadIds(loadBookmarkedThreadIds());
    void loadThreads(adminMode); // Reload to get updated counts
  };

  const handleToggleBookmark = (event: React.MouseEvent<HTMLButtonElement>, threadId: string) => {
    event.stopPropagation();
    setBookmarkedThreadIds(toggleBookmarkedThread(threadId));
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 2592000)}mo ago`;
  };

  const isProgressUpdateThread = (thread: ForumThread) => {
    return thread.title.toLowerCase().startsWith('progress update') || thread.content.includes('Completion:');
  };

  const getThreadLabel = (thread: ForumThread) => {
    if (isProgressUpdateThread(thread)) return 'Update';
    if (thread.stackPeptides && thread.stackPeptides.length > 0) return 'Stack';
    if (thread.title.includes('?') || thread.content.includes('?')) return 'Question';
    if (thread.imageUrls && thread.imageUrls.length > 0) return 'Update';
    return 'Discussion';
  };

  const needsAnswersThreads = [...threads]
    .filter(thread => !thread.isPinned && thread.replyCount === 0)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const recentUpdateThreads = [...threads]
    .filter(thread => !thread.isPinned && isProgressUpdateThread(thread))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  // If a thread is selected, show the detail view
  if (selectedThread) {
    return <ThreadDetail thread={selectedThread} onBack={handleBackToList} />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight bg-gradient-to-br from-emerald-400 via-green-500 to-lime-500 bg-clip-text text-transparent">
            Threads
          </h2>
          <p className="text-sm text-slate-800 dark:text-slate-200 mt-1 font-medium">
            Anonymous discussions, stack logs, and practical questions from the community.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          disabled={!configured}
          className="flex items-center gap-2 bg-gradient-to-br from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-white shadow-md shadow-emerald-500/30 ring-1 ring-white/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Thread
        </Button>
      </div>

      {!configured && (
        <Card className="p-8 text-center text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border-emerald-300/30">
          Threads are unavailable right now. Personal tracking still works locally on this device.
        </Card>
      )}

      {/* Search and Filters */}
      {configured && (
        <>
          {!showSavedOnly && (needsAnswersThreads.length > 0 || recentUpdateThreads.length > 0) && (
            <div className="grid gap-3 md:grid-cols-2">
              {needsAnswersThreads.length > 0 && (
                <Card className="p-4 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border-white/30 dark:border-slate-700/40 shadow-lg">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Needs Answers
                      </h3>
                      <p className="text-xs text-slate-700 dark:text-slate-400 mt-0.5">New threads still waiting on replies.</p>
                    </div>
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-mono font-semibold text-amber-700 dark:text-amber-300 border border-amber-400/40">
                      {needsAnswersThreads.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {needsAnswersThreads.map(thread => (
                      <button
                        key={`needs-${thread.id}`}
                        onClick={() => handleThreadClick(thread)}
                        className="w-full rounded-lg border border-emerald-200/40 dark:border-emerald-800/30 bg-white/40 dark:bg-slate-900/30 p-3 text-left transition-all hover:border-emerald-300/60 hover:bg-white/70 dark:hover:bg-slate-900/50"
                      >
                        <div className="line-clamp-1 font-medium text-slate-900 dark:text-white">{thread.title}</div>
                        <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-mono text-emerald-700 dark:text-emerald-400">{thread.authorUsername}</span>
                          <HolderBadge tier={thread.authorHolderTier} balance={thread.authorTokenBalance} compact /> · {formatTimeAgo(thread.createdAt)}
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>
              )}

              {recentUpdateThreads.length > 0 && (
                <Card className="p-4 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border-white/30 dark:border-slate-700/40 shadow-lg">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Recent Updates
                      </h3>
                      <p className="text-xs text-slate-700 dark:text-slate-400 mt-0.5">Tracker-driven progress logs and follow-ups.</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-400/40">
                      Live
                    </span>
                  </div>
                  <div className="space-y-2">
                    {recentUpdateThreads.map(thread => (
                      <button
                        key={`update-${thread.id}`}
                        onClick={() => handleThreadClick(thread)}
                        className="w-full rounded-lg border border-emerald-200/40 dark:border-emerald-800/30 bg-white/40 dark:bg-slate-900/30 p-3 text-left transition-all hover:border-emerald-300/60 hover:bg-white/70 dark:hover:bg-slate-900/50"
                      >
                        <div className="line-clamp-1 font-medium text-slate-900 dark:text-white">{thread.title}</div>
                        <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-mono text-emerald-700 dark:text-emerald-400">{thread.authorUsername}</span>
                          <HolderBadge tier={thread.authorHolderTier} balance={thread.authorTokenBalance} compact /> · {formatTimeAgo(thread.updatedAt)}
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          <Card className="p-4 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border-white/30 dark:border-slate-700/40 shadow-lg">
            <div className="flex flex-col gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600/60 dark:text-emerald-400/60" />
                <Input
                  type="text"
                  placeholder="Search threads, aliases, tags, or peptides"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white/70 dark:bg-slate-900/60 border-emerald-200/40 dark:border-emerald-800/40 focus-visible:ring-emerald-400/50"
                />
              </div>

              {/* Sort and Tags */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex gap-1 rounded-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-emerald-200/30 dark:border-emerald-800/30 p-1">
                  {([
                    { mode: 'hot' as const, label: 'Trending', icon: TrendingUp },
                    { mode: 'new' as const, label: 'New', icon: Clock },
                    { mode: 'top' as const, label: 'Top', icon: ArrowUp },
                  ]).map(({ mode, label, icon: Icon }) => {
                    const active = sortMode === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => setSortMode(mode)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${active
                          ? 'bg-gradient-to-br from-emerald-500 to-lime-500 text-white shadow-sm shadow-emerald-500/30'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30'
                          }`}
                      >
                        <Icon className="w-3 h-3" />
                        {label}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setShowSavedOnly((current) => !current)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${showSavedOnly
                    ? 'bg-gradient-to-br from-emerald-500 to-lime-500 text-white shadow-sm shadow-emerald-500/30'
                    : 'bg-white/70 dark:bg-slate-900/60 border border-emerald-200/40 dark:border-emerald-800/40 text-slate-700 dark:text-slate-300 hover:border-emerald-400/60'
                    }`}
                >
                  <Bookmark className={`w-3 h-3 ${showSavedOnly ? 'fill-current' : ''}`} />
                  Saved
                </button>

                <div className="flex-1 flex flex-wrap gap-1">
                  {availableTags.map(tag => {
                    const active = selectedTag === tag;
                    return (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${active
                          ? 'bg-gradient-to-br from-emerald-500 to-lime-500 text-white shadow-sm shadow-emerald-500/30'
                          : 'bg-white/70 dark:bg-slate-900/60 border border-emerald-200/40 dark:border-emerald-800/40 text-slate-700 dark:text-slate-300 hover:border-emerald-400/60'
                          }`}
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* Thread List */}
          {loading ? (
            <Card className="p-8 text-center text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border-white/30 dark:border-slate-700/40">
              Loading threads...
            </Card>
          ) : filteredThreads.length === 0 ? (
            <Card className="p-8 text-center text-slate-800 dark:text-slate-200 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border-white/30 dark:border-slate-700/40 font-medium">
              {showSavedOnly
                ? 'No saved threads yet. Bookmark the ones you want to revisit.'
                : searchQuery || selectedTag
                  ? 'No threads match your filters'
                  : 'No threads yet. Ask the first question, share a stack, or post the first update.'}
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredThreads.map(thread => {
                const visiblePeptides = thread.stackPeptides?.slice(0, 3) || [];
                const extraPeptideCount = Math.max((thread.stackPeptides?.length || 0) - visiblePeptides.length, 0);

                return (
                  <Card
                    key={thread.id}
                    className={`cursor-pointer p-4 transition-all bg-white/60 dark:bg-slate-900/40 backdrop-blur-md hover:bg-white/80 dark:hover:bg-slate-900/60 hover:border-emerald-300/60 dark:hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10 ${bookmarkedThreadIds.includes(thread.id)
                      ? 'border-emerald-300/60 dark:border-emerald-500/40 shadow-md shadow-emerald-500/10'
                      : 'border-white/30 dark:border-slate-700/40'
                      }`}
                    onClick={() => handleThreadClick(thread)}
                  >
                    <div className="flex gap-3">
                      <div className="flex min-w-[52px] flex-col items-center gap-1">
                        <ArrowUp className="w-5 h-5 text-slate-400" />
                        <span className={`font-semibold text-sm ${
                          (thread.upvotes - thread.downvotes) > 0
                            ? 'text-green-600 dark:text-green-400'
                            : (thread.upvotes - thread.downvotes) < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-500'
                        }`}>
                          {thread.upvotes - thread.downvotes}
                        </span>
                        <ArrowDown className="w-5 h-5 text-slate-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 border border-emerald-400/40">
                                {getThreadLabel(thread)}
                              </span>
                              {thread.isPinned && (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                  Pinned
                                </span>
                              )}
                              {thread.isLocked && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                  Locked
                                </span>
                              )}
                              {adminMode && thread.isHidden && (
                                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                                  Hidden
                                </span>
                              )}
                            </div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {thread.title}
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={(event) => handleToggleBookmark(event, thread.id)}
                            className={`rounded-md p-2 transition-colors ${bookmarkedThreadIds.includes(thread.id)
                              ? 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30'
                              : 'text-slate-400 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20'
                              }`}
                            aria-label={bookmarkedThreadIds.includes(thread.id) ? 'Remove bookmark' : 'Save thread'}
                          >
                            <Bookmark className={`h-4 w-4 ${bookmarkedThreadIds.includes(thread.id) ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                          {thread.content}
                        </p>

                        {visiblePeptides.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {visiblePeptides.map(peptide => (
                              <span
                                key={`${thread.id}-${peptide.peptideName}`}
                                className="rounded-full bg-emerald-100/80 px-2 py-0.5 text-xs font-medium text-emerald-800 border border-emerald-300/40 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/40"
                              >
                                {peptide.peptideName}
                              </span>
                            ))}
                            {extraPeptideCount > 0 && (
                              <span className="rounded-full bg-slate-100/80 px-2 py-0.5 text-xs text-slate-700 border border-slate-300/40 dark:bg-slate-800/60 dark:text-slate-300">
                                +{extraPeptideCount} more
                              </span>
                            )}
                          </div>
                        )}

                        {thread.tags && thread.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {thread.tags.map(tag => (
                              <span
                                key={tag}
                                className="rounded px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-mono font-medium text-emerald-700 dark:text-emerald-400">
                            {thread.authorUsername}
                          </span>
                          <HolderBadge tier={thread.authorHolderTier} balance={thread.authorTokenBalance} />
                          <span>{formatTimeAgo(thread.createdAt)}</span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {thread.replyCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {thread.viewCount}
                          </span>
                          {thread.imageUrls && thread.imageUrls.length > 0 && (
                            <span className="flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              {thread.imageUrls.length}
                            </span>
                          )}
                          {thread.stackPeptides && thread.stackPeptides.length > 0 && (
                            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                              {thread.stackPeptides.length} peptides
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Create Thread Dialog */}
      {showCreateDialog && (
        <CreateThreadDialog
          onClose={() => setShowCreateDialog(false)}
          onThreadCreated={handleThreadCreated}
        />
      )}
    </div>
  );
}
