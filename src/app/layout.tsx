import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { Providers } from "./providers";

/**
 * 앱의 가장 바깥 껍데기. 모든 페이지가 이 안에 들어간다.
 *
 * Next.js 의 App Router 에서는 `src/app/` 폴더 구조가 곧 주소가 된다.
 *   src/app/page.tsx           →  /
 *   src/app/settings/page.tsx  →  /settings
 * 그리고 `layout.tsx` 는 그 아래 모든 페이지를 감싸는 공통 틀이다.
 *
 * 이 파일은 이 저장소에서 **유일하게 "use client" 가 없는 화면 파일**이다.
 * 즉 브라우저가 아니라 빌드할 때 한 번 실행된다. 그래서 여기서는
 * `useState` 같은 훅도, `window` 도 쓸 수 없다. 브라우저에서 돌아야 하는 것들은
 * 아래 `<Providers>`(그쪽은 "use client")로 넘긴다.
 */


const SITE_NAME = "레지오 마리애 주간 활동 보고";
const SITE_DESCRIPTION =
  "레지오 마리애 단원을 위한 주간 기도 활동 기록 및 보고 앱 / A weekly prayer activity tracker for Legion of Mary members.";

/**
 * 브라우저 탭 제목, 검색 결과, 카카오톡·페이스북 공유 미리보기에 쓰이는 정보.
 * Next.js 가 이 객체를 읽어 `<head>` 안의 `<meta>` 태그들로 바꿔 준다.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // 홈 화면에 앱으로 설치될 때 쓰이는 정보(PWA).
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

/** 모바일에서의 화면 크기·확대 정책. maximumScale 5 는 확대를 막지 않기 위한 값이다. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#fafaf5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // [TS] `children` 은 이 컴포넌트가 감싸고 있는 내용물이다. 각 페이지가
  //      여기 `{children}` 자리에 끼워진다.
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
