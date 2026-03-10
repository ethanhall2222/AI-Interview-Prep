const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "your",
  "have",
  "you",
  "are",
  "was",
  "were",
  "has",
  "had",
  "our",
  "their",
  "about",
  "into",
  "using",
  "used",
  "will",
  "can",
  "job",
  "role",
  "team",
  "work",
  "years",
  "experience",
  "across",
  "within",
  "include",
  "including",
  "ability",
  "strong",
  "skills",
]);

const STRONG_VERBS = [
  "led",
  "built",
  "launched",
  "scaled",
  "optimized",
  "implemented",
  "improved",
  "increased",
  "reduced",
  "delivered",
  "designed",
  "automated",
  "streamlined",
  "shipped",
  "owned",
  "drove",
];

const WEAK_VERBS = ["helped", "worked on", "responsible for", "assisted", "supported"];

export type ResumeSections = {
  summary: string[];
  experience: string[];
  education: string[];
  skills: string[];
  projects: string[];
  other: string[];
};

export type RewriteSuggestion = {
  original: string;
  improved: string;
  why: string;
};

export type KeywordInsight = {
  keyword: string;
  resumeCount: number;
  jdCount: number;
  status: "present" | "missing" | "overused";
};

export type BulletQualityFinding = {
  bullet: string;
  problems: string[];
};

export type ResumeAnalysis = {
  sections: ResumeSections;
  summary: {
    priorityFixes: string[];
    coverageScore: number;
    bulletScore: number;
  };
  issues: string[];
  keywordGaps: string[];
  keywordInsights: KeywordInsight[];
  bulletFindings: BulletQualityFinding[];
  rewriteSuggestions: RewriteSuggestion[];
  atsWarnings: string[];
};

function linesFromText(input: string) {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

function tokenCounts(text: string) {
  const map = new Map<string, number>();
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 4)
    .forEach((token) => {
      if (STOP_WORDS.has(token)) {
        return;
      }
      map.set(token, (map.get(token) ?? 0) + 1);
    });
  return map;
}

export function parseResumeSections(resumeText: string): ResumeSections {
  const lines = linesFromText(resumeText);
  const sections: ResumeSections = {
    summary: [],
    experience: [],
    education: [],
    skills: [],
    projects: [],
    other: [],
  };

  let current: keyof ResumeSections = "other";

  for (const line of lines) {
    const marker = line.toLowerCase();
    if (/summary|profile/.test(marker)) current = "summary";
    else if (/experience|employment|work history/.test(marker)) current = "experience";
    else if (/education/.test(marker)) current = "education";
    else if (/skills|tooling|technologies/.test(marker)) current = "skills";
    else if (/projects|portfolio/.test(marker)) current = "projects";

    sections[current].push(line);
  }

  return sections;
}

export function extractKeywords(text: string, limit = 40) {
  const counts = tokenCounts(text);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

function collectBullets(lines: string[]) {
  return lines.filter((line) => /^[-*•]/.test(line) || /^(\d+\.|\w+\))/i.test(line));
}

function hasMetric(line: string) {
  return /(\d+%|\$\d+|\d+\+|\d+\s?(k|m|b)|\b\d{2,}\b)/i.test(line);
}

function hasScope(line: string) {
  return /(team|users|customers|platform|pipeline|service|revenue|latency|stakeholders|system)/i.test(
    line,
  );
}

function hasActionVerb(line: string) {
  return STRONG_VERBS.some((verb) => line.toLowerCase().includes(verb));
}

function rewriteBullet(original: string): RewriteSuggestion {
  const normalized = original.replace(/^[-*•]\s*/, "").trim();
  const startsWithWeakVerb = WEAK_VERBS.some((verb) =>
    normalized.toLowerCase().startsWith(verb),
  );
  const actionVerb = STRONG_VERBS.find((verb) => normalized.toLowerCase().includes(verb)) ?? "led";
  let improved = normalized;

  if (startsWithWeakVerb) {
    improved = improved.replace(/^(helped|worked on|responsible for|assisted|supported)\s+/i, "");
    improved = `${actionVerb.charAt(0).toUpperCase() + actionVerb.slice(1)} ${improved}`;
  }

  if (!hasScope(improved)) {
    improved = `${improved} across a cross-functional product and engineering scope`;
  }

  if (!hasMetric(improved)) {
    improved = `${improved}, resulting in a measurable improvement of 20% in a core KPI`;
  }

  if (!/[.!?]$/.test(improved)) {
    improved += ".";
  }

  return {
    original,
    improved: `- ${improved}`,
    why: "Uses a stronger verb, adds scope, and includes measurable impact.",
  };
}

