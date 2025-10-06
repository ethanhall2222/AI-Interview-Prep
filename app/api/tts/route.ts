import { NextResponse } from "next/server";
import OpenAI from "openai";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "1";

export async function POST(request: Request) {
  try {
    const { text } = (await request.json()) as { text?: string };

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ message: "Missing text." }, { status: 400 });
    }

    if (DEV_MODE) {
      return NextResponse.json({ audio: null });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { message: "OPENAI_API_KEY is not set." },
        { status: 500 },
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const speech = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text,
    });

    const arrayBuffer = await speech.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("TTS generation failed", error);
    const message = error instanceof Error ? error.message : "Unable to generate audio.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
