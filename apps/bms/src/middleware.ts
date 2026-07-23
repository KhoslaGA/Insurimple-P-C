import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)"]);

/**
 * Clerk is the auth boundary in production: every route is protected except
 * sign-in, and tenant comes from the org claim, never a param.
 *
 * When Clerk isn't configured (a preview/first deploy before CLERK_SECRET_KEY
 * is set), `clerkMiddleware()` throws at the edge — Vercel surfaces that as
 * MIDDLEWARE_INVOCATION_FAILED and every route 500s. So we only mount Clerk when
 * a secret key is present; otherwise the app renders unauthenticated. This is
 * safe: tenancy is enforced independently by the API (Postgres RLS + the NestJS
 * auth guard), and the web app can't fetch tenant data without a Clerk session
 * anyway (lib/api.ts throws outside development when Clerk is absent).
 */
const clerkConfigured = !!process.env.CLERK_SECRET_KEY;

export default clerkConfigured
  ? clerkMiddleware(async (auth, req) => {
      if (!isPublicRoute(req)) {
        await auth.protect();
      }
    })
  : () => NextResponse.next();

export const config = {
  matcher: [
    // All routes except Next internals and static assets
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
