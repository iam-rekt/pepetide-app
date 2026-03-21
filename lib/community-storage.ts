import type { ForumThread, StackPeptideInfo } from '@/types';
import type { PreparedThreadComposerData } from '@/lib/thread-sharing';

const COMMUNITY_ALIAS_KEY = 'pepetide:community-alias';
const LEGACY_FORUM_ALIAS_KEY = 'forumUsername';
const THREAD_DRAFT_KEY = 'pepetide:draft:thread-compose';
const PEPTIDE_SUBMISSION_DRAFT_KEY = 'pepetide:draft:peptide-submit';
const PREPARED_THREAD_DRAFT_KEY = 'pepetide:draft:thread-prepared';
const PENDING_THREAD_KEY = 'pepetide:threads:pending-open';
const LAST_VIEWED_THREAD_KEY = 'pepetide:threads:last-viewed';
const BOOKMARKED_THREAD_IDS_KEY = 'pepetide:threads:bookmarked';

export interface ThreadComposerDraft {
  title: string;
  content: string;
  tags: string[];
  stackPeptides: StackPeptideInfo[];
  sourceLabel?: string;
  templateKind?: 'stack' | 'question' | 'update';
}

export interface ReplyComposerDraft {
  content: string;
  username: string;
  replyToPostId: string | null;
}

export interface PeptideSubmissionDraft {
  username: string;
  name: string;
  description: string;
  dosageMin: string;
  dosageMax: string;
  dosageUnit: 'mcg' | 'mg';
  benefits: string[];
  contraindications: string[];
  warnings: string[];
  storageInstructions: string;
  unreconShelfLife: string;
  reconShelfLife: string;
  notes: string;
  source: string;
}

export interface PeptideReviewDraft {
  username: string;
  dosageUsed: string;
  dosageUnit: 'mcg' | 'mg';
  frequency: string;
  durationWeeks: string;
  benefitsExperienced: string[];
  sideEffects: string[];
  effectivenessRating: number;
  notes: string;
}

export interface StoredThreadSummary {
  id: string;
  title: string;
  authorUsername: string;
  replyCount: number;
  updatedAt: string;
}

function canUseStorage() {
  return typeof window !== 'undefined';
}

function readText(key: string) {
  if (!canUseStorage()) return '';

  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function writeText(key: string, value: string) {
  if (!canUseStorage()) return;

  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures and keep the UX functional.
  }
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;

  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures and keep the UX functional.
  }
}

function removeKey(key: string) {
  if (!canUseStorage()) return;

  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage failures and keep the UX functional.
  }
}

export function loadCommunityAlias() {
  return readText(COMMUNITY_ALIAS_KEY) || readText(LEGACY_FORUM_ALIAS_KEY);
}

export function saveCommunityAlias(alias: string) {
  const trimmedAlias = alias.trim();

  if (!trimmedAlias) return;

  writeText(COMMUNITY_ALIAS_KEY, trimmedAlias);
  writeText(LEGACY_FORUM_ALIAS_KEY, trimmedAlias);
}

export function loadThreadComposerDraft(): ThreadComposerDraft {
  return readJson<ThreadComposerDraft>(THREAD_DRAFT_KEY, {
    title: '',
    content: '',
    tags: [],
    stackPeptides: [],
    sourceLabel: undefined,
    templateKind: 'stack',
  });
}

export function saveThreadComposerDraft(draft: ThreadComposerDraft) {
  writeJson(THREAD_DRAFT_KEY, draft);
}

export function clearThreadComposerDraft() {
  removeKey(THREAD_DRAFT_KEY);
}

export function queuePreparedThreadDraft(draft: PreparedThreadComposerData) {
  writeJson(PREPARED_THREAD_DRAFT_KEY, draft);
}

export function consumePreparedThreadDraft() {
  const draft = readJson<PreparedThreadComposerData | null>(PREPARED_THREAD_DRAFT_KEY, null);

  if (draft) {
    removeKey(PREPARED_THREAD_DRAFT_KEY);
  }

  return draft;
}

