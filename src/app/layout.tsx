import type { Metadata, Viewport } from "next";
import { Inter, DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";

const inter   = Inter({ subsets: ["latin"], variable: "--font-inter" });
const dmSans  = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", weight: ["300", "400"] });

export const metadata: Metadata = {
  title: "SwiftPark — Trouvez une place en temps réel",
  description: "Partagez et trouvez des places de stationnement en temps réel grâce aux SwiftCoins.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SwiftPark",
  },
};

export const viewport: Viewport = {
  themeColor: "#1da45f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${dmSans.variable}`} data-theme="light">
      <body className="antialiased">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
