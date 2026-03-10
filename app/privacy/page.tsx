export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-50">Privacy</h1>
        <p className="text-sm text-slate-300">
          This local deployment stores account data in Supabase and keeps tracker entries
          in your browser localStorage unless a server-backed tracker is added.
        </p>
      </header>

      <section className="space-y-3 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
        <h2 className="text-lg font-semibold text-slate-100">Data handling</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>Authentication is managed by Supabase.</li>
          <li>Practice sessions and generated outputs are saved to your project database.</li>
          <li>Application tracker entries are currently local to your browser.</li>
        </ul>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
        <h2 className="text-lg font-semibold text-slate-100">User control</h2>
        <p className="text-sm text-slate-300">
          You control what resume and job text you paste into the app. Avoid sharing
          sensitive personal identifiers unless required for your workflow.
        </p>
      </section>
    </div>
  );
}
