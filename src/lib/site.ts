// Hardcoded rather than an env var: NEXT_PUBLIC_SITE_URL isn't set in the
// Vercel deployment, which broke OG/social preview image URLs (they were
// resolving against localhost). Update this if the deployment domain changes.
export const SITE_URL = "https://legio-001.vercel.app";
