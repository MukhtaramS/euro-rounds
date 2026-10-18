import type { Post, Run } from "@/lib/types";

function usd(n: number) {
  return n < 0.1 ? `$${n.toFixed(3)}` : `$${n.toFixed(2)}`;
}

function avg(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

export default function Stats({ posts, runs }: { posts: Post[]; runs: Run[] }) {
  const reviewed = posts.filter((p) => p.status !== "pending");
  const approved = posts.filter((p) => p.status === "approved").length;
  // A run ends with one ok / no_new_rounds row; error rows are per-step or crashes.
  const finished = runs.filter((r) => r.status !== "error");
  const runCost = avg(runs.map((r) => Number(r.cost_usd)).filter((n) => n > 0));
  const postCost = avg(posts.map((p) => Number(p.cost_usd)).filter((n) => n > 0));

  const tiles = [
    { label: "Posts drafted", value: String(posts.length), hint: `${posts.filter((p) => p.status === "pending").length} waiting for review` },
    {
      label: "Approved",
      value: reviewed.length ? `${Math.round((approved / reviewed.length) * 100)}%` : "—",
      hint: `${approved} of ${reviewed.length} reviewed`,
    },
    {
      label: "Runs completed",
      value: runs.length ? `${finished.length}/${runs.length}` : "—",
      hint: "last 10 log entries, errors included",
    },
    { label: "Claude cost / run", value: runCost != null ? usd(runCost) : "—", hint: runCost != null ? `≈ ${usd(runCost * 30)} per month` : "logged from next run" },
    { label: "Claude cost / post", value: postCost != null ? usd(postCost) : "—", hint: "Haiku 5.5 + 1–2 link searches" },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="label">{t.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-100">{t.value}</p>
          <p className="mt-0.5 text-xs text-zinc-500">{t.hint}</p>
        </div>
      ))}
    </section>
  );
}
