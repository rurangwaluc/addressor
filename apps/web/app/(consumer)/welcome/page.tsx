"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthBadge from "@/components/AuthBadge";
import ThemeToggle from "@/components/ThemeToggle";
import LogoutButton from "@/components/auth/LogoutButton";

export default function WelcomePage() {
  const [ready, setReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("addressorAuthToken");
    setHasToken(Boolean(token));
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <main className="min-h-screen p-6" style={{ background: "var(--bg)" }}>
        <div
          className="mx-auto h-40 max-w-3xl animate-pulse rounded-[2rem]"
          style={{ background: "var(--border)" }}
        />
      </main>
    );
  }

  if (!hasToken) {
    return (
      <main className="grid min-h-screen place-items-center px-4" style={{ background: "var(--bg)" }}>
        <div
          className="max-w-md rounded-[2rem] border p-6 text-center shadow-xl"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <h1 className="text-2xl font-black">Access required</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            Please login before continuing.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-block rounded-2xl px-5 py-3 text-sm font-bold"
            style={{ background: "var(--primary)", color: "var(--primary-text)" }}
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="imigongo-pattern absolute inset-0 opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(182,95,42,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(22,17,12,0.14),transparent_30%)]" />

      <div className="relative mx-auto max-w-6xl">
        <nav
          className="flex items-center justify-between rounded-full border px-4 py-3 backdrop-blur-xl"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div>
            <p className="text-lg font-black tracking-tight">Addressor</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Auth flow complete
            </p>
          </div>
          <ThemeToggle />
        </nav>

        <section className="grid min-h-[calc(100vh-7rem)] place-items-center py-12">
          <div
            className="w-full max-w-3xl rounded-[2rem] border p-6 text-center shadow-2xl backdrop-blur-xl sm:p-10"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <AuthBadge>Verified access</AuthBadge>

            <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
              Welcome to Addressor.
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 sm:text-base" style={{ color: "var(--muted)" }}>
              Your verified account is ready. Next, we will connect this access
              to business onboarding, branches, listings, availability, bookings,
              and the full Addressor experience.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["Discover", "Book", "Manage"].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border p-4 text-sm font-black"
                  style={{
                    background: "var(--surface-strong)",
                    borderColor: "var(--border)",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8">
              <LogoutButton />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}