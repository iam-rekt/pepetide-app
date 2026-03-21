'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowUp, ArrowDown, MessageSquare, Download, Image as ImageIcon, Trash2, Bookmark, Shield, Pin, PinOff, Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import type { ForumThread, ForumPost } from '@/types';
import { addPeptide } from '@/lib/db';
import {
  clearReplyComposerDraft,
  loadCommunityAlias,
  loadBookmarkedThreadIds,
  loadReplyComposerDraft,
  saveCommunityAlias,
  saveLastViewedThread,
  saveReplyComposerDraft,
  toggleBookmarkedThread,
} from '@/lib/community-storage';
import { getAdminHeaders, validateStoredAdminKey } from '@/lib/admin-mode';

function extractIpfsCid(url: string): string | null {
  if (!url) return null;

  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', '').replace(/^ipfs\//, '').split('/')[0];
  }

  const subdomainMatch = url.match(/^https?:\/\/([a-z0-9]+)\.ipfs\./i);
  if (subdomainMatch?.[1]) return subdomainMatch[1];

  const pathMatch = url.match(/\/ipfs\/([a-z0-9]+)/i);
  if (pathMatch?.[1]) return pathMatch[1];

  return null;
}

function getImageCandidates(url: string): string[] {
  const cid = extractIpfsCid(url);
  if (!cid) return [url];

  return [
    `https://ipfs.io/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`,
    `https://${cid}.ipfs.storacha.link`
  ];
}

function IpfsImage({ url, alt, maxHeight }: { url: string; alt: string; maxHeight: string }) {
  const candidates = getImageCandidates(url);
  const [index, setIndex] = useState(0);
  const current = candidates[Math.min(index, candidates.length - 1)];

  return (
    <a
      href={current}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <img
        src={current}
        alt={alt}
        onError={() => {
          if (index < candidates.length - 1) {
            setIndex((prev) => prev + 1);
          }
        }}
        className="max-w-full h-auto rounded border border-slate-200 dark:border-slate-700 hover:opacity-90 cursor-pointer"
        style={{ maxHeight }}
        loading="lazy"
      />
    </a>
  );
}

interface ThreadDetailProps {
  thread: ForumThread;
  onBack: () => void;
}

type PostWithChildren = ForumPost & { children: PostWithChildren[] };

