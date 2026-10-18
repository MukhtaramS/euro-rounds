import { NextResponse } from "next/server";
import { callN8n, N8nError } from "@/lib/n8n";
import type { Post } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await callN8n<{ posts: Post[] }>("euro-rounds/posts");
    return NextResponse.json({ posts: data.posts ?? [] });
  } catch (e) {
    const err = e as N8nError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 502 });
  }
}
