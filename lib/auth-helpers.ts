import { redirect } from "next/navigation";
import type { TypedSupabaseClient } from "./supabase-server";
import {
  getSupabaseRouteHandlerClient,
  getSupabaseServerComponentClient,
} from "./supabase-server";

async function ensureProfileRecord(supabase: TypedSupabaseClient, userId: string) {
  try {
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId }, { onConflict: "id" });

    if (error) {
      console.error("Failed to upsert profile", error.message);
    }
  } catch (error) {
    console.error("Unexpected profile upsert error", error);
  }
}

function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function isDevModeBypass() {
  return (
    process.env.NEXT_PUBLIC_DEV_MODE === "1" ||
    process.env.NODE_ENV !== "production"
  );
}

function stubSession() {
  return {
    session: null as AppSession | null,
    supabase: null as unknown as TypedSupabaseClient,
  };
}

type AppSession = {
  user: {
    id: string;
    email: string | null;
  };
};

function parseAdminEmails() {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null) {
  if (!email) {
    return false;
  }
  return parseAdminEmails().includes(email.toLowerCase());
}

export async function requireServerSession() {
  if (isDevModeBypass() || !hasSupabaseEnv()) {
    return stubSession();
  }

  const supabase = getSupabaseServerComponentClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const session: AppSession = {
    user: {
      id: user.id,
      email: user.email ?? null,
    },
  };

  await ensureProfileRecord(supabase, user.id);

  return { session, supabase } as { session: AppSession; supabase: TypedSupabaseClient };
}

export async function getOptionalServerSession() {
  if (isDevModeBypass() || !hasSupabaseEnv()) {
    return stubSession();
  }

  const supabase = getSupabaseServerComponentClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!error && user) {
    await ensureProfileRecord(supabase, user.id);
  }

  const session: AppSession | null =
    !error && user
      ? {
          user: {
            id: user.id,
            email: user.email ?? null,
          },
        }
      : null;

  return { session: session ?? null, supabase } as {
    session: AppSession | null;
    supabase: TypedSupabaseClient;
  };
}

export async function getRouteHandlerSession() {
  if (isDevModeBypass() || !hasSupabaseEnv()) {
    return stubSession();
  }

  const supabase = getSupabaseRouteHandlerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!error && user) {
    await ensureProfileRecord(supabase, user.id);
  }

  const session: AppSession | null =
    !error && user
      ? {
          user: {
            id: user.id,
            email: user.email ?? null,
          },
        }
      : null;

  return { session: session ?? null, supabase } as {
    session: AppSession | null;
    supabase: TypedSupabaseClient;
  };
}

export async function requireAdminSession() {
  const { session, supabase } = await requireServerSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (!isAdminEmail(session.user.email)) {
    redirect("/dashboard");
  }

  return { session, supabase } as { session: AppSession; supabase: TypedSupabaseClient };
}
