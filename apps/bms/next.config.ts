import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship TS/TSX source — let Next transpile them.
  transpilePackages: ["@insurimple/design-system", "@insurimple/contracts"],
};

export default nextConfig;
