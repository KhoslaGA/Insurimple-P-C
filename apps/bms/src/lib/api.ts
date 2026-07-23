import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.API_URL ?? "http://localhost:3001";
const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

/**
 * Whether a backend API is configured. When false (a keyless preview/Vercel
 * deploy with no API_URL), screens fall back to the deterministic preview
 * snapshot in lib/demo-data.ts instead of fetching. Set API_URL to use the
 * real RLS-scoped API.
 */
export const API_CONFIGURED = !!process.env.API_URL;

/**
 * Server-side API client. With Clerk configured, every call carries the
 * session token (Authorization: Bearer) — the API maps org -> tenant and
 * sub -> staff itself; the app never sends tenant identifiers.
 *
 * Dev fallback (development only, Clerk keys absent): the pre-Clerk
 * x-tenant-id/x-actor-id headers from DEV_TENANT_ID/DEV_ACTOR_ID env.
 */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (clerkConfigured) {
    const { getToken } = await auth();
    const token = await getToken();
    if (!token) throw new Error("no Clerk session token — signed out?");
    headers.authorization = `Bearer ${token}`;
  } else if (process.env.NODE_ENV === "development") {
    console.warn("[api] DEV-HEADER auth — set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to use Clerk");
    headers["x-tenant-id"] = process.env.DEV_TENANT_ID ?? "";
    headers["x-actor-id"] = process.env.DEV_ACTOR_ID ?? process.env.DEV_USER_ID ?? "";
  } else {
    throw new Error("Clerk is not configured and dev-header auth is disabled outside development");
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`API ${path} -> ${res.status} ${await res.text().catch(() => "")}`);
  }
  return res.json() as Promise<T>;
}
