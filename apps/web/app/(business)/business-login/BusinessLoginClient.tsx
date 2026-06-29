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

export default function BusinessLoginClient() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      });

      const result = await redirectAfterAuth({
        payload: response.data,
        redirectTo,
        fallback: "/business-dashboard",
        requireBusinessAccess: true,
      });

      if (!result.redirected) {
        setError(result.error);
      }
    } catch {
      setError("Login failed. Confirm your email/phone are verified.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Business login"
      subtitle="Access your Addressor business dashboard to manage your public presence."
      eyebrow="Business access"
      panelTitle="Keep your public presence current."
      panelSubtitle="Only business owners and approved team members can enter business tools."
      panelItems={[
        {
          title: "Verified business",
          text: "Only approved owners and team members enter business tools.",
        },
        {
          title: "Same access rules",
          text: "Google sign-in still respects business roles and platform permissions.",
        },
        {
          title: "Fast dashboard",
          text: "Manage visibility, trust signals, and availability with less friction.",
        },
      ]}
    >
      <form onSubmit={handleLogin} className="space-y-4">
        {error ? (
          <div
            className="rounded-2xl border px-4 py-3 text-sm leading-6"
            style={{
              color: "var(--danger)",
              borderColor: "var(--border)",
              background: "var(--surface-strong)",
            }}
          >
            {error}
          </div>
        ) : null}

        <GoogleSignInButton
          intent="business"
          redirectTo={redirectTo}
          fallbackRedirectTo="/business-dashboard"
          requireBusinessAccess
          onError={setError}
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

        <InputField
          label="Business email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="owner@business.com"
        />

        <InputField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Your password"
        />

        <AsyncButton loading={loading}>Enter business dashboard</AsyncButton>

        <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
          New business?{" "}
          <Link
            href="/business-register"
            className="font-bold"
            style={{ color: "var(--accent)" }}
          >
            Register here
          </Link>
        </p>

        <p className="text-center text-xs" style={{ color: "var(--muted)" }}>
          Just exploring?{" "}
          <Link
            href="/login"
            className="font-bold"
            style={{ color: "var(--accent)" }}
          >
            Use customer login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}