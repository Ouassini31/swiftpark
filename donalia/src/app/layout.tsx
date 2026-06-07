import type { Metadata } from "next";
import { Fraunces, Mulish } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { BRAND } from "@/lib/donalia/constants";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});
const mulish = Mulish({
  subsets: ["latin"],
  variable: "--font-mulish",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.baseline}`,
  description: BRAND.tagline,
  openGraph: {
    title: `${BRAND.name} — ${BRAND.baseline}`,
    description: BRAND.tagline,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${mulish.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
