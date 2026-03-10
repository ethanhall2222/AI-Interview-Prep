"use client";

import React, { ChangeEvent, useMemo, useState } from "react";
import {
  analyzeResumeAgainstJob,
  formatAnalysisForExport,
  sampleJobDescriptionText,
  sampleResumeText,
} from "@/lib/resume-review";
import { Button } from "@/components/Button";
import { useToast } from "@/components/ToastProvider";
import { trackEvent } from "@/lib/analytics";
import WorkflowRail from "@/components/WorkflowRail";

export default function ResumeReviewClient() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescriptionText, setJobDescriptionText] = useState("");
  const [analysisReady, setAnalysisReady] = useState(false);
  const { publish } = useToast();

  const analysis = useMemo(() => {
    if (!analysisReady) {
      return null;
    }
    return analyzeResumeAgainstJob(resumeText, jobDescriptionText);
  }, [analysisReady, resumeText, jobDescriptionText]);

  const runAnalysis = () => {
    if (resumeText.trim().length < 80) {
      publish("Paste a fuller resume before running review.", "error");
      return;
    }
    if (jobDescriptionText.trim().length < 80) {
      publish("Paste a job description so keyword and fit analysis can run.", "error");
      return;
    }
    setAnalysisReady(true);
    trackEvent("resume_review_ran", {
      resumeLength: resumeText.length,
      jdLength: jobDescriptionText.length,
    });
  };

  const onFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
      const text = await file.text();
      setResumeText(text);
      publish("TXT resume loaded.", "success");
      trackEvent("resume_txt_uploaded", { length: text.length });
      return;
    }
    publish("PDF and DOCX upload parsing is scaffolded. Paste content for now.", "info");
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      publish(`${label} copied`, "success");
      trackEvent("resume_review_copied", { label });
    } catch {
      publish("Copy failed. You can still select and copy manually.", "error");
    }
  };

  const exportTxt = () => {
    if (!analysis) {
      return;
    }
    const payload = formatAnalysisForExport(analysis);
    const blob = new Blob([payload], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "resume-review.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <WorkflowRail current="resume-review" />

      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-50">Resume Review</h1>
        <p className="text-sm text-slate-300">
          Compare your resume against a target job description and get actionable rewrite
          guidance, ATS checks, and keyword gaps.
        </p>
      </header>

      <section className="grid gap-6 rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6 md:grid-cols-2">
        <div className="space-y-3">
          <label htmlFor="resume-text" className="text-sm font-medium text-slate-200">
            Resume text
          </label>
          <textarea
            id="resume-text"
            value={resumeText}
            onChange={(event) => setResumeText(event.target.value)}
            placeholder="Paste your resume text here"
            className="min-h-[280px] w-full rounded-xl border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-sm text-white focus:border-[#eaaa00] focus:outline-none"
          />
          <div className="flex flex-wrap gap-2">
            <label
              htmlFor="resume-upload"
              className="inline-flex cursor-pointer items-center rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-[#eaaa00]/70"
            >
              Upload resume (.txt, .pdf, .docx)
            </label>
            <input
              id="resume-upload"
              type="file"
              className="hidden"
              accept=".txt,.pdf,.doc,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={onFileUpload}
            />
            <Button
              type="button"
              intent="ghost"
              size="sm"
              onClick={() => setResumeText(sampleResumeText)}
            >
              Use sample resume
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <label htmlFor="jd-text" className="text-sm font-medium text-slate-200">
            Job description
          </label>
          <textarea
            id="jd-text"
            value={jobDescriptionText}
            onChange={(event) => setJobDescriptionText(event.target.value)}
            placeholder="Paste the target job description"
            className="min-h-[280px] w-full rounded-xl border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-sm text-white focus:border-[#eaaa00] focus:outline-none"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              intent="ghost"
              size="sm"
              onClick={() => setJobDescriptionText(sampleJobDescriptionText)}
            >
              Use sample job description
            </Button>
            <Button type="button" onClick={runAnalysis}>
              Run resume review
            </Button>
          </div>
        </div>
      </section>

      {analysis && (
        <section className="space-y-6">
          <article className="rounded-2xl border border-[#eaaa00]/45 bg-[#eaaa00]/10 p-5">
            <h2 className="text-lg font-semibold text-[#ffe49a]">Fix this first</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {analysis.summary.priorityFixes.map((fix) => (
                <p
                  key={fix}
                  className="rounded-lg border border-[#eaaa00]/30 bg-slate-950/40 p-3 text-sm text-slate-100"
                >
                  {fix}
                </p>
              ))}
            </div>
            <div className="mt-4 grid gap-3 text-xs text-slate-200 md:grid-cols-2">
              <p className="rounded-lg border border-slate-700/70 bg-slate-950/40 px-3 py-2">
                Keyword coverage score:{" "}
                <span className="font-semibold text-[#ffe49a]">
                  {analysis.summary.coverageScore}%
                </span>
              </p>
              <p className="rounded-lg border border-slate-700/70 bg-slate-950/40 px-3 py-2">
                Bullet quality score:{" "}
                <span className="font-semibold text-[#ffe49a]">
                  {analysis.summary.bulletScore}%
                </span>
              </p>
            </div>
          </article>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              intent="secondary"
              onClick={() => copyText(formatAnalysisForExport(analysis), "Full review")}
            >
              Copy full review
            </Button>
            <Button type="button" intent="secondary" onClick={exportTxt}>
              Export txt
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
              <h2 className="text-lg font-semibold text-slate-100">Top issues checklist</h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
                {analysis.issues.length === 0 ? (
                  <li>No major issues detected. Focus on tailoring to the target role.</li>
                ) : (
                  analysis.issues.map((item) => <li key={item}>{item}</li>)
                )}
              </ul>
            </article>

            <article className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
              <h2 className="text-lg font-semibold text-slate-100">Keyword gaps</h2>
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {analysis.keywordInsights
                    .filter((item) => item.status === "missing")
                    .slice(0, 14)
                    .map((item) => (
                      <span
                        key={`missing-${item.keyword}`}
                        className="rounded-full border border-red-400/35 bg-red-500/10 px-3 py-1 text-xs text-red-100"
                      >
                        {item.keyword}
                      </span>
                    ))}
                  {analysis.keywordGaps.length === 0 && (
                    <p className="text-sm text-slate-300">Keyword coverage looks strong.</p>
                  )}
                </div>

                <div className="grid gap-2 text-xs md:grid-cols-2">
                  <div>
                    <p className="mb-1 font-semibold uppercase tracking-wide text-slate-500">
                      Present keywords
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.keywordInsights
                        .filter((item) => item.status === "present")
                        .slice(0, 10)
                        .map((item) => (
                          <span
                            key={`present-${item.keyword}`}
                            className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100"
                          >
                            {item.keyword}
                          </span>
                        ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 font-semibold uppercase tracking-wide text-slate-500">
                      Overused keywords
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.keywordInsights
                        .filter((item) => item.status === "overused")
                        .slice(0, 10)
                        .map((item) => (
                          <span
                            key={`overused-${item.keyword}`}
                            className="rounded-full border border-amber-400/35 bg-amber-500/10 px-3 py-1 text-xs text-amber-100"
                          >
                            {item.keyword}
                          </span>
                        ))}
                      {analysis.keywordInsights.filter((item) => item.status === "overused")
                        .length === 0 && (
                        <p className="text-sm text-slate-400">No major overuse detected.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <article className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold text-slate-100">Section extraction</h2>
            <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
              {[
                ["Summary", analysis.sections.summary.length],
                ["Experience", analysis.sections.experience.length],
                ["Projects", analysis.sections.projects.length],
                ["Skills", analysis.sections.skills.length],
                ["Education", analysis.sections.education.length],
              ].map(([label, count]) => (
                <p
                  key={label}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-300"
                >
                  {label}: <span className="font-semibold text-slate-100">{count}</span> lines
                </p>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold text-slate-100">Bullet quality checks</h2>
            {analysis.bulletFindings.length === 0 ? (
              <p className="mt-3 text-sm text-slate-300">
                Bullet structure is solid. Keep metrics and scope concrete.
              </p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {analysis.bulletFindings.slice(0, 8).map((finding) => (
                  <li
                    key={`${finding.bullet}-${finding.problems.join("|")}`}
                    className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-slate-100">{finding.bullet}</p>
                    <p className="mt-1 text-xs text-slate-400">{finding.problems.join(" · ")}</p>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold text-slate-100">ATS warnings</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
              {analysis.atsWarnings.length === 0 ? (
                <li>No major ATS issues detected from plain-text heuristics.</li>
              ) : (
                analysis.atsWarnings.map((warning) => <li key={warning}>{warning}</li>)
              )}
            </ul>
          </article>

          <article className="space-y-3 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold text-slate-100">Before / After rewrites</h2>
            <div className="space-y-3">
              {analysis.rewriteSuggestions.map((item) => (
                <div
                  key={`${item.original}-${item.improved}`}
                  className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 md:grid-cols-2"
                >
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Before</p>
                    <p className="mt-1 text-sm text-slate-300">{item.original}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">After</p>
                    <p className="mt-1 text-sm text-slate-100">{item.improved}</p>
                    <p className="mt-2 text-xs text-slate-400">{item.why}</p>
                    <Button
                      type="button"
                      intent="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => copyText(item.improved, "Rewrite")}
                    >
                      Copy rewrite
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}
    </div>
  );
}
