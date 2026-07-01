"use client";

import { useEffect, useState } from "react";
import { getPostAuthRedirectPath } from "@/lib/authRedirect";
import {
  clearAuthTokens,
  getCurrentAccessContext,
  getStoredAccessContext,
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

      const cachedAccess = getStoredAccessContext();

      if (cachedAccess) {
        window.location.href = getPostAuthRedirectPath({
          access: cachedAccess,
          fallback,
        });
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
    return null;
  }

  return <>{children}</>;
}
