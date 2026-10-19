import { Link } from "@/i18n/navigation";

export default function AuthToggle({ active }: { active: "signin" | "signup" }) {
  return (
    <div className="grid grid-cols-2 rounded-[10px] border border-line dark:border-white/10 p-1 mb-7" role="tablist">
      <Link
        href="/signin"
        role="tab"
        aria-selected={active === "signin"}
        className={`text-center py-2 rounded-[7px] text-[14px] font-display font-semibold transition ${
          active === "signin" ? "bg-navy text-white" : "text-muted dark:text-white/60 hover:text-navy dark:text-white"
        }`}
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        role="tab"
        aria-selected={active === "signup"}
        className={`text-center py-2 rounded-[7px] text-[14px] font-display font-semibold transition ${
          active === "signup" ? "bg-navy text-white" : "text-muted dark:text-white/60 hover:text-navy dark:text-white"
        }`}
      >
        Sign up
      </Link>
    </div>
  );
}
