"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { JLIVE_URL, isExternalHref } from "@/lib/external-links";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/theme/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";

// Full nav restructure: Research Network | Digital Platforms | Community |
// About.
const RESEARCH_NETWORK_LINK_HREFS = ["/", "/trials", "/institutions", "/investigators"] as const;
const RESEARCH_NETWORK_LINK_KEYS = ["mellowConsortium", "clinicalTrials", "institutions", "investigators"] as const;

const DIGITAL_PLATFORMS_LINK_HREFS = [JLIVE_URL, "/mellow-age"] as const;
const DIGITAL_PLATFORMS_LINK_KEYS = ["jlive", "mellowAge"] as const;

const COMMUNITY_LINK_HREFS = ["/conferences", "/news", "/contact"] as const;
const COMMUNITY_LINK_KEYS = ["conferences", "newsAndUpdates", "contact"] as const;

export default function Header() {
  const t = useTranslations("Nav");
  const tSearch = useTranslations("Search");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const researchNetworkLinks = RESEARCH_NETWORK_LINK_KEYS.map((key, i) => ({
    key,
    href: RESEARCH_NETWORK_LINK_HREFS[i],
    label: t(`researchNetworkLinks.${key}`),
  }));

  const digitalPlatformsLinks = DIGITAL_PLATFORMS_LINK_KEYS.map((key, i) => ({
    key,
    href: DIGITAL_PLATFORMS_LINK_HREFS[i],
    label: t(`digitalPlatformsLinks.${key}`),
  }));

  const communityLinks = COMMUNITY_LINK_KEYS.map((key, i) => ({
    key,
    href: COMMUNITY_LINK_HREFS[i],
    label: t(`communityLinks.${key}`),
  }));

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session?.user);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  // Focus the input the moment it appears, and let click-outside / Escape
  // close it again — same interaction pattern as the language dropdown.
  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
    if (!searchOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSearchOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [searchOpen]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    setSearchOpen(false);
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <>
      <div className="bg-richblack text-pistachio text-[12.5px] border-b border-white/[.08]">
        <div className="wrap flex justify-between items-center h-[38px]">
          <div className="flex gap-2.5 items-center tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-caribbean shadow-[0_0_0_3px_rgba(0,223,129,.25)]" />
            <span className="hidden sm:inline">{t("utilityBar")}</span>
          </div>
          <div className="flex gap-5 items-center">
            <LanguageSwitcher className="text-pistachio" />
            <div ref={searchRef} className="relative">
              {searchOpen ? (
                <form onSubmit={submitSearch} className="flex items-center gap-1.5">
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={tSearch("placeholder")}
                    aria-label={tSearch("inputLabel")}
                    className="w-[180px] sm:w-[220px] rounded-full border border-white/20 bg-white/5 px-3.5 py-1.5 text-[12.5px] text-white placeholder-pistachio/50 focus:outline-none focus:ring-2 focus:ring-caribbean"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    aria-label={t("closeSearch")}
                    className="text-pistachio hover:text-white transition"
                  >
                    ✕
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="hover:text-white transition"
                >
                  {t("search")}
                </button>
              )}
            </div>
            <ThemeToggle className="!border-white/20 !text-pistachio hover:!border-white/40 hover:!text-white" />
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-line dark:bg-darkbg/95 dark:border-white/10">
        <div className="wrap flex items-center gap-[30px] h-[74px]">
          <Link href="/" className="flex items-center flex-none">
            <Image
              src="/logo-mark.png"
              alt="Mellow Consortium"
              width={751}
              height={197}
              priority
              className="h-10 w-auto"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ms-1.5" aria-label="Primary">
            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-[9px] font-brand font-semibold text-[14.5px] text-ink hover:text-bangladesh hover:bg-flashwhite transition dark:text-white dark:hover:bg-white/[0.06]"
              >
                {t("researchNetwork")}
                <span className="w-2 h-2 border-r-2 border-b-2 border-current rotate-45 opacity-55 -mt-0.5" />
              </button>
              <div className="absolute top-[calc(100%+10px)] start-0 min-w-[220px] bg-white border border-line rounded-2xl shadow-card-green p-2 before:absolute before:inset-x-0 before:bottom-full before:h-[10px] before:content-[''] opacity-0 invisible translate-y-2 transition group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 z-[70] dark:bg-[#0d1117] dark:border-white/10 dark:shadow-none dark:ring-1 dark:ring-white/[0.08]">
                <span className="block font-brand text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted px-3 pt-1 pb-2.5 border-b border-line mb-1.5 dark:text-white/50 dark:border-white/10">
                  {t("researchNetwork")}
                </span>
                {researchNetworkLinks.map((link) => (
                  <Link
                    key={link.key}
                    href={link.href}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-[9px] text-[14px] font-medium text-ink hover:bg-flashwhite hover:text-bangladesh transition dark:text-white dark:hover:bg-white/[0.06]"
                  >
                    <span className="w-2 h-2 rounded-sm bg-meadow rotate-45 flex-none" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-[9px] font-brand font-semibold text-[14.5px] text-ink hover:text-bangladesh hover:bg-flashwhite transition dark:text-white dark:hover:bg-white/[0.06]"
              >
                {t("digitalPlatforms")}
                <span className="w-2 h-2 border-r-2 border-b-2 border-current rotate-45 opacity-55 -mt-0.5" />
              </button>
              <div className="absolute top-[calc(100%+10px)] start-0 min-w-[200px] bg-white border border-line rounded-2xl shadow-card-green p-2 before:absolute before:inset-x-0 before:bottom-full before:h-[10px] before:content-[''] opacity-0 invisible translate-y-2 transition group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 z-[70] dark:bg-[#0d1117] dark:border-white/10 dark:shadow-none dark:ring-1 dark:ring-white/[0.08]">
                <span className="block font-brand text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted px-3 pt-1 pb-2.5 border-b border-line mb-1.5 dark:text-white/50 dark:border-white/10">
                  {t("digitalPlatforms")}
                </span>
                {digitalPlatformsLinks.map((link) => (
                  <NavItemLink
                    key={link.key}
                    href={link.href}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-[9px] text-[14px] font-medium text-ink hover:bg-flashwhite hover:text-bangladesh transition dark:text-white dark:hover:bg-white/[0.06]"
                  >
                    <span className="w-2 h-2 rounded-sm bg-meadow rotate-45 flex-none" />
                    {link.label}
                  </NavItemLink>
                ))}
              </div>
            </div>
            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-[9px] font-brand font-semibold text-[14.5px] text-ink hover:text-bangladesh hover:bg-flashwhite transition dark:text-white dark:hover:bg-white/[0.06]"
              >
                {t("community")}
                <span className="w-2 h-2 border-r-2 border-b-2 border-current rotate-45 opacity-55 -mt-0.5" />
              </button>
              <div className="absolute top-[calc(100%+10px)] start-0 min-w-[220px] bg-white border border-line rounded-2xl shadow-card-green p-2 before:absolute before:inset-x-0 before:bottom-full before:h-[10px] before:content-[''] opacity-0 invisible translate-y-2 transition group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 z-[70] dark:bg-[#0d1117] dark:border-white/10 dark:shadow-none dark:ring-1 dark:ring-white/[0.08]">
                <span className="block font-brand text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted px-3 pt-1 pb-2.5 border-b border-line mb-1.5 dark:text-white/50 dark:border-white/10">
                  {t("community")}
                </span>
                {communityLinks.map((link) => (
                  <Link
                    key={link.key}
                    href={link.href}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-[9px] text-[14px] font-medium text-ink hover:bg-flashwhite hover:text-bangladesh transition dark:text-white dark:hover:bg-white/[0.06]"
                  >
                    <span className="w-2 h-2 rounded-sm bg-meadow rotate-45 flex-none" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <Link
              href="/about"
              className="px-3.5 py-2.5 rounded-[9px] font-brand font-semibold text-[14.5px] text-ink hover:text-bangladesh hover:bg-flashwhite transition dark:text-white dark:hover:bg-white/[0.06]"
            >
              {t("about")}
            </Link>
          </nav>

          <div className="hidden lg:flex items-center gap-3 ms-auto">
            {signedIn ? (
              <Link href="/dashboard" className="mkt-btn-secondary-light !px-4 !py-2.5 !text-[14px]">
                {t("dashboard")}
              </Link>
            ) : (
              <>
                <Link href="/access" className="mkt-btn-secondary-light !px-4 !py-2.5 !text-[14px]">
                  {t("signIn")}
                </Link>
                <Link href="/signup" className="mkt-btn-primary !px-4 !py-2.5 !text-[14px]">
                  {t("signUp")}
                </Link>
              </>
            )}
            <div className="relative group">
              <button
                type="button"
                className="mkt-btn-secondary-light !px-4 !py-2.5 !text-[14px] flex items-center gap-1.5"
              >
                {t("partner")}
                <span className="w-2 h-2 border-r-2 border-b-2 border-current rotate-45 opacity-55 -mt-0.5" />
              </button>
              <div className="absolute top-[calc(100%+10px)] end-0 min-w-[240px] bg-white border border-line rounded-2xl shadow-card-green p-2 before:absolute before:inset-x-0 before:bottom-full before:h-[10px] before:content-[''] opacity-0 invisible translate-y-2 transition group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 z-[70] dark:bg-[#0d1117] dark:border-white/10 dark:shadow-none dark:ring-1 dark:ring-white/[0.08]">
                <a
                  href="#sponsors"
                  className="block px-3 py-2.5 rounded-[9px] text-[14px] font-medium text-ink hover:bg-flashwhite hover:text-bangladesh transition dark:text-white dark:hover:bg-white/[0.06]"
                >
                  {t("becomePartner")}
                </a>
                <Link
                  href="/apply/healthcare_provider"
                  className="block px-3 py-2.5 rounded-[9px] text-[14px] font-medium text-ink hover:bg-flashwhite hover:text-bangladesh transition dark:text-white dark:hover:bg-white/[0.06]"
                >
                  {t("becomePhysicianPartner")}
                </Link>
                {/* Placeholder until self-service member signup is built. */}
                <Link
                  href="/coming-soon?from=membership"
                  className="block px-3 py-2.5 rounded-[9px] text-[14px] font-medium text-ink hover:bg-flashwhite hover:text-bangladesh transition dark:text-white dark:hover:bg-white/[0.06]"
                >
                  {t("becomeMember")}
                </Link>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="lg:hidden ms-auto inline-flex items-center justify-center w-[38px] h-[38px] rounded-[9px] border border-line text-ink dark:border-white/15 dark:text-white"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden="true">{open ? "✕" : "☰"}</span>
          </button>
        </div>

        {open && (
          <nav id="mobile-nav" aria-label="Mobile" className="lg:hidden border-t border-line bg-white max-h-[calc(100vh-74px)] overflow-y-auto dark:border-white/10 dark:bg-darkbg">
            <div className="wrap flex flex-col py-4 gap-1">
              <div className="py-2">
                <p className="font-brand text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-1.5 dark:text-white/50">
                  {t("researchNetwork")}
                </p>
                {researchNetworkLinks.map((link) => (
                  <Link
                    key={link.key}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block py-2 text-[15px] font-semibold text-ink dark:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="py-2 border-t border-line dark:border-white/10">
                <p className="font-brand text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-1.5 pt-2 dark:text-white/50">
                  {t("digitalPlatforms")}
                </p>
                {digitalPlatformsLinks.map((link) => (
                  <NavItemLink
                    key={link.key}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block py-2 text-[15px] font-semibold text-ink dark:text-white"
                  >
                    {link.label}
                  </NavItemLink>
                ))}
              </div>
              <div className="py-2 border-t border-line dark:border-white/10">
                <p className="font-brand text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-1.5 pt-2 dark:text-white/50">
                  {t("community")}
                </p>
                {communityLinks.map((link) => (
                  <Link
                    key={link.key}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block py-2 text-[15px] font-semibold text-ink dark:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <Link href="/about" onClick={() => setOpen(false)} className="py-2.5 text-[15px] font-semibold text-ink dark:text-white">
                {t("about")}
              </Link>
              <div className="py-2 mt-2 border-t border-line dark:border-white/10">
                <p className="font-brand text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-1.5 pt-2 dark:text-white/50">
                  {t("partner")}
                </p>
                <a
                  href="#sponsors"
                  onClick={() => setOpen(false)}
                  className="block py-2 text-[15px] font-semibold text-ink dark:text-white"
                >
                  {t("becomePartner")}
                </a>
                <Link
                  href="/apply/healthcare_provider"
                  onClick={() => setOpen(false)}
                  className="block py-2 text-[15px] font-semibold text-ink dark:text-white"
                >
                  {t("becomePhysicianPartner")}
                </Link>
                <Link
                  href="/coming-soon?from=membership"
                  onClick={() => setOpen(false)}
                  className="block py-2 text-[15px] font-semibold text-ink dark:text-white"
                >
                  {t("becomeMember")}
                </Link>
              </div>

              {signedIn ? (
                <Link href="/dashboard" onClick={() => setOpen(false)} className="mkt-btn-secondary-light mt-3">
                  {t("dashboard")}
                </Link>
              ) : (
                <div className="flex gap-3 mt-3">
                  <Link href="/access" onClick={() => setOpen(false)} className="mkt-btn-secondary-light flex-1">
                    {t("signIn")}
                  </Link>
                  <Link href="/signup" onClick={() => setOpen(false)} className="mkt-btn-primary flex-1">
                    {t("signUp")}
                  </Link>
                </div>
              )}
            </div>
          </nav>
        )}
      </header>
    </>
  );
}

// External destinations (e.g. JLIVE) open in a new tab via a plain anchor;
// next-intl's Link would locale-prefix them into a broken internal path.
function NavItemLink({
  href,
  className,
  onClick,
  children,
}: {
  href: string;
  className: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  if (isExternalHref(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} onClick={onClick} className={className}>
      {children}
    </Link>
  );
}
