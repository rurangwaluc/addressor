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

export function getStoredAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function saveAuthTokens(payload: TokenLoginPayload) {
  const accessToken = payload.accessToken || payload.token;

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

  if (payload.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
  }

  return accessToken;
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function getCurrentAccessContext(authToken?: string) {
  const response = await apiRequest<MeResponse>("/auth/me", {
    method: "GET",
    authToken,
  });

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

export function logout() {
  clearAuthTokens();
  window.location.href = "/login";
}