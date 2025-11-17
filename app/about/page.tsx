export default function AboutPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <h1 className="text-2xl font-bold mb-2">About Will&apos;s Ops Command</h1>
      <p className="text-sm text-zinc-400 mb-4">
        This is my personal Life OS – tracks health, tasks, and WillMadeThis orders.
      </p>
      <a
        href="/"
        className="text-xs px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition"
      >
        ⬅ Back to dashboard
      </a>
    </main>
  );
}
