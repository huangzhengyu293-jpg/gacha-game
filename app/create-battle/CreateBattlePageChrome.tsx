"use client";

import Link from "next/link";
import { useId } from "react";
import { useI18n } from "@/app/components/I18nProvider";
import { BATTLE_LIST_PATH } from "@/app/lib/battleRoutes";
import { CreateBattleMainShell } from "@/app/create-battle/CreateBattleMainShell";

/** Key-Drop 风「创建对战」顶栏 + 主壳（内容区后续逐段接入） */
export function CreateBattlePageChrome() {
  const { t } = useI18n();
  const uid = useId().replace(/:/g, "");
  const clipDesk = `${uid}-cb-back-d`;
  const clipMob = `${uid}-cb-back-m`;

  return (
    <main
      id="main-view"
      className="relative z-[19] min-h-screen overflow-hidden bg-[length:2570px] bg-[center_top] bg-no-repeat"
      style={{ minHeight: 0, height: "auto" }}
    >
      <div className="bg-navy-800 pb-6">
        <div data-testid="case-bttl-list-header" className="mx-auto overflow-hidden bg-navy-800">
          <div className="relative mx-auto my-3 flex min-h-[42px] w-full max-w-none items-center justify-between px-4 sm:px-6 md:my-4 md:px-8 xl:my-5 xl:mb-0 xl:mt-6">
            <div className="relative z-10 flex w-max shrink-0 justify-self-start">
              <Link
                href={BATTLE_LIST_PATH}
                data-testid="home-btn"
                className="button hidden h-[42px] items-center justify-center gap-0 rounded bg-navy-600 px-9 text-xs font-bold text-white hover:bg-navy-500 sm:inline-flex"
              >
                <svg className="icon mr-2 size-[18px] shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <g clipPath={`url(#${clipDesk})`}>
                    <path d="M8 12L14 6V18L8 12Z" fill="white" />
                  </g>
                  <defs>
                    <clipPath id={clipDesk}>
                      <rect width="24" height="24" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
                <span>{t("back")}</span>
              </Link>
              <Link
                href={BATTLE_LIST_PATH}
                className="button flex size-[42px] items-center justify-center rounded bg-navy-600 p-0 text-white hover:bg-navy-500 sm:hidden"
                aria-label={t("back")}
              >
                <svg className="icon size-[18px] shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <g clipPath={`url(#${clipMob})`}>
                    <path d="M8 12L14 6V18L8 12Z" fill="white" />
                  </g>
                  <defs>
                    <clipPath id={clipMob}>
                      <rect width="24" height="24" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </Link>
            </div>
            <div className="absolute left-[50%] flex h-full -translate-x-1/2 items-center text-base font-normal uppercase text-white md:text-lg lg:left-1/2 xl:text-base">
              <div className="flex h-[42px] items-center justify-center rounded bg-navy-600 px-5 py-2 text-xs">
                {t("createBattle")}
              </div>
            </div>
          </div>
          <div className="mb-0 my-6 hidden h-px w-full bg-transparent xl:block" />
        </div>
        <CreateBattleMainShell />
      </div>
    </main>
  );
}
