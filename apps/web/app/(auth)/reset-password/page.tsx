"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import AsyncButton from "@/components/AsyncButton";
import InputField from "@/components/InputField";
import { apiRequest } from "@/lib/api";

type ResetPasswordResponse = {
  ok: true;
  data: {
    reset: true;
  };
};

function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (loading) return;

    setMessage("");

    if (!token) {
      setMessage("This reset link is missing a token. Request a new reset link.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await apiRequest<ResetPasswordResponse>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
        skipAuth: true,
      });

      setComplete(true);
      setMessage("Password reset successfully. You can now login.");
    } catch {
      setMessage("This reset link is invalid or expired. Request a new one.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create a new password"
      subtitle="Use a strong password to protect your Addressor account."
      eyebrow="Secure reset"
      panelTitle="Finish account recovery."
      panelSubtitle="Once the password is changed, old sessions are cleared by the backend and the user signs in again."
      panelItems={[
        {
          title: "Strong password",
          text: "Use uppercase, lowercase, and a number.",
        },
        {
          title: "Expired links blocked",
          text: "Invalid or old reset links cannot change the password.",
        },
        {
          title: "Fresh login",
          text: "After reset, return to the shared Addressor login.",
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
              color: complete ? "var(--success)" : "var(--danger)",
            }}
          >
            {message}
          </div>
        ) : null}

        {!complete ? (
          <>
            <InputField
              label="New password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Minimum 8 characters"
            />

            <InputField
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Repeat your password"
            />

            <AsyncButton loading={loading}>Reset password</AsyncButton>
          </>
        ) : (
          <Link
            href="/login"
            className="block rounded-full px-5 py-3 text-center text-sm font-black transition hover:scale-[1.01]"
            style={{
              background: "var(--accent)",
              color: "var(--accent-contrast)",
            }}
          >
            Continue to login
          </Link>
        )}

        <div
          className="rounded-[1.25rem] border px-4 py-4 text-center text-sm"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--muted)",
          }}
        >
          Need a fresh link?{" "}
          <Link
            href="/forgot-password"
            className="font-black transition hover:opacity-80"
            style={{ color: "var(--accent)" }}
          >
            Request password reset
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordClient />
    </Suspense>
  );
}
