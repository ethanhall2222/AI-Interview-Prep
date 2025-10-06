import { NextResponse } from "next/server";
import { generateQuestions } from "@/lib/ai";
import { QuestionRequest } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = QuestionRequest.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid request payload." }, { status: 400 });
    }

    const questions = await generateQuestions({
      role: parsed.data.role,
      interviewType: parsed.data.interviewType,
      count: parsed.data.count,
    });
    return NextResponse.json(questions);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to generate interview questions at this time.";
    return NextResponse.json({ message }, { status: 502 });
  }
}
