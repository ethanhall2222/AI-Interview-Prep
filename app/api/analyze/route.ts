import { NextResponse } from "next/server";
import { toFile } from "openai/uploads";
import OpenAI from "openai";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "1";

const bodyFeedbackSchema = {
  type: "object",
  required: ["summary", "cues"],
  properties: {
    summary: { type: "string" },
    cues: {
      type: "array",
      items: { type: "string" },
      maxItems: 6,
    },
  },
  additionalProperties: false,
} as const;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const video = formData.get("video");
    const question = formData.get("question")?.toString() ?? "this interview question";

    if (!(video instanceof File)) {
      return NextResponse.json({ message: "Missing video blob." }, { status: 400 });
    }

    if (DEV_MODE) {
      return NextResponse.json({
        summary: `DEV observation for ${question}`,
        cues: ["Maintain eye contact", "Use confident gestures"],
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { message: "OPENAI_API_KEY is not set." },
        { status: 500 },
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const videoFile = await toFile(video, video.name || "answer.webm");
    const uploaded = await openai.files.create({ file: videoFile, purpose: "assistants" });

    const prompt = `You are analyzing a candidate's recorded mock interview answer to the question: "${question}".
Provide a concise summary of their body language and delivery, then list 2-4 short cues that would help them improve (posture, facial expression, pacing, gestures).
Return JSON.`;

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            {
              type: "input_file",
              file_id: uploaded.id,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "body_language_summary",
          schema: bodyFeedbackSchema,
        },
      },
    });

    const raw = response.output_text ?? "";
    const parsed = JSON.parse(raw);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Body-language analysis failed", error);
    const message =
      error instanceof Error ? error.message : "Unable to analyze body-language.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
