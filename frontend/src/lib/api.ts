function resolveApiBaseUrl(configuredUrl?: string) {
  const rawUrl = String(configuredUrl || "http://localhost:4000/api").trim().replace(/\/+$/, "");
  return rawUrl.endsWith("/api") ? rawUrl : `${rawUrl}/api`;
}

const API_BASE_URL = resolveApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);

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

export { resolveApiBaseUrl };
