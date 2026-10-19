import { COUNTRY_CENTROIDS } from "@/lib/country-centroids";

// The investigators table also holds private registration fields
// (personal_email, street_address, postal_code, cv_path). Public pages
// must select only these columns, never `*`.
export const PUBLIC_INVESTIGATOR_COLUMNS =
  "id, salutation, full_name, title, institution_id, country, photo_url, created_at, access_tier, department_focus_area, bio, qualifications, core_competencies, publications, linkedin_url, website_url";

// Prefix the salutation unless the imported name already carries it
// ("Dr. Moien Khan", "Dr ANJUM Ilahi").
export function investigatorDisplayName(salutation: string | null, fullName: string) {
  if (!salutation) return fullName;
  const bare = salutation.replace(/\.$/, "").toLowerCase();
  const first = fullName.split(/\s+/)[0]?.replace(/\.$/, "").toLowerCase();
  return first === bare ? fullName : `${salutation} ${fullName}`;
}

// Affiliated investigators take their institution's region; independent
// ones are bucketed by country, the same way the network map clusters them.
export function investigatorRegion(country: string | null, institutionRegion: string | null) {
  return institutionRegion ?? (country ? COUNTRY_CENTROIDS[country]?.region ?? null : null);
}

export function initials(name: string) {
  const parts = name.replace(/^(dr|prof)\.?\s+/i, "").split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
