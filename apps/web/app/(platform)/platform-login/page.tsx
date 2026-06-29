"use client";

import Link from "next/link";
import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import AsyncButton from "@/components/AsyncButton";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import InputField from "@/components/InputField";
import { apiRequest } from "@/lib/api";
import { redirectAfterAuth } from "@/lib/authSession";
import type { AccessContext } from "@/lib/authRedirect";

type LoginResponse = {
  ok: true;
  data: {
    token: string;
    accessToken?: string;
    refreshToken?: string;
    access?: AccessContext;
  };
};

export default function PlatformLoginPage() {
  const [email, setEmail] = useState("rurangwa.luke@gmail.com");
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
        fallback: "/platform",
        requirePlatformAccess: true,
      });

      if (!result.redirected) {
        setError(result.error);
      }
    } catch {
      setError("Platform login failed. Use an approved platform account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Platform login"
      subtitle="Secure access for the Addressor platform team."
      eyebrow="Platform access"
      panelTitle="This area controls Addressor operations."
      panelSubtitle="Only platform owner, admins, and support team members can enter."
      panelItems={[
        {
          title: "Platform only",
          text: "Customer and business accounts are blocked from this area.",
        },
        {
          title: "Full visibility",
          text: "Review businesses, platform settings, users, and support operations.",
        },
        {
          title: "Strict redirects",
          text: "Approved platform users go to the platform control area after login.",
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
          intent="login"
          fallbackRedirectTo="/platform"
          requirePlatformAccess
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
          label="Platform email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="platform@addressor.com"
        />

        <InputField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Your password"
        />

        <AsyncButton loading={loading}>Enter platform</AsyncButton>

        <p className="text-center text-xs leading-6" style={{ color: "var(--muted)" }}>
          Business owner?{" "}
          <Link
            href="/business-login"
            className="font-bold"
            style={{ color: "var(--accent)" }}
          >
            Use business login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}