"use client";

import { Button } from "@/components/Button";

export default function ResumeReviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-100">
      <p className="font-semibold">Resume Review could not load.</p>
      <p className="text-red-200/90">{error.message}</p>
      <Button type="button" intent="secondary" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
