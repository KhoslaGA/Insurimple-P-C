import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* The workspace packages ship TypeScript source rather than a build step, so
     Next compiles them as part of the app. */
  transpilePackages: [
    "@insurimple/design-system",
    "@insurimple/contracts",
    "@insurimple/db",
  ],

  /* `pg` is a native-ish Node driver: it must stay external and be required at
     runtime rather than bundled. Bundling it breaks the connection pool and
     risks dragging database code toward the client bundle. */
  serverExternalPackages: ["pg"],

  /* Pin the workspace root. Without this Next walks up looking for a lockfile
     and lands on a stray one in $HOME, which puts the inferred root outside
     the monorepo entirely. */
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
};

export default nextConfig;