export function hasPreparedThreadDraft() {
  return readJson<PreparedThreadComposerData | null>(PREPARED_THREAD_DRAFT_KEY, null) !== null;
}

export function loadReplyComposerDraft(threadId: string): ReplyComposerDraft {
  return readJson<ReplyComposerDraft>(`pepetide:draft:reply:${threadId}`, {
    content: '',
    username: '',
    replyToPostId: null,
  });
}

export function saveReplyComposerDraft(threadId: string, draft: ReplyComposerDraft) {
  writeJson(`pepetide:draft:reply:${threadId}`, draft);
}

export function clearReplyComposerDraft(threadId: string) {
  removeKey(`pepetide:draft:reply:${threadId}`);
}

export function loadPeptideSubmissionDraft(): PeptideSubmissionDraft {
  return readJson<PeptideSubmissionDraft>(PEPTIDE_SUBMISSION_DRAFT_KEY, {
    username: '',
    name: '',
    description: '',
    dosageMin: '',
    dosageMax: '',
    dosageUnit: 'mcg',
    benefits: [''],
    contraindications: [''],
    warnings: [''],
    storageInstructions: 'Refrigerate at 2-8°C after reconstitution',
    unreconShelfLife: 'Store in freezer until use',
    reconShelfLife: '4-6 weeks when refrigerated',
    notes: '',
    source: 'personal-experience',
  });
}

export function savePeptideSubmissionDraft(draft: PeptideSubmissionDraft) {
  writeJson(PEPTIDE_SUBMISSION_DRAFT_KEY, draft);
}

export function clearPeptideSubmissionDraft() {
  removeKey(PEPTIDE_SUBMISSION_DRAFT_KEY);
}

export function loadPeptideReviewDraft(peptideId: string): PeptideReviewDraft {
  return readJson<PeptideReviewDraft>(`pepetide:draft:review:${peptideId}`, {
    username: '',
    dosageUsed: '',
    dosageUnit: 'mcg',
    frequency: '',
    durationWeeks: '',
    benefitsExperienced: [''],
    sideEffects: [''],
    effectivenessRating: 0,
    notes: '',
  });
}

export function savePeptideReviewDraft(peptideId: string, draft: PeptideReviewDraft) {
  writeJson(`pepetide:draft:review:${peptideId}`, draft);
}

export function clearPeptideReviewDraft(peptideId: string) {
  removeKey(`pepetide:draft:review:${peptideId}`);
}

export function setPendingThreadOpen(threadId: string) {
  writeText(PENDING_THREAD_KEY, threadId);
}

export function consumePendingThreadOpen() {
  const threadId = readText(PENDING_THREAD_KEY);

  if (threadId) {
    removeKey(PENDING_THREAD_KEY);
  }

  return threadId;
}

export function saveLastViewedThread(thread: Pick<ForumThread, 'id' | 'title' | 'authorUsername' | 'replyCount' | 'updatedAt'>) {
  writeJson<StoredThreadSummary>(LAST_VIEWED_THREAD_KEY, {
    id: thread.id,
    title: thread.title,
    authorUsername: thread.authorUsername,
    replyCount: thread.replyCount,
    updatedAt: String(thread.updatedAt),
  });
}

export function loadLastViewedThread() {
  return readJson<StoredThreadSummary | null>(LAST_VIEWED_THREAD_KEY, null);
}

export function loadBookmarkedThreadIds() {
  return readJson<string[]>(BOOKMARKED_THREAD_IDS_KEY, []);
}

export function saveBookmarkedThreadIds(threadIds: string[]) {
  writeJson(BOOKMARKED_THREAD_IDS_KEY, threadIds);
}

export function toggleBookmarkedThread(threadId: string) {
  const threadIds = loadBookmarkedThreadIds();

  if (threadIds.includes(threadId)) {
    const nextThreadIds = threadIds.filter((id) => id !== threadId);
    saveBookmarkedThreadIds(nextThreadIds);
    return nextThreadIds;
  }

  const nextThreadIds = [threadId, ...threadIds];
  saveBookmarkedThreadIds(nextThreadIds);
  return nextThreadIds;
}
