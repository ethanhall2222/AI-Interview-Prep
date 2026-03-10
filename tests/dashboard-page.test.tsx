import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/lib/auth-helpers", () => ({
  getOptionalServerSession: vi.fn(async () => ({ session: null, supabase: null })),
}));

import DashboardPage from "@/app/dashboard/page";

describe("dashboard logged-out mode", () => {
  it("renders guest empty state without throwing", async () => {
    const element = await DashboardPage({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(element);
    expect(html).toContain("You are currently in guest mode.");
    expect(html).toContain("Start practice");
    expect(html).toContain("Run resume review");
  });
});
