import { NextResponse } from "next/server";

import { isAirtableConfigured, upsertAirtableJobPostings } from "@/lib/airtable";
import { getJobSourceUrls, scrapeJobSources, validateScrapedPostings } from "@/lib/job-postings";
import { requireServerSession } from "@/lib/auth-helpers";
import { upsertSupabaseJobPostings } from "@/lib/supabase-postings";

export async function POST(request: Request) {
  const { supabase } = await requireServerSession();

  try {
    await supabase
      .from("external_job_postings")
      .delete()
      .or("url.ilike.%greenhouse%,source.ilike.%greenhouse%");

    const body = (await request.json().catch(() => ({}))) as {
      sources?: string[];
    };
    const sources =
      Array.isArray(body.sources) && body.sources.length > 0
        ? body.sources
        : getJobSourceUrls();

    if (sources.length === 0) {
      return NextResponse.json(
        { message: "No job sources configured. Set JOB_SOURCE_URLS in env." },
        { status: 400 },
      );
    }

    const { postings, failures } = await scrapeJobSources(sources);
    const validated = await validateScrapedPostings(postings);
    const usablePostings = validated.postings.map((posting) => {
      if (posting.company.toLowerCase() !== "unknown company") {
        return posting;
      }
      try {
        const host = new URL(posting.url).hostname.split(".");
        const root = host.length >= 2 ? host[host.length - 2] : host[0];
        const company = root
          .split(/[-_]/)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");
        return { ...posting, company: company || "Unknown company" };
      } catch {
        return posting;
      }
    });

    if (usablePostings.length === 0) {
      return NextResponse.json({
        scraped: postings.length,
        valid: 0,
        created: 0,
        updated: 0,
        failures: [...failures, ...validated.failures],
      });
    }

    const usingAirtable = isAirtableConfigured();
    const upserted = usingAirtable
      ? await upsertAirtableJobPostings(usablePostings)
      : await upsertSupabaseJobPostings(supabase, usablePostings);
    return NextResponse.json({
      scraped: postings.length,
      valid: usablePostings.length,
      created: upserted.created,
      updated: upserted.updated,
      store: usingAirtable ? "airtable" : "supabase",
      failures: [...failures, ...validated.failures],
      preview: usablePostings.slice(0, 8),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to sync job postings.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
