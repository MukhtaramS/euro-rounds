"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const STEPS = [
  { title: "Remember", detail: "Loads companies covered in the last 30 days so nobody is posted twice.", model: "Data table" },
  { title: "Research", detail: "Up to 8 web searches for European rounds from the last 48 h. Only rounds with a stated amount.", model: "Sonnet 5.5 + web search" },
  { title: "Pick", detail: "Chooses the 3 most interesting rounds and writes a trend note.", model: "Haiku 5.5" },
  { title: "Write + verify", detail: "Post, X version and hashtags. 1–2 searches find the source article and re-check the amount.", model: "Haiku 5.5 + web search" },
  { title: "Review", detail: "You approve or reject here, copy the text, download the 1080×1080 card.", model: "Human" },
];

const EDGE_CASES = [
  ["Company already covered", "Skipped for 30 days"],
  ["No amount stated in a source", "Round dropped, never guessed"],
  ["Sources or article disagree on the amount", "⚠️ Check the amount flag"],
  ["No new rounds today", "Logged as “no new rounds”, no empty posts"],
  ["Claude API down or overloaded", "Automatic retries (Research 3×, Pick/Write 2×), then logged"],
  ["Claude reply not valid JSON / cut off", "That step is logged with the reply, the other posts continue"],
  ["Claude invents a source link", "Rejected: only URLs seen in the search results are kept"],
  ["Missing investors or round type", "Left out of the post, never “not disclosed”"],
  ["Source site blocks image downloads or has no photo", "Classic card, or upload a press photo you have rights to"],
  ["X version too long with hashtags", "Hashtags are added only while it fits in 280 characters"],
  ["Crash, timeout, 180 s limit", "Error Handler workflow logs it here"],
  ["Someone calls the API without the key", "403. Invalid status changes get a 400"],
  ["Agent edits a post", "Needs your approval; $5/month budget cap"],
];

export default function HowItWorks() {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-xl border border-zinc-800">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <span className="text-sm font-medium text-zinc-200">How it works · right-sized AI · edge cases</span>
        <ChevronDown size={16} className={`text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="space-y-6 border-t border-zinc-800 p-4">
          <ol className="grid gap-3 md:grid-cols-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-lg bg-zinc-900/60 p-3">
                <p className="text-xs text-gold">{String(i + 1).padStart(2, "0")}</p>
                <p className="font-medium text-zinc-100">{s.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">{s.detail}</p>
                <p className="mt-2 inline-block rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-300">{s.model}</p>
              </li>
            ))}
          </ol>

          <p className="text-xs text-zinc-400">
            Runs daily at 08:00 (Berlin) in n8n. The expensive model only does the one step that needs judgment over the open web;
            the cheap model does everything else. An n8n Agent (<span className="text-zinc-200">Euro Rounds Editor</span>) answers
            questions about the data, rewrites posts on request and writes a weekly recap every Friday.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-zinc-500">
                <tr>
                  <th className="py-1.5 pr-4 font-medium">Edge case</th>
                  <th className="py-1.5 font-medium">What happens</th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                {EDGE_CASES.map(([c, a]) => (
                  <tr key={c} className="border-t border-zinc-800/70">
                    <td className="py-1.5 pr-4">{c}</td>
                    <td className="py-1.5 text-zinc-400">{a}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
