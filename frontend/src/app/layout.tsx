import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorker } from "@/components/ServiceWorker";

const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (productionHost ? `https://${productionHost}` : "http://localhost:3000");
const title = "NO LOVERS · Badminton Score Tracker";
const description = "The private badminton score tracker for the NO LOVERS friend group—record singles and doubles matches, follow rankings, compare player stats, and keep every rally remembered.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s · NO LOVERS",
  },
  description,
  applicationName: "NO LOVERS Badminton",
  keywords: [
    "NO LOVERS",
    "NO LOVERS badminton",
    "badminton score tracker",
    "badminton match tracker",
    "badminton leaderboard",
    "badminton rankings",
    "badminton statistics",
    "singles badminton scores",
    "doubles badminton scores",
    "friends badminton group",
    "daily badminton tracker",
  ],
  authors: [{ name: "NO LOVERS" }],
  creator: "NO LOVERS",
  publisher: "NO LOVERS",
  category: "sports",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "NO LOVERS Badminton",
    title,
    description,
    locale: "en_IN",
    images: [
      {
        url: "/no-lovers-badminton.jpeg",
        width: 900,
        height: 1600,
        alt: "NO LOVERS friends playing badminton on their evening court",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/no-lovers-badminton.jpeg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NO LOVERS",
  },
};

export const viewport: Viewport = {
  themeColor: "#b7f34a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en-IN"><body><ServiceWorker />{children}</body></html>;
}
