import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const reportPath = join(rootDir, "docs", "agent_readiness.md");

const checks = [
  {
    id: "test",
    label: "Unit and flow tests",
    command: ["pnpm", "test"],
    lane: "Verify",
  },
  {
    id: "typecheck",
    label: "TypeScript contract check",
    command: ["pnpm", "exec", "tsc", "--noEmit"],
    lane: "Verify",
  },
  {
    id: "lint",
    label: "Lint check",
    command: ["pnpm", "lint"],
    lane: "Verify",
  },
  {
    id: "build",
    label: "Production build",
    command: ["pnpm", "build"],
    lane: "Launch",
  },
];

const routeRoots = ["app", "app/admin", "app/jobs", "app/resume-review", "app/practice"];

function runCheck(check) {
  const startedAt = Date.now();
  try {
    const output = execFileSync(check.command[0], check.command.slice(1), {
      cwd: rootDir,
      encoding: "utf8",
      env: {
        ...process.env,
        NEXT_PUBLIC_DEV_MODE: process.env.NEXT_PUBLIC_DEV_MODE ?? "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    return {
      ...check,
      status: "pass",
      durationMs: Date.now() - startedAt,
      output: output.trim().slice(-2400),
    };
  } catch (error) {
    const stdout = typeof error.stdout === "string" ? error.stdout : "";
    const stderr = typeof error.stderr === "string" ? error.stderr : "";

    return {
      ...check,
      status: "fail",
      durationMs: Date.now() - startedAt,
      output: `${stdout}\n${stderr}`.trim().slice(-4000),
    };
  }
}

function listPages(dir) {
  const absolute = join(rootDir, dir);
  if (!existsSync(absolute)) {
    return [];
  }

  const pages = [];
  const visit = (current) => {
    readdirSync(current).forEach((entry) => {
      const next = join(current, entry);
      const stats = statSync(next);
      if (stats.isDirectory()) {
        visit(next);
        return;
      }
      if (entry === "page.tsx") {
        const route = dirname(next)
          .replace(rootDir, "")
          .replace(/^\/?app/, "")
          .replace(/\\/g, "/");
        pages.push(route || "/");
      }
    });
  };

  visit(absolute);
  return pages.sort();
}

function readOptional(path) {
  const absolute = join(rootDir, path);
  return existsSync(absolute) ? readFileSync(absolute, "utf8") : "";
}

function buildReport(results) {
  const failed = results.filter((result) => result.status === "fail");
  const routeInventory = [...new Set(routeRoots.flatMap(listPages))].sort();
  const agentDoc = readOptional("docs/agency_continuous_building.md");
  const hasAgentDoc = agentDoc.includes("Build Loop") && agentDoc.includes("Source");
  const ready = failed.length === 0 && hasAgentDoc;

  const lines = [
    "# Agent Readiness Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Status: ${ready ? "Output ready" : "Needs work"}`,
    "",
    "## Continuous Build Lanes",
    "",
    "| Lane | Gate | Status | Duration |",
    "| --- | --- | --- | --- |",
  ];

  results.forEach((result) => {
    lines.push(
      `| ${result.lane} | ${result.label} | ${result.status} | ${Math.round(
        result.durationMs / 1000,
      )}s |`,
    );
  });

  lines.push("");
  lines.push("## Route Inventory");
  lines.push("");
  routeInventory.forEach((route) => lines.push(`- ${route}`));

  lines.push("");
  lines.push("## Agent Architecture Gate");
  lines.push("");
  lines.push(`- Operating doc present: ${hasAgentDoc ? "yes" : "no"}`);
  lines.push("- Command center route: `/admin/agents`");
  lines.push("- Source architecture: `https://github.com/msitarzewski/agency-agents`");

  if (failed.length > 0) {
    lines.push("");
    lines.push("## Failures To Resolve");
    failed.forEach((result) => {
      lines.push("");
      lines.push(`### ${result.label}`);
      lines.push("");
      lines.push("```text");
      lines.push(result.output || "No output captured.");
      lines.push("```");
    });
  }

  lines.push("");
  lines.push("## Next Agent Actions");
  lines.push("");
  if (ready) {
    lines.push("- Product Manager: choose the next highest-impact workflow candidate.");
    lines.push("- UX Architect: verify the route has complete states before build starts.");
    lines.push("- Code Reviewer: keep the current gates green before release.");
  } else {
    lines.push("- Code Reviewer: resolve failing gates first.");
    lines.push("- DevOps Automator: rerun the continuous build after fixes land.");
    lines.push("- Technical Writer: update docs once behavior changes.");
  }

  return { ready, content: lines.join("\n") };
}

const results = checks.map(runCheck);
const report = buildReport(results);

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${report.content}\n`);

console.log(report.content);

if (!report.ready) {
  process.exitCode = 1;
}
