 "use client";

import Link from "next/link";
import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import AsyncButton from "@/components/AsyncButton";
import InputField from "@/components/InputField";
import { apiRequest } from "@/lib/api";

type LoginResponse = {
  ok: true;
  data: {
    token: string;
  };
};

export default function BusinessLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("addressorAuthToken", response.data.token);
      window.location.href = "/business-dashboard";
    } catch {
      setError("Login failed. Confirm your email/phone are verified.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Business login"
      subtitle="Access your Addressor business dashboard to manage branches, offers, events, bookings, and visibility."
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
      </form>
    </AuthShell>
  );
}