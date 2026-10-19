"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, LOCALE_META, type AppLocale } from "@/i18n/routing";

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function selectLocale(next: AppLocale) {
    setOpen(false);
    if (next === locale) return;
    // router.push from `@/i18n/navigation` re-prefixes `pathname` (already
    // locale-agnostic) with `next`, and — since a `locale` option is
    // passed — also writes next-intl's locale cookie so the choice
    // survives future visits regardless of Accept-Language.
    router.replace(pathname, { locale: next });
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="hover:text-white transition inline-flex items-center gap-1"
      >
        {LOCALE_META[locale].nativeLabel}
        <span aria-hidden="true" className={`text-[9px] transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Language"
          className="absolute top-[calc(100%+8px)] end-0 min-w-[160px] bg-white border border-line rounded-xl shadow-card-green p-1.5 z-[80] dark:bg-[#0d1117] dark:border-white/10 dark:shadow-none dark:ring-1 dark:ring-white/[0.08]"
        >
          {routing.locales.map((code) => (
            <li key={code}>
              <button
                type="button"
                role="option"
                aria-selected={code === locale}
                onClick={() => selectLocale(code)}
                className={`w-full text-start px-3 py-2 rounded-[8px] text-[13.5px] font-medium transition flex items-center justify-between gap-2 ${
                  code === locale
                    ? "text-bangladesh bg-flashwhite dark:text-meadow dark:bg-white/[0.06]"
                    : "text-ink hover:bg-flashwhite dark:text-white dark:hover:bg-white/[0.06]"
                }`}
              >
                <span>{LOCALE_META[code].nativeLabel}</span>
                <span className="text-[11px] text-muted dark:text-white/40 uppercase">{code}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
