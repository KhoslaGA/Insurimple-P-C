/**
 * The Next server APIs a screen reaches transitively.
 *
 * Components import their server actions, and those import `next/cache` and
 * `next/headers` — modules that only exist inside a Next request. Nothing here
 * is exercised by a render test (the actions run on submit, not on paint), but
 * the import graph still has to resolve.
 *
 * Each one throws if actually called, so a test that starts depending on server
 * behaviour fails loudly instead of silently observing a no-op.
 */
const unavailable = (name: string) => () => {
  throw new Error(`${name}() is a Next server API and is not available in a render test`);
};

export const revalidatePath = unavailable('revalidatePath');
export const revalidateTag = unavailable('revalidateTag');
export const unstable_cache = <T,>(fn: T) => fn;
export const cookies = unavailable('cookies');
export const headers = unavailable('headers');
export const draftMode = unavailable('draftMode');

/** Clerk's server helpers, for the same reason and with the same rule. */
export const auth = unavailable('auth');
export const currentUser = unavailable('currentUser');
export const clerkClient = unavailable('clerkClient');
export const clerkMiddleware = unavailable('clerkMiddleware');
export const createRouteMatcher = unavailable('createRouteMatcher');
