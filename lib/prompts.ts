import { interviewTypes, Role } from "./schemas";

type InterviewType = (typeof interviewTypes)[number];

export const QUESTION_SYSTEM_PROMPT =
  "You are an expert interviewer who writes targeted questions that surface real experience.";

const interviewTypeDescriptors: Record<InterviewType, string> = {
  behavioral:
    "behavioral interview questions that uncover past leadership, collaboration, and ownership stories",
  situational:
    "situational prompts that explore how the candidate would navigate hypothetical but realistic challenges",
  technical:
    "technical interview questions that probe architecture, debugging, design trade-offs, or coding decisions",
};

export function buildQuestionPrompt({
  role,
  interviewType,
  count,
  seed,
}: {
  role: Role;
  interviewType: InterviewType;
  count: number;
  seed: string;
}) {
  const descriptor = interviewTypeDescriptors[interviewType];

  return `You are preparing ${count} ${descriptor} for a ${role} candidate.
Instructions:
- Do not repeat questions from previous sessions. Use the random seed "${seed}" to diversify examples.
- Keep each question under 28 words and avoid generic phrasing like "Tell me about".
- Make the scenarios specific to a ${role} at a modern technology company.
- Vary focus areas (strategy, execution, metrics, stakeholder management, failure) across questions.

Return JSON with ${count} items:
{"questions": ["...","...", ...]}`;
}

export const FEEDBACK_SYSTEM_PROMPT =
  "You are a strict interview coach. Use STAR. Do not invent facts. Be concise.";

export function buildFeedbackPrompt({
  role,
  interviewType,
  questions,
  answers,
}: {
  role: Role;
  interviewType: InterviewType;
  questions: string[];
  answers: string[];
}) {
  const questionLiteral = questions
    .map((question, idx) => `Q${idx + 1}: ${question}`)
    .join(" | ");

  const answerLiteral = answers
    .map((answer, idx) => `A${idx + 1}: ${answer}`)
    .join(" | ");

  return `Evaluate ${questions.length} ${interviewType} answers for the role ${role}. Use STAR. Do not fabricate.
Return JSON exactly:
{
  "scores": {
    "structure": <0-10>,
    "relevance": <0-10>,
    "impact": <0-10>,
    "delivery": <0-10>,
    "overall": <0-10>
  },
  "feedback": {
    "summary": "2-3 sentences on what to fix first.",
    "by_answer": [
      {"improvements": ["bullet","bullet"], "missing_keywords": ["..."]},
      ... (one entry per answer in order)
    ]
  },
  "tips_next_time": ["3 concise bullets"]
}

Role: ${role}
Interview type: ${interviewType}
Questions: ${questionLiteral}
Answers: ${answerLiteral}

Rules:
- Penalize vague outcomes and missing metrics.
- Only list missing keywords if clearly relevant.
- Keep overall JSON under 1200 tokens.
- Every improvement statement must be specific to the provided answer.`;
}
