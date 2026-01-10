import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PEPEtide - Peptide Protocol Tracker",
  description: "Track your peptide protocols with precision and safety",
  manifest: "/manifest.json",
  metadataBase: new URL("https://pepetide.xyz"),
  icons: {
    icon: [
      { url: "/pwaicon.png", type: "image/png" },
    ],
    apple: "/pwaicon.png",
    shortcut: "/pwaicon.png",
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
        <link rel="icon" type="image/png" href="/pwaicon.png" />
        <link rel="apple-touch-icon" href="/pwaicon.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/pwaicon.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/pwaicon.png" />

        {/* Splash screens for iOS */}
        <link rel="apple-touch-startup-image" href="/pwaicon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        {/* Site-wide responsive background image */}
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-no-repeat bg-center bg-cover opacity-35 bg-hero-responsive"
          style={{
            backgroundImage: 'url(/hero-pepe.jpg)',
          }}
          aria-hidden="true"
        />
        {/* Mobile-specific background (if hero-pepe-mobile.png exists) */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 768px) {
              .bg-hero-responsive {
                background-image: url(/hero-pepe-mobile.png) !important;
              }
            }
          `
        }} />
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
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
