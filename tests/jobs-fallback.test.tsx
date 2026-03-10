import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import JobsClient from "@/app/jobs/jobs-client";

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
    root?.render(
      <JobsClient
        canPersist
        initialParams={{ jobTitle: "", company: "", jobUrl: "" }}
      />,
    );
  });
}

async function setField(label: string, value: string) {
  const labels = [...document.querySelectorAll("label")];
  const target = labels.find((node) => node.textContent?.includes(label));
  if (!target) {
    throw new Error(`Missing field: ${label}`);
  }
  const input = target.parentElement?.querySelector("input, textarea") as
    | HTMLInputElement
    | HTMLTextAreaElement
    | null;
  if (!input) {
    throw new Error(`Missing input for: ${label}`);
  }
  const setter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(input),
    "value",
  )?.set;
  if (!setter) {
    throw new Error(`Missing value setter for: ${label}`);
  }
  await act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

async function clickButtonByText(text: string) {
  const button = [...document.querySelectorAll("button")].find(
    (node) => node.textContent?.trim() === text,
  ) as HTMLButtonElement | undefined;
  if (!button) {
    throw new Error(`Missing button: ${text}`);
  }
  await act(async () => {
    button.click();
  });
}

afterEach(async () => {
  vi.restoreAllMocks();
  await act(async () => {
    root?.unmount();
  });
  root = null;
  if (container) {
    container.remove();
    container = null;
  }
});

describe("jobs fallback when API fails", () => {
  it("shows retry/error panel instead of hanging", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("Network unavailable");
      }),
    );

    await renderComponent();
    await setField("Job title", "Software Engineer");
    await setField("Company", "Example Inc");
    await setField(
      "Job description",
      "Build APIs and improve reliability for distributed systems.",
    );
    await setField(
      "Resume summary",
      "Built services, improved latency by 25%, and led delivery.",
    );

    await clickButtonByText("Generate package");
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const text = document.body.textContent ?? "";
    expect(text).toContain("Job Lab request failed");
    expect(text).toContain("Retry generation");
    expect(text).toContain("You can still continue");
  });
});
