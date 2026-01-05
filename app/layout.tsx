import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Urbanist } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "./components/I18nProvider";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { LiveFeedProvider } from "./components/live-feed/LiveFeedProvider";
import QueryProvider from "./components/QueryProvider";
import ToastProvider from "./components/ToastProvider";
import AuthProvider from "./providers/AuthProvider";
import Providers from "./providers";
import ChaportLiveChat from "./components/ChaportLiveChat";

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
    default: "FlameDraw",
    template: "%s | FlameDraw",
  },
  applicationName: "FlameDraw",
  description: "FlameDraw",
  icons: {
    icon: [
      { url: "/logo-black.svg", media: "(prefers-color-scheme: light)" },
      { url: "/logo.svg", media: "(prefers-color-scheme: dark)" },
    ],
  },
  openGraph: {
    title: "FlameDraw",
  },
  twitter: {
    title: "FlameDraw",
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
      <body className={`${urbanist.className} ${urbanist.variable} ${geistSans.variable} ${geistMono.variable} antialiased h-screen overflow-y-auto flex flex-col`} style={{ backgroundColor: '#1D2125' }}>
        <style>{`
          /* 全站背景图（各端启用）：小屏优先流畅、桌面更沉浸 */
          html,
          body {
            background-image: url("/theme/default/background.png");
            background-position: center top;
            background-repeat: no-repeat;
            background-size: cover;
            background-attachment: scroll;
            background-color: #1D2125;
          }

          /* 桌面端：固定背景更有质感 */
          @media (min-width: 1024px) {
            html,
            body {
              background-attachment: fixed;
            }
          }
        `}</style>
        <I18nProvider>
          <Providers>
            <QueryProvider>
              <ToastProvider>
                <AuthProvider>
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
                </AuthProvider>
              </ToastProvider>
            </QueryProvider>
          </Providers>
        </I18nProvider>
        <ChaportLiveChat />
      </body>
    </html>
  );
}
