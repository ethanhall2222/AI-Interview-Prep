import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  ClipboardCheck,
  MessageSquareText,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { buttonStyles } from "@/components/Button";
import { getOptionalServerSession } from "@/lib/auth-helpers";

const featureCards = [
  {
    title: "Role-specific prompts",
    description:
      "Leverage AI-crafted behavioral questions tailored to Data Analyst, Product Manager, and SWE interviews.",
    icon: BrainCircuit,
  },
  {
    title: "STAR feedback",
    description:
      "Structured scoring that pinpoints gaps in structure, relevance, impact, and delivery for every spoken or typed answer.",
    icon: ClipboardCheck,
  },
  {
    title: "Longitudinal insights",
    description:
      "Dashboard memories store every session so you can measure trend lines and prep efficiently.",
    icon: TrendingUp,
  },
];

export default async function Home() {
  const { session } = await getOptionalServerSession();

  const primaryCta = session
    ? {
        href: "/practice",
        label: "Start practicing",
      }
    : {
        href: "/login",
        label: "Get started",
      };

  return (
    <div className="space-y-16 pb-12">
      <section className="relative overflow-hidden rounded-[2.25rem] border border-slate-800/60 bg-gradient-to-br from-[#0f172a] via-[#111a2f] to-[#030712] p-12 text-white shadow-[0_32px_80px_-48px_rgba(15,23,42,0.9)]">
        <div className="absolute inset-0 opacity-35">
          <div className="absolute -top-32 -right-20 h-72 w-72 rounded-full bg-blue-500/25 blur-[130px]" />
          <div className="absolute bottom-0 left-12 h-56 w-56 rounded-full bg-sky-400/20 blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.08),_transparent_55%)]" />
        </div>
        <div className="relative grid gap-12 lg:grid-cols-[1.35fr_1fr]">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-100">
              <Sparkles className="h-3.5 w-3.5" /> Mock interviews, evolved
            </p>
            <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
              Speak with confidence. Get feedback that sticks.
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-slate-100/90">
              Interview Coach pairs voice-led drills with STAR-aligned coaching. Generate
              focused questions, speak your answer out loud, refine the transcript, and
              track progress with actionable AI feedback.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href={primaryCta.href}
                className={`${buttonStyles({ intent: "primary", size: "lg" })} shadow-[0_18px_45px_-15px_rgba(37,99,235,0.55)]`}
              >
                {primaryCta.label}
              </Link>
              <Link
                href="/dashboard"
                className={`${buttonStyles({ intent: "secondary", size: "lg" })} border-white/25 text-white hover:border-white/55`}
              >
                View dashboard
              </Link>
            </div>
            <div className="grid gap-4 text-xs text-slate-100/80 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">Designed for senior interviews</p>
                <p className="mt-1 leading-relaxed text-slate-100/75">
                  Calibrate storytelling for Staff+, EM, and Product leadership roles with
                  prompts written by FAANG interviewers.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">Voice-first practice</p>
                <p className="mt-1 leading-relaxed text-slate-100/75">
                  Capture spoken answers, edit the AI transcript, and submit when you are
                  satisfied.
                </p>
              </div>
            </div>
          </div>
          <div className="relative space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <MessageSquareText className="h-4 w-4" /> What you’ll rehearse
            </h2>
            <div className="space-y-3 text-xs text-slate-100/80">
              <p className="leading-relaxed">
                “Tell me about a high-stakes roadmap decision you led when stakeholders
                were misaligned.”
              </p>
              <p className="leading-relaxed">
                “How do you measure impact when the signal is ambiguous or lagging?”
              </p>
              <p className="leading-relaxed">
                “Walk me through the last time you stepped in to rebuild trust on a team.”
              </p>
            </div>
            <hr className="border-white/10" />
            <div className="space-y-4 text-xs text-white/90">
              <p className="uppercase tracking-wide text-[11px] text-white/70">
                What you get back
              </p>
              <div className="grid gap-2 text-white">
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2">
                  <ArrowRight className="h-3.5 w-3.5 text-indigo-200" /> STAR heatmap with
                  per-dimension scores
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2">
                  <ArrowRight className="h-3.5 w-3.5 text-indigo-200" /> Transcript edits
                  & AI-flagged weak spots
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2">
                  <ArrowRight className="h-3.5 w-3.5 text-indigo-200" /> Next-step prompts
                  to keep sharpening
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-100">
            Build a portfolio of confident answers
          </h2>
          <span className="text-xs uppercase tracking-wide text-slate-500">
            Crafted for real interviews
          </span>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featureCards.map((feature) => (
            <article
              key={feature.title}
              className="space-y-3 rounded-2xl border border-slate-800/60 bg-slate-900/65 p-6 text-slate-100 shadow-lg shadow-slate-950/25 transition hover:border-blue-500/60 hover:shadow-blue-600/10"
            >
              <feature.icon className="h-8 w-8 text-indigo-400" />
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-slate-300">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
