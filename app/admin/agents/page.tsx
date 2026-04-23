import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleDot,
  ExternalLink,
  GitBranch,
  Layers3,
} from "lucide-react";

import {
  agencyAgents,
  agencySourceRepo,
  buildContinuousBuildPrompt,
  continuousBuildStages,
  getAgentById,
  getAgentCoverageSummary,
} from "@/lib/agency-agents";
import { requireAdminSession } from "@/lib/auth-helpers";

export const revalidate = 0;

const laneTone: Record<string, string> = {
  Discover: "border-cyan-400/35 bg-cyan-500/10 text-cyan-100",
  Shape: "border-fuchsia-400/35 bg-fuchsia-500/10 text-fuchsia-100",
  Build: "border-[#eaaa00]/35 bg-[#eaaa00]/10 text-[#ffe49a]",
  Verify: "border-emerald-400/35 bg-emerald-500/10 text-emerald-100",
  Launch: "border-sky-400/35 bg-sky-500/10 text-sky-100",
  Learn: "border-slate-500/45 bg-slate-800/60 text-slate-100",
};

export default async function AdminAgentsPage() {
  await requireAdminSession();

  const coverage = getAgentCoverageSummary();
  const totalOutputs = coverage.reduce((total, item) => total + item.outputCount, 0);
  const prompt = buildContinuousBuildPrompt(
    "Improve Hire Ground with the next highest-impact interview helper workflow",
  );

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-slate-800/60 bg-slate-900/65 p-6">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#eaaa00]/40 bg-[#eaaa00]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#ffe39f]">
          <Bot className="h-3.5 w-3.5" />
          Agency Build System
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50">
          Continuous Build Command Center
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
          A role-based agent architecture adapted from Agency Agents to keep Hire
          Ground shipping in a repeatable loop: discover, shape, build, verify,
          launch, and learn.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={agencySourceRepo}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-[#eaaa00]/60 hover:text-[#ffe49a]"
          >
            Source architecture
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/admin/jobs"
            className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-[#eaaa00]/60 hover:text-[#ffe49a]"
          >
            Job review queue
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
            <Bot className="h-3.5 w-3.5 text-[#eaaa00]" />
            Active agents
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-100">
            {agencyAgents.length}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
            <Layers3 className="h-3.5 w-3.5 text-[#eaaa00]" />
            Build lanes
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-100">
            {continuousBuildStages.length}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#eaaa00]" />
            Expected outputs
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-100">{totalOutputs}</p>
        </article>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Build Loop</h2>
            <p className="text-sm text-slate-400">
              Each lane has named agents, exit criteria, and outputs that feed the next
              lane.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#eaaa00]/40 bg-[#eaaa00]/10 px-3 py-1 text-xs font-medium text-[#f4d27d]">
            <GitBranch className="h-3.5 w-3.5" />
            Continuous delivery ready
          </span>
        </div>

        <div className="grid gap-4">
          {continuousBuildStages.map((stage) => (
            <article
              key={stage.lane}
              className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                      laneTone[stage.lane]
                    }`}
                  >
                    {stage.lane}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-slate-100">
                    {stage.purpose}
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  {stage.agentIds.length} agent
                  {stage.agentIds.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {stage.agentIds.map((agentId) => {
                  const agent = getAgentById(agentId);
                  if (!agent) {
                    return null;
                  }

                  return (
                    <div
                      key={agent.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
                    >
                      <p className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                        <CircleDot className="h-3.5 w-3.5 text-[#eaaa00]" />
                        {agent.name}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-300">
                        {agent.mission}
                      </p>
                      <p className="mt-3 text-xs text-slate-500">
                        Output: {agent.outputs.slice(0, 3).join(", ")}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Exit criteria
                </p>
                <ul className="mt-2 grid gap-2 text-sm text-slate-300 md:grid-cols-3">
                  {stage.exitCriteria.map((criterion) => (
                    <li key={criterion} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-5">
          <h2 className="text-xl font-semibold text-slate-100">Agent Roster</h2>
          <div className="mt-4 grid gap-3">
            {agencyAgents.map((agent) => (
              <div
                key={agent.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">
                      {agent.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {agent.division} | {agent.sourcePath}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                      laneTone[agent.lane]
                    }`}
                  >
                    {agent.lane}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  {agent.operatingRule}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Metric: {agent.successMetric}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-5">
          <h2 className="text-xl font-semibold text-slate-100">Reusable Build Prompt</h2>
          <p className="mt-2 text-sm text-slate-400">
            Use this prompt when starting the next feature pass so every agent produces
            the right handoff.
          </p>
          <pre className="mt-4 max-h-[620px] overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-relaxed text-slate-300">
            {prompt}
          </pre>
        </article>
      </section>
    </div>
  );
}
