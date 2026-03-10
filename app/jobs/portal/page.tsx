import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, Building2, Clock3, FolderKanban } from "lucide-react";

import { requireServerSession } from "@/lib/auth-helpers";
import { isAirtableConfigured, listAirtableJobPostings } from "@/lib/airtable";
import { listSupabaseJobPostings } from "@/lib/supabase-postings";
import PortalSyncPanel from "./sync-panel";

type JobApplicationPortalRow = {
  id: string;
  created_at: string;
  job_title: string;
  company: string;
  focus_areas: string | null;
  generated_output: {
    applicationSummary?: string;
  } | null;
};

export const revalidate = 0;

export default async function JobsPortalPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    company?: string;
    location?: string;
    days?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const { session, supabase } = await requireServerSession();
  const { company, q, location, days } = resolvedSearchParams ?? {};

  if (!session || !supabase) {
    return (
      <div className="space-y-4 rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-sm text-slate-300">
        <p>Sign in to open your Job Portal and sync live postings.</p>
        <Link
          href="/login"
          className="inline-flex items-center rounded-md border border-[#eaaa00]/40 bg-[#eaaa00]/10 px-3 py-2 text-xs font-medium text-[#ffe49a] hover:bg-[#eaaa00]/20"
        >
          Log in
        </Link>
      </div>
    );
  }

  const { data, error } = await supabase
    .from("job_applications")
    .select("id, created_at, job_title, company, focus_areas, generated_output")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to load job portal", error);
  }

  const applications = (data ?? []) as JobApplicationPortalRow[];
  const thisWeekCount = applications.filter((item) => {
    const created = new Date(item.created_at).getTime();
    return created >= Date.now() - 7 * 24 * 60 * 60 * 1000;
  }).length;

  const airtableEnabled = isAirtableConfigured();
  let postings = airtableEnabled
    ? await listAirtableJobPostings(60)
        .then((records) =>
          records.map((record) => ({
            id: record.id,
            title: record.fields.Title ?? "Untitled role",
            company: record.fields.Company ?? "Unknown company",
            location: record.fields.Location ?? null,
            url: record.fields.URL ?? "",
            snippet: record.fields.Snippet ?? "",
            lastSeenAt: record.fields.LastSeenAt ?? record.createdTime,
          })),
        )
        .catch(() => [])
    : await listSupabaseJobPostings(supabase, 60)
        .then((rows) =>
          rows.map((row) => ({
            id: row.id,
            title: row.title,
            company: row.company,
            location: row.location,
            url: row.url,
            snippet: row.snippet ?? "",
            lastSeenAt: row.last_seen_at,
          })),
        )
        .catch(() => []);

  const companyFilter = typeof company === "string" ? company.trim().toLowerCase() : "";
  const textFilter = typeof q === "string" ? q.trim().toLowerCase() : "";
  const locationFilter = typeof location === "string" ? location.trim().toLowerCase() : "";
  const daysFilter = typeof days === "string" ? Number(days) : NaN;

  if (companyFilter) {
    postings = postings.filter((posting) =>
      posting.company.toLowerCase().includes(companyFilter),
    );
  }
  if (locationFilter) {
    postings = postings.filter((posting) =>
      (posting.location ?? "").toLowerCase().includes(locationFilter),
    );
  }
  if (textFilter) {
    postings = postings.filter(
      (posting) =>
        posting.title.toLowerCase().includes(textFilter) ||
        posting.company.toLowerCase().includes(textFilter) ||
        posting.snippet.toLowerCase().includes(textFilter),
    );
  }
  if (!Number.isNaN(daysFilter) && daysFilter > 0) {
    const cutoff = Date.now() - daysFilter * 24 * 60 * 60 * 1000;
    postings = postings.filter((posting) => {
      const timestamp = new Date(posting.lastSeenAt).getTime();
      return Number.isFinite(timestamp) && timestamp >= cutoff;
    });
  }

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-slate-800/60 bg-slate-900/65 p-6">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#eaaa00]/40 bg-[#eaaa00]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#ffe39f]">
          <FolderKanban className="h-3.5 w-3.5" />
          Job Portal
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50">Application Tracker</h1>
        <p className="mt-2 text-sm text-slate-300">
          Track every role you generated materials for and quickly reopen your active
          pipeline.
        </p>
      </header>

      <PortalSyncPanel />

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total applications</p>
          <p className="mt-2 text-3xl font-semibold text-slate-100">{applications.length}</p>
        </article>
        <article className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
            <Clock3 className="h-3.5 w-3.5" />
            Added this week
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-100">{thisWeekCount}</p>
        </article>
        <article className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
            <BriefcaseBusiness className="h-3.5 w-3.5 text-[#eaaa00]" />
            Pipeline stage
          </p>
          <p className="mt-2 text-base font-semibold text-[#f4d27d]">
            Drafted materials ready
          </p>
        </article>
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-800/60 bg-slate-950/60 p-6">
        <form method="GET" className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-4">
          <input
            name="q"
            defaultValue={typeof q === "string" ? q : ""}
            placeholder="Search title or keyword"
            className="rounded-lg border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-sm text-white focus:border-[#eaaa00] focus:outline-none"
          />
          <input
            name="company"
            defaultValue={typeof company === "string" ? company : ""}
            placeholder="Company"
            className="rounded-lg border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-sm text-white focus:border-[#eaaa00] focus:outline-none"
          />
          <input
            name="location"
            defaultValue={typeof location === "string" ? location : ""}
            placeholder="Location"
            className="rounded-lg border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-sm text-white focus:border-[#eaaa00] focus:outline-none"
          />
          <div className="flex gap-2">
            <select
              name="days"
              defaultValue={typeof days === "string" ? days : ""}
              className="w-full rounded-lg border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-sm text-white focus:border-[#eaaa00] focus:outline-none"
            >
              <option value="">Any time</option>
              <option value="1">Past day</option>
              <option value="7">Past 7 days</option>
              <option value="30">Past 30 days</option>
            </select>
            <button
              type="submit"
              className="rounded-lg border border-[#eaaa00]/50 bg-[#eaaa00]/10 px-3 py-2 text-sm font-medium text-[#ffe49a] hover:bg-[#eaaa00]/20"
            >
              Filter
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Live Job Postings</h2>
            <p className="text-sm text-slate-400">
              Sourced via scraper and synced to {airtableEnabled ? "Airtable" : "Supabase"}.
            </p>
          </div>
          <span className="rounded-full border border-[#eaaa00]/40 bg-[#eaaa00]/10 px-3 py-1 text-xs font-medium text-[#f4d27d]">
            {postings.length} active
          </span>
        </div>

        {postings.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300">
            No postings yet. Run sync from <Link href="/admin/jobs" className="text-[#f4d27d] hover:text-[#ffe49a]">Admin Jobs</Link>.
          </p>
        ) : (
          <div className="space-y-3">
            {postings.map((posting) => (
              <article
                key={posting.id}
                className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-slate-100">{posting.title}</h3>
                    <p className="text-sm text-slate-300">{posting.company}</p>
                    {posting.location && (
                      <p className="text-xs text-slate-400">{posting.location}</p>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Seen {new Date(posting.lastSeenAt).toLocaleString()}
                  </p>
                </div>
                {posting.snippet && (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-300">{posting.snippet}</p>
                )}
                {posting.url && (
                  <div className="mt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={posting.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-[#eaaa00]/40 px-3 py-1 text-xs font-medium text-[#f4d27d] transition hover:bg-[#eaaa00]/10"
                      >
                        View posting
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                      <Link
                        href={`/jobs?jobTitle=${encodeURIComponent(posting.title)}&company=${encodeURIComponent(posting.company)}&jobUrl=${encodeURIComponent(posting.url)}`}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-[#eaaa00]/70 hover:text-[#ffe49a]"
                      >
                        Prepare application
                      </Link>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Apply flow: open posting, review requirements, then use Prepare
                      application to generate tailored materials.
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-sm text-slate-300">
          No tracked applications yet. Start in the{" "}
          <Link href="/jobs" className="text-[#f4d27d] hover:text-[#ffe49a]">
            Job Lab
          </Link>{" "}
          to create your first entry.
        </div>
      ) : (
        <section className="space-y-4">
          {applications.map((application) => (
            <article
              key={application.id}
              className="rounded-3xl border border-slate-800/60 bg-slate-950/60 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {new Date(application.created_at).toLocaleString()}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-100">
                    {application.job_title}
                  </h2>
                  <p className="inline-flex items-center gap-2 text-sm text-slate-300">
                    <Building2 className="h-4 w-4 text-slate-500" />
                    {application.company}
                  </p>
                </div>
                <div className="rounded-full border border-[#eaaa00]/40 bg-[#eaaa00]/10 px-3 py-1 text-xs font-medium text-[#f4d27d]">
                  Tracked
                </div>
              </div>
              {application.generated_output?.applicationSummary && (
                <p className="mt-4 line-clamp-2 text-sm text-slate-300">
                  {application.generated_output.applicationSummary}
                </p>
              )}
              {application.focus_areas && (
                <p className="mt-2 text-xs text-slate-400">
                  Focus: {application.focus_areas}
                </p>
              )}
              <div className="mt-4">
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-1 rounded-full border border-[#eaaa00]/40 px-3 py-1 text-xs font-medium text-[#f4d27d] transition hover:bg-[#eaaa00]/10"
                >
                  Open Job Lab
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
