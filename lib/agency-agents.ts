export type AgencyDivision =
  | "Product"
  | "Design"
  | "Engineering"
  | "Quality"
  | "Operations";

export type BuildLane =
  | "Discover"
  | "Shape"
  | "Build"
  | "Verify"
  | "Launch"
  | "Learn";

export type AgencyAgent = {
  id: string;
  name: string;
  division: AgencyDivision;
  lane: BuildLane;
  sourcePath: string;
  mission: string;
  inputs: string[];
  outputs: string[];
  operatingRule: string;
  successMetric: string;
};

export type ContinuousBuildStage = {
  lane: BuildLane;
  purpose: string;
  agentIds: string[];
  exitCriteria: string[];
};

export const agencySourceRepo = "https://github.com/msitarzewski/agency-agents";

export const agencyAgents = [
  {
    id: "product-manager",
    name: "Product Manager",
    division: "Product",
    lane: "Discover",
    sourcePath: "product/product-manager.md",
    mission:
      "Turn vague requests into scoped product bets with owner, metric, and time horizon.",
    inputs: ["User request", "Observed friction", "Support signal", "Usage signal"],
    outputs: ["Problem statement", "Non-goals", "Success metric", "Acceptance criteria"],
    operatingRule:
      "No build item enters the backlog until the user problem and success metric are explicit.",
    successMetric: "Each shipped feature has a measurable outcome and a stated non-goal.",
  },
  {
    id: "ux-architect",
    name: "UX Architect",
    division: "Design",
    lane: "Shape",
    sourcePath: "design/ux-architect.md",
    mission:
      "Translate the product bet into a usable path through Job Lab, Resume Review, Practice, and Tracker.",
    inputs: ["Problem statement", "Current route behavior", "User role", "Accessibility risk"],
    outputs: ["Flow map", "Interaction model", "Empty states", "Accessibility checklist"],
    operatingRule:
      "Every feature must have a complete loading, empty, success, and failure state before implementation starts.",
    successMetric: "Primary flows complete without dead ends on desktop and mobile.",
  },
  {
    id: "frontend-developer",
    name: "Frontend Developer",
    division: "Engineering",
    lane: "Build",
    sourcePath: "engineering/frontend-developer.md",
    mission:
      "Ship polished Next.js interfaces using the existing Hire Ground design system.",
    inputs: ["Flow map", "Component inventory", "Route contract", "Design tokens"],
    outputs: ["Page implementation", "Reusable UI pieces", "Client state handling", "Responsive QA notes"],
    operatingRule:
      "Build inside existing routes and components unless a new route is part of the accepted workflow.",
    successMetric: "No layout shift, inaccessible control, or missing fallback blocks the core flow.",
  },
  {
    id: "backend-architect",
    name: "Backend Architect",
    division: "Engineering",
    lane: "Build",
    sourcePath: "engineering/backend-architect.md",
    mission:
      "Keep Supabase, OpenAI, and route handlers reliable under partial configuration and network failure.",
    inputs: ["Data model", "API contract", "Auth requirements", "Failure modes"],
    outputs: ["Server route plan", "Persistence contract", "Timeout policy", "Error surface"],
    operatingRule:
      "Every network or database call needs a client-safe error path and server-side diagnostic log.",
    successMetric: "Critical pages render useful UI when optional services are down.",
  },
  {
    id: "ai-engineer",
    name: "AI Engineer",
    division: "Engineering",
    lane: "Build",
    sourcePath: "engineering/ai-engineer.md",
    mission:
      "Turn interview, resume, and job-posting analysis into deterministic, explainable AI workflows.",
    inputs: ["Prompt contract", "Schema", "Sample payload", "Fallback heuristic"],
    outputs: ["Prompt updates", "Schema validation", "Fallback response", "Eval fixture"],
    operatingRule:
      "AI output must be schema-validated, explainable, and paired with a deterministic fallback when feasible.",
    successMetric: "AI-assisted flows remain usable without blocking the user on a perfect model response.",
  },
  {
    id: "database-optimizer",
    name: "Database Optimizer",
    division: "Engineering",
    lane: "Verify",
    sourcePath: "engineering/database-optimizer.md",
    mission:
      "Protect Supabase schema, RLS, migrations, and query shape as the product grows.",
    inputs: ["Migration diff", "Query plan", "RLS policy", "Seed data"],
    outputs: ["Migration review", "Index recommendation", "RLS checklist", "Rollback note"],
    operatingRule:
      "Schema changes ship with migration files, ownership assumptions, and clear local reset instructions.",
    successMetric: "New data surfaces work locally and in production without manual console edits.",
  },
  {
    id: "code-reviewer",
    name: "Code Reviewer",
    division: "Quality",
    lane: "Verify",
    sourcePath: "engineering/code-reviewer.md",
    mission:
      "Catch regressions, edge cases, security issues, and missing tests before release.",
    inputs: ["Git diff", "Acceptance criteria", "Test output", "Production symptom"],
    outputs: ["Findings", "Risk list", "Test gap list", "Release recommendation"],
    operatingRule:
      "Review starts from user-visible behavior and works backward to implementation risk.",
    successMetric: "No known P0 or P1 issue reaches deployment without an explicit decision.",
  },
  {
    id: "devops-automator",
    name: "DevOps Automator",
    division: "Operations",
    lane: "Launch",
    sourcePath: "engineering/devops-automator.md",
    mission:
      "Keep GitHub, Vercel, environment setup, and release verification repeatable.",
    inputs: ["Branch state", "Test command", "Vercel deploy", "Environment variables"],
    outputs: ["Release checklist", "CI status", "Deployment URL", "Rollback note"],
    operatingRule:
      "Do not call a release done until GitHub, Vercel, and smoke checks agree.",
    successMetric: "Every production change has a commit, deployment URL, and route smoke test.",
  },
  {
    id: "technical-writer",
    name: "Technical Writer",
    division: "Operations",
    lane: "Learn",
    sourcePath: "engineering/technical-writer.md",
    mission:
      "Keep audit notes, demo scripts, and implementation docs aligned with the current app.",
    inputs: ["Accepted change", "Known limitation", "Demo flow", "Operational command"],
    outputs: ["Audit update", "Demo script", "Runbook", "Decision record"],
    operatingRule:
      "Docs change with behavior, especially when auth, deployment, or AI assumptions change.",
    successMetric: "A new contributor can demo and run the app from the docs without tribal knowledge.",
  },
] as const satisfies AgencyAgent[];

