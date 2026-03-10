import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

import "@/styles/globals.css";

import LogoutButton from "@/components/LogoutButton";
import { ToastProvider } from "@/components/ToastProvider";
import { buttonStyles } from "@/components/Button";
import { getOptionalServerSession, isAdminEmail } from "@/lib/auth-helpers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hire Ground",
  description: "AI interview prep and job application tracking",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { session } = await getOptionalServerSession();

  const navLinks = [
    { href: "/resume-review", label: "Resume review" },
    { href: "/interview-prep", label: "Interview prep" },
    { href: "/tracker", label: "Tracker" },
    { href: "/practice", label: "Practice" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/about", label: "About" },
    { href: "/privacy", label: "Privacy" },
  ];

  if (session) {
    navLinks.push({ href: "/history", label: "History" });
    navLinks.push({ href: "/jobs", label: "Job lab" });
    navLinks.push({ href: "/jobs/portal", label: "Job portal" });
    if (isAdminEmail(session.user.email)) {
      navLinks.push({ href: "/admin/jobs", label: "Admin" });
    }
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} text-slate-100 antialiased`}
      >
        <ToastProvider>
          <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-900/65 backdrop-blur-xl">
              <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
                <Link
                  href="/"
                  className="text-lg font-semibold tracking-tight text-white transition hover:text-[#ffd76a]"
                >
                  Hire Ground
                </Link>
                <div className="flex items-center gap-1 text-sm font-medium">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-md px-3 py-2 text-slate-300 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ))}
                  {session ? (
                    <LogoutButton intent="ghost" size="sm">
                      Sign out
                    </LogoutButton>
                  ) : (
                    <Link
                      href="/login"
                      className={buttonStyles({ intent: "secondary", size: "sm" })}
                    >
                      Log in
                    </Link>
                  )}
                </div>
              </nav>
            </header>
            <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 md:py-16">
              {children}
            </main>
            <footer className="border-t border-slate-800/70 bg-slate-900/70 py-6">
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  © {new Date().getFullYear()} Hire Ground. Prep with intention.
                </p>
                <p className="flex items-center gap-3">
                  <Link
                    href="https://supabase.com"
                    className="transition hover:text-slate-300"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Powered by Supabase
                  </Link>
                  <span className="text-slate-600">|</span>
                  <Link
                    href="https://openai.com"
                    className="transition hover:text-slate-300"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Powered by OpenAI
                  </Link>
                </p>
              </div>
            </footer>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
