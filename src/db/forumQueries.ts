/**
 * Forum query layer — all community forum DB operations.
 */

import { eq, and, desc, asc, sql, isNull, inArray } from 'drizzle-orm';
import { db } from './index';
import {
  forumCategories,
  forumPosts,
  forumComments,
  forumVotes,
  forumReports,
  savedForumPosts,
  users,
  doctors,
} from './schema';
import { like, gt, gte } from 'drizzle-orm';
import type { NewForumPost, NewForumComment } from './schema';

// ── AUTHOR INFO ──────────────────────────────────

export interface ForumAuthorInfo {
  id: string;
  name: string | null;
  role: string;
  doctorName?: string;
  credential?: string;
  imageUrl?: string;
}

export async function getForumAuthorInfo(userId: string): Promise<ForumAuthorInfo | null> {
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      role: users.role,
      clinicId: users.clinicId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = result[0];
  if (!user) return null;

  const info: ForumAuthorInfo = {
    id: user.id,
    name: user.name,
    role: user.role,
  };

  // If clinic_owner, look up linked doctor profile for photo/credential
  if (user.role === 'clinic_owner' && user.clinicId) {
    const doctorResult = await db
      .select({
        name: doctors.name,
        credential: doctors.credential,
        imageUrl: doctors.imageUrl,
      })
      .from(doctors)
      .where(eq(doctors.clinicId, user.clinicId))
      .limit(1);

    if (doctorResult[0]) {
      info.doctorName = doctorResult[0].name;
      info.credential = doctorResult[0].credential ?? undefined;
      info.imageUrl = doctorResult[0].imageUrl ?? undefined;
    }
  }

  return info;
}

// ── CATEGORIES ──────────────────────────────────

export async function getForumCategories() {
  return db
    .select()
    .from(forumCategories)
    .orderBy(asc(forumCategories.sortOrder));
}

export async function getForumCategoryBySlug(slug: string) {
  const result = await db
    .select()
    .from(forumCategories)
    .where(eq(forumCategories.slug, slug))
    .limit(1);
  return result[0] ?? null;
}

// ── POSTS ──────────────────────────────────────

export async function getForumPosts(opts: {
  categoryId?: string;
  sort?: 'hot' | 'new' | 'top';
  topPeriod?: 'week' | 'month' | 'all';
  limit?: number;
  offset?: number;
  search?: string;
}) {
  const { categoryId, sort = 'hot', topPeriod = 'all', limit = 20, offset = 0, search } = opts;

  const conditions = [eq(forumPosts.status, 'published')];
  if (categoryId) {
    conditions.push(eq(forumPosts.categoryId, categoryId));
  }
  if (search) {
    conditions.push(sql`(${forumPosts.title} ILIKE ${'%' + search + '%'} OR ${forumPosts.body} ILIKE ${'%' + search + '%'})`);
  }

  // Time filter for top sort
  if (sort === 'top' && topPeriod !== 'all') {
    const cutoff = new Date();
    if (topPeriod === 'week') cutoff.setDate(cutoff.getDate() - 7);
    else if (topPeriod === 'month') cutoff.setDate(cutoff.getDate() - 30);
    conditions.push(gte(forumPosts.createdAt, cutoff));
  }

  let orderClause;
  switch (sort) {
    case 'new':
      orderClause = desc(forumPosts.createdAt);
      break;
    case 'top':
      orderClause = desc(forumPosts.voteScore);
      break;
    case 'hot':
    default:
      orderClause = desc(
        sql`(${forumPosts.voteScore} + ${forumPosts.commentCount}) / POWER(EXTRACT(EPOCH FROM (NOW() - ${forumPosts.createdAt})) / 3600 + 2, 1.5)`
      );
      break;
  }

  const rows = await db
    .select({
      id: forumPosts.id,
      categoryId: forumPosts.categoryId,
      authorId: forumPosts.authorId,
      slug: forumPosts.slug,
      title: forumPosts.title,
      body: forumPosts.body,
      isPinned: forumPosts.isPinned,
      isLocked: forumPosts.isLocked,
      voteScore: forumPosts.voteScore,
      commentCount: forumPosts.commentCount,
      lastActivityAt: forumPosts.lastActivityAt,
      createdAt: forumPosts.createdAt,
      authorName: users.name,
      authorRole: users.role,
      authorClinicId: users.clinicId,
      categorySlug: forumCategories.slug,
      categoryName: forumCategories.name,
      categoryColor: forumCategories.color,
      doctorName: doctors.name,
      credential: doctors.credential,
      imageUrl: doctors.imageUrl,
    })
    .from(forumPosts)
    .innerJoin(users, eq(forumPosts.authorId, users.id))
    .innerJoin(forumCategories, eq(forumPosts.categoryId, forumCategories.id))
    .leftJoin(doctors, eq(users.clinicId, doctors.clinicId))
    .where(and(...conditions))
    .orderBy(desc(forumPosts.isPinned), orderClause)
    .limit(limit)
    .offset(offset);

  // Deduplicate rows caused by multiple doctors per clinic (take first match)
  const seen = new Set<string>();
  const deduped = [];
  for (const row of rows) {
    if (!seen.has(row.id)) {
      seen.add(row.id);
      deduped.push(row);
    }
  }
  return deduped;
}

