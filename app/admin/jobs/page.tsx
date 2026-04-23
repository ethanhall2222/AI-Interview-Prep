import Link from "next/link";
import { BriefcaseBusiness, Building2, Clock3, Search } from "lucide-react";

import { requireAdminSession } from "@/lib/auth-helpers";
import AdminJobsSyncPanel from "./sync-panel";

type JobApplicationReviewRow = {
  id: string;
  created_at: string;
  job_title: string;
  company: string;
  job_description: string;
  resume_summary: string;
  focus_areas: string | null;
};

export const revalidate = 0;

export default async function AdminJobsReviewPage() {
  const { supabase } = await requireAdminSession();

  const { data, error } = await supabase
    .from("job_applications")
    .select(
      "id, created_at, job_title, company, job_description, resume_summary, focus_areas",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to load admin job review queue", error);
  }

  const items = (data ?? []) as JobApplicationReviewRow[];

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-slate-800/60 bg-slate-900/65 p-6">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#eaaa00]/40 bg-[#eaaa00]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#ffe39f]">
          <Search className="h-3.5 w-3.5" />
          Admin Review
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50">Job Posting Review</h1>
        <p className="mt-2 text-sm text-slate-300">
          Handshake-inspired queue to scan incoming job postings used by candidates and
          audit relevance before interview prep.
        </p>
      </header>

      <AdminJobsSyncPanel />

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-sm text-slate-300">
          No job postings to review yet.
        </div>
      ) : (
        <section className="space-y-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl border border-slate-800/60 bg-slate-950/60 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                    <Clock3 className="h-3.5 w-3.5" />
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                  <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-100">
                    <BriefcaseBusiness className="h-4 w-4 text-[#eaaa00]" />
                    {item.job_title}
                  </h2>
                  <p className="inline-flex items-center gap-2 text-sm text-slate-300">
                    <Building2 className="h-4 w-4 text-slate-500" />
                    {item.company}
                  </p>
                </div>
                <div className="rounded-full border border-[#eaaa00]/40 bg-[#eaaa00]/10 px-3 py-1 text-xs font-medium text-[#f4d27d]">
                  Review pending
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Posting details
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                    {item.job_description}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Candidate context
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                    {item.resume_summary}
                  </p>
                  {item.focus_areas && (
                    <>
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">
                        Focus areas
                      </p>
                      <p className="text-sm leading-relaxed text-slate-300">
                        {item.focus_areas}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      <div className="text-xs text-slate-400">
        Continuous build roles live in{" "}
        <Link href="/admin/agents" className="text-[#f4d27d] hover:text-[#ffe49a]">
          /admin/agents
        </Link>
        .{" "}
        Need a dedicated admin magic link? Use{" "}
        <Link href="/admin/login" className="text-[#f4d27d] hover:text-[#ffe49a]">
          /admin/login
        </Link>
        .
      </div>
    </div>
  );
}
