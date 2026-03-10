import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonStyles } from "@/components/Button";
import { getOptionalServerSession, isAdminEmail } from "@/lib/auth-helpers";
import AdminLoginForm from "./admin-login-form";

export default async function AdminLoginPage() {
  const { session } = await getOptionalServerSession();

  if (session && isAdminEmail(session.user.email)) {
    redirect("/admin/jobs");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 rounded-3xl border border-slate-800 bg-slate-950/70 p-10 text-slate-200 shadow">
      <div className="space-y-3 text-center">
        <h1 className="text-2xl font-semibold text-slate-50">Admin Login</h1>
        <p className="text-sm text-slate-400">
          Use an authorized admin email to access the posting review queue.
        </p>
      </div>
      <AdminLoginForm />
      <p className="text-center text-xs text-slate-500">
        Access is controlled via <code>ADMIN_EMAILS</code> on the server.
      </p>
      <Link href="/" className={buttonStyles({ intent: "ghost" })}>
        Back to landing
      </Link>
    </div>
  );
}
