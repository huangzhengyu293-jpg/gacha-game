"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { keyDropPoppins } from "@/app/components/KeyDropPoppins";
import { MainNavGameIcon } from "@/app/components/MainNavGameIcon";
import { useI18n } from "@/app/components/I18nProvider";
import { MAIN_NAV_GAMES, type MainNavGameKey } from "@/app/lib/mainNavGames";

function NavHomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20 20C20 20.2652 19.8946 20.5196 19.7071 20.7071C19.5196 20.8947 19.2652 21 19 21H5C4.73478 21 4.48043 20.8947 4.29289 20.7071C4.10536 20.5196 4 20.2652 4 20V11H1L11.327 1.61201C11.5111 1.44449 11.7511 1.35165 12 1.35165C12.2489 1.35165 12.4889 1.44449 12.673 1.61201L23 11H20V20Z" />
    </svg>
  );
}

const GAME_LABEL_KEY: Record<MainNavGameKey, "packs" | "battles" | "deals" | "events" | "rewards"> = {
  packs: "packs",
  battles: "battles",
  deals: "deals",
  events: "events",
  rewards: "rewards",
};

function isGameActive(pathname: string, key: MainNavGameKey, href: string): boolean {
  if (key === "battles") {
    return pathname.startsWith("/battles");
  }
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname() ?? "";
  const { t } = useI18n();
  const homeActive = pathname === "/" || pathname === "";

  return (
    <div
      className={`${keyDropPoppins.className} fixed bottom-0 left-0 right-0 z-50 bg-navy-600 pb-[env(safe-area-inset-bottom,0px)] md:hidden`}
    >
      <nav
        className="grid h-[60px] grid-cols-6 items-center gap-1 px-2 sm:px-[26px]"
        aria-label={t("mobileNavAria")}
      >
        <Link
          href="/"
          className={`relative flex min-w-0 flex-col items-center gap-2 text-[8px] font-semibold leading-tight ${
            homeActive ? "text-gold-400" : "text-navy-200"
          }`}
        >
          <NavHomeIcon className="icon h-6 w-6 shrink-0" />
          <span className="max-w-full truncate text-center">{t("navHome")}</span>
          <span
            className={`absolute right-[-2px] top-0 h-2 w-2 rounded-md bg-gold-400 ${homeActive ? "block" : "hidden"}`}
            aria-hidden
          />
        </Link>
        {MAIN_NAV_GAMES.map((item) => {
          const active = isGameActive(pathname, item.key, item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`relative flex min-w-0 flex-col items-center gap-2 text-[8px] font-semibold leading-tight ${
                active ? "text-gold-400" : "text-navy-200"
              }`}
            >
              <MainNavGameIcon
                name={item.key}
                className={`icon h-6 w-6 shrink-0 ${active ? "text-gold-400" : ""}`}
              />
              <span className="max-w-full truncate text-center">{t(GAME_LABEL_KEY[item.key])}</span>
              <span
                className={`absolute right-[-2px] top-0 h-2 w-2 rounded-md bg-gold-400 ${active ? "block" : "hidden"}`}
                aria-hidden
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