export async function getForumPostBySlug(slug: string) {
  const result = await db
    .select({
      id: forumPosts.id,
      categoryId: forumPosts.categoryId,
      authorId: forumPosts.authorId,
      slug: forumPosts.slug,
      title: forumPosts.title,
      body: forumPosts.body,
      status: forumPosts.status,
      isPinned: forumPosts.isPinned,
      isLocked: forumPosts.isLocked,
      voteScore: forumPosts.voteScore,
      commentCount: forumPosts.commentCount,
      lastActivityAt: forumPosts.lastActivityAt,
      createdAt: forumPosts.createdAt,
      updatedAt: forumPosts.updatedAt,
      authorName: users.name,
      authorRole: users.role,
      authorClinicId: users.clinicId,
      categorySlug: forumCategories.slug,
      categoryName: forumCategories.name,
      categoryColor: forumCategories.color,
    })
    .from(forumPosts)
    .innerJoin(users, eq(forumPosts.authorId, users.id))
    .innerJoin(forumCategories, eq(forumPosts.categoryId, forumCategories.id))
    .where(and(eq(forumPosts.slug, slug), eq(forumPosts.status, 'published')))
    .limit(1);

  return result[0] ?? null;
}

export async function getForumPostById(id: string) {
  const result = await db
    .select()
    .from(forumPosts)
    .where(eq(forumPosts.id, id))
    .limit(1);
  return result[0] ?? null;
}

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

export async function createForumPost(data: {
  categoryId: string;
  authorId: string;
  title: string;
  body: string;
}) {
  const slug = generateSlug(data.title);
  const now = new Date();

  const result = await db
    .insert(forumPosts)
    .values({
      categoryId: data.categoryId,
      authorId: data.authorId,
      slug,
      title: data.title,
      body: data.body,
      lastActivityAt: now,
    })
    .returning();

  // Update category post count and last activity
  await db
    .update(forumCategories)
    .set({
      postCount: sql`${forumCategories.postCount} + 1`,
      lastActivityAt: now,
    })
    .where(eq(forumCategories.id, data.categoryId));

  return result[0];
}

export async function updateForumPost(
  postId: string,
  data: { title?: string; body?: string; status?: 'published' | 'pending' | 'removed'; isPinned?: boolean; isLocked?: boolean }
) {
  // If removing a post, decrement the category's postCount
  if (data.status === 'removed') {
    const post = await getForumPostById(postId);
    if (post && post.status === 'published') {
      await db
        .update(forumCategories)
        .set({ postCount: sql`GREATEST(${forumCategories.postCount} - 1, 0)` })
        .where(eq(forumCategories.id, post.categoryId));
    }
  }

  const result = await db
    .update(forumPosts)
    .set(data)
    .where(eq(forumPosts.id, postId))
    .returning();
  return result[0] ?? null;
}

// ── COMMENTS ──────────────────────────────────

export async function getForumComments(postId: string, limit = 50, offset = 0) {
  const rows = await db
    .select({
      id: forumComments.id,
      postId: forumComments.postId,
      parentId: forumComments.parentId,
      authorId: forumComments.authorId,
      body: forumComments.body,
      isAccepted: forumComments.isAccepted,
      voteScore: forumComments.voteScore,
      createdAt: forumComments.createdAt,
      updatedAt: forumComments.updatedAt,
      authorName: users.name,
      authorRole: users.role,
      authorClinicId: users.clinicId,
      doctorName: doctors.name,
      credential: doctors.credential,
      imageUrl: doctors.imageUrl,
    })
    .from(forumComments)
    .innerJoin(users, eq(forumComments.authorId, users.id))
    .leftJoin(doctors, eq(users.clinicId, doctors.clinicId))
    .where(and(eq(forumComments.postId, postId), eq(forumComments.status, 'published')))
    .orderBy(desc(forumComments.isAccepted), asc(forumComments.createdAt))
    .limit(limit)
    .offset(offset);

  // Deduplicate rows from multiple doctors per clinic
  const seen = new Set<string>();
  const deduped = [];
  for (const row of rows) {
    if (!seen.has(row.id)) {
      seen.add(row.id);
      deduped.push(row);
    }
  }
  return deduped;

  return rows;
}

