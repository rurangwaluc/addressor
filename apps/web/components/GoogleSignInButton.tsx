"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getPostAuthRedirectResult } from "@/lib/authSession";
import type { AccessContext } from "@/lib/authRedirect";
import { apiRequest } from "@/lib/api";

type GoogleLoginResponse = {
  ok: true;
  data: {
    token: string;
    accessToken: string;
    refreshToken: string;
    user: {
      email: string | null;
      fullName: string;
    };
    access?: AccessContext;
  };
};

type GoogleCredentialResponse = {
  credential?: string;
  select_by?: string;
  clientId?: string;
};

type GoogleAccountsApi = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        ux_mode?: "popup" | "redirect";
        auto_select?: boolean;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: {
          type?: "standard" | "icon";
          theme?: "outline" | "filled_blue" | "filled_black";
          size?: "large" | "medium" | "small";
          text?: "signin_with" | "signup_with" | "continue_with" | "signin";
          shape?: "rectangular" | "pill" | "circle" | "square";
          logo_alignment?: "left" | "center";
          width?: string | number;
        },
      ) => void;
      prompt: () => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleAccountsApi;
  }
}

const GOOGLE_SCRIPT_ID = "addressor-google-identity-script";

function loadGoogleScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = () => reject();

    document.head.appendChild(script);
  });
}

type GoogleSignInButtonProps = {
  intent?: "login" | "signup" | "business";
  redirectTo?: string | null;
  fallbackRedirectTo?: string;
  requireBusinessAccess?: boolean;
  requirePlatformAccess?: boolean;
  onError?: (message: string) => void;
};

export default function GoogleSignInButton({
  intent = "login",
  redirectTo,
  fallbackRedirectTo = "/welcome",
  requireBusinessAccess = false,
  requirePlatformAccess = false,
  onError,
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const renderedRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [missingClientId, setMissingClientId] = useState(false);

  useEffect(() => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      setMissingClientId(true);
      return;
    }

    const clientId: string = googleClientId;
    let cancelled = false;

    async function bootGoogle() {
      try {
        await loadGoogleScript();

        if (cancelled || !buttonRef.current || renderedRef.current) {
          return;
        }

        window.google?.accounts.id.initialize({
          client_id: clientId,
          ux_mode: "popup",
          auto_select: false,
          callback: async (credentialResponse) => {
            const idToken = credentialResponse.credential;

            if (!idToken) {
              onError?.("Google did not return a sign-in token.");
              return;
            }

            setLoading(true);

            try {
              const response = await apiRequest<GoogleLoginResponse>(
                "/auth/google",
                {
                  method: "POST",
                  body: JSON.stringify({ idToken }),
                },
              );

              const result = await getPostAuthRedirectResult({
                payload: response.data,
                redirectTo,
                fallback: fallbackRedirectTo,
                requireBusinessAccess,
                requirePlatformAccess,
              });

              if (!result.redirected) {
                onError?.(result.error);
              }
            } catch {
              onError?.(
                "Google sign-in failed. Confirm your Google client ID and API are configured.",
              );
            } finally {
              setLoading(false);
            }
          },
        });

        window.google?.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text:
            intent === "signup"
              ? "signup_with"
              : intent === "business"
                ? "continue_with"
                : "signin_with",
          shape: "pill",
          logo_alignment: "left",
          width: "360",
        });

        renderedRef.current = true;
      } catch {
        onError?.("Google sign-in could not load. Check your connection.");
      }
    }

    bootGoogle();

    return () => {
      cancelled = true;
    };
  }, [
    fallbackRedirectTo,
    intent,
    onError,
    redirectTo,
    requireBusinessAccess,
    requirePlatformAccess,
  ]);

  if (missingClientId) {
    return (
      <div
        className="rounded-[1.15rem] border px-4 py-3 text-sm font-semibold leading-6"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          color: "var(--danger)",
        }}
      >
        Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID in the web environment.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="flex min-h-[44px] justify-center overflow-hidden rounded-full"
        ref={buttonRef}
      />

      {loading ? (
        <p
          className="text-center text-xs font-bold"
          style={{ color: "var(--muted)" }}
        >
          Securing your Google session...
        </p>
      ) : null}
    </div>
  );
}