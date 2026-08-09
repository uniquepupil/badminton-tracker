import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function backendOrigin() {
  const configuredUrl = process.env.BACKEND_API_URL
    || process.env.NEXT_PUBLIC_API_BASE_URL
    || "http://localhost:4000";
  return configuredUrl.trim().replace(/\/+$/, "").replace(/\/api$/, "");
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const target = new URL(`${backendOrigin()}/api/${path.join("/")}`);
  target.search = request.nextUrl.search;

  const requestHeaders = new Headers();
  for (const name of ["accept", "content-type", "cookie", "origin", "user-agent"]) {
    const value = request.headers.get(name);
    if (value) requestHeaders.set(name, value);
  }

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers: requestHeaders,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
    });

    const responseHeaders = new Headers({
      "Cache-Control": "private, no-store, max-age=0",
    });
    for (const name of ["content-type", "content-disposition", "etag", "last-modified"]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }

    const getSetCookie = (upstream.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
    const cookies = getSetCookie ? getSetCookie.call(upstream.headers) : [];
    if (cookies.length) {
      cookies.forEach((cookie) => responseHeaders.append("set-cookie", cookie));
    } else {
      const cookie = upstream.headers.get("set-cookie");
      if (cookie) responseHeaders.set("set-cookie", cookie);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Backend proxy failed:", error instanceof Error ? error.message : error);
    return Response.json(
      { success: false, error: { code: "BACKEND_UNAVAILABLE", message: "The score service is waking up. Please try again shortly." } },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
