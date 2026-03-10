"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { trackEvent } from "@/lib/analytics";
import WorkflowRail from "@/components/WorkflowRail";

type ApplicationStatus = "saved" | "applied" | "interviewing" | "offer" | "rejected";

type TrackerEntry = {
  id: string;
  company: string;
  role: string;
  link: string;
  status: ApplicationStatus;
  appliedDate: string;
  notes: string;
  updatedAt: string;
};

const STORAGE_KEY = "hire-ground-tracker-v1";

const statuses: ApplicationStatus[] = [
  "saved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
];

export default function TrackerClient() {
  const [entries, setEntries] = useState<TrackerEntry[]>([]);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [link, setLink] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("saved");
  const [appliedDate, setAppliedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as TrackerEntry[];
      setEntries(parsed);
    } catch {
      setEntries([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      if (filter !== "all" && entry.status !== filter) {
        return false;
      }
      if (query.trim().length === 0) {
        return true;
      }
      const search = query.toLowerCase();
      return (
        entry.company.toLowerCase().includes(search) ||
        entry.role.toLowerCase().includes(search) ||
        entry.notes.toLowerCase().includes(search)
      );
    });
  }, [entries, filter, query]);

  const addEntry = () => {
    if (!company.trim() || !role.trim()) {
      return;
    }
    const entry: TrackerEntry = {
      id: crypto.randomUUID(),
      company: company.trim(),
      role: role.trim(),
      link: link.trim(),
      status,
      appliedDate: appliedDate || new Date().toISOString().slice(0, 10),
      notes: notes.trim(),
      updatedAt: new Date().toISOString(),
    };
    setEntries((current) => [entry, ...current]);
    trackEvent("tracker_added", {
      company: entry.company,
      role: entry.role,
      status: entry.status,
    });
    setCompany("");
    setRole("");
    setLink("");
    setStatus("saved");
    setAppliedDate("");
    setNotes("");
  };

  const updateStatus = (id: string, nextStatus: ApplicationStatus) => {
    setEntries((current) =>
      current.map((entry) =>
        entry.id === id
          ? { ...entry, status: nextStatus, updatedAt: new Date().toISOString() }
          : entry,
      ),
    );
    trackEvent("tracker_status_changed", { status: nextStatus });
  };

  return (
    <div className="space-y-8">
      <WorkflowRail current="tracker" />
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-50">Application Tracker</h1>
        <p className="text-sm text-slate-300">
          Capture each application, update status quickly, and keep notes ready before
          every recruiter round.
        </p>
      </header>

      <section className="grid gap-3 rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6 md:grid-cols-2">
        <label className="space-y-1 text-sm text-slate-200">
          Company
          <input
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            className="w-full rounded-lg border border-slate-700/70 bg-slate-950 px-3 py-2 text-sm text-white focus:border-[#eaaa00] focus:outline-none"
          />
        </label>
        <label className="space-y-1 text-sm text-slate-200">
          Role
          <input
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="w-full rounded-lg border border-slate-700/70 bg-slate-950 px-3 py-2 text-sm text-white focus:border-[#eaaa00] focus:outline-none"
          />
        </label>
        <label className="space-y-1 text-sm text-slate-200">
          Job link
          <input
            value={link}
            onChange={(event) => setLink(event.target.value)}
            className="w-full rounded-lg border border-slate-700/70 bg-slate-950 px-3 py-2 text-sm text-white focus:border-[#eaaa00] focus:outline-none"
          />
        </label>
        <label className="space-y-1 text-sm text-slate-200">
          Applied date
          <input
            type="date"
            value={appliedDate}
            onChange={(event) => setAppliedDate(event.target.value)}
            className="w-full rounded-lg border border-slate-700/70 bg-slate-950 px-3 py-2 text-sm text-white focus:border-[#eaaa00] focus:outline-none"
          />
        </label>
        <label className="space-y-1 text-sm text-slate-200">
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as ApplicationStatus)}
            className="w-full rounded-lg border border-slate-700/70 bg-slate-950 px-3 py-2 text-sm text-white focus:border-[#eaaa00] focus:outline-none"
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm text-slate-200 md:col-span-2">
          Notes
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="min-h-[90px] w-full rounded-lg border border-slate-700/70 bg-slate-950 px-3 py-2 text-sm text-white focus:border-[#eaaa00] focus:outline-none"
          />
        </label>
        <div className="md:col-span-2">
          <Button type="button" onClick={addEntry}>
            Add application
          </Button>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-800/60 bg-slate-950/60 p-6">
        <div className="flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by company, role, notes"
            className="w-72 rounded-lg border border-slate-700/70 bg-slate-950 px-3 py-2 text-sm text-white focus:border-[#eaaa00] focus:outline-none"
          />
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as ApplicationStatus | "all")}
            className="rounded-lg border border-slate-700/70 bg-slate-950 px-3 py-2 text-sm text-white focus:border-[#eaaa00] focus:outline-none"
          >
            <option value="all">All statuses</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300">
            No applications yet. Add one above to start tracking.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2">Company</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Link</th>
                  <th className="px-3 py-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filtered.map((entry) => (
                  <tr key={entry.id} className="text-slate-200">
                    <td className="px-3 py-2">{entry.company}</td>
                    <td className="px-3 py-2">{entry.role}</td>
                    <td className="px-3 py-2">{entry.appliedDate}</td>
                    <td className="px-3 py-2">
                      <select
                        value={entry.status}
                        onChange={(event) =>
                          updateStatus(entry.id, event.target.value as ApplicationStatus)
                        }
                        className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 focus:border-[#eaaa00] focus:outline-none"
                      >
                        {statuses.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      {entry.link ? (
                        <a
                          href={entry.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#f4d27d] hover:text-[#ffe49a]"
                        >
                          Open
                        </a>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-300">{entry.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
