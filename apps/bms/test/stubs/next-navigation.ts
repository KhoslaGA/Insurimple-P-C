/**
 * The Next router, for a renderer that has no router.
 *
 * Every list screen calls useRouter() to navigate on row click, and useRouter
 * throws outside a Next router context. Skipping the components that use it
 * would skip most of the product, so the loader redirects `next/navigation`
 * here during tests.
 *
 * A stub rather than node:test's mock.module: that resolves the real specifier
 * first, and `next/navigation` is a subpath the bare ESM resolver cannot reach.
 * It also drops an experimental flag, and leaves the substitution as a file
 * someone can open and read.
 *
 * Deliberately inert. These tests assert the first paint — what a broker sees
 * and what breaks. Anything that needs a click belongs in a browser test.
 */
export function useRouter() {
  return {
    push() {}, replace() {}, refresh() {}, back() {}, forward() {}, prefetch() {},
  };
}
export function usePathname() { return '/'; }
export function useSearchParams() { return new URLSearchParams(); }
export function useParams(): Record<string, string> { return {}; }
export function redirect(): never { throw new Error('redirect() called during a render test'); }
export function notFound(): never { throw new Error('notFound() called during a render test'); }
