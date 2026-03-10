import Link from "next/link";
import { ArrowUpRight, Clock3, Trophy, Zap } from "lucide-react";

import { getOptionalServerSession } from "@/lib/auth-helpers";
import { SessionRow, type SessionRowType } from "@/lib/schemas";

export const revalidate = 0;

function parseSessions(rows: unknown[]): SessionRowType[] {
  return rows
    .map((row) => SessionRow.safeParse(row))
    .filter((result): result is { success: true; data: SessionRowType } => result.success)
    .map((result) => result.data);
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function formatPercent(score: number) {
  return `${Math.round((score / 10) * 100)}%`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ latest?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const { session, supabase } = await getOptionalServerSession();
  const latestParam = Array.isArray(resolvedSearchParams?.latest)
    ? resolvedSearchParams?.latest[0]
    : resolvedSearchParams?.latest;

  if (!session || !supabase) {
    return (
      <div className="space-y-8">
        <header className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#eaaa00]/40 bg-[#eaaa00]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#ffe39f]">
            <Zap className="h-3.5 w-3.5" />
            Running dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-50">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-300">
            Sign in to view your graded interview sessions and track momentum.
          </p>
        </header>
        <section className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-sm text-slate-300">
          <p>You are currently in guest mode.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-md border border-[#eaaa00]/40 bg-[#eaaa00]/10 px-3 py-2 text-xs font-medium text-[#ffe39f] hover:bg-[#eaaa00]/20"
            >
              Log in
            </Link>
            <Link
              href="/practice"
              className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:border-[#eaaa00]/60"
            >
              Start practice
            </Link>
            <Link
              href="/resume-review"
              className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:border-[#eaaa00]/60"
            >
              Run resume review
            </Link>
          </div>
        </section>
      </div>
    );
  }

  let sessions: SessionRowType[] = [];

  try {
    const { data, error } = await supabase
      .from("sessions")
      .select("id, created_at, role, question_set, answers, scores, feedback")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Failed to load sessions", {
        code: error.code,
        message: error.message,
      });
    } else if (data) {
      sessions = parseSessions(data);
    }
  } catch (error) {
    console.error("Dashboard query crashed", error);
  }

  const overallScores = sessions.map((session) => session.scores.scores.overall);
  const currentAverage = average(overallScores);
  const bestSession = sessions.reduce<SessionRowType | null>((best, session) => {
    if (!best || session.scores.scores.overall > best.scores.scores.overall) {
      return session;
    }
    return best;
  }, null);
  const sessionsThisWeek = sessions.filter((session) => {
    const sessionDate = new Date(session.created_at).getTime();
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return sessionDate >= oneWeekAgo;
  }).length;

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#eaaa00]/40 bg-[#eaaa00]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#ffe39f]">
          <Zap className="h-3.5 w-3.5" />
          Running dashboard
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-300">
          Review your latest grades in real time, track score momentum, and open any
          report to iterate.
        </p>
      </header>

      {sessions.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-sm text-slate-300">
          <p>No sessions yet. Start your first run to populate this dashboard.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/practice"
              className="inline-flex items-center gap-2 rounded-md border border-[#eaaa00]/40 bg-[#eaaa00]/10 px-3 py-2 text-xs font-medium text-[#ffe39f] hover:bg-[#eaaa00]/20"
            >
              Start practice
            </Link>
            <Link
              href="/resume-review"
              className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:border-[#eaaa00]/60"
            >
              Run resume review
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
              <p className="text-xs uppercase tracking-wide text-slate-400">Average score</p>
              <p className="mt-2 text-3xl font-semibold text-slate-100">
                {currentAverage.toFixed(1)} / 10
              </p>
            </article>
            <article className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                <Trophy className="h-3.5 w-3.5 text-[#eaaa00]" />
                Best run
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-100">
                {bestSession?.scores.scores.overall.toFixed(1) ?? "0.0"} / 10
              </p>
              {bestSession && <p className="mt-1 text-xs text-slate-400">{bestSession.role}</p>}
            </article>
            <article className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                <Clock3 className="h-3.5 w-3.5" />
                Sessions this week
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-100">{sessionsThisWeek}</p>
            </article>
          </section>

          <section className="space-y-4">
            {sessions.map((session) => {
              const isLatest = latestParam === session.id;
              const overall = session.scores.scores.overall;
              return (
                <article
                  key={session.id}
                  className={`rounded-3xl border p-5 transition ${
                    isLatest
                      ? "border-[#eaaa00]/60 bg-[#eaaa00]/10"
                      : "border-slate-800/60 bg-slate-950/60"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        {new Date(session.created_at).toLocaleString()}
                      </p>
                      <h2 className="text-lg font-semibold text-slate-100">{session.role}</h2>
                      <p className="text-xs capitalize text-slate-400">
                        {session.scores.meta?.interviewType ?? "mixed"} interview
                      </p>
                    </div>
                    <div className="space-y-2 text-right">
                      <p className="text-sm font-semibold text-[#f4d27d]">
                        Overall {overall.toFixed(1)} / 10
                      </p>
                      <div className="h-2 w-44 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#eaaa00] to-[#004a98]"
                          style={{ width: formatPercent(overall) }}
                        />
                      </div>
                      {isLatest && (
                        <p className="text-xs font-medium text-[#ffe39f]">Latest graded run</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-slate-300">{session.feedback}</p>
                    <Link
                      href={`/dashboard/${session.id}`}
                      className="ml-4 inline-flex items-center gap-1 rounded-full border border-[#eaaa00]/40 px-3 py-1 text-xs font-medium text-[#f4d27d] transition hover:bg-[#eaaa00]/10"
                    >
                      Open report
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}
