// Registers the esbuild transform hook for the test runner. Separate from
// loader.mjs because register() must run in the main thread before any test
// module is imported.
import { register } from 'node:module';
register('./loader.mjs', import.meta.url);
