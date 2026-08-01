// Set NEXT_PUBLIC_SITE_URL in the Vercel project's environment variables to
// override per-deployment. The fallback is the live domain rather than the
// vercel.app one because the settings screen prints this for members to type
// in — an address that redirects is worse than none.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://legio.diginori.com";
