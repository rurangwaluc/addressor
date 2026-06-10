"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthShell from "@/components/AuthShell";
import AsyncButton from "@/components/AsyncButton";
import InputField from "@/components/InputField";
import { apiRequest } from "@/lib/api";

type VerifyResponse = {
  ok: true;
  data: {
    verified: true;
    type: "email" | "phone";
  };
};

export default function VerifyPage() {
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [token, setToken] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [loadingType, setLoadingType] = useState<"email" | "phone" | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setToken(localStorage.getItem("addressorVerificationToken") || "");
    setEmailOtp(localStorage.getItem("addressorEmailOtp") || "");
    setPhoneOtp(localStorage.getItem("addressorPhoneOtp") || "");
  }, []);

  async function verifyEmail() {
    setLoadingType("email");
    setMessage("");

    try {
      await apiRequest<VerifyResponse>("/auth/verify-email", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: emailOtp }),
      });

      setEmailVerified(true);
      setMessage("Email verified successfully.");
    } catch {
      setMessage("Email verification failed.");
    } finally {
      setLoadingType(null);
    }
  }

  async function verifyPhone() {
    setLoadingType("phone");
    setMessage("");

    try {
      await apiRequest<VerifyResponse>("/auth/verify-phone", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otp: phoneOtp }),
      });

      setPhoneVerified(true);
      setMessage("Phone verified successfully.");
    } catch {
      setMessage("Phone verification failed.");
    } finally {
      setLoadingType(null);
    }
  }

  const completed = emailVerified && phoneVerified;

  return (
    <AuthShell
      title="Verify your account"
      subtitle="Addressor requires email and phone verification to protect users, businesses, and bookings."
    >
      <div className="space-y-5">
        {message ? (
          <div className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "var(--border)", color: completed ? "var(--success)" : "var(--text)" }}>
            {message}
          </div>
        ) : null}

        <div className="rounded-3xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-strong)" }}>
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold">Email verification</p>
            <span style={{ color: emailVerified ? "var(--success)" : "var(--muted)" }}>
              {emailVerified ? "Verified" : "Pending"}
            </span>
          </div>
          <InputField label="Email OTP" value={emailOtp} onChange={setEmailOtp} placeholder="Enter email OTP" />
          <div className="mt-3">
            <AsyncButton type="button" loading={loadingType === "email"} disabled={!token || emailVerified} onClick={verifyEmail}>
              Verify email
            </AsyncButton>
          </div>
        </div>

        <div className="rounded-3xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-strong)" }}>
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold">Phone verification</p>
            <span style={{ color: phoneVerified ? "var(--success)" : "var(--muted)" }}>
              {phoneVerified ? "Verified" : "Pending"}
            </span>
          </div>
          <InputField label="Phone OTP" value={phoneOtp} onChange={setPhoneOtp} placeholder="Enter phone OTP" />
          <div className="mt-3">
            <AsyncButton type="button" loading={loadingType === "phone"} disabled={!token || phoneVerified} onClick={verifyPhone}>
              Verify phone
            </AsyncButton>
          </div>
        </div>

        {completed ? (
          <Link
            href="/login"
            className="block rounded-2xl px-5 py-3 text-center text-sm font-bold"
            style={{ background: "var(--primary)", color: "var(--primary-text)" }}
          >
            Continue to login
          </Link>
        ) : null}
      </div>
    </AuthShell>
  );
}