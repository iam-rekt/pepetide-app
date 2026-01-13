'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Search, TrendingUp, Clock, Tag, ArrowUp, ArrowDown, MessageSquare, Eye } from 'lucide-react';
import type { ForumThread } from '@/types';
import CreateThreadDialog from './CreateThreadDialog';
import ThreadDetail from './ThreadDetail';

type SortMode = 'hot' | 'new' | 'top';

export default function ForumView() {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [filteredThreads, setFilteredThreads] = useState<ForumThread[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('hot');
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);

  // Available tags for filtering
  const availableTags = ['cutting', 'bulking', 'anti-aging', 'recovery', 'cognitive', 'longevity', 'performance'];

  // Load threads from API
  useEffect(() => {
    loadThreads();
  }, []);

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
        thread.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply tag filter
    if (selectedTag) {
      filtered = filtered.filter(thread => thread.tags?.includes(selectedTag));
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
  }, [threads, searchQuery, selectedTag, sortMode]);

  const loadThreads = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/forum/threads');
      if (response.ok) {
        const data = await response.json();
        setThreads(data);
      }
    } catch (error) {
      console.error('Failed to load threads:', error);
    } finally {
      setLoading(false);
    }
  };

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
    loadThreads(); // Reload to get updated counts
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 2592000)}mo ago`;
  };

  // If a thread is selected, show the detail view
  if (selectedThread) {
    return <ThreadDetail thread={selectedThread} onBack={handleBackToList} />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Share Your Stack (SYS)
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Discuss peptide stacks and share experiences
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Thread
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search threads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Sort and Tags */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sort buttons */}
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <Button
                variant={sortMode === 'hot' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSortMode('hot')}
                className="flex items-center gap-1"
              >
                <TrendingUp className="w-3 h-3" />
                Hot
              </Button>
              <Button
                variant={sortMode === 'new' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSortMode('new')}
                className="flex items-center gap-1"
              >
                <Clock className="w-3 h-3" />
                New
              </Button>
              <Button
                variant={sortMode === 'top' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSortMode('top')}
                className="flex items-center gap-1"
              >
                <ArrowUp className="w-3 h-3" />
                Top
              </Button>
            </div>

            {/* Tag filters */}
            <div className="flex-1 flex flex-wrap gap-1">
              {availableTags.map(tag => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className="text-xs"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Thread List */}
      {loading ? (
        <Card className="p-8 text-center text-slate-500">
          Loading threads...
        </Card>
      ) : filteredThreads.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">
          {searchQuery || selectedTag
            ? 'No threads match your filters'
            : 'No threads yet. Be the first to share your stack!'}
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredThreads.map(thread => (
            <Card
              key={thread.id}
              className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
              onClick={() => handleThreadClick(thread)}
            >
              <div className="flex gap-3">
                {/* Voting sidebar */}
                <div className="flex flex-col items-center gap-1 min-w-[48px]">
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

                {/* Thread content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {thread.isPinned && (
                        <span className="text-green-600 dark:text-green-400 mr-2">📌</span>
                      )}
                      {thread.title}
                    </h3>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                    {thread.content}
                  </p>

                  {/* Tags */}
                  {thread.tags && thread.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {thread.tags.map(tag => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta info */}
                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {thread.authorUsername}
                    </span>
                    <span>{formatTimeAgo(thread.createdAt)}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {thread.replyCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {thread.viewCount}
                    </span>
                    {thread.stackPeptides && thread.stackPeptides.length > 0 && (
                      <span className="text-cyan-600 dark:text-cyan-400">
                        {thread.stackPeptides.length} peptides
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
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
