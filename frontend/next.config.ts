import type { NextConfig } from "next";

const backendImageUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  ? new URL(process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/api\/?$/, ""))
  : null;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      ...(backendImageUrl
        ? [
            {
              protocol: backendImageUrl.protocol.replace(":", "") as "http" | "https",
              hostname: backendImageUrl.hostname,
              port: backendImageUrl.port,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
