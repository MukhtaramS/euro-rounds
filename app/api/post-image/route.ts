import { NextResponse } from "next/server";
import { callN8n, N8nError } from "@/lib/n8n";
import type { Post } from "@/lib/types";

export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";
const MAX_BYTES = 8 * 1024 * 1024;

type Cached = { body: ArrayBuffer; type: string; credit: string } | null;
// Per-process cache: article images don't change, and a miss (null) shouldn't be retried on every render.
const cache = new Map<number, Cached>();

function decodeEntities(s: string) {
  return s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

// Finds og:image / twitter:image in the article HTML, whatever the attribute order.
function findImageUrl(html: string, pageUrl: string): string | null {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase();
    if (key !== "og:image" && key !== "og:image:url" && key !== "twitter:image") continue;
    const content = /content\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (!content) continue;
    try {
      return new URL(decodeEntities(content), pageUrl).toString();
    } catch {
      continue;
    }
  }
  return null;
}

async function fetchWithTimeout(url: string, accept: string) {
  return fetch(url, {
    headers: { "user-agent": UA, accept },
    redirect: "follow",
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
}

async function loadImage(post: Post): Promise<Cached> {
  if (!/^https?:\/\//i.test(post.source_url ?? "")) return null;
  const page = await fetchWithTimeout(post.source_url, "text/html");
  if (!page.ok) return null;
  const imageUrl = findImageUrl(await page.text(), post.source_url);
  if (!imageUrl) return null;

  const img = await fetchWithTimeout(imageUrl, "image/*");
  const type = img.headers.get("content-type") ?? "";
  if (!img.ok || !type.startsWith("image/")) return null;
  const body = await img.arrayBuffer();
  if (body.byteLength > MAX_BYTES) return null;
  return { body, type, credit: new URL(post.source_url).hostname.replace(/^www\./, "") };
}

// GET /api/post-image?id=12 → the lead photo of that post's source article.
// Takes a post id (not a URL) so the server only ever fetches links stored by the pipeline.
export async function GET(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Missing post id" }, { status: 400 });

  if (!cache.has(id)) {
    try {
      const { posts } = await callN8n<{ posts: Post[] }>("euro-rounds/posts");
      const post = posts.find((p) => p.id === id);
      if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
      cache.set(id, await loadImage(post).catch(() => null));
    } catch (e) {
      const err = e as N8nError;
      return NextResponse.json({ error: err.message }, { status: err.status ?? 502 });
    }
  }

  const hit = cache.get(id);
  if (!hit) return NextResponse.json({ error: "No usable image in the source article" }, { status: 404 });
  return new NextResponse(hit.body, {
    headers: { "content-type": hit.type, "x-image-credit": hit.credit, "cache-control": "private, max-age=86400" },
  });
}
