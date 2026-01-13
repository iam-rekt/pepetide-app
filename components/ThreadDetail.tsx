'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowUp, ArrowDown, MessageSquare, Download, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import type { ForumThread, ForumPost, StackPeptideInfo } from '@/types';
import { hashIP } from '@/lib/hash';
import { addPeptide, addVial } from '@/lib/db';

interface ThreadDetailProps {
  thread: ForumThread;
  onBack: () => void;
}

type PostWithChildren = ForumPost & { children: PostWithChildren[] };

export default function ThreadDetail({ thread, onBack }: ThreadDetailProps) {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [replyUsername, setReplyUsername] = useState('');
  const [replyToPostId, setReplyToPostId] = useState<string | null>(null);
  const [threadVotes, setThreadVotes] = useState({ up: thread.upvotes, down: thread.downvotes });
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    loadPosts();
    loadUserVote();
    // Load saved username
    const savedUsername = localStorage.getItem('forumUsername');
    if (savedUsername) {
      setReplyUsername(savedUsername);
    }
  }, [thread.id]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/forum/threads/${thread.id}/posts`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserVote = async () => {
    try {
      const response = await fetch(`/api/forum/threads/${thread.id}/vote`);
      if (response.ok) {
        const data = await response.json();
        setUserVote(data.voteType);
      }
    } catch (error) {
      console.error('Failed to load user vote:', error);
    }
  };

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
      const adminKey = localStorage.getItem('adminKey');
      const headers: HeadersInit = {};
      if (adminKey) {
        headers['x-admin-key'] = adminKey;
      }

      const response = await fetch(`/api/forum/threads/${thread.id}`, {
        method: 'DELETE',
        headers
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
      const adminKey = localStorage.getItem('adminKey');
      const headers: HeadersInit = {};
      if (adminKey) {
        headers['x-admin-key'] = adminKey;
      }

      const response = await fetch(`/api/forum/posts/${postId}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        setPosts(posts.filter(p => p.id !== postId));
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
      localStorage.setItem('forumUsername', replyUsername);

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
        setPosts([...posts, newPost]);
        setReplyContent('');
        setReplyToPostId(null);
        setImages([]);
        setImagePreviews([]);
      }
    } catch (error) {
      console.error('Failed to post reply:', error);
      alert('Failed to post reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportStack = async () => {
    if (!thread.stackPeptides || thread.stackPeptides.length === 0) {
      alert('No stack to import');
      return;
    }

    try {
      for (const peptide of thread.stackPeptides) {
        // Add peptide to library (if not exists, we'll handle duplicates in the UI)
        const newPeptide = await addPeptide({
          name: peptide.peptideName,
          description: `Imported from ${thread.authorUsername}'s stack`,
          commonDosageRange: {
            min: peptide.dosage,
            max: peptide.dosage,
            unit: peptide.dosageUnit
          }
        });

        // Optionally create a vial (commented out - user might want to do this manually)
        // await addVial({...});
      }

      alert(`Successfully imported ${thread.stackPeptides.length} peptide(s) to your library!`);
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
            {/* Vote sidebar */}
            <div className="flex flex-col items-center gap-1">
              <button className="text-slate-400 hover:text-green-500">
                <ArrowUp className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {post.upvotes - post.downvotes}
              </span>
              <button className="text-slate-400 hover:text-red-500">
                <ArrowDown className="w-4 h-4" />
              </button>
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
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {post.imageUrls.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Attachment ${idx + 1}`}
                      className="w-full max-h-48 object-contain rounded bg-slate-100 dark:bg-slate-800"
                    />
                  ))}
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
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={() => handleDeletePost(post.id)}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
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
                {thread.title}
              </h1>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={handleDeleteThread}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Thread
              </Button>
            </div>

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

            <div className="flex items-center gap-3 mt-3 text-sm text-slate-500">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {thread.authorUsername}
              </span>
              <span>{formatTimeAgo(thread.createdAt)}</span>
              <span>{thread.replyCount} replies</span>
              <span>{thread.viewCount} views</span>
            </div>

            <p className="text-slate-900 dark:text-white mt-4 whitespace-pre-wrap">
              {thread.content}
            </p>

            {/* Thread images */}
            {thread.imageUrls && thread.imageUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {thread.imageUrls.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Attachment ${idx + 1}`}
                    className="w-full max-h-64 object-contain rounded bg-slate-100 dark:bg-slate-800"
                  />
                ))}
              </div>
            )}

            {/* Stack peptides */}
            {thread.stackPeptides && thread.stackPeptides.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Stack Details ({thread.stackPeptides.length} peptides)
                  </h3>
                  <Button size="sm" onClick={handleImportStack}>
                    <Download className="w-4 h-4 mr-1" />
                    Import to My Library
                  </Button>
                </div>
                <div className="space-y-2">
                  {thread.stackPeptides.map((peptide, idx) => (
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
          {replyToPostId ? 'Reply to comment' : 'Add a reply'}
        </h3>
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
          </div>
          <div>
            <Label htmlFor="reply-content">Your reply</Label>
            <textarea
              id="reply-content"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Share your thoughts..."
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
            <Button onClick={handleSubmitReply} disabled={submitting} className="ml-auto">
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
        {loading ? (
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
