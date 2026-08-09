// Browser requests stay on the frontend origin. Next.js proxies /api to Render,
// keeping the HTTP-only session cookie first-party and reliable after reloads.
const API_BASE_URL = "/api";

export class ApiError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function api<T>(path: string, init: RequestInit = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      body?.error?.code || "REQUEST_FAILED",
      body?.error?.message || "Request failed.",
    );
  }

  return body.data as T;
}
