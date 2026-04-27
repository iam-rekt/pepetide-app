import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import WalletProvider from "@/components/WalletProvider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PEPEtide - Peptide Protocol Tracker",
  description: "Track your peptide protocols with precision and safety",
  manifest: "/manifest.json",
  metadataBase: new URL("https://pepetide.xyz"),
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon-180.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/icon-192.png",
  },
  openGraph: {
    title: "PEPEtide - Peptide Protocol Tracker",
    description: "Track your peptide protocols with precision and safety",
    url: "https://pepetide.xyz",
    siteName: "PEPEtide",
    images: [
      {
        url: "https://pepetide.xyz/hero-pepe.jpg",
        width: 1200,
        height: 630,
        alt: "PEPEtide - Track your peptide protocols",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "PEPEtide - Peptide Protocol Tracker",
    description: "Track your peptide protocols with precision and safety",
    images: ["https://pepetide.xyz/hero-pepe.jpg"],
    creator: "@pepetide",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PEPEtide",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PEPEtide" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />

        {/* OG Image meta tags for social previews */}
        <meta property="og:image" content="https://pepetide.xyz/hero-pepe.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:image" content="https://pepetide.xyz/hero-pepe.jpg" />

        {/* PWA Links */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon-180.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180.png" />

        {/* Splash screens for iOS */}
        <link rel="apple-touch-startup-image" href="/icon-512.png" />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen`}
      >
        <WalletProvider>{children}</WalletProvider>
        <Analytics />
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                  // Skip SW in dev — it caches aggressively and interferes with HMR + wallet adapter network calls.
                  navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
                  return;
                }
                navigator.serviceWorker.register('/sw.js').then(registration => {
                  console.log('SW registered:', registration.scope);
                }).catch(error => {
                  console.log('SW registration failed:', error);
                });
              });
            }
          `
        }} />
      </body>
    </html>
  );
}
