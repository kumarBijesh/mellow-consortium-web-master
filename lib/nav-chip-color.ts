const NAV_CHIP_COLORS = ["blue", "teal", "purple", "gold", "coral"] as const;

// Deterministic per-label color so the same nav item always gets the same
// chip color across renders/sessions, without every NavLink call site
// needing to pass one explicitly.
export function navChipColor(label: string): (typeof NAV_CHIP_COLORS)[number] {
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  return NAV_CHIP_COLORS[hash % NAV_CHIP_COLORS.length];
}