export default function ThreadDetail({ thread, onBack }: ThreadDetailProps) {
  const [threadState, setThreadState] = useState(thread);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [forumConfigured, setForumConfigured] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [replyUsername, setReplyUsername] = useState('');
  const [replyToPostId, setReplyToPostId] = useState<string | null>(null);
  const [threadVotes, setThreadVotes] = useState({ up: thread.upvotes, down: thread.downvotes });
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [bookmarked, setBookmarked] = useState(false);
  const [threadReplyCount, setThreadReplyCount] = useState(thread.replyCount);
  const [adminMode, setAdminMode] = useState(false);
  const [moderatingAction, setModeratingAction] = useState<'pin' | 'hide' | 'lock' | null>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setThreadState(thread);
    setThreadReplyCount(thread.replyCount);
    setThreadVotes({ up: thread.upvotes, down: thread.downvotes });
  }, [thread]);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/forum/threads/${thread.id}/posts`, {
        headers: getAdminHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setForumConfigured(true);
          setPosts(data);
          setThreadReplyCount(data.length);
        } else {
          setForumConfigured(data.configured !== false);
          setPosts(data.posts || []);
          setThreadReplyCount((data.posts || []).length);
        }
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  }, [thread.id]);

  const loadUserVote = useCallback(async () => {
    try {
      const response = await fetch(`/api/forum/threads/${thread.id}/vote`);
      if (response.ok) {
        const data = await response.json();
        if (data.configured === false) {
          setForumConfigured(false);
          return;
        }
        setUserVote(data.voteType);
      }
    } catch (error) {
      console.error('Failed to load user vote:', error);
    }
  }, [thread.id]);

  useEffect(() => {
    const savedDraft = loadReplyComposerDraft(thread.id);
    const savedUsername = loadCommunityAlias();

    saveLastViewedThread(thread);
    void loadPosts();
    void loadUserVote();
    setBookmarked(loadBookmarkedThreadIds().includes(thread.id));

    const initializeAdminMode = async () => {
      const isAdmin = await validateStoredAdminKey();
      setAdminMode(isAdmin);
    };

    void initializeAdminMode();

    setReplyUsername(savedDraft.username || savedUsername);
    setReplyContent(savedDraft.content);
    setReplyToPostId(savedDraft.replyToPostId);
  }, [loadPosts, loadUserVote, thread]);

  useEffect(() => {
    saveReplyComposerDraft(thread.id, {
      content: replyContent,
      username: replyUsername,
      replyToPostId,
    });
  }, [thread.id, replyContent, replyUsername, replyToPostId]);

  useEffect(() => {
    if (replyUsername.trim()) {
      saveCommunityAlias(replyUsername);
    }
  }, [replyUsername]);

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    try {
      const response = await fetch(`/api/forum/threads/${thread.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType })
      });

      if (response.ok) {
        const data = await response.json();
        setThreadVotes({ up: data.upvotes, down: data.downvotes });
        setUserVote(data.userVote);
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleDeleteThread = async () => {
    if (!confirm('Are you sure you want to delete this thread? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/forum/threads/${thread.id}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });

      if (response.ok) {
        alert('Thread deleted successfully');
        onBack();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete thread');
      }
    } catch (error) {
      console.error('Failed to delete thread:', error);
      alert('Failed to delete thread');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/forum/posts/${postId}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        const deletedPostIds = new Set<string>(data.deletedPostIds || [postId]);

        setPosts((currentPosts) => currentPosts.filter((post) => !deletedPostIds.has(post.id)));
        setThreadReplyCount((currentCount) => Math.max(0, currentCount - (data.deletedCount || deletedPostIds.size)));
        if (replyToPostId && deletedPostIds.has(replyToPostId)) {
          setReplyToPostId(null);
        }
        alert('Post deleted successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 4) {
      alert('Maximum 4 images allowed');
      return;
    }

    setImages([...images, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !replyUsername.trim()) {
      alert('Please fill in username and content');
      return;
    }

    setSubmitting(true);

    try {
      saveCommunityAlias(replyUsername);

      // Upload images if any
      let imageUrls: string[] = [];
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach(image => formData.append('images', image));

        const uploadResponse = await fetch('/api/forum/upload', {
          method: 'POST',
          body: formData
        });

        if (uploadResponse.ok) {
          const { urls } = await uploadResponse.json();
          imageUrls = urls;
          console.log('Images uploaded successfully:', urls);
        } else {
          const errorData = await uploadResponse.json();
          console.error('Image upload failed:', errorData);
          alert(`Image upload failed: ${errorData.error || 'Unknown error'}. Reply will be posted without images.`);
        }
      }

      const response = await fetch(`/api/forum/threads/${thread.id}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          username: replyUsername,
          parentPostId: replyToPostId,
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined
        })
      });

      if (response.ok) {
        const newPost = await response.json();
        setPosts((currentPosts) => [...currentPosts, newPost]);
        setThreadReplyCount((currentCount) => currentCount + 1);
        setReplyContent('');
        setReplyToPostId(null);
        setImages([]);
        setImagePreviews([]);
        clearReplyComposerDraft(thread.id);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to post reply. Please try again.');
      }
    } catch (error) {
      console.error('Failed to post reply:', error);
      alert('Failed to post reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportStack = async () => {
    if (!threadState.stackPeptides || threadState.stackPeptides.length === 0) {
      alert('No stack to import');
      return;
    }

    try {
      for (const peptide of threadState.stackPeptides) {
        // Add peptide to library (if not exists, we'll handle duplicates in the UI)
        await addPeptide({
          name: peptide.peptideName,
          description: `Imported from ${threadState.authorUsername}'s stack`,
          commonDosageRange: {
            min: peptide.dosage,
            max: peptide.dosage,
            unit: peptide.dosageUnit
          }
        });

        // Optionally create a vial (commented out - user might want to do this manually)
        // await addVial({...});
      }

      alert(`Successfully imported ${threadState.stackPeptides.length} peptide(s) to your library!`);
    } catch (error) {
      console.error('Failed to import stack:', error);
      alert('Failed to import stack. Some peptides may already exist in your library.');
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 2592000)}mo ago`;
  };

  const handleToggleBookmark = () => {
    const nextIds = toggleBookmarkedThread(thread.id);
    setBookmarked(nextIds.includes(thread.id));
  };

  const handleModerateThread = async (
    action: 'pin' | 'hide' | 'lock',
    updates: { isPinned?: boolean; isHidden?: boolean; isLocked?: boolean }
  ) => {
    try {
      setModeratingAction(action);
      const response = await fetch(`/api/forum/threads/${thread.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(getAdminHeaders() || {})
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedThread = await response.json();
        setThreadState(updatedThread);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update thread moderation state');
      }
    } catch (error) {
      console.error('Failed to moderate thread:', error);
      alert('Failed to update thread moderation state');
    } finally {
      setModeratingAction(null);
    }
  };

  const handleStartFollowUpUpdate = () => {
    if (threadState.isHidden) {
      alert('Thread is hidden. Unhide it before posting a follow-up.');
      return;
    }

    if (threadState.isLocked) {
      alert('Thread is locked. Unlock it before posting a follow-up.');
      return;
    }

    const template = [
      `Follow-up update - ${new Date().toLocaleDateString()}`,
      '',
      'What changed since the last post:',
      '- ',
      '',
      'What I noticed:',
      '- ',
      '',
      'Questions / feedback:',
      '- ',
    ].join('\n');

    setReplyToPostId(null);
    setReplyContent((currentContent) => currentContent.trim() ? currentContent : template);

    requestAnimationFrame(() => {
      replyTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      replyTextareaRef.current?.focus();
    });
  };

  const buildPostTree = (posts: ForumPost[]): PostWithChildren[] => {
    const postMap = new Map<string, PostWithChildren>();
    const rootPosts: PostWithChildren[] = [];

    // Create map of posts with children array
    posts.forEach(post => {
      postMap.set(post.id, { ...post, children: [] });
    });

    // Build tree structure
    posts.forEach(post => {
      const postWithChildren = postMap.get(post.id)!;
      if (post.parentPostId) {
        const parent = postMap.get(post.parentPostId);
        if (parent) {
          parent.children.push(postWithChildren);
        } else {
          rootPosts.push(postWithChildren);
        }
      } else {
        rootPosts.push(postWithChildren);
      }
    });

    return rootPosts;
  };

  const renderPost = (post: PostWithChildren, depth: number = 0) => {
    return (
      <div key={post.id} className={`${depth > 0 ? 'ml-8 mt-2' : 'mt-3'}`}>
        <Card className="p-3">
          <div className="flex gap-3">
            {/* Score sidebar */}
            <div className="flex min-w-[52px] flex-col items-center gap-1 pt-1">
              <div className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {post.upvotes - post.downvotes}
              </div>
              <span className="text-[10px] uppercase tracking-wide text-slate-400">
                score
              </span>
            </div>

            {/* Post content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {post.authorUsername}
                </span>
                <span>{formatTimeAgo(post.createdAt)}</span>
              </div>

              <p className="text-sm text-slate-900 dark:text-white mt-2 whitespace-pre-wrap">
                {post.content}
              </p>

              {/* Images */}
              {post.imageUrls && post.imageUrls.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  {post.imageUrls.map((url, idx) => {
                    return (
                    <IpfsImage
                      key={idx}
                      url={url}
                      alt={`Attachment ${idx + 1}`}
                      maxHeight="300px"
                    />
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => setReplyToPostId(post.id)}
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Reply
                </Button>
                {adminMode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => handleDeletePost(post.id)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Render nested replies */}
        {post.children.map(child => renderPost(child, depth + 1))}
      </div>
    );
  };

  const postTree = buildPostTree(posts);
  const replyTarget = replyToPostId ? posts.find(post => post.id === replyToPostId) : null;

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to threads
      </Button>

      {/* Thread */}
      <Card className="p-6">
        <div className="flex gap-4">
          {/* Vote sidebar */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => handleVote('upvote')}
              className={`${userVote === 'upvote' ? 'text-green-500' : 'text-slate-400 hover:text-green-500'}`}
            >
              <ArrowUp className="w-6 h-6" />
            </button>
            <span className={`text-lg font-bold ${(threadVotes.up - threadVotes.down) > 0
              ? 'text-green-600 dark:text-green-400'
              : (threadVotes.up - threadVotes.down) < 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-slate-500'
              }`}>
              {threadVotes.up - threadVotes.down}
            </span>
            <button
              onClick={() => handleVote('downvote')}
              className={`${userVote === 'downvote' ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
            >
              <ArrowDown className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex-1">
                {threadState.title}
              </h1>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleToggleBookmark}>
                  <Bookmark className={`w-4 h-4 mr-1 ${bookmarked ? 'fill-current' : ''}`} />
                  {bookmarked ? 'Saved' : 'Save Thread'}
                </Button>
                {adminMode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={handleDeleteThread}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove Thread
                  </Button>
                )}
              </div>
            </div>

            {adminMode && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={moderatingAction !== null}
                  onClick={() => handleModerateThread('pin', { isPinned: !threadState.isPinned })}
                >
                  {threadState.isPinned ? <PinOff className="w-4 h-4 mr-1" /> : <Pin className="w-4 h-4 mr-1" />}
                  {threadState.isPinned ? 'Unpin' : 'Pin'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={moderatingAction !== null}
                  onClick={() => handleModerateThread('hide', { isHidden: !threadState.isHidden })}
                >
                  {threadState.isHidden ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                  {threadState.isHidden ? 'Unhide' : 'Hide'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={moderatingAction !== null}
                  onClick={() => handleModerateThread('lock', { isLocked: !threadState.isLocked })}
                >
                  {threadState.isLocked ? <Unlock className="w-4 h-4 mr-1" /> : <Lock className="w-4 h-4 mr-1" />}
                  {threadState.isLocked ? 'Unlock' : 'Lock'}
                </Button>
              </div>
            )}

            {/* Tags */}
            {(threadState.tags && threadState.tags.length > 0) || threadState.isPinned || threadState.isLocked || (adminMode && threadState.isHidden) ? (
              <div className="flex flex-wrap gap-1 mt-2">
                {threadState.tags?.map(tag => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {threadState.isPinned && (
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    pinned
                  </span>
                )}
                {threadState.isLocked && (
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    locked
                  </span>
                )}
                {adminMode && threadState.isHidden && (
                  <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                    hidden
                  </span>
                )}
              </div>
            ) : null}

            <div className="flex items-center gap-3 mt-3 text-sm text-slate-500">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {threadState.authorUsername}
              </span>
              <span>{formatTimeAgo(threadState.createdAt)}</span>
              <span>{threadReplyCount} replies</span>
              <span>{threadState.viewCount} views</span>
              {adminMode && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  <Shield className="w-3 h-3" />
                  Admin mode
                </span>
              )}
            </div>

            <p className="text-slate-900 dark:text-white mt-4 whitespace-pre-wrap">
              {threadState.content}
            </p>

            {/* Thread images */}
            {threadState.imageUrls && threadState.imageUrls.length > 0 && (
              <div className="flex flex-col gap-2 mt-4">
                {threadState.imageUrls.map((url, idx) => {
                  return (
                  <IpfsImage
                    key={idx}
                    url={url}
                    alt={`Attachment ${idx + 1}`}
                    maxHeight="400px"
                  />
                  );
                })}
              </div>
            )}

            {/* Stack peptides */}
            {threadState.stackPeptides && threadState.stackPeptides.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Stack Details ({threadState.stackPeptides.length} peptides)
                  </h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleStartFollowUpUpdate} disabled={threadState.isLocked}>
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Post Follow-Up
                    </Button>
                    <Button size="sm" onClick={handleImportStack}>
                      <Download className="w-4 h-4 mr-1" />
                      Import to My Library
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {threadState.stackPeptides.map((peptide, idx) => (
                    <Card key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            {peptide.peptideName}
                          </h4>
                          <div className="text-sm text-slate-600 dark:text-slate-400 mt-1 space-y-0.5">
                            <div>
                              <strong>Dosage:</strong> {peptide.dosage} {peptide.dosageUnit}
                            </div>
                            <div>
                              <strong>Frequency:</strong> {peptide.frequency}
                            </div>
                            {peptide.timeOfDay && (
                              <div>
                                <strong>Time:</strong> {peptide.timeOfDay}
                              </div>
                            )}
                            {peptide.duration && (
                              <div>
                                <strong>Duration:</strong> {peptide.duration}
                              </div>
                            )}
                            {peptide.notes && (
                              <div>
                                <strong>Notes:</strong> {peptide.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Reply form */}
      <Card className="p-4">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
          {threadState.isHidden ? 'Thread is hidden' : threadState.isLocked ? 'Replies are locked' : replyToPostId ? 'Reply to comment' : 'Add a reply'}
        </h3>
        {!forumConfigured && (
          <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
            Replies are unavailable right now, but your local tracking data still works normally on this device.
          </div>
        )}
        {threadState.isHidden && (
          <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
            This thread is hidden. Unhide it before allowing new replies or follow-up updates.
          </div>
        )}
        {threadState.isLocked && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
            This thread is locked. New replies and follow-up updates are disabled until an admin unlocks it.
          </div>
        )}
        <div className="space-y-3">
          <div>
            <Label htmlFor="reply-username">Username</Label>
            <Input
              id="reply-username"
              value={replyUsername}
              onChange={(e) => setReplyUsername(e.target.value)}
              placeholder="Your alias..."
              className="mt-1"
            />
            <p className="mt-1 text-xs text-slate-500">
              Your alias and reply draft stay saved only on this device.
            </p>
          </div>
          {replyTarget && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-900/50">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Replying to {replyTarget.authorUsername}
              </div>
              <p className="mt-1 line-clamp-2 text-slate-700 dark:text-slate-300">
                {replyTarget.content}
              </p>
            </div>
          )}
          <div>
            <Label htmlFor="reply-content">Your reply</Label>
            <textarea
              id="reply-content"
              ref={replyTextareaRef}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Share your thoughts..."
              disabled={threadState.isLocked || threadState.isHidden}
              className="mt-1 w-full min-h-[100px] px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-y"
            />
          </div>


          {/* Image previews */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative">
                  <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-20 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <label className="cursor-pointer">
              <Button type="button" variant="outline" size="sm" asChild>
                <span>
                  <ImageIcon className="w-4 h-4 mr-1" />
                  Add Images
                </span>
              </Button>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
            </label>
            <Button onClick={handleSubmitReply} disabled={submitting || !forumConfigured || threadState.isLocked || threadState.isHidden} className="ml-auto">
              {submitting ? 'Posting...' : 'Post Reply'}
            </Button>
            {replyToPostId && (
              <Button variant="outline" onClick={() => setReplyToPostId(null)}>
                Cancel Reply
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Posts */}
      <Card className="p-4">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
          Replies ({posts.length})
        </h3>
        {!forumConfigured ? (
          <p className="text-slate-500 text-center py-4">Replies are unavailable right now.</p>
        ) : loading ? (
          <p className="text-slate-500 text-center py-4">Loading replies...</p>
        ) : posts.length === 0 ? (
          <p className="text-slate-500 text-center py-4">No replies yet. Be the first to reply!</p>
        ) : (
          <div>
            {postTree.map(post => renderPost(post))}
          </div>
        )}
      </Card>
    </div>
  );
}
