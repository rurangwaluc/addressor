"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import AsyncButton from "@/components/AsyncButton";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import InputField from "@/components/InputField";
import { redirectAfterAuth } from "@/lib/authSession";
import type { AccessContext } from "@/lib/authRedirect";
import { apiRequest } from "@/lib/api";

type LoginResponse = {
  ok: true;
  data: {
    token: string;
    accessToken?: string;
    refreshToken?: string;
    access?: AccessContext;
  };
};

type LoginIntent = "customer" | "business" | "platform";

const outcomes = ["Saved places", "Fast return", "Trusted picks"];

function getIntent(value: string | null): LoginIntent {
  if (value === "business" || value === "platform") {
    return value;
  }

  return "customer";
}

const loginContent = {
  customer: {
    eyebrow: "Customer access",
    title: "Welcome back",
    subtitle: "Save better places. Return to trusted options faster.",
    panelTitle: "Your trusted Rwanda list starts here.",
    panelSubtitle:
      "Log in when you want saved places, faster returns, and a personal discovery history.",
    button: "Login to Addressor",
    fallback: "/welcome",
    items: [
      {
        title: "Browse first",
        text: "You can explore restaurants, stays, events, and nightlife before signing in.",
      },
      {
        title: "Save when ready",
        text: "Sign in to keep places, plans, and trusted options connected to your account.",
      },
      {
        title: "One login",
        text: "Customers, business users, and platform users all use one secure login.",
      },
    ],
  },
  business: {
    eyebrow: "Business access",
    title: "Business login",
    subtitle: "Access your Addressor business dashboard from one secure login.",
    panelTitle: "Keep your public presence current.",
    panelSubtitle:
      "Approved business owners and team members are redirected to business tools after login.",
    button: "Enter Addressor",
    fallback: "/business-dashboard",
    items: [
      {
        title: "Business protected",
        text: "Only approved business owners and team members can enter business tools.",
      },
      {
        title: "One login",
        text: "Use the same Addressor login. Access rules decide where you go next.",
      },
      {
        title: "Fast dashboard",
        text: "Manage visibility, trust signals, and availability with less friction.",
      },
    ],
  },
  platform: {
    eyebrow: "Platform access",
    title: "Platform login",
    subtitle: "Secure access for the Addressor platform team.",
    panelTitle: "This area controls Addressor operations.",
    panelSubtitle:
      "Only platform owner, admins, and support team members are redirected to platform control.",
    button: "Enter Addressor",
    fallback: "/platform",
    items: [
      {
        title: "Platform only",
        text: "Customer and business accounts are blocked from the platform area.",
      },
      {
        title: "Full visibility",
        text: "Review businesses, users, quality, categories, and platform operations.",
      },
      {
        title: "Strict redirects",
        text: "Access rules send every user to the correct place after login.",
      },
    ],
  },
} satisfies Record<
  LoginIntent,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    panelTitle: string;
    panelSubtitle: string;
    button: string;
    fallback: string;
    items: Array<{ title: string; text: string }>;
  }
>;

export default function LoginClient() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const intent = getIntent(searchParams.get("intent"));
  const content = useMemo(() => loginContent[intent], [intent]);

  const [email, setEmail] = useState(
    intent === "platform" ? "rurangwa.luke@gmail.com" : "",
  );
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const requireBusinessAccess = intent === "business";
  const requirePlatformAccess = intent === "platform";

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      });

      const result = await redirectAfterAuth({
        payload: response.data,
        redirectTo,
        fallback: content.fallback,
        requireBusinessAccess,
        requirePlatformAccess,
      });

      if (!result.redirected) {
        setMessage(result.error);
      }
    } catch {
      setMessage(
        intent === "customer"
          ? "Login failed. Check your password and make sure your email and phone are verified."
          : "Login failed. Use an approved account for this area.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={content.title}
      subtitle={content.subtitle}
      eyebrow={content.eyebrow}
      panelTitle={content.panelTitle}
      panelSubtitle={content.panelSubtitle}
      panelItems={content.items}
    >
      <form onSubmit={handleLogin} className="space-y-5">
        <div className="grid grid-cols-3 gap-2">
          {outcomes.map((item) => (
            <div
              key={item}
              className="relative overflow-hidden rounded-2xl border px-2.5 py-3 text-center text-[0.68rem] font-black"
              style={{
                background:
                  "linear-gradient(145deg, var(--surface), color-mix(in srgb, var(--surface) 92%, var(--accent-soft)))",
                borderColor: "var(--border)",
                color: "var(--text)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              <div className="imigongo-pattern absolute inset-0 opacity-[0.06]" />
              <span className="relative">{item}</span>
            </div>
          ))}
        </div>

        {message ? (
          <div
            className="rounded-[1.15rem] border px-4 py-3 text-sm font-semibold leading-6"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--danger)",
            }}
          >
            {message}
          </div>
        ) : null}

        <GoogleSignInButton
          intent={intent === "business" ? "business" : "login"}
          redirectTo={redirectTo}
          fallbackRedirectTo={content.fallback}
          requireBusinessAccess={requireBusinessAccess}
          requirePlatformAccess={requirePlatformAccess}
          onError={setMessage}
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

        <div className="space-y-4">
          <InputField
            label={
              intent === "business"
                ? "Business email"
                : intent === "platform"
                  ? "Platform email"
                  : "Email address"
            }
            type="email"
            value={email}
            onChange={setEmail}
            placeholder={
              intent === "business"
                ? "owner@business.com"
                : intent === "platform"
                  ? "platform@addressor.com"
                  : "you@example.com"
            }
          />

          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
          />
        </div>

        <AsyncButton loading={loading}>{content.button}</AsyncButton>

        <div
          className="rounded-[1.35rem] border px-4 py-4 text-center text-sm leading-6"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--muted)",
          }}
        >
          <p>
            New to Addressor?{" "}
            <Link
              href="/signup"
              className="font-black transition hover:opacity-80"
              style={{ color: "var(--accent)" }}
            >
              Create customer account
            </Link>
          </p>

          <div className="my-3 h-px w-full" style={{ background: "var(--border)" }} />

          <p>
            Business owner?{" "}
            <Link
              href="/business-register"
              className="font-black transition hover:opacity-80"
              style={{ color: "var(--accent)" }}
            >
              Register your business
            </Link>
          </p>

          {intent !== "business" ? (
            <p className="mt-2 text-xs">
              Already approved for business?{" "}
              <Link
                href="/login?intent=business"
                className="font-bold opacity-70 transition hover:opacity-100"
                style={{ color: "var(--muted)" }}
              >
                Use business access
              </Link>
            </p>
          ) : null}

          {intent !== "platform" ? (
            <p className="mt-2 text-xs">
              Platform team?{" "}
              <Link
                href="/login?intent=platform"
                className="font-bold opacity-70 transition hover:opacity-100"
                style={{ color: "var(--muted)" }}
              >
                Internal access
              </Link>
            </p>
          ) : null}
        </div>
      </form>
    </AuthShell>
  );
}
