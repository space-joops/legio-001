// Set NEXT_PUBLIC_SITE_URL in the Vercel project's environment variables to
// the deployment's real domain; falls back to the old Vercel URL if unset
// (e.g. preview deployments) so OG/social preview images never resolve
// against localhost.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://legio-001.vercel.app";
