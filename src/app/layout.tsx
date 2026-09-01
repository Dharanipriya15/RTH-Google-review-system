import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import "./globals.css";
import { publicEnv } from "@/lib/env";

const display = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const sans = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
});

const siteUrl = publicEnv.siteUrl;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Raade's Tea House — Guest Feedback",
    template: "%s · Raade's Tea House",
  },
  description:
    "Share how your visit to Raade's Tea House went. Your feedback goes straight to our team.",
  applicationName: "Raade's Tea House Feedback",
  authors: [{ name: "Raade's Tea House" }],
  openGraph: {
    title: "Raade's Tea House — Guest Feedback",
    description:
      "Share how your visit to Raade's Tea House went. Your feedback goes straight to our team.",
    siteName: "Raade's Tea House",
    type: "website",
    url: siteUrl,
    images: [{ url: "/raade-logo.png", width: 500, height: 500, alt: "Raade's Tea House" }],
  },
  twitter: {
    card: "summary",
    title: "Raade's Tea House — Guest Feedback",
    description: "Share how your visit to Raade's Tea House went.",
    images: ["/raade-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
