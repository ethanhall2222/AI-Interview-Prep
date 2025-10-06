import Link from "next/link";

import { requireServerSession } from "@/lib/auth-helpers";
import { SessionRow, type SessionRowType } from "@/lib/schemas";

export const revalidate = 0;

function parseSessions(rows: unknown[]): SessionRowType[] {
  return rows
    .map((row) => SessionRow.safeParse(row))
    .filter((result): result is { success: true; data: SessionRowType } => result.success)
    .map((result) => result.data);
}

export default async function HistoryPage() {
  const { supabase } = await requireServerSession();

  const { data, error } = await supabase
    .from("sessions")
    .select("id, created_at, role, question_set, answers, scores, feedback")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to load history", error);
  }

  const sessions = data ? parseSessions(data) : [];

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-50">History</h1>
        <p className="text-sm text-slate-300">
          A full timeline of your practice runs. Revisit transcripts, feedback, and STAR
          scores to see how your storytelling evolves over time.
        </p>
      </header>

      {sessions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-sm text-slate-300">
          No saved sessions yet. Run a mock interview to populate your history.
        </p>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <article
              key={session.id}
              className="rounded-3xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/30"
            >
              <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {new Date(session.created_at).toLocaleString()}
                  </p>
                  <h2 className="text-base font-semibold text-slate-100">
                    {session.role}
                  </h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-200">
                  Overall {session.scores.scores.overall.toFixed(1)} / 10
                </div>
              </header>

              <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
                {session.scores.meta?.interviewType ?? "behavioral"} interview ·{" "}
                {session.question_set.length} question
                {session.question_set.length === 1 ? "" : "s"}
              </p>

              <div className="mt-4 grid gap-4 text-xs text-slate-400 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Questions tackled
                  </p>
                  <ol className="space-y-1 text-slate-300">
                    {session.question_set.map((question) => (
                      <li key={question} className="leading-relaxed">
                        {question}
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Snapshot insight
                  </p>
                  <p className="leading-relaxed text-slate-300">
                    {session.feedback.summary}
                  </p>
                  {session.tips_next_time.length > 0 && (
                    <ul className="space-y-1 text-slate-400">
                      {session.tips_next_time.map((tip) => (
                        <li key={tip}>• {tip}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <footer className="mt-5 flex items-center justify-between text-xs text-slate-400">
                <div className="flex gap-4">
                  {session.scores.scores.structure && (
                    <span>Structure {session.scores.scores.structure.toFixed(1)}</span>
                  )}
                  {session.scores.scores.relevance && (
                    <span>Relevance {session.scores.scores.relevance.toFixed(1)}</span>
                  )}
                  {session.scores.scores.impact && (
                    <span>Impact {session.scores.scores.impact.toFixed(1)}</span>
                  )}
                  {session.scores.scores.delivery && (
                    <span>Delivery {session.scores.scores.delivery.toFixed(1)}</span>
                  )}
                </div>
                <Link
                  href={`/dashboard/${session.id}`}
                  className="rounded-full border border-slate-700 px-3 py-1 text-indigo-200 transition hover:border-indigo-400 hover:text-indigo-100"
                >
                  Open full report
                </Link>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
