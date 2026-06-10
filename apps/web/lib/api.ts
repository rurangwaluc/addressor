const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:4000";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const json = await response.json();

  if (!response.ok) {
    throw json;
  }

  return json as T;
}