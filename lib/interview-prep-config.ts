export type PrepRole = "consulting" | "swe" | "data-analytics" | "cybersecurity";

export const prepRoleLabels: Record<PrepRole, string> = {
  consulting: "Consulting",
  swe: "Software Engineering",
  "data-analytics": "Data and Analytics",
  cybersecurity: "Cybersecurity",
};

export const prepQuestionBank: Record<PrepRole, string[]> = {
  consulting: [
    "Tell me about a time you structured an ambiguous problem for stakeholders.",
    "Describe a project where your recommendation changed an executive decision.",
    "How would you prioritize initiatives when a client asks for everything at once?",
    "Walk me through a time your analysis was challenged and how you handled it.",
  ],
  swe: [
    "Describe a production incident you owned and resolved.",
    "How would you design a rate-limited API for multi-tenant workloads?",
    "Tell me about a major refactor and how you reduced risk.",
    "Explain a performance bottleneck you identified and fixed.",
  ],
  "data-analytics": [
    "Tell me about a time you found a misleading metric and corrected decision-making.",
    "How do you design an experiment when sample size is constrained?",
    "Describe a dashboard you built that changed team behavior.",
    "Explain a data quality issue you detected before it reached leadership.",
  ],
  cybersecurity: [
    "Describe an incident response where containment speed mattered.",
    "How would you prioritize vulnerabilities across business-critical assets?",
    "Tell me about a security control you introduced with low user friction.",
    "Explain a threat model you built and how it influenced architecture decisions.",
  ],
};

export const starPrompt =
  "Answer in STAR format: Situation, Task, Action, Result. Keep each answer focused and quantifiable.";

export const rubric = [
  { id: "structure", label: "Structure", helper: "Clear setup and logical flow." },
  { id: "specificity", label: "Specificity", helper: "Concrete details and constraints." },
  { id: "impact", label: "Impact", helper: "Measurable outcome and business value." },
  { id: "communication", label: "Communication", helper: "Concise and confident delivery." },
] as const;
