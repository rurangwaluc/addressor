"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Mail,
  Phone,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

type User = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
};

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

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

  return "Something went wrong. Please try again.";
}

function editablePhone(value: string | null) {
  if (!value) return "";

  const digits = value.replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("250")) {
    return `0${digits.slice(3)}`;
  }

  return value;
}

function comparablePhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 10 && digits.startsWith("0")) {
    return `250${digits.slice(1)}`;
  }

  if (digits.length === 9 && digits.startsWith("7")) {
    return `250${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("250")) {
    return digits;
  }

  return digits;
}

function formatPhone(value: string | null) {
  if (!value) return "No phone number";

  const digits = value.replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("250")) {
    return `+250 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }

  return value;
}

export default function CustomerProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await apiRequest<{
          ok: true;
          data: { user: User };
        }>("/auth/me");

        if (cancelled) return;

        const nextUser = response.data.user;

        setUser(nextUser);
        setFullName(nextUser.fullName);
        setPhone(editablePhone(nextUser.phone));
        setNeedsVerification(
          Boolean(nextUser.phone) && !nextUser.phoneVerified,
        );
      } catch (requestError) {
        if (!cancelled) {
          setError(errorMessage(requestError));
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const dirty = useMemo(() => {
    if (!user) return false;

    return (
      fullName.trim() !== user.fullName ||
      comparablePhone(phone) !== comparablePhone(user.phone ?? "")
    );
  }, [fullName, phone, user]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();

    if (!user || saving || !dirty) return;

    setSaving(true);
    setError("");
    setMessage("");

    const payload: {
      fullName?: string;
      phone?: string;
    } = {};

    if (fullName.trim() !== user.fullName) {
      payload.fullName = fullName.trim();
    }

    if (
      comparablePhone(phone) !==
      comparablePhone(user.phone ?? "")
    ) {
      payload.phone = phone.trim();
    }

    try {
      const response = await apiRequest<{
        ok: true;
        data: {
          user: User;
          phoneVerificationRequired: boolean;
        };
      }>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      const nextUser = response.data.user;

      setUser(nextUser);
      setFullName(nextUser.fullName);
      setPhone(editablePhone(nextUser.phone));
      setNeedsVerification(
        response.data.phoneVerificationRequired ||
          (Boolean(nextUser.phone) && !nextUser.phoneVerified),
      );
      setOtp("");

      setMessage(
        response.data.phoneVerificationRequired
          ? "Phone updated. Enter the verification code to finish."
          : "Changes saved.",
      );
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function verifyPhone(event: FormEvent) {
    event.preventDefault();

    if (verifying || otp.length !== 6) return;

    setVerifying(true);
    setError("");
    setMessage("");

    try {
      const response = await apiRequest<{
        ok: true;
        data: { user: User };
      }>("/auth/verify-phone", {
        method: "POST",
        body: JSON.stringify({ otp }),
      });

      const nextUser = response.data.user;

      setUser(nextUser);
      setPhone(editablePhone(nextUser.phone));
      setNeedsVerification(false);
      setOtp("");
      setMessage("Phone verified.");
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setVerifying(false);
    }
  }

  async function resendCode() {
    if (resending) return;

    setResending(true);
    setError("");
    setMessage("");

    try {
      await apiRequest("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ channel: "phone" }),
      });

      setMessage("A new code was sent.");
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setResending(false);
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <div
          className="h-24 animate-pulse rounded-[1.1rem]"
          style={{ background: "var(--surface)" }}
        />
        <div
          className="h-96 animate-pulse rounded-[1.1rem]"
          style={{ background: "var(--surface)" }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p
          className="text-[0.68rem] font-black uppercase tracking-[0.18em]"
          style={{ color: "var(--accent)" }}
        >
          Account settings
        </p>

        <h1 className="mt-1.5 text-3xl font-black tracking-[-0.055em]">
          Profile
        </h1>

        <p
          className="mt-1.5 max-w-xl text-sm font-semibold leading-6"
          style={{ color: "var(--muted)" }}
        >
          Keep the contact details businesses receive with future requests up to date.
        </p>
      </header>

      {needsVerification ? (
        <form
          onSubmit={verifyPhone}
          className="border"
          style={{
            background: "var(--surface-strong)",
            borderColor:
              "color-mix(in srgb, var(--accent) 45%, var(--border))",
          }}
        >
          <div className="flex min-w-0 items-start gap-3 px-4 py-4 sm:px-5">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0"
              style={{ color: "var(--accent)" }}
            />

            <div className="min-w-0">
              <h2 className="font-black">Verify your phone</h2>
              <p
                className="mt-1 text-sm font-semibold leading-6"
                style={{ color: "var(--muted)" }}
              >
                Enter the 6-digit code sent to {formatPhone(user.phone)}.
              </p>
            </div>
          </div>

          <div
            className="grid gap-3 border-t px-4 py-4 sm:grid-cols-[minmax(0,14rem)_auto_auto] sm:items-center sm:px-5"
            style={{ borderColor: "var(--border)" }}
          >
            <input
              value={otp}
              onChange={(event) =>
                setOtp(
                  event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6),
                )
              }
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-label="Phone verification code"
              placeholder="000000"
              className="w-full rounded-xl border px-4 py-3 text-center text-lg font-black tracking-[0.28em] outline-none focus:border-[var(--accent)]"
              style={{
                background: "var(--bg)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />

            <button
              type="submit"
              disabled={otp.length !== 6 || verifying}
              className="min-h-12 whitespace-nowrap rounded-xl px-5 py-3 text-sm font-black disabled:opacity-40"
              style={{
                background: "var(--accent)",
                color: "var(--accent-contrast)",
              }}
            >
              {verifying ? "Verifying…" : "Verify phone"}
            </button>

            <button
              type="button"
              disabled={resending}
              onClick={() => void resendCode()}
              className="inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-4 py-3 text-sm font-black disabled:opacity-40"
              style={{
                background: "var(--bg)",
                borderColor: "var(--border)",
              }}
            >
              <RefreshCw size={15} />
              {resending ? "Sending…" : "Send again"}
            </button>
          </div>
        </form>
      ) : null}

      <form
        onSubmit={saveProfile}
        className="overflow-hidden border sm:rounded-[1.2rem]"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div
          className="flex min-w-0 items-center gap-3 border-b px-4 py-4 sm:px-5"
          style={{ borderColor: "var(--border)" }}
        >
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
            style={{ background: "var(--surface-strong)" }}
          >
            <UserRound size={18} />
          </div>

          <div className="min-w-0">
            <h2 className="font-black">Personal details</h2>
            <p
              className="mt-0.5 text-xs font-semibold"
              style={{ color: "var(--muted)" }}
            >
              Used on new requests you send
            </p>
          </div>
        </div>

        <div
          className="grid gap-4 border-b px-4 py-5 sm:px-5 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-6"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <p className="text-sm font-black">Full name</p>
            <p
              className="mt-1 text-xs font-semibold leading-5"
              style={{ color: "var(--muted)" }}
            >
              How businesses identify your request.
            </p>
          </div>

          <input
            value={fullName}
            onChange={(event) => {
              setFullName(event.target.value);
              setMessage("");
              setError("");
            }}
            maxLength={120}
            className="w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none focus:border-[var(--accent)]"
            style={{
              background: "var(--surface-strong)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          />
        </div>

        <div
          className="grid gap-4 border-b px-4 py-5 sm:px-5 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-6"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <p className="text-sm font-black">Email</p>
            <p
              className="mt-1 text-xs font-semibold leading-5"
              style={{ color: "var(--muted)" }}
            >
              Email changes aren’t available here yet.
            </p>
          </div>

          <div
            className="flex min-w-0 items-center gap-3 rounded-xl border px-4 py-3"
            style={{
              background: "var(--surface-strong)",
              borderColor: "var(--border)",
            }}
          >
            <Mail
              size={17}
              className="shrink-0"
              style={{ color: "var(--muted)" }}
            />

            <span className="min-w-0 flex-1 truncate text-sm font-bold">
              {user.email || "No email"}
            </span>

            {user.emailVerified ? (
              <span
                className="inline-flex shrink-0 items-center gap-1 text-xs font-black"
                style={{ color: "var(--success)" }}
              >
                <BadgeCheck size={16} />
                <span className="hidden min-[420px]:inline">
                  Verified
                </span>
              </span>
            ) : null}
          </div>
        </div>

        <div
          className="grid gap-4 px-4 py-5 sm:px-5 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-6"
        >
          <div>
            <p className="text-sm font-black">Phone</p>
            <p
              className="mt-1 text-xs font-semibold leading-5"
              style={{ color: "var(--muted)" }}
            >
              Changing your number requires verification.
            </p>
          </div>

          <div className="min-w-0">
            <div className="relative">
              <Phone
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: "var(--muted)" }}
              />

              <input
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  setMessage("");
                  setError("");
                }}
                placeholder="0781234567"
                className="w-full rounded-xl border py-3 pl-11 pr-4 text-sm font-bold outline-none focus:border-[var(--accent)]"
                style={{
                  background: "var(--surface-strong)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              />
            </div>

            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <p
                className="text-xs font-semibold"
                style={{ color: "var(--muted)" }}
              >
                Current: {formatPhone(user.phone)}
              </p>

              {user.phone && user.phoneVerified ? (
                <span
                  className="inline-flex items-center gap-1 text-xs font-black"
                  style={{ color: "var(--success)" }}
                >
                  <CheckCircle2 size={14} />
                  Verified
                </span>
              ) : (
                <span
                  className="text-xs font-black"
                  style={{ color: "var(--muted)" }}
                >
                  Verification needed
                </span>
              )}
            </div>
          </div>
        </div>

        {(error || message) ? (
          <div
            className="border-t px-4 py-3 sm:px-5"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface-strong)",
            }}
          >
            {error ? (
              <p
                className="text-sm font-black"
                role="alert"
                style={{ color: "var(--danger)" }}
              >
                {error}
              </p>
            ) : null}

            {message ? (
              <p
                className="text-sm font-black"
                role="status"
                style={{
                  color:
                    message === "Changes saved." ||
                    message === "Phone verified."
                      ? "var(--success)"
                      : "var(--accent)",
                }}
              >
                {message}
              </p>
            ) : null}
          </div>
        ) : null}

        <footer
          className="flex min-w-0 flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
          style={{
            background: "var(--surface-strong)",
            borderColor: "var(--border)",
          }}
        >
          <p
            className="text-xs font-semibold"
            style={{ color: "var(--muted)" }}
          >
            {dirty ? "You have unsaved changes." : "Everything is up to date."}
          </p>

          <button
            type="submit"
            disabled={saving || !dirty}
            className="min-h-12 w-full whitespace-nowrap rounded-xl px-5 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            style={{
              background: "var(--accent)",
              color: "var(--accent-contrast)",
            }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </footer>
      </form>
    </div>
  );
}
