"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import AsyncButton from "@/components/AsyncButton";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import InputField from "@/components/InputField";
import { redirectAfterAuth } from "@/lib/authSession";
import type { AccessContext } from "@/lib/authRedirect";
import { apiRequest } from "@/lib/api";

type LoginResponse = {
  ok: true;
  data: {
    token: string;
    accessToken?: string;
    refreshToken?: string;
    access?: AccessContext;
  };
};

const outcomes = ["Saved places", "Fast return", "Trusted picks"];

export default function LoginClient() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      });

      const result = await redirectAfterAuth({
        payload: response.data,
        redirectTo,
        fallback: "/welcome",
      });

      if (!result.redirected) {
        setMessage(result.error);
      }
    } catch {
      setMessage(
        "Login failed. Check your password and make sure your email and phone are verified.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Save better places. Return to trusted options faster."
      eyebrow="Customer access"
      panelTitle="Your trusted Rwanda list starts here."
      panelSubtitle="Log in when you want saved places, faster returns, and a personal discovery history."
      panelItems={[
        {
          title: "Browse first",
          text: "You can explore restaurants, stays, events, and nightlife before signing in.",
        },
        {
          title: "Save when ready",
          text: "Sign in to keep places, plans, and trusted options connected to your account.",
        },
        {
          title: "Same account",
          text: "Google and password login both use the same Addressor access rules.",
        },
      ]}
    >
      <form onSubmit={handleLogin} className="space-y-5">
        <div className="grid grid-cols-3 gap-2">
          {outcomes.map((item) => (
            <div
              key={item}
              className="relative overflow-hidden rounded-2xl border px-2.5 py-3 text-center text-[0.68rem] font-black"
              style={{
                background:
                  "linear-gradient(145deg, var(--surface), color-mix(in srgb, var(--surface) 92%, var(--accent-soft)))",
                borderColor: "var(--border)",
                color: "var(--text)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              <div className="imigongo-pattern absolute inset-0 opacity-[0.06]" />
              <span className="relative">{item}</span>
            </div>
          ))}
        </div>

        {message ? (
          <div
            className="rounded-[1.15rem] border px-4 py-3 text-sm font-semibold leading-6"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--danger)",
            }}
          >
            {message}
          </div>
        ) : null}

        <GoogleSignInButton
          intent="login"
          redirectTo={redirectTo}
          fallbackRedirectTo="/welcome"
          onError={setMessage}
        />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: "var(--border)" }} />
          <span
            className="text-[0.68rem] font-black uppercase tracking-[0.18em]"
            style={{ color: "var(--muted)" }}
          >
            Or use password
          </span>
          <div className="h-px flex-1" style={{ background: "var(--border)" }} />
        </div>

        <div className="space-y-4">
          <InputField
            label="Email address"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
          />

          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
          />
        </div>

        <AsyncButton loading={loading}>Login to Addressor</AsyncButton>

        <div
          className="rounded-[1.35rem] border px-4 py-4 text-center text-sm leading-6"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--muted)",
          }}
        >
          <p>
            New to Addressor?{" "}
            <Link
              href="/signup"
              className="font-black transition hover:opacity-80"
              style={{ color: "var(--accent)" }}
            >
              Create account
            </Link>
          </p>

          <div className="my-3 h-px w-full" style={{ background: "var(--border)" }} />

          <p>
            Business owner?{" "}
            <Link
              href="/business-login"
              className="font-black transition hover:opacity-80"
              style={{ color: "var(--accent)" }}
            >
              Business login
            </Link>
          </p>

          <p className="mt-2 text-xs">
            Platform team?{" "}
            <Link
              href="/platform-login"
              className="font-bold opacity-70 transition hover:opacity-100"
              style={{ color: "var(--muted)" }}
            >
              Internal access
            </Link>
          </p>
        </div>
      </form>
    </AuthShell>
  );
}