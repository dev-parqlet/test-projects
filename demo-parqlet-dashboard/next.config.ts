import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // The browser may resolve localhost to 127.0.0.1 for the dev HMR socket.
  // Allow that loopback origin so webpack HMR can connect on port 3010.
  allowedDevOrigins: ["127.0.0.1"],
  async rewrites() {
    return [];
  },
};

export default nextConfig;
