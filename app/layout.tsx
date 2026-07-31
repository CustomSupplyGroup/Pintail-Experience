import type { Metadata, Viewport } from "next";
import { Allura, Bitter, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Display / hero / wordmark — flowing script (closest free match to Lakeside).
const allura = Allura({
  variable: "--font-allura",
  subsets: ["latin"],
  weight: "400",
});

// Reading — slab serif, matches pintailgoods.com body.
const bitter = Bitter({
  variable: "--font-bitter",
  subsets: ["latin"],
});

// Functional UI — tables, forms, small labels.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Pintail Experience",
  description:
    "An intentional, faith-centered hunting retreat — carried in your pocket from the day you're confirmed until long after the trip ends.",
  applicationName: "The Pintail Experience",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pintail",
  },
  // Icons come from Next file conventions: app/icon.png (favicon + manifest
  // fallback) and app/apple-icon.png (iOS "Add to Home Screen"). The manifest
  // additionally declares the 192/512/maskable PWA icons.
};

export const viewport: Viewport = {
  themeColor: "#1f2421",
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
    <html
      lang="en"
      className={`dark ${allura.variable} ${bitter.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
