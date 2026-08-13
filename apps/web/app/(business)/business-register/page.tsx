"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import AsyncButton from "@/components/AsyncButton";
import InputField from "@/components/InputField";
import { apiRequest } from "@/lib/api";
import type { AccessContext } from "@/lib/authRedirect";
import { saveAuthTokens } from "@/lib/authSession";

type SignupResponse = {
  ok: true;
  data: {
    token: string;
    accessToken?: string;
    refreshToken?: string;
    verificationToken: string;
    access?: AccessContext;
    verificationRequired: {
      email: boolean;
      phone: boolean;
    };
    devVerification?: {
      emailOtp: string;
      phoneOtp: string;
    };
  };
};

function getSignupErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "error" in error &&
    error.error &&
    typeof error.error === "object" &&
    "message" in error.error &&
    typeof error.error.message === "string"
  ) {
    return error.error.message;
  }

  return "Business registration could not be completed. Check your details and try again.";
}

export default function BusinessRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (loading) return;

    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.password) {
      setError("Complete your name, email, phone, and password to continue.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<SignupResponse>("/auth/signup", {
        method: "POST",
        body: JSON.stringify(form),
      });

      saveAuthTokens(response.data);
      localStorage.setItem("addressorVerificationToken", response.data.verificationToken);
      localStorage.setItem("addressorVerificationIntent", "business");

      if (response.data.devVerification) {
        localStorage.setItem("addressorEmailOtp", response.data.devVerification.emailOtp);
        localStorage.setItem("addressorPhoneOtp", response.data.devVerification.phoneOtp);
      }

      router.replace("/verify");
    } catch (signupError) {
      setError(getSignupErrorMessage(signupError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Register your business"
      subtitle="Create your Addressor business account, then add your business profile, branches, photos, menus, offers, and booking rules."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          className="rounded-2xl border px-4 py-3 text-sm leading-6"
          style={{
            background: "var(--accent-soft)",
            borderColor: "var(--border)",
            color: "var(--text)",
          }}
        >
          Business registration will create a verified owner account first, then
          connect it to a business profile and first branch.
        </div>

        {error ? (
          <div
            className="rounded-2xl border px-4 py-3 text-sm font-semibold leading-6"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--danger)",
            }}
          >
            {error}
          </div>
        ) : null}

        <InputField
          label="Owner full name"
          value={form.fullName}
          onChange={(value) => setForm({ ...form, fullName: value })}
          placeholder="Business owner name"
        />

        <InputField
          label="Business email"
          type="email"
          value={form.email}
          onChange={(value) => setForm({ ...form, email: value })}
          placeholder="owner@business.com"
        />

        <InputField
          label="Business phone"
          value={form.phone}
          onChange={(value) => setForm({ ...form, phone: value })}
          placeholder="2507XXXXXXXX"
        />

        <InputField
          label="Password"
          type="password"
          value={form.password}
          onChange={(value) => setForm({ ...form, password: value })}
          placeholder="Create a secure password"
        />

        <AsyncButton loading={loading}>
          Continue to verification
        </AsyncButton>

        <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
          Already manage a business?{" "}
          <Link
            href="/login?intent=business"
            className="font-bold"
            style={{ color: "var(--accent)" }}
          >
            Login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
