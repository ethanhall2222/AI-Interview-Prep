import Link from "next/link";
import { ArrowRight, ClipboardCheck, Mic, Sparkles } from "lucide-react";

import { buttonStyles } from "@/components/Button";
import { getOptionalServerSession } from "@/lib/auth-helpers";

const featureList = [
  {
    title: "Voice-first drills",
    description:
      "Record answers one question at a time, review the transcript, and keep iterating until it sounds right.",
    icon: Mic,
  },
  {
    title: "STAR grading",
    description:
      "Structured scoring across structure, relevance, impact, and delivery—plus precise improvements for each answer.",
    icon: ClipboardCheck,
  },
  {
    title: "Momentum tracking",
    description:
      "Every session is saved to your dashboard so you can scan progress, spot trends, and prepare with intention.",
    icon: ArrowRight,
  },
];

const journeySteps = [
  {
    title: "1. Pick a target role",
    description: "Start in Job Lab with a posting URL or pasted job description.",
    href: "/jobs",
    cta: "Open Job Lab",
  },
  {
    title: "2. Tailor your resume",
    description: "Run Resume Review to surface keyword gaps and rewrite weak bullets.",
    href: "/resume-review",
    cta: "Review resume",
  },
  {
    title: "3. Rehearse answers",
    description: "Use Interview Prep for STAR drills and timed mock prompts.",
    href: "/interview-prep",
    cta: "Start prep",
  },
  {
    title: "4. Track pipeline",
    description: "Keep every application, status, and note in one tracker.",
    href: "/tracker",
    cta: "Track apps",
  },
];

export default async function Home() {
  const { session } = await getOptionalServerSession();

  const primaryCta = session
    ? {
        href: "/practice",
        label: "Start a session",
      }
    : {
        href: "/login",
        label: "Create free account",
      };

  return (
    <div className="space-y-16 pb-12">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-800/60 bg-gradient-to-br from-[#001a3a] via-[#002855] to-[#011025] p-12 text-white shadow-[0_30px_80px_-55px_rgba(15,23,42,0.9)]">
        <div className="absolute inset-0">
          <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-[#eaaa00]/20 blur-[140px]" />
          <div className="absolute bottom-[-80px] right-12 h-72 w-72 rounded-full bg-[#004a98]/30 blur-[140px]" />
        </div>
        <div className="relative space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-100">
            <Sparkles className="h-3.5 w-3.5" /> Hire Ground
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
            Record a sharper story. Ship answers you trust.
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-slate-100/85">
            Practice the way the real conversation happens: voice-first, question by
            question. Each run gives you targeted STAR feedback, highlights what to fix,
            and saves the transcript so you can track momentum over time.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={primaryCta.href}
              className={`${buttonStyles({ intent: "primary", size: "lg" })} shadow-[0_20px_45px_-18px_rgba(234,170,0,0.45)]`}
            >
              {primaryCta.label}
            </Link>
            <Link
              href="/practice"
              className={`${buttonStyles({ intent: "secondary", size: "lg" })} border-white/25 text-white hover:border-white/50`}
            >
              Explore the flow
            </Link>
          </div>
          <dl className="grid gap-4 text-xs text-white/70 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <dt className="uppercase tracking-wide">Interview modes</dt>
              <dd className="mt-1 text-lg font-semibold text-white">
                Behavioral · Situational · Technical
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <dt className="uppercase tracking-wide">Answer cadence</dt>
              <dd className="mt-1 text-lg font-semibold text-white">
                One question at a time
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <dt className="uppercase tracking-wide">Feedback turnaround</dt>
              <dd className="mt-1 text-lg font-semibold text-white">Under 30 seconds</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-100">What you get inside</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {featureList.map((feature) => (
            <article
              key={feature.title}
              className="space-y-3 rounded-2xl border border-slate-800/60 bg-slate-900/65 p-6 text-slate-100 shadow-lg shadow-slate-950/20 transition hover:border-[#eaaa00]/60 hover:shadow-[#eaaa00]/10"
            >
              <feature.icon className="h-8 w-8 text-[#f2c04b]" />
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-slate-300">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6 rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">
              Landing to interview-ready in four steps
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Follow this path: landing -&gt; job description -&gt; resume review -&gt;
              outputs -&gt; interview prep.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/resume-review"
              className={buttonStyles({ intent: "secondary", size: "sm" })}
            >
              Resume Review
            </Link>
            <Link
              href="/interview-prep"
              className={buttonStyles({ intent: "secondary", size: "sm" })}
            >
              Interview Prep
            </Link>
            <Link href="/tracker" className={buttonStyles({ intent: "secondary", size: "sm" })}>
              Tracker
            </Link>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {journeySteps.map((step) => (
            <article
              key={step.title}
              className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5"
            >
              <h3 className="text-base font-semibold text-slate-100">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{step.description}</p>
              <Link
                href={step.href}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#f4d27d] hover:text-[#ffe49a]"
              >
                {step.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold text-slate-100">Try with sample data</h2>
          <p className="mt-2 text-sm text-slate-300">
            New to the workflow. Jump into prefilled examples and see the full output fast.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/resume-review" className={buttonStyles({ intent: "primary", size: "sm" })}>
              Open sample resume flow
            </Link>
            <Link href="/jobs" className={buttonStyles({ intent: "ghost", size: "sm" })}>
              Open sample job workflow
            </Link>
          </div>
        </article>
        <article className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-5">
          <h2 className="text-lg font-semibold text-slate-100">First-time checklist</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
            <li>Paste one target job description.</li>
            <li>Paste your current resume text.</li>
            <li>Review keyword gaps and bullet rewrites.</li>
            <li>Practice two STAR prompts and score yourself.</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
