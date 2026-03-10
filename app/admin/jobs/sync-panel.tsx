"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/Button";

type SyncResult = {
  scraped: number;
  valid?: number;
  created: number;
  updated: number;
  store?: "airtable" | "supabase";
  failures?: Array<{ source: string; message: string }>;
  message?: string;
};

export default function AdminJobsSyncPanel() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  const runSync = async () => {
    setRunning(true);
    setResult(null);
    try {
      const response = await fetch("/api/jobs/sync", { method: "POST" });
      const payload = (await response.json()) as SyncResult;
      setResult(payload);
    } catch {
      setResult({ scraped: 0, created: 0, updated: 0, message: "Sync failed." });
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-800/60 bg-slate-900/65 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Ingest Job Postings</h2>
          <p className="text-sm text-slate-400">
            Scrape configured sources and upsert into Airtable.
          </p>
        </div>
        <Button type="button" onClick={runSync} disabled={running}>
          {running ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Sync now
        </Button>
      </div>
      {result && (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
          {result.message ? (
            <p>{result.message}</p>
          ) : (
            <p>
              Scraped {result.scraped}
              {typeof result.valid === "number" ? `, valid ${result.valid}` : ""}
              , created {result.created}, updated {result.updated}
              {result.store ? ` (${result.store})` : ""}.
            </p>
          )}
          {result.failures && result.failures.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-400">
              {result.failures.slice(0, 5).map((failure) => (
                <li key={`${failure.source}-${failure.message}`}>
                  {failure.source}: {failure.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
