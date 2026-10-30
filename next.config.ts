import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The compiler owns render memoization for the site. Do not add `useMemo`,
  // `useCallback`, or `React.memo` to site or registry source to compensate.
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
  },
};

export default nextConfig;
