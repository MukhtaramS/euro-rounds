import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex items-center gap-3">
        <div className="h-8 w-1.5 rounded-full bg-gold" />
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Euro Rounds</h1>
          <p className="text-sm text-zinc-400">European startup funding, ready to post.</p>
        </div>
      </header>
      <Dashboard />
    </main>
  );
}
