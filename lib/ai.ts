import OpenAI from "openai";
import {
  EvalPayload,
  EvalPayloadType,
  EvalRequestPayloadType,
  QuestionResponse,
  QuestionResponseType,
  interviewTypes,
  roleSchema,
} from "./schemas";
import {
  FEEDBACK_SYSTEM_PROMPT,
  QUESTION_SYSTEM_PROMPT,
  buildFeedbackPrompt,
  buildQuestionPrompt,
} from "./prompts";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "1";

let client: OpenAI | null = null;

const questionResponseJsonSchema = {
  type: "object",
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 6,
    },
  },
  additionalProperties: false,
} as const;

const baseEvaluationSchema = {
  scores: {
    type: "object",
    required: ["structure", "relevance", "impact", "delivery", "overall"],
    properties: {
      structure: { type: "number" },
      relevance: { type: "number" },
      impact: { type: "number" },
      delivery: { type: "number" },
      overall: { type: "number" },
    },
    additionalProperties: false,
  },
  feedback: {
    type: "object",
    required: ["summary", "by_answer"],
    properties: {
      summary: { type: "string" },
      by_answer: {
        type: "array",
        items: {
          type: "object",
          required: ["improvements", "missing_keywords"],
          properties: {
            improvements: {
              type: "array",
              items: { type: "string" },
              maxItems: 5,
            },
            missing_keywords: {
              type: "array",
              items: { type: "string" },
              maxItems: 8,
            },
          },
          additionalProperties: false,
        },
      },
    },
    additionalProperties: false,
  },
  tips_next_time: {
    type: "array",
    items: { type: "string" },
    maxItems: 5,
  },
} as const;

const evaluationJsonSchema = (count: number) => ({
  type: "object",
  required: ["scores", "feedback", "tips_next_time"],
  properties: {
    ...baseEvaluationSchema,
    feedback: {
      ...baseEvaluationSchema.feedback,
      properties: {
        ...baseEvaluationSchema.feedback.properties,
        by_answer: {
          ...baseEvaluationSchema.feedback.properties.by_answer,
          minItems: count,
          maxItems: count,
        },
      },
    },
  },
  additionalProperties: false,
});

function getClient() {
  if (DEV_MODE) {
    return null;
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  return client;
}

function buildFormat(name: string, schema: unknown) {
  return {
    type: "json_schema" as const,
    name,
    schema: schema as Record<string, unknown>,
  };
}

async function createJsonResponse(
  system: string,
  user: string,
  schemaName: string,
  schema: unknown,
) {
  const openai = getClient();

  if (!openai) {
    throw new Error("OpenAI client unavailable in dev mode.");
  }

  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_output_tokens: 1100,
    input: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    text: {
      format: buildFormat(schemaName, schema),
    },
  });

  return response.output_text ?? "";
}

async function parseWithRetry<T>(
  attempt: (retry: number) => Promise<string>,
  validator: (payload: unknown) => T,
  retries = 2,
): Promise<T> {
  let error: unknown;

  for (let index = 0; index <= retries; index += 1) {
    try {
      const raw = await attempt(index);
      const parsed = JSON.parse(raw || "{}");
      return validator(parsed);
    } catch (err) {
      error = err;
    }
  }

  throw error instanceof Error ? error : new Error("Failed to parse OpenAI response");
}

export async function generateQuestions({
  role,
  interviewType,
  count,
}: {
  role: string;
  interviewType: (typeof interviewTypes)[number];
  count: number;
}): Promise<QuestionResponseType> {
  const roleParse = roleSchema.safeParse(role);

  if (!roleParse.success) {
    throw new Error("Invalid role supplied.");
  }

  const safeCount = Math.min(Math.max(count, 1), 6);

  if (DEV_MODE) {
    const placeholder = new Array(safeCount).fill(null).map((_, idx) => {
      return `DEV sample question ${idx + 1} (${interviewType}) for ${role}.`;
    });
    return { questions: placeholder } satisfies QuestionResponseType;
  }

  const seed = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const prompt = buildQuestionPrompt({
    role: roleParse.data,
    interviewType,
    count: safeCount,
    seed,
  });

  return parseWithRetry(
    (retry) =>
      createJsonResponse(
        QUESTION_SYSTEM_PROMPT,
        retry > 0
          ? `${prompt}

Return valid JSON only.`
          : prompt,
        "question_response",
        questionResponseJsonSchema,
      ),
    (payload) => QuestionResponse.parse(payload),
  );
}

export async function evaluateSession(
  input: EvalRequestPayloadType,
): Promise<EvalPayloadType> {
  if (DEV_MODE) {
    return {
      scores: {
        structure: 6,
        relevance: 7,
        impact: 5,
        delivery: 6,
        overall: 6,
      },
      feedback: {
        summary:
          "Strong structure but outcomes need clearer metrics. Focus on quantifying impact and clarifying your personal contributions.",
        by_answer: new Array(input.answers.length).fill(null).map(() => ({
          improvements: [
            "Lead with the result and quantify the impact.",
            "Add more detail on your personal actions.",
          ],
          missing_keywords: [],
        })),
      },
      tips_next_time: [
        "Lead with the Result in one sentence before diving into details.",
        "State the metric shift or customer impact for each story.",
        "Highlight one learning per example to show growth mindset.",
      ],
      meta: {
        interviewType: input.interviewType,
        questionCount: input.questions.length,
      },
    } satisfies EvalPayloadType;
  }

  const prompt = buildFeedbackPrompt({
    role: input.role,
    interviewType: input.interviewType,
    questions: input.questions,
    answers: input.answers,
  });
  const questionCount = input.questions.length;

  const evaluation = await parseWithRetry(
    (retry) =>
      createJsonResponse(
        FEEDBACK_SYSTEM_PROMPT,
        retry > 0
          ? `${prompt}

Return valid JSON only.`
          : prompt,
        "evaluation_response",
        evaluationJsonSchema(questionCount),
      ),
    (payload) => EvalPayload.parse(payload),
  );

  return {
    ...evaluation,
    meta: {
      interviewType: input.interviewType,
      questionCount,
    },
  } satisfies EvalPayloadType;
}
