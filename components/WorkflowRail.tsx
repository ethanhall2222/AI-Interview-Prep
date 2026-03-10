import Link from "next/link";

const steps = [
  { id: "jobs", label: "Job Lab", href: "/jobs" },
  { id: "resume-review", label: "Resume Review", href: "/resume-review" },
  { id: "practice", label: "Practice", href: "/practice" },
  { id: "tracker", label: "Tracker", href: "/tracker" },
] as const;

type WorkflowStepId = (typeof steps)[number]["id"];

type WorkflowRailProps = {
  current: WorkflowStepId;
};

export default function WorkflowRail({ current }: WorkflowRailProps) {
  return (
    <nav
      aria-label="Workflow progress"
      className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-3"
    >
      <ol className="flex flex-wrap items-center gap-2">
        {steps.map((step, index) => {
          const isCurrent = step.id === current;
          return (
            <li key={step.id} className="flex items-center gap-2">
              <Link
                href={step.href}
                aria-current={isCurrent ? "step" : undefined}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition ${
                  isCurrent
                    ? "border-[#eaaa00]/55 bg-[#eaaa00]/15 text-[#ffe49a]"
                    : "border-slate-700 text-slate-300 hover:border-[#eaaa00]/50 hover:text-[#ffe49a]"
                }`}
              >
                {index + 1}. {step.label}
              </Link>
              {index < steps.length - 1 && (
                <span className="text-xs text-slate-600" aria-hidden="true">
                  →
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
