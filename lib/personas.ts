export type PersonaType =
  | "biotech_company"
  | "clinical_investigator"
  | "academic_institution"
  | "individual"
  | "healthcare_provider"
  | "hospital_wellness_group"
  | "journal_conference_partner";

export interface Persona {
  type: PersonaType;
  label: string;
  description: string;
}

export const PERSONAS: Persona[] = [
  {
    type: "biotech_company",
    label: "Wellness & Biotech Company",
    description: "Run trials or partner on biomarker and formulation research.",
  },
  {
    // Routes to a dedicated Investigator Registration form, not the
    // generic ApplicationForm — see app/[locale]/apply/[type]/page.tsx
    // and supabase/investigator-registrations.sql.
    type: "clinical_investigator",
    label: "Clinical Investigator",
    description: "Lead or join harmonized multi-country trials.",
  },
  {
    type: "academic_institution",
    label: "Academic Institution",
    description: "Contribute sites, cohorts, or shared research infrastructure.",
  },
  {
    type: "individual",
    label: "Individual",
    description: "Explore MELLOW-Age and track your own biological age.",
  },
  {
    type: "healthcare_provider",
    label: "Healthcare Provider",
    description: "Offer MELLOW-Age care plans to your own patients.",
  },
  {
    type: "hospital_wellness_group",
    label: "Hospital or Wellness Group",
    description: "Bring your team onto the MELLOW-Age clinical dashboard.",
  },
  {
    type: "journal_conference_partner",
    label: "Journal or Conference Partner",
    description: "Partner with JLIVE publishing or the Annual Meeting.",
  },
];

export function personaByType(type: string): Persona | undefined {
  return PERSONAS.find((p) => p.type === type);
}
