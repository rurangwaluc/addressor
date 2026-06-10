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

type PlatformMeResponse = {
  ok: true;
  data: {
    userId: string;
    role: "platform_owner" | "platform_admin" | "platform_support";
    permissions: string[];
  };
};

export default function PlatformLoginPage() {
  const [email, setEmail] = useState("rurangwa.luke@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const loginResponse = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const token = loginResponse.data.token;

      const platformResponse = await apiRequest<PlatformMeResponse>(
        "/platform/me",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      localStorage.setItem("addressorAuthToken", token);
      localStorage.setItem("addressorPlatformRole", platformResponse.data.role);

      window.location.href = "/owner";
    } catch {
      localStorage.removeItem("addressorAuthToken");
      localStorage.removeItem("addressorPlatformRole");
      setError("Platform login failed. Confirm your account is verified and has platform access.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Platform owner login"
      subtitle="Secure access for Addressor platform owner, admins, and support team members."
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
          label="Platform email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="owner@addressor.com"
        />

        <InputField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Your secure password"
        />

        <AsyncButton loading={loading}>Enter platform control room</AsyncButton>

        <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
          Public user?{" "}
          <Link href="/login" className="font-bold" style={{ color: "var(--accent)" }}>
            Go to user login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}