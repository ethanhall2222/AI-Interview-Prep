import { NextResponse } from "next/server";

import { isAirtableConfigured, listAirtableJobPostings } from "@/lib/airtable";
import { requireServerSession } from "@/lib/auth-helpers";
import { listSupabaseJobPostings } from "@/lib/supabase-postings";

export async function GET() {
  const { supabase } = await requireServerSession();

  try {
    if (isAirtableConfigured()) {
      const records = await listAirtableJobPostings(150);
      const postings = records
        .map((record) => ({
          id: record.id,
          title: record.fields.Title ?? "Untitled role",
          company: record.fields.Company ?? "Unknown company",
          location: record.fields.Location ?? null,
          url: record.fields.URL ?? "",
          source: record.fields.Source ?? "",
          snippet: record.fields.Snippet ?? "",
          postedAt: record.fields.PostedAt ?? null,
          lastSeenAt: record.fields.LastSeenAt ?? record.createdTime,
        }))
        .filter((posting) => !/greenhouse\.io/i.test(`${posting.url} ${posting.source}`));
      return NextResponse.json({ postings, store: "airtable" });
    }

    const rows = await listSupabaseJobPostings(supabase, 150);
    const postings = rows.map((row) => ({
      id: row.id,
      title: row.title,
      company: row.company,
      location: row.location,
      url: row.url,
      source: row.source,
      snippet: row.snippet ?? "",
      postedAt: row.posted_at,
      lastSeenAt: row.last_seen_at,
    }));
    return NextResponse.json({ postings, store: "supabase" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load job postings.";
    return NextResponse.json({ message, postings: [] }, { status: 500 });
  }
}