export async function createForumComment(data: {
  postId: string;
  authorId: string;
  body: string;
  parentId?: string;
}) {
  const now = new Date();

  const result = await db
    .insert(forumComments)
    .values({
      postId: data.postId,
      authorId: data.authorId,
      body: data.body,
      parentId: data.parentId ?? null,
    })
    .returning();

  // Update post comment count and last activity
  await db
    .update(forumPosts)
    .set({
      commentCount: sql`${forumPosts.commentCount} + 1`,
      lastActivityAt: now,
    })
    .where(eq(forumPosts.id, data.postId));

  // Update category last activity
  const post = await getForumPostById(data.postId);
  if (post) {
    await db
      .update(forumCategories)
      .set({ lastActivityAt: now })
      .where(eq(forumCategories.id, post.categoryId));
  }

  return result[0];
}

// ── VOTES ──────────────────────────────────────

export async function upsertForumVote(userId: string, targetType: 'post' | 'comment', targetId: string, value: 1 | -1) {
  // Use a serializable transaction to prevent race conditions
  // The unique index idx_forum_votes_unique guarantees no duplicates
  const result = await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(forumVotes)
      .where(and(
        eq(forumVotes.userId, userId),
        eq(forumVotes.targetType, targetType),
        eq(forumVotes.targetId, targetId),
      ))
      .limit(1);

    let scoreDelta = value;

    if (existing[0]) {
      if (existing[0].value === value) {
        // Same vote — remove it (toggle off)
        await tx.delete(forumVotes).where(eq(forumVotes.id, existing[0].id));
        scoreDelta = -value;
      } else {
        // Opposite vote — update
        await tx.update(forumVotes).set({ value }).where(eq(forumVotes.id, existing[0].id));
        scoreDelta = value * 2;
      }
    } else {
      // New vote — unique index catches any race condition
      try {
        await tx.insert(forumVotes).values({ userId, targetType, targetId, value });
      } catch (err: any) {
        // Unique constraint violation = concurrent duplicate, treat as no-op
        if (err.code === '23505') return { scoreDelta: 0, toggled: false };
        throw err;
      }
    }

    // Update denormalized score within the same transaction
    if (targetType === 'post') {
      await tx
        .update(forumPosts)
        .set({ voteScore: sql`${forumPosts.voteScore} + ${scoreDelta}` })
        .where(eq(forumPosts.id, targetId));
    } else {
      await tx
        .update(forumComments)
        .set({ voteScore: sql`${forumComments.voteScore} + ${scoreDelta}` })
        .where(eq(forumComments.id, targetId));
    }

    return { scoreDelta, toggled: existing[0]?.value === value };
  });

  return result;
}

export async function getUserVotes(userId: string, targetType: 'post' | 'comment', targetIds: string[]) {
  if (targetIds.length === 0) return {};

  const rows = await db
    .select({ targetId: forumVotes.targetId, value: forumVotes.value })
    .from(forumVotes)
    .where(and(
      eq(forumVotes.userId, userId),
      eq(forumVotes.targetType, targetType),
      inArray(forumVotes.targetId, targetIds),
    ));

  const map: Record<string, number> = {};
  for (const row of rows) {
    map[row.targetId] = row.value;
  }
  return map;
}

// ── REPORTS ──────────────────────────────────────

export async function createForumReport(data: {
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
}) {
  const result = await db.insert(forumReports).values(data).returning();
  return result[0];
}

export async function getUnresolvedReports(limit = 50) {
  return db
    .select()
    .from(forumReports)
    .where(eq(forumReports.resolved, false))
    .orderBy(desc(forumReports.createdAt))
    .limit(limit);
}

export async function resolveForumReport(reportId: string, resolvedBy: string) {
  return db
    .update(forumReports)
    .set({ resolved: true, resolvedBy })
    .where(eq(forumReports.id, reportId))
    .returning();
}

// ── SEED CATEGORIES ──────────────────────────────

