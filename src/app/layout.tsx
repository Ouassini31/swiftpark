import type { Metadata, Viewport } from "next";
import { Inter, DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";

const inter   = Inter({ subsets: ["latin"], variable: "--font-inter" });
const dmSans  = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", weight: ["300", "400"] });

const APP_URL = "https://www.swiftpark.fr";

export const metadata: Metadata = {
  title: "SwiftPark — Trouvez une place de parking en temps réel",
  description: "Trouve une place de parking en secondes grâce aux conducteurs qui partagent leur place en temps réel. Gagne des SwiftCoins en partageant la tienne.",
  metadataBase: new URL(APP_URL),
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
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: APP_URL,
    siteName: "SwiftPark",
    title: "SwiftPark — Trouvez une place de parking en temps réel",
    description: "Trouve une place de parking en secondes grâce aux conducteurs qui partagent leur place en temps réel. Gagne des SwiftCoins en partageant la tienne.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SwiftPark — Trouvez une place de parking en temps réel",
    description: "Trouve une place de parking en secondes. Gagne des SwiftCoins en partageant ta place.",
  },
};

export const viewport: Viewport = {
  themeColor: "#22956b",
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
