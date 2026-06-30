"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  buildLoginPath,
  hasBusinessAccess,
  hasPlatformAccess,
  type AccessContext,
} from "@/lib/authRedirect";
import {
  clearAuthTokens,
  getCurrentAccessContext,
  getStoredAccessToken,
} from "@/lib/authSession";

type AccessState =
  | { status: "checking" }
  | { status: "allowed"; access: AccessContext }
  | { status: "blocked"; reason: string; loginPath: string };

type RequireAccessProps = {
  children: React.ReactNode;
  mode?: "auth" | "business" | "platform";
};

function getCurrentPath() {
  if (typeof window === "undefined") {
    return "/";
  }

  return `${window.location.pathname}${window.location.search}`;
}

function buildIntentLoginPath(intent: "business" | "platform", currentPath: string) {
  return `/login?intent=${intent}&redirectTo=${encodeURIComponent(currentPath)}`;
}

function LoadingState() {
  return (
    <main
      className="min-h-screen px-5 py-10"
      style={{
        background: "var(--background)",
        color: "var(--text)",
      }}
    >
      <section className="mx-auto flex min-h-[70vh] w-full max-w-4xl items-center justify-center">
        <div
          className="w-full max-w-md rounded-[2rem] border p-6 text-center shadow-2xl"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <div
            className="mx-auto mb-5 h-12 w-12 animate-pulse rounded-full"
            style={{ background: "var(--accent-soft)" }}
          />
          <p className="text-sm font-black uppercase tracking-[0.2em]">
            Checking access
          </p>
          <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted)" }}>
            We are confirming your Addressor session before opening this area.
          </p>
        </div>
      </section>
    </main>
  );
}

function BlockedState({
  reason,
  loginPath,
}: {
  reason: string;
  loginPath: string;
}) {
  return (
    <main
      className="min-h-screen px-5 py-10"
      style={{
        background: "var(--background)",
        color: "var(--text)",
      }}
    >
      <section className="mx-auto flex min-h-[70vh] w-full max-w-4xl items-center justify-center">
        <div
          className="w-full max-w-md rounded-[2rem] border p-6 text-center shadow-2xl"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <p
            className="text-xs font-black uppercase tracking-[0.22em]"
            style={{ color: "var(--accent)" }}
          >
            Access needed
          </p>

          <h1 className="mt-4 text-2xl font-black tracking-[-0.04em]">
            This area is not open to this account.
          </h1>

          <p className="mt-4 text-sm leading-6" style={{ color: "var(--muted)" }}>
            {reason}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href={loginPath}
              className="rounded-full px-5 py-3 text-sm font-black transition hover:scale-[1.01]"
              style={{
                background: "var(--accent)",
                color: "var(--accent-contrast)",
              }}
            >
              Login
            </Link>

            <Link
              href="/"
              className="rounded-full border px-5 py-3 text-sm font-black transition hover:scale-[1.01]"
              style={{
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            >
              Go home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function RequireAccess({
  children,
  mode = "auth",
}: RequireAccessProps) {
  const [state, setState] = useState<AccessState>({ status: "checking" });

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      const token = getStoredAccessToken();
      const currentPath = getCurrentPath();

      if (!token) {
        setState({
          status: "blocked",
          reason: "Please log in to continue.",
          loginPath:
            mode === "business"
              ? buildIntentLoginPath("business", currentPath)
              : mode === "platform"
                ? buildIntentLoginPath("platform", currentPath)
                : buildLoginPath(currentPath),
        });
        return;
      }

      try {
        const access = await getCurrentAccessContext(token);

        if (cancelled) return;

        if (mode === "platform" && !hasPlatformAccess(access)) {
          setState({
            status: "blocked",
            reason: "This account does not have platform access.",
            loginPath: buildIntentLoginPath("platform", currentPath),
          });
          return;
        }

        if (
          mode === "business" &&
          !hasPlatformAccess(access) &&
          !hasBusinessAccess(access)
        ) {
          setState({
            status: "blocked",
            reason:
              "This account does not have business access. Use a business owner or approved team account.",
            loginPath: buildIntentLoginPath("business", currentPath),
          });
          return;
        }

        setState({ status: "allowed", access });
      } catch {
        clearAuthTokens();

        if (cancelled) return;

        setState({
          status: "blocked",
          reason: "Your session expired. Please log in again.",
          loginPath: buildLoginPath(currentPath),
        });
      }
    }

    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [mode]);

  if (state.status === "checking") {
    return <LoadingState />;
  }

  if (state.status === "blocked") {
    return <BlockedState reason={state.reason} loginPath={state.loginPath} />;
  }

  return <>{children}</>;
}
