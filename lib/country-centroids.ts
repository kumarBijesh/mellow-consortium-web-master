// Approximate capital/reference coordinates + network-map region bucket
// for countries that have independent investigators (no institution) but
// no MELLOW institution of their own to anchor a map pin to. Region
// values must stay in institutions-geo.sql's region check constraint set
// (North America / South America / Europe / Africa / Middle East /
// Asia-Pacific) — see components/network-map/GlobalNetworkMap.tsx REGIONS.
export const COUNTRY_CENTROIDS: Record<string, { lat: number; lon: number; region: string }> = {
  Pakistan: { lat: 33.6844, lon: 73.0479, region: "Asia-Pacific" },
  US: { lat: 39.8283, lon: -98.5795, region: "North America" },
  Bahamas: { lat: 25.0343, lon: -77.3963, region: "North America" },
  Tunisia: { lat: 36.8065, lon: 10.1815, region: "Africa" },
  "Sri Lanka": { lat: 6.9271, lon: 79.8612, region: "Asia-Pacific" },
  Italy: { lat: 41.9028, lon: 12.4964, region: "Europe" },
  Nepal: { lat: 27.7172, lon: 85.324, region: "Asia-Pacific" },
  Turkey: { lat: 39.9334, lon: 32.8597, region: "Middle East" },
  China: { lat: 39.9042, lon: 116.4074, region: "Asia-Pacific" },
  Singapore: { lat: 1.3521, lon: 103.8198, region: "Asia-Pacific" },
  Canada: { lat: 45.4215, lon: -75.6972, region: "North America" },
  Kazakhstan: { lat: 51.1694, lon: 71.4491, region: "Asia-Pacific" },
  India: { lat: 28.6139, lon: 77.209, region: "Asia-Pacific" },
  Ethiopia: { lat: 9.025, lon: 38.7469, region: "Africa" },
  Australia: { lat: -35.2809, lon: 149.13, region: "Asia-Pacific" },
  UAE: { lat: 24.4539, lon: 54.3773, region: "Middle East" },
  France: { lat: 48.8566, lon: 2.3522, region: "Europe" },
  "Saudi Arabia": { lat: 24.7136, lon: 46.6753, region: "Middle East" },
  Germany: { lat: 52.52, lon: 13.405, region: "Europe" },
  Nigeria: { lat: 9.0765, lon: 7.3986, region: "Africa" },
  Brazil: { lat: -15.7975, lon: -47.8919, region: "South America" },
  UK: { lat: 51.5072, lon: -0.1276, region: "Europe" },
};
