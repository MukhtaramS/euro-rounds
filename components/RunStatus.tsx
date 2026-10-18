import { AlertCircle, CheckCircle2, MinusCircle } from "lucide-react";
import type { Run } from "@/lib/types";

function when(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Berlin" });
}

export default function RunStatus({ runs, error }: { runs: Run[]; error?: string }) {
  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">Can&apos;t reach n8n</p>
          <p className="text-red-300/80">{error}</p>
        </div>
      </div>
    );
  }

  const last = runs[0];
  if (!last) {
    return <div className="rounded-xl border border-zinc-800 p-4 text-sm text-zinc-400">No runs yet. The pipeline runs daily at 08:00 (Berlin).</div>;
  }

  // A run logs its per-post errors before its final row; rows of one run share its n8n execution id.
  const sameRunErrors = last.execution_id
    ? runs.filter((r) => r.id !== last.id && r.status === "error" && r.execution_id === last.execution_id)
    : [];

  const look = {
    ok: { icon: CheckCircle2, cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300", title: "Last run OK" },
    no_new_rounds: { icon: MinusCircle, cls: "border-zinc-700 bg-zinc-900 text-zinc-300", title: "No new rounds today" },
    error: { icon: AlertCircle, cls: "border-red-500/30 bg-red-500/10 text-red-300", title: `Error at step "${last.step}"` },
  }[last.status] ?? { icon: MinusCircle, cls: "border-zinc-700 text-zinc-300", title: last.status };
  const Icon = look.icon;

  return (
    <div className={`space-y-2 rounded-xl border p-4 text-sm ${look.cls}`}>
      <div className="flex items-center gap-2">
        <Icon size={18} />
        <span className="font-medium">{look.title}</span>
        <span className="opacity-70">· {when(last.run_date)}</span>
      </div>
      {last.status !== "no_new_rounds" && last.message && <p className="opacity-90">{last.message}</p>}
      {last.trend && (
        <p className="text-zinc-300">
          <span className="label mr-2">Trend</span>
          {last.trend}
        </p>
      )}
      {sameRunErrors.map((r) => (
        <p key={r.id} className="text-red-300">
          ⚠ {r.step}: {r.message}
        </p>
      ))}
    </div>
  );
}
