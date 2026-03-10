export type AnalyticsEvent = {
  name: string;
  detail?: Record<string, string | number | boolean | null>;
  at: string;
};

const STORAGE_KEY = "hire-ground-analytics-v1";

export function trackEvent(name: string, detail?: AnalyticsEvent["detail"]) {
  const event: AnalyticsEvent = {
    name,
    detail,
    at: new Date().toISOString(),
  };

  if (typeof window === "undefined") {
    return event;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const current = raw ? (JSON.parse(raw) as AnalyticsEvent[]) : [];
    const next = [...current, event].slice(-200);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Non-blocking logging for local analytics only.
  }

  return event;
}
