"use client";

import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import type { ReactNode } from "react";
import { navChipColor } from "@/lib/nav-chip-color";

export default function ProviderNavLink({
  href,
  label,
  icon,
  badge,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}) {
  const pathname = usePathname();
  // "/provider" is the dashboard root — only an exact match should light
  // it up, otherwise every sub-page (e.g. /provider/patients) would also
  // show it active.
  const active = pathname === href || (href !== "/provider" && pathname?.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      prefetch={false}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-all duration-200 ${
        active
          ? "bg-gradient-to-r from-blue to-teal text-white shadow-[0_4px_14px_-4px_rgba(21,168,160,.55)]"
          : "text-white/70 hover:text-white hover:bg-white/[0.06]"
      }`}
    >
      <span className={`nav-chip ${active ? "nav-chip-active" : `nav-chip-${navChipColor(label)}`}`}>{icon}</span>
      {label}
      {!!badge && (
        <span
          className={`ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
            active ? "bg-white text-blue" : "bg-teal text-navy"
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
