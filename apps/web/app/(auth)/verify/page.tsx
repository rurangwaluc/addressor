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

type ResendVerificationResponse = {
  ok: true;
  data: {
    sent: boolean;
    channel?: "email" | "phone";
    reason?: string;
    devVerification?: {
      emailOtp?: string;
      phoneOtp?: string;
    };
  };
};

type VerificationChannel = "email" | "phone";

export default function VerifyPage() {
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [token, setToken] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [loadingType, setLoadingType] = useState<VerificationChannel | null>(null);
  const [resendingType, setResendingType] = useState<VerificationChannel | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"neutral" | "success" | "danger">(
    "neutral",
  );

  useEffect(() => {
    setToken(localStorage.getItem("addressorVerificationToken") || "");
    setEmailOtp(localStorage.getItem("addressorEmailOtp") || "");
    setPhoneOtp(localStorage.getItem("addressorPhoneOtp") || "");
  }, []);

  function showMessage(nextMessage: string, tone: typeof messageTone = "neutral") {
    setMessage(nextMessage);
    setMessageTone(tone);
  }

  async function verifyChannel(channel: VerificationChannel) {
    const otp = channel === "email" ? emailOtp : phoneOtp;

    if (!token) {
      showMessage("Verification session is missing. Please create an account again.", "danger");
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      showMessage("Enter the 6 digit verification code.", "danger");
      return;
    }

    setLoadingType(channel);
    showMessage("");

    try {
      await apiRequest<VerifyResponse>(
        channel === "email" ? "/auth/verify-email" : "/auth/verify-phone",
        {
          method: "POST",
          authToken: token,
          body: JSON.stringify({ otp: otp.trim() }),
        },
      );

      if (channel === "email") {
        setEmailVerified(true);
        localStorage.removeItem("addressorEmailOtp");
      } else {
        setPhoneVerified(true);
        localStorage.removeItem("addressorPhoneOtp");
      }

      showMessage(
        channel === "email"
          ? "Email verified successfully."
          : "Phone verified successfully.",
        "success",
      );
    } catch {
      showMessage(
        "This code is invalid or expired. Check the code or request a new one.",
        "danger",
      );
    } finally {
      setLoadingType(null);
    }
  }

  async function resendCode(channel: VerificationChannel) {
    if (!token) {
      showMessage("Verification session is missing. Please create an account again.", "danger");
      return;
    }

    setResendingType(channel);
    showMessage("");

    try {
      const response = await apiRequest<ResendVerificationResponse>(
        "/auth/resend-verification",
        {
          method: "POST",
          authToken: token,
          body: JSON.stringify({ channel }),
        },
      );

      if (!response.data.sent) {
        showMessage(response.data.reason || "This contact is already verified.", "neutral");
        return;
      }

      if (response.data.devVerification?.emailOtp) {
        setEmailOtp(response.data.devVerification.emailOtp);
        localStorage.setItem(
          "addressorEmailOtp",
          response.data.devVerification.emailOtp,
        );
      }

      if (response.data.devVerification?.phoneOtp) {
        setPhoneOtp(response.data.devVerification.phoneOtp);
        localStorage.setItem(
          "addressorPhoneOtp",
          response.data.devVerification.phoneOtp,
        );
      }

      showMessage(
        channel === "email"
          ? "A new email verification code was sent."
          : "A new phone verification code was sent.",
        "success",
      );
    } catch {
      showMessage("Could not send a new code. Try again in a moment.", "danger");
    } finally {
      setResendingType(null);
    }
  }

  const completed = emailVerified && phoneVerified;
  const messageColor =
    messageTone === "success"
      ? "var(--success)"
      : messageTone === "danger"
        ? "var(--danger)"
        : "var(--text)";

  return (
    <AuthShell
      title="Verify your account"
      subtitle="Confirm your email and phone so Addressor can protect users, businesses, bookings, and reviews."
      eyebrow="Trusted account"
      panelTitle="Verification keeps Addressor safer."
      panelSubtitle="Every trusted account starts with confirmed contact details before stronger actions are unlocked."
      panelItems={[
        {
          title: "Email check",
          text: "Confirm that you control the email used for your account.",
        },
        {
          title: "Phone check",
          text: "Confirm your Rwanda phone number for safer account activity.",
        },
        {
          title: "Clean access",
          text: "After verification, login and continue with the right access level.",
        },
      ]}
    >
      <div className="space-y-5">
        {!token ? (
          <div
            className="rounded-[1.15rem] border px-4 py-3 text-sm font-semibold leading-6"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--danger)",
            }}
          >
            Verification session missing. Please create your account again.
          </div>
        ) : null}

        {message ? (
          <div
            className="rounded-[1.15rem] border px-4 py-3 text-sm font-semibold leading-6"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: messageColor,
            }}
          >
            {message}
          </div>
        ) : null}

        <div
          className="rounded-[1.45rem] border p-4"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface-strong)",
          }}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-black">Email verification</p>
              <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                Enter the 6 digit email code.
              </p>
            </div>

            <span
              className="rounded-full border px-3 py-1 text-xs font-black"
              style={{
                borderColor: "var(--border)",
                color: emailVerified ? "var(--success)" : "var(--muted)",
              }}
            >
              {emailVerified ? "Verified" : "Pending"}
            </span>
          </div>

          <InputField
            label="Email code"
            value={emailOtp}
            onChange={setEmailOtp}
            placeholder="123456"
          />

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <AsyncButton
              type="button"
              loading={loadingType === "email"}
              disabled={!token || emailVerified}
              onClick={() => verifyChannel("email")}
            >
              Verify email
            </AsyncButton>

            <button
              type="button"
              disabled={!token || emailVerified || resendingType === "email"}
              onClick={() => void resendCode("email")}
              className="rounded-full border px-5 py-3 text-sm font-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            >
              {resendingType === "email" ? "Sending..." : "Resend code"}
            </button>
          </div>
        </div>

        <div
          className="rounded-[1.45rem] border p-4"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface-strong)",
          }}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-black">Phone verification</p>
              <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                Enter the 6 digit phone code.
              </p>
            </div>

            <span
              className="rounded-full border px-3 py-1 text-xs font-black"
              style={{
                borderColor: "var(--border)",
                color: phoneVerified ? "var(--success)" : "var(--muted)",
              }}
            >
              {phoneVerified ? "Verified" : "Pending"}
            </span>
          </div>

          <InputField
            label="Phone code"
            value={phoneOtp}
            onChange={setPhoneOtp}
            placeholder="123456"
          />

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <AsyncButton
              type="button"
              loading={loadingType === "phone"}
              disabled={!token || phoneVerified}
              onClick={() => verifyChannel("phone")}
            >
              Verify phone
            </AsyncButton>

            <button
              type="button"
              disabled={!token || phoneVerified || resendingType === "phone"}
              onClick={() => void resendCode("phone")}
              className="rounded-full border px-5 py-3 text-sm font-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            >
              {resendingType === "phone" ? "Sending..." : "Resend code"}
            </button>
          </div>
        </div>

        {completed ? (
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
        ) : null}

        <div
          className="rounded-[1.25rem] border px-4 py-4 text-center text-sm"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--muted)",
          }}
        >
          Already verified?{" "}
          <Link
            href="/login"
            className="font-black transition hover:opacity-80"
            style={{ color: "var(--accent)" }}
          >
            Back to login
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