export const FORUM_CATEGORY_SEEDS = [
  { slug: 'treatment-experiences', name: 'Treatment Experiences', description: 'Share and read first-hand TMS therapy journeys', icon: 'brain', color: 'violet', sortOrder: 1 },
  { slug: 'ask-a-specialist', name: 'Ask a Specialist', description: 'Get answers from verified TMS professionals', icon: 'specialist', color: 'emerald', sortOrder: 2 },
  { slug: 'insurance-cost', name: 'Insurance & Cost', description: 'Navigate coverage, billing, and financial options', icon: 'currency', color: 'amber', sortOrder: 3 },
  { slug: 'side-effects-recovery', name: 'Side Effects & Recovery', description: 'What to expect during and after TMS treatment', icon: 'health', color: 'rose', sortOrder: 4 },
  { slug: 'success-stories', name: 'Success Stories', description: 'Celebrate positive outcomes and milestones', icon: 'star', color: 'yellow', sortOrder: 5 },
  { slug: 'research-studies', name: 'Research & Studies', description: 'Discuss new findings and clinical data', icon: 'chart', color: 'blue', sortOrder: 6 },
  { slug: 'mental-health-support', name: 'Mental Health Support', description: 'Peer support and coping strategies', icon: 'heart', color: 'teal', sortOrder: 7 },
  { slug: 'events-workshops', name: 'Events & Workshops', description: 'Community meetups and educational events', icon: 'calendar', color: 'indigo', sortOrder: 8 },
];

export async function seedForumCategories() {
  for (const cat of FORUM_CATEGORY_SEEDS) {
    await db
      .insert(forumCategories)
      .values(cat)
      .onConflictDoNothing({ target: forumCategories.slug });
  }
}

// ── BOOKMARKS ──────────────────────────────────

export async function toggleSavedPost(userId: string, postId: string): Promise<boolean> {
  const existing = await db
    .select()
    .from(savedForumPosts)
    .where(and(eq(savedForumPosts.userId, userId), eq(savedForumPosts.postId, postId)))
    .limit(1);

  if (existing[0]) {
    await db.delete(savedForumPosts).where(eq(savedForumPosts.id, existing[0].id));
    return false; // unsaved
  } else {
    await db.insert(savedForumPosts).values({ userId, postId });
    return true; // saved
  }
}

export async function getUserSavedPostIds(userId: string, postIds: string[]): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();
  const rows = await db
    .select({ postId: savedForumPosts.postId })
    .from(savedForumPosts)
    .where(and(eq(savedForumPosts.userId, userId), inArray(savedForumPosts.postId, postIds)));
  return new Set(rows.map(r => r.postId));
}

export async function getUserSavedPosts(userId: string, limit = 20, offset = 0) {
  const rows = await db
    .select({
      id: forumPosts.id,
      categoryId: forumPosts.categoryId,
      authorId: forumPosts.authorId,
      slug: forumPosts.slug,
      title: forumPosts.title,
      body: forumPosts.body,
      isPinned: forumPosts.isPinned,
      isLocked: forumPosts.isLocked,
      voteScore: forumPosts.voteScore,
      commentCount: forumPosts.commentCount,
      lastActivityAt: forumPosts.lastActivityAt,
      createdAt: forumPosts.createdAt,
      authorName: users.name,
      authorRole: users.role,
      authorClinicId: users.clinicId,
      categorySlug: forumCategories.slug,
      categoryName: forumCategories.name,
      categoryColor: forumCategories.color,
      doctorName: doctors.name,
      credential: doctors.credential,
      imageUrl: doctors.imageUrl,
      savedAt: savedForumPosts.createdAt,
    })
    .from(savedForumPosts)
    .innerJoin(forumPosts, eq(savedForumPosts.postId, forumPosts.id))
    .innerJoin(users, eq(forumPosts.authorId, users.id))
    .innerJoin(forumCategories, eq(forumPosts.categoryId, forumCategories.id))
    .leftJoin(doctors, eq(users.clinicId, doctors.clinicId))
    .where(and(eq(savedForumPosts.userId, userId), eq(forumPosts.status, 'published')))
    .orderBy(desc(savedForumPosts.createdAt))
    .limit(limit)
    .offset(offset);

  const seen = new Set<string>();
  const deduped = [];
  for (const row of rows) {
    if (!seen.has(row.id)) { seen.add(row.id); deduped.push(row); }
  }
  return deduped;
}

// ── ACCEPT ANSWER ──────────────────────────────

