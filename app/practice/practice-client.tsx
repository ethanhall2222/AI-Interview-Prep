"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import WorkflowRail from "@/components/WorkflowRail";
import { interviewTypes } from "@/lib/schemas";
import type {
  BodyFeedbackType,
  QuestionResponseType,
  StoredEvaluationType,
} from "@/lib/schemas";

type InterviewType = (typeof interviewTypes)[number];

interface PracticeClientProps {
  roles: string[];
}

interface QuestionResponsePayload extends QuestionResponseType {
  message?: string;
}

interface EvalResponsePayload extends StoredEvaluationType {
  sessionId?: string;
  message?: string;
}

type BodyFeedbackEntry = BodyFeedbackType | null;

export default function PracticeClient({ roles }: PracticeClientProps) {
  const router = useRouter();
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
  const [analyzingIndex, setAnalyzingIndex] = useState<number | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [recorderSupported, setRecorderSupported] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [mode, setMode] = useState<"voice" | "type">("type");
  const [micPermission, setMicPermission] = useState<
    "granted" | "denied" | "prompt" | "unknown"
  >("unknown");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);
  const [latestSessionId, setLatestSessionId] = useState<string | null>(null);
  const [bodyFeedbacks, setBodyFeedbacks] = useState<BodyFeedbackEntry[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<(string | null)[]>([]);

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

    const mediaSupported = !!(
      navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function"
    );
    const speechApiSupported = Boolean(
      "SpeechRecognition" in window || "webkitSpeechRecognition" in window,
    );

    setRecorderSupported(mediaSupported);
    setSpeechSupported(speechApiSupported);
    if (mediaSupported && speechApiSupported) {
      setMode("voice");
    } else {
      setMode("type");
    }

    const checkPermission = async () => {
      try {
        if (!navigator.permissions?.query) {
          setMicPermission("unknown");
          return;
        }
        const status = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        setMicPermission(status.state);
        status.onchange = () => setMicPermission(status.state);
      } catch {
        setMicPermission("unknown");
      }
    };

    void checkPermission();

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
    setLatestSessionId(null);
    setReviewMode(false);
    setCurrentIndex(0);
    videoPreviews.forEach((url) => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    });
    setVideoPreviews([]);
    setBodyFeedbacks([]);

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
      setBodyFeedbacks(Array.from({ length: payload.questions.length }, () => null));
      setVideoPreviews(Array.from({ length: payload.questions.length }, () => null));
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
      const transcript = payload.text;

      setAnswers((current) => {
        const next = [...current];
        const existing = next[index]?.trim();
        next[index] = existing ? `${existing}\n${transcript}` : transcript;
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

  const submitBodyFeedback = async (index: number, blob: Blob, question: string) => {
    setAnalyzingIndex(index);

    try {
      const formData = new FormData();
      formData.append("video", blob, `body-${Date.now()}.webm`);
      formData.append("question", question);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as BodyFeedbackType & { message?: string };

      if (!response.ok || !payload.summary) {
        throw new Error(payload.message ?? "Body-language analysis failed.");
      }

      setBodyFeedbacks((current) => {
        const next = [...current];
        next[index] = {
          question,
          summary: payload.summary,
          cues: payload.cues ?? [],
        };
        return next;
      });
    } catch (error) {
      publish(
        error instanceof Error ? error.message : "Unable to analyse body language.",
        "error",
      );
    } finally {
      setAnalyzingIndex(null);
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
      if (mode !== "voice") {
        publish("Switch to Voice mode to record audio.", "error");
        return;
      }

      if (!recorderSupported || !speechSupported) {
        publish("Voice mode is not supported in this browser.", "error");
        return;
      }

      if (recordingIndex !== null) {
        stopRecording(recordingIndex);
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: "user" },
      });
      setMicPermission("granted");
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
        const blob = new Blob(chunks, { type: "video/webm" });
        const previewUrl = URL.createObjectURL(blob);
        setVideoPreviews((current) => {
          const next = [...current];
          if (next[index]) {
            URL.revokeObjectURL(next[index]!);
          }
          next[index] = previewUrl;
          return next;
        });
        mediaStreamRef.current = null;
        if (questions[index]) {
          void submitTranscription(index, blob, questions[index]);
          void submitBodyFeedback(index, blob, questions[index]);
        }
      };

      recorder.start();
      mediaRecorderRef.current[index] = recorder;
      setRecordingIndex(index);
      publish("Recording started. Speak your answer out loud.", "info");
    } catch (error) {
      setMicPermission("denied");
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

  const voiceUnavailable = !recorderSupported || !speechSupported;
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

  const playQuestionAudio = async (text: string, index: number) => {
    if (!text) {
      return;
    }

    setPlayingIndex(index);

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const fallback = await response.json().catch(() => ({ message: "" }));
        throw new Error(fallback.message ?? "Unable to generate audio.");
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        setPlayingIndex(null);
        return;
      }

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setPlayingIndex(null);
      };
      await audio.play();
    } catch (error) {
      setPlayingIndex(null);
      publish(error instanceof Error ? error.message : "Unable to play audio.", "error");
    }
  };

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

    const sanitizedBodyFeedbacks = bodyFeedbacks.reduce<BodyFeedbackType[]>(
      (acc, entry, idx) => {
        if (entry) {
          acc.push({
            question: questions[idx],
            summary: entry.summary,
            cues: entry.cues,
          });
        }
        return acc;
      },
      [],
    );

    try {
      const response = await fetch("/api/eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: normalizedRole,
          interviewType,
          questions,
          answers,
          bodyFeedbacks: sanitizedBodyFeedbacks,
        }),
      });

      const payload = (await response.json()) as EvalResponsePayload;

      if (!response.ok) {
        throw new Error(payload.message ?? "Evaluation failed. Try again.");
      }

      const { sessionId } = payload;
      const evaluationPayload: StoredEvaluationType = {
        scores: payload.scores,
        feedback: payload.feedback,
        tips_next_time: payload.tips_next_time,
        meta: payload.meta,
      };
      setEvaluation(evaluationPayload);
      setLatestSessionId(sessionId ?? null);

      if (sessionId) {
        publish("Feedback ready. Opening your dashboard.", "success");
        setTimeout(() => {
          router.push(`/dashboard?latest=${sessionId}`);
        }, 600);
      } else {
        publish("Feedback ready! Review your scores below.", "success");
      }
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
    setLatestSessionId(null);
    setQuestions([]);
    setAnswers([]);
    bodyFeedbacks.forEach((entry, idx) => {
      if (videoPreviews[idx]) {
        URL.revokeObjectURL(videoPreviews[idx]!);
      }
    });
    setBodyFeedbacks([]);
    setVideoPreviews([]);
    setCurrentIndex(0);
    setReviewMode(false);
    publish("Session reset. Draft fresh answers.", "info");
  };

  return (
    <div className="space-y-10">
      <WorkflowRail current="practice" />
      <header className="grid gap-6 rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 backdrop-blur md:grid-cols-[1.35fr_1fr]">
        <div className="space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#eaaa00]/40 bg-[#eaaa00]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#ffe39f]">
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
                  className="w-64 rounded-md border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-sm text-white shadow-inner focus:border-[#eaaa00] focus:outline-none"
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
                      ? "bg-[#eaaa00]/20 text-[#ffe39f]"
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
                className="accent-[#eaaa00]"
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
            <CheckCircle2 className="h-4 w-4 text-[#eaaa00]" /> Quick tips
          </h2>
          <ul className="space-y-3 text-xs leading-relaxed text-slate-400">
            {quickTips.map((tip) => (
              <li key={tip} className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-3 w-3 text-[#eaaa00]" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-2 rounded-md border border-slate-800/70 bg-slate-950/60 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Input mode</p>
            <div className="flex items-center gap-1 rounded-full border border-slate-700/60 bg-slate-950/60 px-1 py-1 text-xs font-medium text-slate-300">
              <button
                type="button"
                onClick={() => setMode("voice")}
                disabled={voiceUnavailable}
                className={`rounded-full px-3 py-1 transition ${
                  mode === "voice"
                    ? "bg-[#eaaa00]/20 text-[#ffe39f]"
                    : "hover:bg-slate-800/70"
                } ${voiceUnavailable ? "cursor-not-allowed opacity-50" : ""}`}
              >
                Voice mode
              </button>
              <button
                type="button"
                onClick={() => setMode("type")}
                className={`rounded-full px-3 py-1 transition ${
                  mode === "type" ? "bg-slate-800 text-slate-100" : "hover:bg-slate-800/70"
                }`}
              >
                Type mode
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Permission: <span className="text-slate-300">{micPermission}</span>
            </p>
            {mode === "voice" && (
              <p className="text-[11px] text-slate-400">
                If mic fails: browser settings -&gt; site permissions -&gt; allow microphone,
                then reload.
              </p>
            )}
          </div>
          {voiceUnavailable && (
            <p className="rounded-md border border-[#eaaa00]/40 bg-[#eaaa00]/10 px-3 py-2 text-xs text-[#ffe39f]">
              Voice mode is unavailable here because microphone capture or speech APIs
              are missing. We switched you to Type mode automatically.
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
              disabled={
                submitting ||
                transcribingIndex === currentIndex ||
                analyzingIndex === currentIndex
              }
            />
            {videoPreviews[currentIndex] && (
              <video
                src={videoPreviews[currentIndex]!}
                className="w-full rounded-xl border border-slate-800/70"
                controls
              />
            )}
            {bodyFeedbacks[currentIndex] && (
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Body language
                </p>
                <p className="mt-1 text-slate-300">
                  {bodyFeedbacks[currentIndex]!.summary}
                </p>
                {bodyFeedbacks[currentIndex]!.cues.length > 0 && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    Cues: {bodyFeedbacks[currentIndex]!.cues.join(", ")}
                  </p>
                )}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <Button
                type="button"
                intent="secondary"
                size="sm"
                onClick={() => toggleRecording(currentIndex)}
                disabled={
                  mode !== "voice" ||
                  !recorderSupported ||
                  !speechSupported ||
                  submitting ||
                  transcribingIndex === currentIndex ||
                  analyzingIndex === currentIndex
                }
              >
                {recordingIndex === currentIndex ? (
                  <Square className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
                {recordingIndex === currentIndex ? "Stop recording" : "Record answer"}
              </Button>
              <Button
                type="button"
                intent="ghost"
                size="sm"
                onClick={() => playQuestionAudio(currentQuestion, currentIndex)}
                disabled={submitting || playingIndex === currentIndex}
              >
                {playingIndex === currentIndex ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Headphones className="h-4 w-4" />
                )}
                Hear question
              </Button>
              {transcribingIndex === currentIndex ? (
                <span className="inline-flex items-center gap-2 text-slate-300">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Transcribing…
                </span>
              ) : analyzingIndex === currentIndex ? (
                <span className="inline-flex items-center gap-2 text-slate-300">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analysing body
                  language…
                </span>
              ) : (
                <span>
                  {recorderSupported
                  ? "Use the microphone, then refine the transcript inline."
                    : "Type mode is active. You can still complete the entire flow."}
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
                disabled={
                  submitting ||
                  transcribingIndex === currentIndex ||
                  analyzingIndex === currentIndex
                }
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
              {videoPreviews[index] && (
                <video
                  src={videoPreviews[index]!}
                  className="w-full rounded-xl border border-slate-800/70"
                  controls
                />
              )}
              {bodyFeedbacks[index] && (
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Body language
                  </p>
                  <p className="mt-1 text-slate-300">{bodyFeedbacks[index]!.summary}</p>
                  {bodyFeedbacks[index]!.cues.length > 0 && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      Cues: {bodyFeedbacks[index]!.cues.join(", ")}
                    </p>
                  )}
                </div>
              )}
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
            href={latestSessionId ? `/dashboard?latest=${latestSessionId}` : "/dashboard"}
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
