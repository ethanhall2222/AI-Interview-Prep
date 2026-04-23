import { describe, expect, it } from "vitest";

import {
  agencyAgents,
  buildContinuousBuildPrompt,
  continuousBuildStages,
  getAgentCoverageSummary,
} from "@/lib/agency-agents";

describe("agency agent continuous build model", () => {
  it("assigns every stage to at least one known agent", () => {
    const ids = new Set(agencyAgents.map((agent) => agent.id));

    continuousBuildStages.forEach((stage) => {
      expect(stage.agentIds.length).toBeGreaterThan(0);
      stage.agentIds.forEach((id) => {
        expect(ids.has(id)).toBe(true);
      });
      expect(stage.exitCriteria.length).toBeGreaterThan(0);
    });
  });

  it("builds a reusable prompt with ordered lanes", () => {
    const prompt = buildContinuousBuildPrompt("Improve resume scoring");

    expect(prompt).toContain("Continuous build brief: Improve resume scoring");
    expect(prompt).toContain("## Discover");
    expect(prompt).toContain("## Launch");
    expect(prompt).toContain("Product Manager");
    expect(prompt).toContain("DevOps Automator");
  });

  it("summarizes coverage for the command center", () => {
    const summary = getAgentCoverageSummary();

    expect(summary).toHaveLength(continuousBuildStages.length);
    expect(summary.every((item) => item.agentCount > 0)).toBe(true);
    expect(summary.every((item) => item.exitCriteriaCount > 0)).toBe(true);
  });
});
