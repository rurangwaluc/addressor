"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
        router.replace(
          getPostAuthRedirectPath({
            access: cachedAccess,
            fallback,
          }),
        );
        return;
      }

      try {
        const access = await getCurrentAccessContext(token);

        if (cancelled) return;

        router.replace(
          getPostAuthRedirectPath({
            access,
            fallback,
          }),
        );
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
  }, [fallback, router]);

  if (checking) {
    return null;
  }

  return <>{children}</>;
}
