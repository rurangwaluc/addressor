const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:4000";

const ACCESS_TOKEN_KEY = "addressorAuthToken";
const REFRESH_TOKEN_KEY = "addressorRefreshToken";
const ACCESS_CONTEXT_KEY = "addressorAccessContext";

type ApiRequestOptions = RequestInit & {
  authToken?: string | null;
  skipAuth?: boolean;
  skipRefresh?: boolean;
};

type RefreshResponse = {
  ok: true;
  data: {
    token: string;
    accessToken?: string;
    refreshToken?: string;
    access?: unknown;
  };
};

function isBrowser() {
  return typeof window !== "undefined";
}

function getStoredAuthToken() {
  if (!isBrowser()) {
    return null;
  }

  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getStoredRefreshToken() {
  if (!isBrowser()) {
    return null;
  }

  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function saveAuthPayload(payload: RefreshResponse["data"]) {
  if (!isBrowser()) {
    return null;
  }

  const accessToken = payload.accessToken || payload.token;

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

  if (payload.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
  }

  if (payload.access) {
    localStorage.setItem(ACCESS_CONTEXT_KEY, JSON.stringify(payload.access));
  }

  return accessToken;
}

function clearStoredAuth() {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ACCESS_CONTEXT_KEY);
}

function buildHeaders(options: ApiRequestOptions, tokenOverride?: string | null) {
  const headers = new Headers(options.headers);
  const authToken = tokenOverride ?? options.authToken ?? getStoredAuthToken();

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (!options.skipAuth && authToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  return headers;
}

async function parseResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: {
        message: text,
        statusCode: response.status,
      },
    };
  }
}

function getResponseStatus(json: unknown, fallback: number) {
  if (
    json &&
    typeof json === "object" &&
    "error" in json &&
    json.error &&
    typeof json.error === "object" &&
    "statusCode" in json.error &&
    typeof json.error.statusCode === "number"
  ) {
    return json.error.statusCode;
  }

  return fallback;
}

function shouldAttemptRefresh(
  path: string,
  response: Response,
  json: unknown,
  options: ApiRequestOptions,
) {
  if (options.skipAuth || options.skipRefresh) {
    return false;
  }

  if (path === "/auth/refresh" || path === "/auth/login" || path === "/auth/google") {
    return false;
  }

  const status = getResponseStatus(json, response.status);

  return status === 401 || status === 403;
}

async function refreshAccessToken() {
  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    clearStoredAuth();
    return null;
  }

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  const json = (await parseResponse(response)) as RefreshResponse | null;

  if (!response.ok || !json?.ok) {
    clearStoredAuth();
    return null;
  }

  return saveAuthPayload(json.data);
}

async function sendRequest<T>(
  path: string,
  options: ApiRequestOptions,
  tokenOverride?: string | null,
): Promise<{
  response: Response;
  json: T | null;
}> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: buildHeaders(options, tokenOverride),
  });

  const json = (await parseResponse(response)) as T | null;

  return {
    response,
    json,
  };
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const firstAttempt = await sendRequest<T>(path, options);

  if (!firstAttempt.response.ok) {
    if (shouldAttemptRefresh(path, firstAttempt.response, firstAttempt.json, options)) {
      const newAccessToken = await refreshAccessToken();

      if (newAccessToken) {
        const secondAttempt = await sendRequest<T>(path, options, newAccessToken);

        if (secondAttempt.response.ok) {
          return secondAttempt.json as T;
        }

        throw secondAttempt.json ?? {
          ok: false,
          error: {
            message: "Request failed.",
            statusCode: secondAttempt.response.status,
          },
        };
      }
    }

    throw firstAttempt.json ?? {
      ok: false,
      error: {
        message: "Request failed.",
        statusCode: firstAttempt.response.status,
      },
    };
  }

  return firstAttempt.json as T;
}
