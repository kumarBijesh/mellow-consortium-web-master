export const ORGANIZATION_TYPES = [
  "biotech_pharma",
  "academic_research",
  "hospital_health_system",
  "cro",
  "investor_vc",
  "media_publication",
  "other",
] as const;

export const PARTNERSHIP_INTERESTS = [
  "clinical_trial_collaboration",
  "research_partnership",
  "advisory_consulting",
  "speaking_conference",
  "media_interview",
  "other",
] as const;

export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];
export type PartnershipInterest = (typeof PARTNERSHIP_INTERESTS)[number];
