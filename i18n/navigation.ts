import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware drop-ins for next/link + next/navigation. Swapping the
// imports (only) in existing components makes every existing href="/foo"
// / router.push("/foo") automatically carry the current locale prefix —
// this is the mechanism that lets the rest of the app's Link/router usage
// stay untouched instead of hand-prefixing every route.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
