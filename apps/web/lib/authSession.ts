import {
  getPostAuthRedirectPath,
  hasBusinessAccess,
  hasPlatformAccess,
  type AccessContext,
} from "@/lib/authRedirect";
import { apiRequest } from "@/lib/api";

type TokenLoginPayload = {
  token: string;
  accessToken?: string;
  refreshToken?: string;
  access?: AccessContext;
};

type MeResponse = {
  ok: true;
  data: {
    access: AccessContext;
  };
};

const ACCESS_TOKEN_KEY = "addressorAuthToken";
const REFRESH_TOKEN_KEY = "addressorRefreshToken";
const ACCESS_CONTEXT_KEY = "addressorAccessContext";

export function getStoredAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredAccessContext() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawAccess = localStorage.getItem(ACCESS_CONTEXT_KEY);

  if (!rawAccess) {
    return null;
  }

  try {
    return JSON.parse(rawAccess) as AccessContext;
  } catch {
    localStorage.removeItem(ACCESS_CONTEXT_KEY);
    return null;
  }
}

export function saveAccessContext(access: AccessContext) {
  localStorage.setItem(ACCESS_CONTEXT_KEY, JSON.stringify(access));
}

export function saveAuthTokens(payload: TokenLoginPayload) {
  const accessToken = payload.accessToken || payload.token;

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

  if (payload.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
  }

  if (payload.access) {
    saveAccessContext(payload.access);
  }

  return accessToken;
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ACCESS_CONTEXT_KEY);
}

export async function getCurrentAccessContext(authToken?: string) {
  const response = await apiRequest<MeResponse>("/auth/me", {
    method: "GET",
    authToken,
  });

  saveAccessContext(response.data.access);

  return response.data.access;
}

export async function redirectAfterAuth(params: {
  payload: TokenLoginPayload;
  redirectTo?: string | null;
  fallback?: string;
  requireBusinessAccess?: boolean;
  requirePlatformAccess?: boolean;
}) {
  const accessToken = saveAuthTokens(params.payload);

  const access =
    params.payload.access ?? (await getCurrentAccessContext(accessToken));

  saveAccessContext(access);

  if (params.requirePlatformAccess && !hasPlatformAccess(access)) {
    clearAuthTokens();

    return {
      redirected: false,
      error: "This account does not have platform access.",
    };
  }

  if (
    params.requireBusinessAccess &&
    !hasPlatformAccess(access) &&
    !hasBusinessAccess(access)
  ) {
    clearAuthTokens();

    return {
      redirected: false,
      error:
        "This account does not have business access. Use customer login to explore Addressor.",
    };
  }

  window.location.href = getPostAuthRedirectPath({
    access,
    redirectTo: params.redirectTo,
    fallback: params.fallback,
  });

  return {
    redirected: true,
    error: "",
  };
}

export async function logout() {
  try {
    const token = getStoredAccessToken();

    if (token) {
      await apiRequest("/auth/logout", {
        method: "POST",
        authToken: token,
        skipRefresh: true,
      });
    }
  } catch {
    // Logout must always clear local auth state, even if the server session is already expired.
  } finally {
    clearAuthTokens();
    window.location.href = "/login";
  }
}
