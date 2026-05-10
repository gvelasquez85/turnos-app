import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavigationProgress } from "@/components/NavigationProgress";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TurnFlow",
  description: "El CRM simple para negocios locales que quieren crecer con sus clientes.",
  icons: {
    icon: '/favicon.svg',
    apple: [
      { url: '/icons/icon-192.png', sizes: '192x192' },
      { url: '/icons/icon-512.png', sizes: '512x512' },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TurnFlow',
    startupImage: '/icons/icon-512.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  openGraph: {
    title: 'TurnFlow',
    description: 'El CRM simple para negocios locales que quieren crecer con sus clientes.',
    siteName: 'TurnFlow',
    type: 'website',
    url: 'https://app.turnflow.com.co',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'TurnFlow' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TurnFlow',
    description: 'El CRM simple para negocios locales que quieren crecer con sus clientes.',
    images: ['/opengraph-image'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Blocking script: reads localStorage before paint to prevent dark-mode flash */}
      <head>
        <meta name="theme-color" content="#4F46E5" />
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');var p=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t!=='light'&&p))document.documentElement.classList.add('dark');}catch(e){}})()` }} />
      </head>
      <body className="min-h-full flex flex-col">
        <NavigationProgress />
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
