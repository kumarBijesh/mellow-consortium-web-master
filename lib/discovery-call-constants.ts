export const COLLABORATION_TYPES = [
  "Sponsor a clinical trial (Biotech / Pharma)",
  "Join as a Clinical Investigator",
  "Contribute as an Academic Institution",
  "Become a Healthcare Provider partner",
  "Enroll our Hospital / Wellness Group",
  "Explore MELLOW-Age as an Individual",
  "Partner with JLIVE (Journal / Conference)",
  "Not sure yet / General inquiry",
] as const;

export type CollaborationType = (typeof COLLABORATION_TYPES)[number];
