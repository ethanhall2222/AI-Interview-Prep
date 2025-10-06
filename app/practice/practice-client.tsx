"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Mic, Sparkles, Square } from "lucide-react";

import { Button, buttonStyles } from "@/components/Button";
import QuestionCard from "@/components/QuestionCard";
import ScoreCard from "@/components/ScoreCard";
import { useToast } from "@/components/ToastProvider";
import type { Role, StoredEvaluationType } from "@/lib/schemas";

interface PracticeClientProps {
  roles: Role[];
}

interface QuestionResponsePayload {
  questions: string[];
  message?: string;
}

export default function PracticeClient({ roles }: PracticeClientProps) {
  const [selectedRole, setSelectedRole] = useState<Role>(roles[0]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  const [evaluation, setEvaluation] = useState<StoredEvaluationType | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recordingIndex, setRecordingIndex] = useState<number | null>(null);
  const [transcribingIndex, setTranscribingIndex] = useState<number | null>(null);
  const [recorderSupported, setRecorderSupported] = useState(false);

  const mediaRecorderRef = useRef<Record<number, MediaRecorder | null>>({});
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Record<number, BlobPart[]>>({});

  const { publish } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const supported = !!(
      navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function"
    );

    setRecorderSupported(supported);

    return () => {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      Object.values(mediaRecorderRef.current).forEach((recorder) => {
        if (recorder && recorder.state !== "inactive") {
          recorder.stop();
        }
      });
    };
  }, []);

  const handleGenerateQuestions = async () => {
    setLoadingQuestions(true);
    setEvaluation(null);

    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });

      const payload = (await response.json()) as QuestionResponsePayload;

      if (!response.ok || !payload.questions) {
        throw new Error(payload.message ?? "Unable to fetch questions.");
      }

      setQuestions(payload.questions);
      setAnswers(["", "", ""]);
      publish("Question set ready. Time to craft your STAR answers.", "success");
    } catch (error) {
      publish(
        error instanceof Error
          ? error.message
          : "Something went wrong while loading questions.",
        "error",
      );
    } finally {
      setLoadingQuestions(false);
    }
  };

  const submitTranscription = async (index: number, blob: Blob, question: string) => {
    if (blob.size === 0) {
      publish("Recording was empty. Please try again.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("audio", blob, `response-${Date.now()}.webm`);
    formData.append("question", question);

    setTranscribingIndex(index);

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as { text?: string; message?: string };

      if (!response.ok || !payload.text) {
        throw new Error(payload.message ?? "Transcription failed.");
      }

      setAnswers((current) => {
        const next = [...current];
        const existing = next[index]?.trim();
        next[index] = existing ? `${existing}\n${payload.text}` : payload.text;
        return next;
      });

      publish("Transcription added to your response.", "success");
    } catch (error) {
      publish(
        error instanceof Error ? error.message : "Unable to transcribe audio.",
        "error",
      );
    } finally {
      setTranscribingIndex(null);
    }
  };

  const stopRecording = (index: number) => {
    const recorder = mediaRecorderRef.current[index];
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    mediaRecorderRef.current[index] = null;
    setRecordingIndex(null);
  };

  const startRecording = async (index: number) => {
    try {
      if (!recorderSupported) {
        publish("Microphone access is not supported in this browser.", "error");
        return;
      }

      if (recordingIndex !== null) {
        stopRecording(recordingIndex);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      chunksRef.current[index] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current[index].push(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const chunks = chunksRef.current[index] ?? [];
        delete chunksRef.current[index];
        const blob = new Blob(chunks, { type: "audio/webm" });
        mediaStreamRef.current = null;
        if (questions[index]) {
          void submitTranscription(index, blob, questions[index]);
        }
      };

      recorder.start();
      mediaRecorderRef.current[index] = recorder;
      setRecordingIndex(index);
      publish("Recording started. Speak your answer out loud.", "info");
    } catch (error) {
      publish(
        error instanceof Error ? error.message : "Unable to access microphone.",
        "error",
      );
    }
  };

  const toggleRecording = (index: number) => {
    if (recordingIndex === index) {
      stopRecording(index);
    } else {
      void startRecording(index);
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (questions.length !== 3) {
      publish("Generate questions before requesting feedback.", "error");
      return;
    }

    if (answers.some((answer) => answer.trim().length < 20)) {
      publish("Each answer should be at least 20 characters to evaluate.", "error");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          questions,
          answers,
        }),
      });

      const payload = (await response.json()) as StoredEvaluationType & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message ?? "Evaluation failed. Try again.");
      }

      setEvaluation(payload);
      publish("Feedback ready! Review your scores below.", "success");
    } catch (error) {
      publish(
        error instanceof Error ? error.message : "Unable to fetch feedback.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setEvaluation(null);
    setAnswers(["", "", ""]);
    publish("Session reset. Draft fresh answers.", "info");
  };

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <h1 className="text-3xl font-semibold text-slate-50">Practice Session</h1>
        <p className="text-sm text-slate-300">
          Choose a role, generate three tailored questions, speak your answers out loud,
          and refine the auto-transcribed notes before submitting. Once you submit, OpenAI
          will analyse and score you across key interview dimensions.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-200">
            Role
            <select
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value as Role)}
              className="rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
            >
              {roles.map((role) => (
                <option key={role} value={role} className="bg-slate-900 text-white">
                  {role}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            intent="secondary"
            onClick={handleGenerateQuestions}
            disabled={loadingQuestions}
          >
            {loadingQuestions ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate Questions
          </Button>
        </div>
      </header>

      {questions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-sm text-slate-300">
          Generate a question set to begin your practice session.
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question} className="space-y-3">
              <QuestionCard
                index={index}
                question={question}
                value={answers[index] ?? ""}
                onChange={(value) => handleAnswerChange(index, value)}
                disabled={submitting || transcribingIndex === index}
              />
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <Button
                  type="button"
                  intent="secondary"
                  size="sm"
                  onClick={() => toggleRecording(index)}
                  disabled={
                    !recorderSupported || submitting || transcribingIndex === index
                  }
                >
                  {recordingIndex === index ? (
                    <Square className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                  {recordingIndex === index ? "Stop recording" : "Record answer"}
                </Button>
                {transcribingIndex === index ? (
                  <span className="inline-flex items-center gap-2 text-slate-300">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Transcribing…
                  </span>
                ) : (
                  <span>
                    {recorderSupported
                      ? "Use the microphone to capture a spoken answer."
                      : "Voice capture is not supported in this browser."}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || questions.length === 0}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Get Feedback
        </Button>
        <Button
          type="button"
          intent="ghost"
          onClick={handleReset}
          disabled={questions.length === 0}
        >
          Reset Session
        </Button>
        {evaluation && (
          <Link
            href="/dashboard"
            className={buttonStyles({ intent: "secondary", size: "md" })}
          >
            Save &amp; View Dashboard
          </Link>
        )}
      </div>

      {evaluation && <ScoreCard evaluation={evaluation} heading="Latest Feedback" />}
    </div>
  );
}
