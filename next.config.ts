import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // beforeFiles: se evalúa ANTES que los archivos estáticos de public/
      // Así el service worker dinámico siempre gana sobre /public/firebase-messaging-sw.js
      beforeFiles: [
        {
          source: '/firebase-messaging-sw.js',
          destination: '/api/firebase-sw',
        },
      ],
      afterFiles: [],
      fallback: [],
    }
  },
}

export default nextConfig;
