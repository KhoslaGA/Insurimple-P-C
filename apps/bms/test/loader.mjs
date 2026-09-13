/**
 * A Node module hook that transforms .ts/.tsx for the test runner.
 *
 * Node's built-in type stripping handles .ts but not JSX, so component tests
 * need a transform. This is twenty lines of esbuild rather than a dependency
 * because the one setting that matters — `jsx: 'automatic'` — has to be
 * explicit: with the classic runtime every design-system component fails with
 * "React is not defined", since they correctly import only `type ReactNode`
 * and rely on the automatic runtime Next configures. A loader that reads the
 * setting from tsconfig would be tidier and was tried; it did not honour
 * `"jsx": "react-jsx"`, and a transform whose output depends on config
 * discovery is a transform that breaks when a file moves.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';

export async function load(url, context, nextLoad) {
  if (!/\.tsx?$/.test(url) || url.includes('/node_modules/')) return nextLoad(url, context);

  const source = await readFile(fileURLToPath(url), 'utf8');
  const { code } = await transform(source, {
    loader: url.endsWith('.tsx') ? 'tsx' : 'ts',
    format: 'esm',
    target: 'node22',
    jsx: 'automatic',
    sourcefile: fileURLToPath(url),
    sourcemap: 'inline',
  });
  return { format: 'module', source: code, shortCircuit: true };
}

// `next/navigation` is redirected to a stub: useRouter() throws outside a Next
// router context, and every list screen calls it to navigate on row click.
// Done here rather than with node:test's mock.module because that resolves the
// real specifier first, and `next/navigation` is a subpath the bare ESM
// resolver cannot reach — and because a stub file is something a reader can
// open.
//
// Everything else resolves normally: the workspace packages point their
// exports at source, which is what lets a test import a component with no
// build step.
const STUBS = new Map([
  ['next/navigation', new URL('./stubs/next-navigation.ts', import.meta.url).href],
  // Components import their server actions, and those import Next server APIs.
  // The actions run on submit, not on paint, so a render test never exercises
  // them — but the import graph still has to resolve.
  ['next/cache', new URL('./stubs/next-server-apis.ts', import.meta.url).href],
  ['next/headers', new URL('./stubs/next-server-apis.ts', import.meta.url).href],
  // Same for Clerk: the auth helpers run in a request, not in a render, and
  // @clerk/nextjs ships extensionless imports inside its own ESM build that a
  // bare Node resolver cannot follow.
  ['@clerk/nextjs/server', new URL('./stubs/next-server-apis.ts', import.meta.url).href],
  // next/link renders as the anchor it becomes, so hrefs stay assertable.
  ['next/link', new URL('./stubs/next-link.tsx', import.meta.url).href],
  // Clerk's client widgets. Third-party, runtime-bound, and shipped as an ESM
  // build with directory imports Node cannot follow.
  ['@clerk/nextjs', new URL('./stubs/clerk.tsx', import.meta.url).href],
]);

export async function resolve(specifier, context, nextResolve) {
  const stub = STUBS.get(specifier);
  if (stub) return { url: stub, format: 'module', shortCircuit: true };

  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    // Extensionless relative imports. The workspace source is written for a
    // bundler — `import { Badge } from './Badge'` — and Node's ESM resolver
    // requires the extension. Rather than rewrite thirty source files to suit
    // the test runner, the runner does what the bundler does.
    if (err?.code !== 'ERR_MODULE_NOT_FOUND' || !specifier.startsWith('.')) throw err;
    for (const ext of ['.tsx', '.ts', '.js', '.mjs', '/index.tsx', '/index.ts', '/index.js']) {
      try {
        return await nextResolve(specifier + ext, context);
      } catch { /* try the next one */ }
    }
    throw err;
  }
}
