"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Headphones,
  Loader2,
  Mic,
  Sparkles,
  Square,
} from "lucide-react";

import { Button, buttonStyles } from "@/components/Button";
import QuestionCard from "@/components/QuestionCard";
import ScoreCard from "@/components/ScoreCard";
import { useToast } from "@/components/ToastProvider";
import { interviewTypes } from "@/lib/schemas";
import type { QuestionResponseType, StoredEvaluationType } from "@/lib/schemas";

type InterviewType = (typeof interviewTypes)[number];

interface PracticeClientProps {
  roles: string[];
}

interface QuestionResponsePayload extends QuestionResponseType {
  message?: string;
}

export default function PracticeClient({ roles }: PracticeClientProps) {
  const defaultRole = roles[0] ?? "";
  const [roleInput, setRoleInput] = useState<string>(defaultRole);
  const [interviewType, setInterviewType] = useState<InterviewType>(interviewTypes[0]);
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [evaluation, setEvaluation] = useState<StoredEvaluationType | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recordingIndex, setRecordingIndex] = useState<number | null>(null);
  const [transcribingIndex, setTranscribingIndex] = useState<number | null>(null);
  const [recorderSupported, setRecorderSupported] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);

  const mediaRecorderRef = useRef<Record<number, MediaRecorder | null>>({});
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Record<number, BlobPart[]>>({});

  const { publish } = useToast();

  const interviewOptions = useMemo(
    () => [
      {
        id: "behavioral" as InterviewType,
        label: "Behavioral",
        blurb: "Highlight past actions and leadership moments.",
      },
      {
        id: "situational" as InterviewType,
        label: "Situational",
        blurb: "Test judgment on hypothetical but realistic dilemmas.",
      },
      {
        id: "technical" as InterviewType,
        label: "Technical",
        blurb: "Dive into architecture, debugging, or analytical thinking.",
      },
    ],
    [],
  );
  const selectedOption = interviewOptions.find((option) => option.id === interviewType);

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
    const normalizedRole = roleInput.trim();

    if (normalizedRole.length < 2) {
      publish("Enter a role (e.g. Engineering Manager).", "error");
      return;
    }

    setLoadingQuestions(true);
    setEvaluation(null);
    setReviewMode(false);
    setCurrentIndex(0);

    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: normalizedRole,
          interviewType,
          count: questionCount,
        }),
      });

      const payload = (await response.json()) as QuestionResponsePayload;

      if (!response.ok || !payload.questions) {
        throw new Error(payload.message ?? "Unable to fetch questions.");
      }

      setRoleInput(normalizedRole);
      setQuestions(payload.questions);
      setAnswers(new Array(payload.questions.length).fill(""));
      setQuestionCount(payload.questions.length);
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

  const microphoneUnavailable = !recorderSupported;
  const quickTips = [
    "Aim for 60-90 seconds per answer and keep STAR in mind.",
    "Lead with the Result, then rewind through Situation → Task → Action.",
    "Use the transcript to tighten phrasing or add key metrics before submission.",
  ];

  const currentQuestion = questions[currentIndex] ?? "";
  const currentAnswer = answers[currentIndex] ?? "";
  const isLastQuestion = currentIndex === questions.length - 1;
  const canAdvance = currentAnswer.trim().length >= 10;
  const allAnswered =
    answers.length === questions.length &&
    answers.every((answer) => answer.trim().length >= 10);

  const handleAdvance = () => {
    if (!canAdvance) {
      publish("Record or type at least a few sentences before continuing.", "error");
      return;
    }

    if (isLastQuestion) {
      setReviewMode(true);
    } else {
      setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
    }
  };

  const handleBack = () => {
    if (currentIndex === 0) {
      return;
    }
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (questions.length === 0) {
      publish("Generate questions before requesting feedback.", "error");
      return;
    }

    const normalizedRole = roleInput.trim();

    if (!normalizedRole) {
      publish("Role cannot be empty.", "error");
      return;
    }

    if (answers.some((answer) => answer.trim().length < 20)) {
      publish("Each answer should be at least 20 characters before evaluation.", "error");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: normalizedRole,
          interviewType,
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
    setQuestions([]);
    setAnswers([]);
    setCurrentIndex(0);
    setReviewMode(false);
    publish("Session reset. Draft fresh answers.", "info");
  };

  return (
    <div className="space-y-10">
      <header className="grid gap-6 rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 backdrop-blur md:grid-cols-[1.35fr_1fr]">
        <div className="space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-200">
            <Headphones className="h-3.5 w-3.5" /> Voice-led drills
          </p>
          <h1 className="text-3xl font-semibold text-slate-50 sm:text-4xl">
            Practice Session
          </h1>
          <p className="text-sm leading-relaxed text-slate-300">
            Generate three tailored prompts, speak your answers aloud, let the AI
            transcribe them, and polish the notes before submitting. We score each
            response against STAR so you know exactly what to sharpen next.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
            <label className="flex items-center gap-2">
              Role
              <div className="relative">
                <input
                  list="role-suggestions"
                  value={roleInput}
                  onChange={(event) => setRoleInput(event.target.value)}
                  placeholder="e.g. Engineering Manager"
                  className="w-64 rounded-md border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-sm text-white shadow-inner focus:border-blue-400 focus:outline-none"
                />
                <datalist id="role-suggestions">
                  {roles.map((role) => (
                    <option key={role} value={role} />
                  ))}
                </datalist>
              </div>
            </label>
            <div className="flex items-center gap-1 rounded-full border border-slate-700/60 bg-slate-950/60 px-1 py-1 text-xs font-medium text-slate-300">
              {interviewOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setInterviewType(option.id)}
                  className={`rounded-full px-3 py-1 transition ${
                    interviewType === option.id
                      ? "bg-blue-500/20 text-blue-200"
                      : "hover:bg-slate-800/70"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {selectedOption && (
              <span className="text-xs text-slate-400">{selectedOption.blurb}</span>
            )}
            <label className="flex items-center gap-2">
              Questions
              <input
                type="range"
                min={1}
                max={5}
                value={questionCount}
                onChange={(event) => setQuestionCount(Number(event.target.value))}
                className="accent-blue-500"
              />
              <span className="w-6 text-right text-xs text-slate-300">
                {questionCount}
              </span>
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
              Generate questions
            </Button>
          </div>
        </div>
        <aside className="space-y-3 rounded-2xl border border-slate-800/50 bg-slate-950/60 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Quick tips
          </h2>
          <ul className="space-y-3 text-xs leading-relaxed text-slate-400">
            {quickTips.map((tip) => (
              <li key={tip} className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-3 w-3 text-indigo-400" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
          {microphoneUnavailable && (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              Browser does not expose microphone access. Type your responses manually or
              switch browsers to use speech capture.
            </p>
          )}
        </aside>
      </header>

      {questions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-sm text-slate-300">
          Generate a question set to begin your practice session.
        </div>
      ) : !reviewMode ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span>
              {Math.round(((currentIndex + 1) / questions.length) * 100)}% complete
            </span>
          </div>
          <div className="space-y-4 rounded-3xl border border-slate-800/50 bg-slate-950/60 p-6">
            <QuestionCard
              index={currentIndex}
              question={currentQuestion}
              value={currentAnswer}
              onChange={(value) => handleAnswerChange(currentIndex, value)}
              disabled={submitting || transcribingIndex === currentIndex}
            />
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <Button
                type="button"
                intent="secondary"
                size="sm"
                onClick={() => toggleRecording(currentIndex)}
                disabled={
                  !recorderSupported || submitting || transcribingIndex === currentIndex
                }
              >
                {recordingIndex === currentIndex ? (
                  <Square className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
                {recordingIndex === currentIndex ? "Stop recording" : "Record answer"}
              </Button>
              {transcribingIndex === currentIndex ? (
                <span className="inline-flex items-center gap-2 text-slate-300">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Transcribing…
                </span>
              ) : (
                <span>
                  {recorderSupported
                    ? "Use the microphone, then refine the transcript inline."
                    : "Voice capture is not supported in this browser."}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Button
                type="button"
                intent="ghost"
                size="sm"
                onClick={handleBack}
                disabled={currentIndex === 0 || submitting}
              >
                Previous
              </Button>
              <Button
                type="button"
                onClick={handleAdvance}
                disabled={submitting || transcribingIndex === currentIndex}
              >
                {isLastQuestion ? "Finish answers" : "Next question"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Review &amp; polish your answers before scoring.</span>
            <Button intent="ghost" size="sm" onClick={() => setReviewMode(false)}>
              Back to questions
            </Button>
          </div>
          {questions.map((question, index) => (
            <div
              key={question}
              className="space-y-3 rounded-3xl border border-slate-800/50 bg-slate-950/60 p-6"
            >
              <QuestionCard
                index={index}
                question={question}
                value={answers[index] ?? ""}
                onChange={(value) => handleAnswerChange(index, value)}
                disabled={submitting || transcribingIndex === index}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || questions.length === 0 || !reviewMode || !allAnswered}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Request feedback
        </Button>
        <Button
          type="button"
          intent="ghost"
          onClick={handleReset}
          disabled={questions.length === 0 || submitting}
        >
          Reset session
        </Button>
        {evaluation && (
          <Link
            href="/dashboard"
            className={buttonStyles({ intent: "secondary", size: "md" })}
          >
            Save &amp; view dashboard
          </Link>
        )}
      </div>

      {evaluation && <ScoreCard evaluation={evaluation} heading="Latest Feedback" />}
    </div>
  );
}
