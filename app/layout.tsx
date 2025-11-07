import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Urbanist } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "./components/I18nProvider";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { LiveFeedProvider } from "./components/live-feed/LiveFeedProvider";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-urbanist",
});

export const metadata: Metadata = {
  title: {
    default: "flamedraw",
    template: "%s | flamedraw",
  },
  applicationName: "flamedraw",
  description: "flamedraw",
  openGraph: {
    title: "flamedraw",
  },
  twitter: {
    title: "flamedraw",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" data-theme="dark">
      <body className={`${urbanist.className} ${geistSans.variable} ${geistMono.variable} antialiased h-screen overflow-y-auto flex flex-col`} style={{ backgroundColor: '#1D2125' }}>
        <I18nProvider>
          <Providers>
            {/* LiveFeedProvider: 将 socketEnabled 改为 true 并提供 socketUrl 即可接入后端 WebSocket */}
            <LiveFeedProvider socketEnabled={false} socketUrl={process.env.NEXT_PUBLIC_LIVE_FEED_WS}>
              <div className="flex flex-col min-h-mobile" style={{ overflowX: 'hidden' }}>
                <Navbar />
                <div className="flex-1 pt-8">
                  {children}
                </div>
                <Footer />
              </div>
            </LiveFeedProvider>
          </Providers>
        </I18nProvider>
      </body>
    </html>
  );
}
