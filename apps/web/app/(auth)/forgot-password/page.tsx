"use client";

import Link from "next/link";
import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import AsyncButton from "@/components/AsyncButton";
import InputField from "@/components/InputField";
import { apiRequest } from "@/lib/api";

type ForgotPasswordResponse = {
  ok: true;
  data: {
    sent: boolean;
    devReset?: {
      token: string;
      expiresAt: string;
    };
  };
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [devResetToken, setDevResetToken] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setMessage("");
    setDevResetToken("");

    try {
      const response = await apiRequest<ForgotPasswordResponse>(
        "/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify({ email }),
          skipAuth: true,
        },
      );

      setMessage(
        "Check your email for reset instructions. For your security, we show this message even if the email is not registered.",
      );

      if (response.data.devReset?.token) {
        setDevResetToken(response.data.devReset.token);
      }
    } catch {
      setMessage(
        "Check your email for reset instructions. For your security, we show this message even if the email is not registered.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your account email. We will send instructions to help you create a new password."
      eyebrow="Account recovery"
      panelTitle="Recover access without support."
      panelSubtitle="A professional auth flow lets real users recover their account safely without touching the database."
      panelItems={[
        {
          title: "Private by default",
          text: "We show the same response even when an email is not found.",
        },
        {
          title: "Time limited",
          text: "Reset links expire, so old recovery links cannot be reused forever.",
        },
        {
          title: "Clean return",
          text: "After reset, users return to the shared Addressor login.",
        },
      ]}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {message ? (
          <div
            className="rounded-[1.15rem] border px-4 py-3 text-sm font-semibold leading-6"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          >
            {message}
          </div>
        ) : null}

        <InputField
          label="Email address"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
        />

        <AsyncButton loading={loading}>Send reset instructions</AsyncButton>

        {devResetToken ? (
          <div
            className="rounded-[1.15rem] border p-4 text-sm leading-6"
            style={{
              background: "var(--surface-strong)",
              borderColor: "var(--border)",
              color: "var(--muted)",
            }}
          >
            <p className="font-black" style={{ color: "var(--text)" }}>
              Development only
            </p>
            <Link
              href={`/reset-password?token=${encodeURIComponent(devResetToken)}`}
              className="mt-2 block break-all font-black transition hover:opacity-80"
              style={{ color: "var(--accent)" }}
            >
              Use reset link
            </Link>
          </div>
        ) : null}

        <div
          className="rounded-[1.25rem] border px-4 py-4 text-center text-sm"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--muted)",
          }}
        >
          Remembered your password?{" "}
          <Link
            href="/login"
            className="font-black transition hover:opacity-80"
            style={{ color: "var(--accent)" }}
          >
            Back to login
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
