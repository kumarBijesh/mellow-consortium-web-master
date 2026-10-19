// Values here match what's stored in the `institutions.region` column
// (Supabase data) — never translate these directly, only the display
// label looked up via REGION_KEYS (NetworkMap.regions.* messages).
// Shared by the network map and the /institutions directory so region
// colours stay identical everywhere.
export const REGIONS = ["North America", "South America", "Europe", "Africa", "Middle East", "Asia-Pacific"] as const;

export type Region = (typeof REGIONS)[number];

export const REGION_KEYS: Record<Region, string> = {
  "North America": "northAmerica",
  "South America": "southAmerica",
  Europe: "europe",
  Africa: "africa",
  "Middle East": "middleEast",
  "Asia-Pacific": "asiaPacific",
};

export const REGION_COLORS: Record<string, string> = {
  "North America": "#3E8FD0",
  "South America": "#15A8A0",
  Europe: "#8A72E0",
  Africa: "#E8735A",
  "Middle East": "#D9B447",
  "Asia-Pacific": "#3FB5D6",
};
