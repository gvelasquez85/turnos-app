import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
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
