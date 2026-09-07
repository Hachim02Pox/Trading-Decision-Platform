import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { AppShell } from "@/components/shell/AppShell";
import { GlobalReadProvider } from "@/context/GlobalReadContext";
import { SettingsProvider } from "@/context/SettingsContext";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  fallback: ["Inter", "system-ui", "sans-serif"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  fallback: ["JetBrains Mono", "Menlo", "monospace"],
});

export const metadata: Metadata = {
  title: "Gold Terminal",
};

export const viewport: Viewport = {
  themeColor: "#0a0d12",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://s3.tradingview.com" />
      </head>
      <body>
        <SettingsProvider>
          <GlobalReadProvider>
            <AppShell>{children}</AppShell>
          </GlobalReadProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
