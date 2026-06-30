"use client";

import { useEffect, useState } from "react";
import { getPostAuthRedirectPath } from "@/lib/authRedirect";
import {
  clearAuthTokens,
  getCurrentAccessContext,
  getStoredAccessToken,
} from "@/lib/authSession";

type RedirectIfAuthenticatedProps = {
  children: React.ReactNode;
  fallback?: string;
};

export default function RedirectIfAuthenticated({
  children,
  fallback = "/welcome",
}: RedirectIfAuthenticatedProps) {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const token = getStoredAccessToken();

      if (!token) {
        if (!cancelled) {
          setChecking(false);
        }

        return;
      }

      try {
        const access = await getCurrentAccessContext(token);

        if (cancelled) return;

        window.location.href = getPostAuthRedirectPath({
          access,
          fallback,
        });
      } catch {
        clearAuthTokens();

        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [fallback]);

  if (checking) {
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
              Checking session
            </p>
            <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted)" }}>
              We are checking if you are already signed in.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}