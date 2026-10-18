"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import HowItWorks from "./HowItWorks";
import PostCard from "./PostCard";
import RunStatus from "./RunStatus";
import Stats from "./Stats";
import type { Post, PostStatus, Run } from "@/lib/types";

const TABS: PostStatus[] = ["pending", "approved", "rejected"];

export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<PostStatus>("pending");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, r] = await Promise.all([fetch("/api/posts"), fetch("/api/runs")]);
      const pj = await p.json();
      const rj = await r.json();
      if (!p.ok) throw new Error(pj.error);
      if (!r.ok) throw new Error(rj.error);
      setPosts(pj.posts);
      setRuns(rj.runs);
      setError(undefined);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: number, status: PostStatus) {
    const res = await fetch("/api/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Could not update status");
      return;
    }
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    toast.success(`Marked as ${status}`);
  }

  const visible = posts.filter((p) => p.status === tab);

  return (
    <div className="space-y-6">
      {loading && posts.length === 0 && runs.length === 0 && !error ? (
        <div className="h-28 animate-pulse rounded-xl bg-zinc-900/60" />
      ) : (
        <>
          <RunStatus runs={runs} error={error} />
          {!error && <Stats posts={posts} runs={runs} />}
        </>
      )}
      <HowItWorks />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex gap-1 rounded-lg bg-zinc-900 p-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1.5 text-sm capitalize ${tab === t ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              {t} <span className="text-zinc-500">{posts.filter((p) => p.status === t).length}</span>
            </button>
          ))}
        </nav>
        <button onClick={load} disabled={loading} className="btn-sm">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {loading && posts.length === 0 ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-500">No {tab} posts.</p>
      ) : (
        <div className="space-y-5">
          {visible.map((p) => (
            <PostCard key={p.id} post={p} onStatus={updateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}
