import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "AssetLibrary AI — Enterprise Digital Asset Management",
    template: "%s — AssetLibrary AI",
  },
  description:
    "AI-powered digital asset management with brand approvals, role-based access control, and automatic tagging. Built for agencies and enterprise teams.",
  keywords: [
    "digital asset management",
    "DAM",
    "brand approvals",
    "AI tagging",
    "media library",
    "asset management",
  ],
  authors: [{ name: "AssetLibrary AI" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "AssetLibrary AI",
    title: "AssetLibrary AI — Enterprise Digital Asset Management",
    description:
      "AI-powered digital asset management with brand approvals, role-based access control, and automatic tagging.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AssetLibrary AI",
    description:
      "AI-powered digital asset management with brand approvals and automatic tagging.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
