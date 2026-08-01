import type { Metadata, Viewport } from "next";
import { Nanum_Gothic } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { Providers } from "./providers";

// Google splits Nanum Gothic into ~276 unicode-range slices (2.9MB all told).
// preload:false is deliberate and load-bearing: preload tags ignore
// unicode-range and fetch every slice, which put ~1.9MB of fonts on the
// critical path of every page — for the majority who never leave the default
// system font (Settings > 폰트). Without it the @font-face rules stay, so
// opting in still works, just fetched lazily per slice as glyphs are used.
const nanumGothic = Nanum_Gothic({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-nanum",
  display: "swap",
  preload: false,
});

const SITE_NAME = "레지오 마리애 주간 활동 보고";
const SITE_DESCRIPTION =
  "레지오 마리애 단원을 위한 주간 기도 활동 기록 및 보고 앱 / A weekly prayer activity tracker for Legion of Mary members.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#f3edf7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={nanumGothic.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
