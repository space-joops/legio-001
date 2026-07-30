import type { Metadata, Viewport } from "next";
import { Nanum_Gothic } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Nanum Gothic's Google Fonts metadata only exposes a "latin" subset name in
// next/font's typings, but the underlying font file is a single CJK-inclusive
// file (Korean fonts aren't split into separate per-script subsets the way
// Latin-script families are), so Korean glyphs render correctly regardless.
const nanumGothic = Nanum_Gothic({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-nanum",
  display: "swap",
});

const SITE_NAME = "레지오 마리애 주간 활동 보고";
const SITE_DESCRIPTION =
  "레지오 마리애 단원을 위한 주간 기도 활동 기록 및 보고 앱 / A weekly prayer activity tracker for Legion of Mary members.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf6" },
    { media: "(prefers-color-scheme: dark)", color: "#14161a" },
  ],
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
