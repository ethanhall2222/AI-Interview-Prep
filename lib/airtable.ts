import type { ScrapedJobPosting } from "@/lib/job-postings";

const AIRTABLE_API_BASE = "https://api.airtable.com/v0";

export type AirtableJobPosting = {
  id: string;
  createdTime: string;
  fields: {
    Title?: string;
    Company?: string;
    Location?: string;
    URL?: string;
    Source?: string;
    Snippet?: string;
    PostedAt?: string;
    ExternalId?: string;
    LastSeenAt?: string;
  };
};

function getAirtableEnv() {
  const token = process.env.AIRTABLE_PAT;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME ?? "JobPostings";
  if (!token || !baseId) {
    return null;
  }
  return { token, baseId, tableName };
}

export function isAirtableConfigured() {
  return Boolean(getAirtableEnv());
}

async function airtableRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const env = getAirtableEnv();
  if (!env) {
    throw new Error("Airtable is not configured. Set AIRTABLE_PAT and AIRTABLE_BASE_ID.");
  }
  const url = `${AIRTABLE_API_BASE}/${env.baseId}/${encodeURIComponent(env.tableName)}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Airtable request failed (${response.status}): ${text}`);
  }
  return (await response.json()) as T;
}

type AirtableListResponse = {
  records: AirtableJobPosting[];
  offset?: string;
};

export async function listAirtableJobPostings(limit = 100) {
  const records: AirtableJobPosting[] = [];
  let offset: string | undefined;

  do {
    const query = new URLSearchParams();
    query.set("pageSize", "100");
    query.set("sort[0][field]", "LastSeenAt");
    query.set("sort[0][direction]", "desc");
    if (offset) {
      query.set("offset", offset);
    }
    const payload = await airtableRequest<AirtableListResponse>(`?${query.toString()}`);
    records.push(...payload.records);
    offset = payload.offset;
  } while (offset && records.length < limit);

  return records.slice(0, limit);
}

function chunks<T>(items: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export async function upsertAirtableJobPostings(postings: ScrapedJobPosting[]) {
  const nowIso = new Date().toISOString();
  const existing = await listAirtableJobPostings(500);
  const existingByExternalId = new Map<string, AirtableJobPosting>();
  existing.forEach((record) => {
    const key = record.fields.ExternalId;
    if (key) {
      existingByExternalId.set(key, record);
    }
  });

  const creates: Array<{ fields: AirtableJobPosting["fields"] }> = [];
  const updates: Array<{ id: string; fields: AirtableJobPosting["fields"] }> = [];

  postings.forEach((posting) => {
    const fields: AirtableJobPosting["fields"] = {
      Title: posting.title,
      Company: posting.company,
      Location: posting.location,
      URL: posting.url,
      Source: posting.source,
      Snippet: posting.snippet,
      PostedAt: posting.postedAt,
      ExternalId: posting.externalId,
      LastSeenAt: nowIso,
    };
    const existingRecord = existingByExternalId.get(posting.externalId);
    if (existingRecord) {
      updates.push({ id: existingRecord.id, fields });
    } else {
      creates.push({ fields });
    }
  });

  for (const batch of chunks(creates, 10)) {
    await airtableRequest("", {
      method: "POST",
      body: JSON.stringify({ records: batch }),
    });
  }

  for (const batch of chunks(updates, 10)) {
    await airtableRequest("", {
      method: "PATCH",
      body: JSON.stringify({ records: batch }),
    });
  }

  return {
    created: creates.length,
    updated: updates.length,
    total: postings.length,
  };
}