export async function toggleAcceptedAnswer(commentId: string, postAuthorId: string): Promise<boolean> {
  const comment = await db.select().from(forumComments).where(eq(forumComments.id, commentId)).limit(1);
  if (!comment[0]) return false;

  // Verify the post author is the one accepting
  const post = await db.select().from(forumPosts).where(eq(forumPosts.id, comment[0].postId)).limit(1);
  if (!post[0] || post[0].authorId !== postAuthorId) return false;

  const newValue = !comment[0].isAccepted;

  // If accepting, unaccept any previously accepted answer on this post first
  if (newValue) {
    await db
      .update(forumComments)
      .set({ isAccepted: false })
      .where(and(eq(forumComments.postId, comment[0].postId), eq(forumComments.isAccepted, true)));
  }

  await db.update(forumComments).set({ isAccepted: newValue }).where(eq(forumComments.id, commentId));
  return newValue;
}

// ── USER PROFILE ──────────────────────────────

export async function getUserForumProfile(userId: string) {
  const user = await db
    .select({
      id: users.id,
      name: users.name,
      role: users.role,
      clinicId: users.clinicId,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user[0]) return null;

  const profile: any = { ...user[0] };

  // Get doctor info if clinic_owner
  if (user[0].role === 'clinic_owner' && user[0].clinicId) {
    const doc = await db
      .select({ name: doctors.name, credential: doctors.credential, imageUrl: doctors.imageUrl, specialties: doctors.specialties, bio: doctors.bio })
      .from(doctors)
      .where(eq(doctors.clinicId, user[0].clinicId))
      .limit(1);
    if (doc[0]) profile.doctor = doc[0];
  }

  // Get stats
  const postCount = await db.select({ count: sql<number>`count(*)` }).from(forumPosts)
    .where(and(eq(forumPosts.authorId, userId), eq(forumPosts.status, 'published')));
  const commentCount = await db.select({ count: sql<number>`count(*)` }).from(forumComments)
    .where(and(eq(forumComments.authorId, userId), eq(forumComments.status, 'published')));

  profile.postCount = Number(postCount[0]?.count ?? 0);
  profile.commentCount = Number(commentCount[0]?.count ?? 0);

  return profile;
}

export async function getUserForumPosts(userId: string, limit = 20, offset = 0) {
  const rows = await db
    .select({
      id: forumPosts.id,
      slug: forumPosts.slug,
      title: forumPosts.title,
      body: forumPosts.body,
      voteScore: forumPosts.voteScore,
      commentCount: forumPosts.commentCount,
      createdAt: forumPosts.createdAt,
      categorySlug: forumCategories.slug,
      categoryName: forumCategories.name,
      categoryColor: forumCategories.color,
    })
    .from(forumPosts)
    .innerJoin(forumCategories, eq(forumPosts.categoryId, forumCategories.id))
    .where(and(eq(forumPosts.authorId, userId), eq(forumPosts.status, 'published')))
    .orderBy(desc(forumPosts.createdAt))
    .limit(limit)
    .offset(offset);
  return rows;
}

export async function getUserForumComments(userId: string, limit = 20, offset = 0) {
  const rows = await db
    .select({
      id: forumComments.id,
      body: forumComments.body,
      voteScore: forumComments.voteScore,
      createdAt: forumComments.createdAt,
      postId: forumPosts.id,
      postSlug: forumPosts.slug,
      postTitle: forumPosts.title,
      categorySlug: forumCategories.slug,
    })
    .from(forumComments)
    .innerJoin(forumPosts, eq(forumComments.postId, forumPosts.id))
    .innerJoin(forumCategories, eq(forumPosts.categoryId, forumCategories.id))
    .where(and(eq(forumComments.authorId, userId), eq(forumComments.status, 'published')))
    .orderBy(desc(forumComments.createdAt))
    .limit(limit)
    .offset(offset);
  return rows;
}

// ── RELATED POSTS ──────────────────────────────

export async function getRelatedPosts(postId: string, categoryId: string, limit = 5) {
  const rows = await db
    .select({
      id: forumPosts.id,
      slug: forumPosts.slug,
      title: forumPosts.title,
      voteScore: forumPosts.voteScore,
      commentCount: forumPosts.commentCount,
      createdAt: forumPosts.createdAt,
      categorySlug: forumCategories.slug,
    })
    .from(forumPosts)
    .innerJoin(forumCategories, eq(forumPosts.categoryId, forumCategories.id))
    .where(and(
      eq(forumPosts.categoryId, categoryId),
      eq(forumPosts.status, 'published'),
      sql`${forumPosts.id} != ${postId}`,
    ))
    .orderBy(desc(forumPosts.voteScore))
    .limit(limit);
  return rows;
}
