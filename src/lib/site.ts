// 이 앱이 배포된 주소. 공유 미리보기(OG 이미지)의 절대경로를 만들 때와
// 설정 화면에 주소를 적어 줄 때 쓴다.
//
// Set NEXT_PUBLIC_SITE_URL in the Vercel project's environment variables to
// override per-deployment. The fallback is the live domain rather than the
// vercel.app one because the settings screen prints this for members to type
// in — an address that redirects is worse than none.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://legio.diginori.com";
