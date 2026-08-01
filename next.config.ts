import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Static export has no server, so the build stamps its own time in. Shown on
  // the settings screen to tell which build a device is actually running.
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
