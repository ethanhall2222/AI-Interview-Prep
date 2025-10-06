import { describe, expect, it } from "vitest";

import { buildFeedbackPrompt, buildQuestionPrompt } from "@/lib/prompts";

describe("prompt builders", () => {
  it("injects the role, type, and count into the question prompt", () => {
    const prompt = buildQuestionPrompt({
      role: "Data Analyst",
      interviewType: "behavioral",
      count: 4,
      seed: "test-seed",
    });

    expect(prompt).toContain("Data Analyst");
    expect(prompt).toContain("behavioral interview questions");
    expect(prompt).toContain("seed \"test-seed\"");
    expect(prompt).toContain("Return JSON with 4 items");
  });

  it("formats questions and answers for the feedback prompt", () => {
    const prompt = buildFeedbackPrompt({
      role: "Product Manager",
      interviewType: "situational",
      questions: ["Q1", "Q2", "Q3"],
      answers: ["A1", "A2", "A3"],
    });

    expect(prompt).toContain("Role: Product Manager");
    expect(prompt).toContain("Interview type: situational");
    expect(prompt).toContain("Questions: Q1: Q1 | Q2: Q2 | Q3: Q3");
    expect(prompt).toContain("Answers: A1: A1 | A2: A2 | A3: A3");
    expect(prompt).toContain("Return JSON exactly");
  });
});
