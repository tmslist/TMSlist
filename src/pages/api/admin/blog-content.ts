/**
 * Read blog posts from Astro content collection (src/content/blog/*.md).
 * The blog_posts DB table is for future CMS usage; current posts live in MD files.
 */
import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

export const prerender = false;

interface PostMeta {
  slug: string;
  title: string;
  description?: string;
  author?: string;
  category?: string;
  publishDate?: string;
  readTime?: string;
  status: 'published' | 'draft';
}

function parseFrontmatter(content: string): Partial<PostMeta> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const fm: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    fm[key] = val;
  }

  return {
    title: fm.title,
    description: fm.description,
    author: fm.author,
    category: fm.category,
    publishDate: fm.publishDate,
    readTime: fm.readTime,
  };
}

export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '50'), 100));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

    const blogDir = join(process.cwd(), 'src/content/blog');

    let files = readdirSync(blogDir).filter(f => f.endsWith('.md'));

    // Apply search filter
    if (search) {
      const q = search.toLowerCase();
      files = files.filter(f => {
        const slug = f.replace('.md', '');
        if (slug.includes(q)) return true;
        const content = readFileSync(join(blogDir, f), 'utf-8');
        const meta = parseFrontmatter(content);
        return (meta.title || '').toLowerCase().includes(q) ||
               (meta.description || '').toLowerCase().includes(q) ||
               (meta.author || '').toLowerCase().includes(q);
      });
    }

    const total = files.length;
    const paginated = files.slice(offset, offset + limit);

    const posts: PostMeta[] = paginated.map(filename => {
      const slug = filename.replace('.md', '');
      const content = readFileSync(join(blogDir, filename), 'utf-8');
      const meta = parseFrontmatter(content);
      return {
        slug,
        title: meta.title || slug,
        description: meta.description,
        author: meta.author || 'Unknown',
        category: meta.category || 'Uncategorized',
        publishDate: meta.publishDate,
        readTime: meta.readTime,
        status: 'published' as const, // MD files are always published
      };
    });

    // Derive categories from posts
    const categories = [...new Set(posts.map(p => p.category).filter(Boolean))];

    return new Response(JSON.stringify({ data: posts, total, categories }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Blog content read error:', err);
    return new Response(JSON.stringify({ error: 'Failed to read blog content' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
