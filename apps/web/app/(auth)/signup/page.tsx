"use client";

import Link from "next/link";
import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import AsyncButton from "@/components/AsyncButton";
import InputField from "@/components/InputField";
import { apiRequest } from "@/lib/api";

type SignupResponse = {
  ok: true;
  data: {
    userId: string;
    email: string;
    phone: string;
    verificationToken: string;
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

const steps = ["Create profile", "Verify access", "Start using"];

export default function SignupPage() {
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

    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<SignupResponse>("/auth/signup", {
        method: "POST",
        body: JSON.stringify(form),
      });

      localStorage.setItem(
        "addressorVerificationToken",
        response.data.verificationToken,
      );

      if (response.data.devVerification) {
        localStorage.setItem(
          "addressorEmailOtp",
          response.data.devVerification.emailOtp,
        );
        localStorage.setItem(
          "addressorPhoneOtp",
          response.data.devVerification.phoneOtp,
        );
      }

      window.location.href = "/verify";
    } catch {
      setError("Signup could not be completed. Check your details and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Verify your email and phone once, then use Addressor with trusted access."
      eyebrow="Verified signup"
      panelTitle="Start with trust before action."
      panelSubtitle="Every Addressor account begins with verified email and phone access so bookings, reviews, and business activity stay safer."
      panelItems={[
        {
          title: "Create profile",
          text: "Use one verified identity across discovery, reviews, and bookings.",
        },
        {
          title: "Verify ownership",
          text: "Confirm email and phone before trusted actions are unlocked.",
        },
        {
          title: "Access Addressor",
          text: "Save places, book experiences, review spots, or manage a business.",
        },
      ]}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-3 gap-2">
          {steps.map((item) => (
            <div
              key={item}
              className="relative overflow-hidden rounded-2xl border px-3 py-3 text-center text-[0.7rem] font-black"
              style={{
                background:
                  "linear-gradient(145deg, var(--surface), color-mix(in srgb, var(--surface) 92%, var(--accent-soft)))",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            >
              <div className="imigongo-pattern absolute inset-0 opacity-[0.08]" />
              <span className="relative">{item}</span>
            </div>
          ))}
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

        <div className="space-y-4">
          <InputField
            label="Full name"
            value={form.fullName}
            onChange={(value) => setForm({ ...form, fullName: value })}
            placeholder="Luc Rurangwa"
          />

          <InputField
            label="Email address"
            type="email"
            value={form.email}
            onChange={(value) => setForm({ ...form, email: value })}
            placeholder="you@example.com"
          />

          <InputField
            label="Phone number"
            value={form.phone}
            onChange={(value) => setForm({ ...form, phone: value })}
            placeholder="250788123456"
          />

          <InputField
            label="Password"
            type="password"
            value={form.password}
            onChange={(value) => setForm({ ...form, password: value })}
            placeholder="Minimum 8 characters"
          />
        </div>

        <AsyncButton loading={loading}>Create verified account</AsyncButton>

        <div
          className="relative overflow-hidden rounded-[1.5rem] border px-4 py-4 text-center text-sm leading-6"
          style={{
            background:
              "linear-gradient(145deg, var(--surface), color-mix(in srgb, var(--surface) 94%, var(--accent-soft)))",
            borderColor: "var(--border)",
            color: "var(--muted)",
          }}
        >
          <div className="imigongo-pattern absolute inset-0 opacity-[0.07]" />

          <div className="relative">
            <p>
              Already verified?{" "}
              <Link
                href="/login"
                className="font-black transition hover:opacity-80"
                style={{ color: "var(--accent)" }}
              >
                Login
              </Link>
            </p>

            <div
              className="my-3 h-px w-full"
              style={{ background: "var(--border)" }}
            />

            <p>
              Own a business?{" "}
              <Link
                href="/business-register"
                className="font-black transition hover:opacity-80"
                style={{ color: "var(--accent)" }}
              >
                Start business registration
              </Link>
            </p>
          </div>
        </div>
      </form>
    </AuthShell>
  );
}