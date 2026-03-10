import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import ResumeReviewClient from "@/app/resume-review/resume-review-client";

vi.mock("@/components/ToastProvider", () => ({
  useToast: () => ({
    publish: vi.fn(),
  }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement | null = null;

async function renderComponent() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root?.render(<ResumeReviewClient />);
  });
}

async function clickButtonByText(text: string) {
  const button = [...document.querySelectorAll("button")].find(
    (node) => node.textContent?.trim() === text,
  ) as HTMLButtonElement | undefined;
  if (!button) {
    throw new Error(`Missing button with text: ${text}`);
  }
  await act(async () => {
    button.click();
  });
}

afterEach(async () => {
  await act(async () => {
    root?.unmount();
  });
  root = null;
  if (container) {
    container.remove();
    container = null;
  }
});

describe("Resume review critical flow", () => {
  it("renders analysis sections after resume + JD input and run", async () => {
    await renderComponent();

    await clickButtonByText("Use sample resume");
    await clickButtonByText("Use sample job description");
    await clickButtonByText("Run resume review");

    const text = document.body.textContent ?? "";
    expect(text).toContain("Top issues checklist");
    expect(text).toContain("Keyword gaps");
    expect(text).toContain("Before / After rewrites");
  });

  it("renders keyword gap chips after JD analysis", async () => {
    await renderComponent();

    await clickButtonByText("Use sample resume");
    await clickButtonByText("Use sample job description");
    await clickButtonByText("Run resume review");

    const keywordArticle = [...document.querySelectorAll("article")].find((node) =>
      node.textContent?.includes("Keyword gaps"),
    );
    expect(keywordArticle).toBeTruthy();
    const chips = keywordArticle?.querySelectorAll("span");
    expect((chips?.length ?? 0) > 0).toBe(true);
  });
});
