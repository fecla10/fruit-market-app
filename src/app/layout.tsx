import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Providers } from "@/components/providers/providers";
import { RootLayout } from "@/components/layout/root-layout";
import { InstallPrompt } from "@/components/pwa/install-prompt";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Fruit Market Tracker",
    template: "%s | Fruit Market Tracker"
  },
  description: "Track fruit commodity prices and manage your portfolio with real-time market data, advanced analytics, and personalized alerts.",
  keywords: [
    "fruit market",
    "commodity trading", 
    "price tracking",
    "portfolio management",
    "market analytics",
    "real-time data",
    "trading platform"
  ],
  authors: [{ name: "Fruit Market Tracker Team" }],
  creator: "Fruit Market Tracker",
  publisher: "Fruit Market Tracker",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US", 
    url: "/",
    title: "Fruit Market Tracker",
    description: "Professional fruit commodity trading platform with real-time data and portfolio management.",
    siteName: "Fruit Market Tracker",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fruit Market Tracker - Professional Trading Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fruit Market Tracker",
    description: "Professional fruit commodity trading platform with real-time data and portfolio management.",
    images: ["/twitter-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large", 
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  other: {
    "msapplication-TileColor": "#16a34a",
    "msapplication-config": "/browserconfig.xml",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* PWA meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Fruit Market" />
        <meta name="application-name" content="Fruit Market Tracker" />
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </head>
      
      <body className={inter.className}>
        <Providers>
          {/* PWA Install Prompt */}
          <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:w-96">
            <InstallPrompt />
          </div>
          
          <RootLayout>{children}</RootLayout>
        </Providers>
        
        {/* Performance Monitoring Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Web Vitals reporting
              function sendToAnalytics({name, value, id}) {
                console.log('Web Vital:', name, value);
              }
              
              // Report Core Web Vitals
              if ('PerformanceObserver' in window) {
                // Error tracking
                window.addEventListener('error', (event) => {
                  console.error('Runtime error:', event.error);
                });
                
                window.addEventListener('unhandledrejection', (event) => {
                  console.error('Unhandled promise rejection:', event.reason);
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
