import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A build and a dev server cannot share `.next`: the build deletes the directory the
  // server is reading. Override the directory to run both at once (CI, or verifying a
  // production build while `next dev` is open).
  distDir: process.env.CADENCE_DIST_DIR ?? ".next",
  // The compiler owns render memoization for the site. Do not add `useMemo`,
  // `useCallback`, or `React.memo` to site or registry source to compensate.
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
  },
};

export default nextConfig;
