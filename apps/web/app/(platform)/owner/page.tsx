"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthBadge from "@/components/AuthBadge";
import ThemeToggle from "@/components/ThemeToggle";
import { apiRequest } from "@/lib/api";

type PlatformRole = "platform_owner" | "platform_admin" | "platform_support";

type PlatformMeResponse = {
  ok: true;
  data: {
    userId: string;
    role: PlatformRole;
    permissions: string[];
  };
};

const ownerCards = [
  {
    title: "Businesses",
    text: "Review businesses joining Addressor.",
  },
  {
    title: "Verification",
    text: "Control trust, approvals, and platform quality.",
  },
  {
    title: "Revenue",
    text: "Track subscriptions, commissions, and payments.",
  },
  {
    title: "Users",
    text: "Monitor verified users and account activity.",
  },
];

export default function PlatformOwnerPage() {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [role, setRole] = useState<PlatformRole | null>(null);

  useEffect(() => {
    async function checkPlatformAccess() {
      const token = localStorage.getItem("addressorAuthToken");

      if (!token) {
        setAllowed(false);
        setReady(true);
        return;
      }

      try {
        const response = await apiRequest<PlatformMeResponse>("/platform/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setRole(response.data.role);
        setAllowed(true);
      } catch {
        localStorage.removeItem("addressorAuthToken");
        localStorage.removeItem("addressorPlatformRole");
        setAllowed(false);
      } finally {
        setReady(true);
      }
    }

    checkPlatformAccess();
  }, []);

  if (!ready) {
    return (
      <main className="min-h-screen p-6" style={{ background: "var(--bg)" }}>
        <div
          className="mx-auto h-64 max-w-5xl animate-pulse rounded-[2rem]"
          style={{ background: "var(--border)" }}
        />
      </main>
    );
  }

  if (!allowed) {
    return (
      <main
        className="grid min-h-screen place-items-center px-4"
        style={{ background: "var(--bg)" }}
      >
        <div
          className="max-w-md rounded-[2rem] border p-6 text-center shadow-xl"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <AuthBadge>Owner access</AuthBadge>

          <h1 className="mt-5 text-3xl font-black">Platform access required</h1>

          <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
            This area is only for Addressor platform owner, admins, and support
            team members.
          </p>

          <Link
            href="/platform-login"
            className="mt-6 inline-block rounded-2xl px-5 py-3 text-sm font-bold"
            style={{
              background: "var(--primary)",
              color: "var(--primary-text)",
            }}
          >
            Go to platform login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="imigongo-pattern absolute inset-0 opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(182,95,42,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(22,17,12,0.14),transparent_30%)]" />

      <div className="relative mx-auto max-w-7xl">
        <nav
          className="flex items-center justify-between rounded-full border px-4 py-3 backdrop-blur-xl"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <div>
            <p className="text-lg font-black tracking-tight">
              Addressor Owner
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Platform control room · {role}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("addressorAuthToken");
                localStorage.removeItem("addressorPlatformRole");
                window.location.href = "/platform-login";
              }}
              className="rounded-full border px-4 py-2 text-sm font-bold"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-strong)",
                color: "var(--text)",
              }}
            >
              Logout
            </button>
          </div>
        </nav>

        <section className="grid min-h-[calc(100vh-7rem)] items-center gap-8 py-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <AuthBadge>Platform owner access</AuthBadge>

            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl">
              Control the trust layer of Addressor.
            </h1>

            <p
              className="mt-6 max-w-xl text-base leading-8"
              style={{ color: "var(--muted)" }}
            >
              This is your side of the SaaS: business approvals, platform
              verification, users, revenue, and operational visibility.
            </p>
          </div>

          <div
            className="rounded-[2rem] border p-5 shadow-2xl backdrop-blur-xl sm:p-7"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {ownerCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-3xl border p-5"
                  style={{
                    background: "var(--surface-strong)",
                    borderColor: "var(--border)",
                  }}
                >
                  <p className="text-lg font-black">{card.title}</p>
                  <p
                    className="mt-2 text-sm leading-6"
                    style={{ color: "var(--muted)" }}
                  >
                    {card.text}
                  </p>
                </div>
              ))}
            </div>

            <div
              className="mt-5 rounded-3xl border p-5"
              style={{
                background: "var(--accent-soft)",
                borderColor: "var(--border)",
              }}
            >
              <p className="text-sm font-black" style={{ color: "var(--accent)" }}>
                Current role
              </p>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--text)" }}>
                You are signed in as <strong>{role}</strong>. Backend access is
                verified through <strong>/platform/me</strong>, not just local
                token presence.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}