"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/Button";
import { useToast } from "@/components/ToastProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { publish } = useToast();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const supabase = getSupabaseBrowserClient();

    try {
      const redirectBase =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const nextPath = "/admin/jobs";

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${redirectBase}/auth/callback?next=${encodeURIComponent(
            nextPath,
          )}`,
        },
      });

      if (error) {
        throw error;
      }

      publish("Admin magic link sent. Open it on this device.", "success");
    } catch (error) {
      publish(
        error instanceof Error ? error.message : "Unable to send admin magic link.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="admin-email" className="text-sm font-medium text-slate-300">
          Admin email
        </label>
        <input
          id="admin-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-[#eaaa00] focus:outline-none"
          placeholder="admin@yourorg.com"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Sending admin magic link..." : "Send admin magic link"}
      </Button>
    </form>
  );
}
