"use client";

import { useEffect, useMemo, useState } from "react";
import {
  prepQuestionBank,
  prepRoleLabels,
  rubric,
  starPrompt,
  type PrepRole,
} from "@/lib/interview-prep-config";
import { Button } from "@/components/Button";
import { trackEvent } from "@/lib/analytics";

type RubricState = Record<(typeof rubric)[number]["id"], number>;

const defaultScores: RubricState = {
  structure: 3,
  specificity: 3,
  impact: 3,
  communication: 3,
};

export default function InterviewPrepClient() {
  const [role, setRole] = useState<PrepRole>("swe");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [seconds, setSeconds] = useState(120);
  const [running, setRunning] = useState(false);
  const [scores, setScores] = useState<RubricState>(defaultScores);

  const questions = prepQuestionBank[role];
  const currentQuestion = questions[questionIndex] ?? "";
  const totalScore = useMemo(
    () => Object.values(scores).reduce((acc, value) => acc + value, 0),
    [scores],
  );

  useEffect(() => {
    if (!running) {
      return;
    }
    const id = window.setInterval(() => {
      setSeconds((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const resetTimer = () => {
    setSeconds(120);
    setRunning(false);
  };

  const nextQuestion = () => {
    setQuestionIndex((prev) => (prev + 1) % questions.length);
    resetTimer();
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-50">Interview Prep Hub</h1>
        <p className="text-sm text-slate-300">
          Practice role-specific behavioral prompts, run timed mock rounds, and score
          each response against a consistent rubric.
        </p>
      </header>

      <section className="rounded-3xl border border-slate-800/60 bg-slate-900/65 p-6">
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(prepRoleLabels) as PrepRole[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setRole(id);
                setQuestionIndex(0);
                resetTimer();
                trackEvent("prep_role_changed", { role: id });
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                role === id
                  ? "bg-[#eaaa00]/20 text-[#ffe49a]"
                  : "border border-slate-700 text-slate-300 hover:border-[#eaaa00]/60"
              }`}
            >
              {prepRoleLabels[id]}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-800/60 bg-slate-950/60 p-6">
        <p className="text-xs uppercase tracking-wide text-slate-500">{starPrompt}</p>
        <h2 className="text-xl font-semibold text-slate-100">{currentQuestion}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() => {
              setRunning((prev) => {
                const next = !prev;
                trackEvent("prep_timer_toggled", { running: next });
                return next;
              });
            }}
          >
            {running ? "Pause timer" : "Start timer"}
          </Button>
          <Button type="button" intent="secondary" onClick={resetTimer}>
            Reset timer
          </Button>
          <Button
            type="button"
            intent="ghost"
            onClick={() => {
              nextQuestion();
              trackEvent("prep_next_question", { role });
            }}
          >
            Next prompt
          </Button>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
            Time left: {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
          </span>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-800/60 bg-slate-950/60 p-6">
        <h3 className="text-lg font-semibold text-slate-100">Scoring rubric</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {rubric.map((item) => (
            <label
              key={item.id}
              className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <p className="text-sm font-medium text-slate-100">{item.label}</p>
              <p className="text-xs text-slate-400">{item.helper}</p>
              <input
                type="range"
                min={1}
                max={5}
                value={scores[item.id]}
                onChange={(event) =>
                  setScores((current) => ({
                    ...current,
                    [item.id]: Number(event.target.value),
                  }))
                }
                className="w-full accent-[#eaaa00]"
              />
              <p className="text-xs text-slate-300">Score: {scores[item.id]} / 5</p>
            </label>
          ))}
        </div>
        <div className="rounded-xl border border-[#eaaa00]/40 bg-[#eaaa00]/10 px-4 py-3 text-sm text-[#ffe49a]">
          Mock score: {totalScore} / {rubric.length * 5}
        </div>
      </section>
    </div>
  );
}