function detectRepetitions(bullets: string[]) {
  const normalized = bullets.map((line) =>
    normalizeToken(line.replace(/^[-*•\d.)\s]+/, "").split(" ").slice(0, 4).join(" ")),
  );
  const counts = new Map<string, number>();
  normalized.forEach((snippet) => {
    if (!snippet) {
      return;
    }
    counts.set(snippet, (counts.get(snippet) ?? 0) + 1);
  });

  return normalized.reduce<number>((total, snippet) => {
    if (!snippet) {
      return total;
    }
    return (counts.get(snippet) ?? 0) > 1 ? total + 1 : total;
  }, 0);
}

function analyzeBullets(bullets: string[]) {
  const findings: BulletQualityFinding[] = [];

  bullets.forEach((bullet) => {
    const problems: string[] = [];
    if (!hasActionVerb(bullet)) {
      problems.push("Missing strong action verb");
    }
    if (!hasScope(bullet)) {
      problems.push("Missing concrete scope");
    }
    if (!hasMetric(bullet)) {
      problems.push("Missing measurable outcome");
    }
    if (WEAK_VERBS.some((verb) => bullet.toLowerCase().includes(verb))) {
      problems.push("Contains weak phrasing");
    }
    if (problems.length > 0) {
      findings.push({ bullet, problems });
    }
  });

  return findings;
}

function buildKeywordInsights(resumeText: string, jobDescriptionText: string) {
  const resumeCounts = tokenCounts(resumeText);
  const jdCounts = tokenCounts(jobDescriptionText);

  const sortedJd = [...jdCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 36);

  const insights: KeywordInsight[] = sortedJd.map(([keyword, jdCount]) => {
    const resumeCount = resumeCounts.get(keyword) ?? 0;
    let status: KeywordInsight["status"] = "present";

    if (resumeCount === 0) {
      status = "missing";
    } else if (resumeCount >= 5 && jdCount <= 2) {
      status = "overused";
    }

    return {
      keyword,
      resumeCount,
      jdCount,
      status,
    };
  });

  return insights;
}

function toPercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function analyzeResumeAgainstJob(resumeText: string, jobDescriptionText: string) {
  const sections = parseResumeSections(resumeText);
  const issues: string[] = [];
  const atsWarnings: string[] = [];

  const allLines = linesFromText(resumeText);
  const bullets = collectBullets(allLines);
  const bulletFindings = analyzeBullets(bullets);
  const repeatedBulletLeadins = detectRepetitions(bullets);

  if (resumeText.length < 600) {
    issues.push("Resume content is short. Add more quantified results and recent impact.");
  }
  if (bullets.length < 4) {
    issues.push("Resume has too few bullet points. Add concise bullets under each role.");
  }
  if (bulletFindings.length > 0) {
    issues.push(
      `${bulletFindings.length} bullets need stronger action, scope, or metrics. Prioritize these first.`,
    );
  }
  if (repeatedBulletLeadins >= 2) {
    issues.push("Multiple bullets start similarly. Vary structure to avoid repetition.");
  }

  if (sections.experience.length <= 1) {
    issues.push("Experience section is sparse. Add role context and outcomes for each position.");
  }

  if (!sections.skills.some((line) => /python|sql|typescript|java|aws|cloud|analytics/i.test(line))) {
    issues.push("Skills section is thin or generic. Add role-specific tools from the job description.");
  }

  if (/\||\t{2,}/.test(resumeText)) {
    atsWarnings.push("Table-like formatting detected. ATS parsers may misread columns.");
  }
  if (/columns?|two-column|sidebar/i.test(resumeText)) {
    atsWarnings.push("Column-style layout hints detected. Single-column formats are safer.");
  }
  if (/\b(image|icon|graphic|logo|png|jpg|jpeg|svg)\b/i.test(resumeText)) {
    atsWarnings.push("Image or icon references detected. ATS systems often ignore visual elements.");
  }
  if (/[\u25A0-\u25FF]/.test(resumeText)) {
    atsWarnings.push("Special symbols detected. Plain bullets are safer for ATS parsing.");
  }

  const keywordInsights = buildKeywordInsights(resumeText, jobDescriptionText);
  const keywordGaps = keywordInsights
    .filter((keyword) => keyword.status === "missing")
    .map((keyword) => keyword.keyword)
    .slice(0, 24);

  const rewriteSuggestions = bullets.slice(0, 6).map(rewriteBullet);

  const presentCount = keywordInsights.filter((item) => item.status === "present").length;
  const missingCount = keywordInsights.filter((item) => item.status === "missing").length;
  const bulletScoreRaw = bullets.length === 0 ? 0 : ((bullets.length - bulletFindings.length) / bullets.length) * 100;
  const coverageScoreRaw = keywordInsights.length === 0 ? 0 : (presentCount / keywordInsights.length) * 100;

  const priorityFixes = [
    missingCount > 0
      ? `Add ${Math.min(missingCount, 8)} missing JD keywords into experience bullets and skills.`
      : "Keyword coverage is strong. Keep tailoring wording to each target role.",
    bulletFindings.length > 0
      ? `Rewrite ${Math.min(bulletFindings.length, 6)} weak bullets with action + scope + metric.`
      : "Bullet quality is strong. Keep outcomes measurable and concise.",
    atsWarnings.length > 0
      ? `Resolve ${atsWarnings.length} ATS risk${atsWarnings.length === 1 ? "" : "s"} before applying.`
      : "ATS structure is clean based on text heuristics.",
  ];

  return {
    sections,
    summary: {
      priorityFixes,
      coverageScore: toPercent(coverageScoreRaw),
      bulletScore: toPercent(bulletScoreRaw),
    },
    issues,
    keywordGaps,
    keywordInsights,
    bulletFindings,
    rewriteSuggestions,
    atsWarnings,
  } satisfies ResumeAnalysis;
}

export function formatAnalysisForExport(analysis: ResumeAnalysis) {
  const rows: string[] = [];
  rows.push("Resume Review Summary");
  rows.push("");
  rows.push(`Coverage score: ${analysis.summary.coverageScore}%`);
  rows.push(`Bullet quality score: ${analysis.summary.bulletScore}%`);
  rows.push("");
  rows.push("Priority fixes:");
  analysis.summary.priorityFixes.forEach((fix) => rows.push(`- ${fix}`));
  rows.push("");
  rows.push("Top Issues:");
  analysis.issues.forEach((issue) => rows.push(`- ${issue}`));
  rows.push("");
  rows.push("Keyword Gaps:");
  analysis.keywordGaps.forEach((keyword) => rows.push(`- ${keyword}`));
  rows.push("");
  rows.push("ATS Warnings:");
  analysis.atsWarnings.forEach((warning) => rows.push(`- ${warning}`));
  rows.push("");
  rows.push("Suggested Rewrites:");
  analysis.rewriteSuggestions.forEach((item) => {
    rows.push(`Original: ${item.original}`);
    rows.push(`Improved: ${item.improved}`);
    rows.push(`Why: ${item.why}`);
    rows.push("");
  });
  return rows.join("\n").trim();
}

export const sampleResumeText = `SUMMARY
Product-minded software engineer with 5 years of experience shipping web applications.

EXPERIENCE
- Helped improve checkout reliability for enterprise users.
- Worked on analytics dashboards used by internal teams.
- Responsible for onboarding flow updates.

PROJECTS
- Built an internal experimentation dashboard used by 14 product managers.

SKILLS
TypeScript, React, Next.js, SQL, Python`;

export const sampleJobDescriptionText = `We are hiring a Software Engineer to build customer-facing platform features.
Responsibilities include improving reliability, reducing latency, and collaborating cross-functionally.
Candidates should demonstrate ownership, API design, analytics, experimentation, and measurable impact.`;
