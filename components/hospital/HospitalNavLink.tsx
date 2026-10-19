"use client";

import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import type { ReactNode } from "react";
import { navChipColor } from "@/lib/nav-chip-color";

export default function HospitalNavLink({
  href,
  label,
  icon,
  comingSoon = false,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  comingSoon?: boolean;
}) {
  const pathname = usePathname();
  // "/hospital" is the dashboard root — only an exact match should light
  // it up, otherwise every sub-page (e.g. /hospital/providers) would also
  // show it active since they all start with "/hospital".
  const active = !comingSoon && (pathname === href || (href !== "/hospital" && pathname?.startsWith(`${href}/`)));

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-all duration-200 ${
        active
          ? "bg-gradient-to-r from-blue to-teal text-white shadow-[0_4px_14px_-4px_rgba(21,168,160,.55)]"
          : "text-white/70 hover:text-white hover:bg-white/[0.06]"
      }`}
    >
      <span className={`nav-chip ${active ? "nav-chip-active" : `nav-chip-${navChipColor(label)}`}`}>{icon}</span>
      {label}
      {comingSoon && (
        <span className="ml-auto text-[9px] font-bold uppercase tracking-wide text-white/30 border border-white/10 rounded-full px-1.5 py-0.5">
          Soon
        </span>
      )}
    </Link>
  );
}
