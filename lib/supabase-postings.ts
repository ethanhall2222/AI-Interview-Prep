import type { TypedSupabaseClient } from "@/lib/supabase-server";
import type { ScrapedJobPosting } from "@/lib/job-postings";

export type SupabaseJobPostingRow = {
  id: string;
  created_at: string;
  external_id: string;
  title: string;
  company: string;
  location: string | null;
  url: string;
  source: string;
  snippet: string | null;
  posted_at: string | null;
  last_seen_at: string;
};

export async function listSupabaseJobPostings(
  supabase: TypedSupabaseClient,
  limit = 100,
) {
  const { data, error } = await supabase
    .from("external_job_postings")
    .select(
      "id, created_at, external_id, title, company, location, url, source, snippet, posted_at, last_seen_at",
    )
    .not("url", "ilike", "%greenhouse%")
    .not("source", "ilike", "%greenhouse%")
    .order("last_seen_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SupabaseJobPostingRow[];
}

export async function upsertSupabaseJobPostings(
  supabase: TypedSupabaseClient,
  postings: ScrapedJobPosting[],
) {
  if (postings.length === 0) {
    return { created: 0, updated: 0, total: 0 };
  }

  const nowIso = new Date().toISOString();
  const payload = postings.map((posting) => ({
    external_id: posting.externalId,
    title: posting.title,
    company: posting.company,
    location: posting.location ?? null,
    url: posting.url,
    source: posting.source,
    snippet: posting.snippet ?? null,
    posted_at: posting.postedAt ?? null,
    last_seen_at: nowIso,
  }));

  const { error } = await supabase
    .from("external_job_postings")
    .upsert(payload, { onConflict: "external_id" });

  if (error) {
    throw new Error(error.message);
  }

  return {
    created: payload.length,
    updated: 0,
    total: payload.length,
  };
}
