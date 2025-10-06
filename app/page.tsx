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
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-800/60 bg-gradient-to-br from-[#0b1222] via-[#0d1425] to-[#020509] p-12 text-white shadow-[0_30px_80px_-55px_rgba(15,23,42,0.9)]">
        <div className="absolute inset-0">
          <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-sky-500/20 blur-[140px]" />
          <div className="absolute bottom-[-80px] right-12 h-72 w-72 rounded-full bg-blue-600/15 blur-[140px]" />
        </div>
        <div className="relative space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-100">
            <Sparkles className="h-3.5 w-3.5" /> Interview Coach
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
              className={`${buttonStyles({ intent: "primary", size: "lg" })} shadow-[0_20px_45px_-18px_rgba(37,99,235,0.55)]`}
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
              className="space-y-3 rounded-2xl border border-slate-800/60 bg-slate-900/65 p-6 text-slate-100 shadow-lg shadow-slate-950/20 transition hover:border-blue-500/60 hover:shadow-blue-600/10"
            >
              <feature.icon className="h-8 w-8 text-blue-300" />
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-slate-300">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
