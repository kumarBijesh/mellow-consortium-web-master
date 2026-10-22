"use client";

import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import type { ReactNode } from "react";
import { navChipColor } from "@/lib/nav-chip-color";

export default function AdminNavLink({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      prefetch={false}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-all duration-200 ${
        active
          ? "bg-gradient-to-r from-blue to-teal text-white shadow-[0_4px_14px_-4px_rgba(21,168,160,.55)]"
          : "text-white/70 hover:text-white hover:bg-white/10"
      }`}
    >
      <span className={`nav-chip ${active ? "nav-chip-active" : `nav-chip-${navChipColor(label)}`}`}>{icon}</span>
      {label}
    </Link>
  );
}
