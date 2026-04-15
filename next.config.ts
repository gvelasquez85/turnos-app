import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Serve the Firebase Messaging service worker dynamically
        // so Firebase config is injected from env vars at runtime.
        source: '/firebase-messaging-sw.js',
        destination: '/api/firebase-sw',
      },
    ]
  },
}

export default nextConfig;
