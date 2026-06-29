const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:4000";

type ApiRequestOptions = RequestInit & {
  authToken?: string | null;
  skipAuth?: boolean;
};

function getStoredAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("addressorAuthToken");
}

function buildHeaders(options: ApiRequestOptions) {
  const headers = new Headers(options.headers);
  const authToken = options.authToken ?? getStoredAuthToken();

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (!options.skipAuth && authToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  return headers;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: buildHeaders(options),
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw json ?? {
      ok: false,
      error: {
        message: "Request failed.",
        statusCode: response.status,
      },
    };
  }

  return json as T;
}