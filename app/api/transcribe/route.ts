import { NextResponse } from "next/server";
import { toFile } from "openai/uploads";
import OpenAI from "openai";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "1";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio");
    const question = formData.get("question")?.toString() ?? "";

    if (!(audio instanceof File)) {
      return NextResponse.json({ message: "Missing audio blob." }, { status: 400 });
    }

    if (DEV_MODE) {
      const placeholder = question
        ? `DEV transcript for: ${question}`
        : "DEV transcript placeholder.";
      return NextResponse.json({ text: placeholder });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { message: "OPENAI_API_KEY is not set." },
        { status: 500 },
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const file = await toFile(audio, audio.name || "speech.webm");

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "gpt-4o-mini-transcribe",
    });

    const text = transcription.text?.trim();

    if (!text) {
      return NextResponse.json({ message: "Transcription was empty." }, { status: 422 });
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Transcription failed", error);
    const message =
      error instanceof Error ? error.message : "Unable to transcribe audio.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