export const continuousBuildStages = [
  {
    lane: "Discover",
    purpose: "Clarify the actual user problem before shaping a feature.",
    agentIds: ["product-manager"],
    exitCriteria: [
      "Problem statement is clear",
      "Primary user and non-goals are named",
      "Success metric is defined",
    ],
  },
  {
    lane: "Shape",
    purpose: "Design the workflow and failure states before implementation.",
    agentIds: ["ux-architect"],
    exitCriteria: [
      "Route and component impact is known",
      "Empty, loading, success, and error states are covered",
      "Accessibility risks are listed",
    ],
  },
  {
    lane: "Build",
    purpose: "Implement the smallest durable slice inside the current architecture.",
    agentIds: ["frontend-developer", "backend-architect", "ai-engineer"],
    exitCriteria: [
      "Feature works with local data",
      "Network failures show user-friendly recovery",
      "AI responses are schema-validated or deterministic",
    ],
  },
  {
    lane: "Verify",
    purpose: "Review code, data, and user-visible behavior before release.",
    agentIds: ["database-optimizer", "code-reviewer"],
    exitCriteria: [
      "Critical flows have tests",
      "Migrations and RLS are reviewed when touched",
      "No unresolved high-risk regression remains",
    ],
  },
  {
    lane: "Launch",
    purpose: "Ship only after source control, deployment, and smoke checks align.",
    agentIds: ["devops-automator"],
    exitCriteria: [
      "Commit is pushed to GitHub",
      "Vercel deployment succeeds",
      "Key routes return HTTP 200",
    ],
  },
  {
    lane: "Learn",
    purpose: "Capture what changed so the next build cycle starts from reality.",
    agentIds: ["technical-writer"],
    exitCriteria: [
      "Audit or demo docs are updated",
      "Known limitations are recorded",
      "Next build candidate is identified",
    ],
  },
] as const satisfies ContinuousBuildStage[];

export function getAgentById(id: string) {
  return agencyAgents.find((agent) => agent.id === id);
}

export function getAgentsForLane(lane: BuildLane) {
  return agencyAgents.filter((agent) => agent.lane === lane);
}

export function getAgentCoverageSummary() {
  return continuousBuildStages.map((stage) => ({
    lane: stage.lane,
    agentCount: stage.agentIds.length,
    outputCount: stage.agentIds.reduce((total, id) => {
      const agent = getAgentById(id);
      return total + (agent?.outputs.length ?? 0);
    }, 0),
    exitCriteriaCount: stage.exitCriteria.length,
  }));
}

export function buildContinuousBuildPrompt(feature: string) {
  const trimmedFeature = feature.trim() || "Next Hire Ground improvement";
  const lines = [
    `Continuous build brief: ${trimmedFeature}`,
    "",
    "Run the agents in order. Each agent must produce its outputs before the next lane starts.",
    "",
  ];

  continuousBuildStages.forEach((stage) => {
    lines.push(`## ${stage.lane}: ${stage.purpose}`);
    stage.agentIds.forEach((id) => {
      const agent = getAgentById(id);
      if (!agent) {
        return;
      }
      lines.push(`- ${agent.name}: ${agent.operatingRule}`);
    });
    lines.push(`Exit: ${stage.exitCriteria.join("; ")}`);
    lines.push("");
  });

  return lines.join("\n").trim();
}
