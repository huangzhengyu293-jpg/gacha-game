"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { gsap } from "gsap";
import { buildBattleListCards } from "@/app/battles/battleListSource";
import { CaseBattleListMobileCard } from "@/app/components/CaseBattleListMobileCard";
import { CaseBattleListTableRow } from "@/app/components/CaseBattleListTableRow";
import type { RawBattleListItem } from "@/app/components/bettlesListData";
import { useI18n } from "@/app/components/I18nProvider";
import { api } from "@/app/lib/api";

/* —— 全宽内容区：仅横向 padding + 安全区，无 container / 无固定 1280 —— */

const contentPadStyle = {
  paddingLeft: "max(env(safe-area-inset-left, 0px), 16px)",
  paddingRight: "max(env(safe-area-inset-right, 0px), 16px)",
} as const;

/** 对战列表表格区：左右 17.5px（与安全区取 max），与参考站一致 */
const caseBattleListTablePadXStyle = {
  paddingLeft: "max(env(safe-area-inset-left, 0px), 17.5px)",
  paddingRight: "max(env(safe-area-inset-right, 0px), 17.5px)",
} as const;

/** 列表页实时暂停条宽度（与 tailwind w-[10rem] / 收起可视条一致），供 GSAP 使用 */
const CASE_BATTLE_PAUSE_PANEL_EXPANDED_PX = 160;
const CASE_BATTLE_PAUSE_PANEL_COLLAPSED_PX = 76;

function ContentPad({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`w-full max-w-none px-4 sm:px-6 md:px-8 ${className}`}
      style={contentPadStyle}
    >
      {children}
    </div>
  );
}

/** 仅用于顶栏/筛选两处复用；`wrapClassName` 只补布局用 class（如宽屏隐藏） */
function ListChromeCreateBattleCta({
  wrapClassName = "",
  variant = "inline",
}: {
  wrapClassName?: string;
  /** 顶栏 xl 行内：不要用 w-full，否则在 flex justify-between 里会按父级 100% 拉满 */
  variant?: "header" | "inline";
}) {
  const { t } = useI18n();
  const widthCls =
    variant === "header"
      ? "flex w-[261px] max-w-full shrink-0 xl:ml-auto xl:mr-0"
      : "mx-auto flex w-full xl:ml-auto xl:mr-0 xl:w-[261px]";
  return (
    <div
      data-testid="bttls-create-bttl-btn"
      className={`${widthCls}${wrapClassName ? ` ${wrapClassName}` : ""}`}
    >
      <Link
        className="button mx-auto mt-4 flex h-[42px] w-full items-center justify-center rounded bg-gold-400 px-9 text-xs font-bold uppercase text-gold-800 transition-colors hover:bg-gold-300 hover:shadow-lg md:mt-0"
        href="/create-battle"
      >
        <svg
          className="icon mr-2 h-[18px] w-[18px] flex-shrink-0 text-gold-800"
          viewBox="0 0 18 18"
          fill="currentColor"
          aria-hidden
        >
          <path d="M3 2.25H15C15.1989 2.25 15.3897 2.32902 15.5303 2.46967C15.671 2.61032 15.75 2.80109 15.75 3V15C15.75 15.1989 15.671 15.3897 15.5303 15.5303C15.3897 15.671 15.1989 15.75 15 15.75H3C2.80109 15.75 2.61032 15.671 2.46967 15.5303C2.32902 15.3897 2.25 15.1989 2.25 15V3C2.25 2.80109 2.32902 2.61032 2.46967 2.46967C2.61032 2.32902 2.80109 2.25 3 2.25V2.25ZM8.25 8.25H5.25V9.75H8.25V12.75H9.75V9.75H12.75V8.25H9.75V5.25H8.25V8.25Z" />
        </svg>
        <span>{t("createBattle")}</span>
      </Link>
    </div>
  );
}

/* ---------- 列表页实时刷新（供后续列表区 useQuery） ---------- */

type BattleListLiveContextValue = {
  livePaused: boolean;
  setLivePaused: (v: boolean) => void;
};

const BattleListLiveContext = createContext<BattleListLiveContextValue | null>(null);

function BattleListLiveProvider({ children }: { children: ReactNode }) {
  const [livePaused, setLivePaused] = useState(false);
  const value = useMemo(() => ({ livePaused, setLivePaused }), [livePaused]);
  return <BattleListLiveContext.Provider value={value}>{children}</BattleListLiveContext.Provider>;
}

function useBattleListLive() {
  const ctx = useContext(BattleListLiveContext);
  if (!ctx) throw new Error("useBattleListLive must be used within BattleListLiveProvider");
  return ctx;
}

/* ---------- 图标 ---------- */

function TabIconActive({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 49" fill="currentColor" aria-hidden>
      <path d="m47.002 6.5-7.266.006L15.524 30.73l-2.9-2.898-2.897 2.898 5.07 5.073-5.795 5.799 2.897 2.898 5.797-5.799 5.07 5.073 2.898-2.898-2.897-2.9 24.229-24.238.006-7.238Z" />
      <path d="M6.77 32.642C2.864 28.78 1.884 22.604 4.611 17.75c1.758-3.23 5.086-5.538 8.665-6.113 3.99-.677 8.194.7 10.98 3.522l7.929-7.93C26.45 1.464 17.417.222 10.33 4.423.146 10.486-1.44 24.492 6.729 32.683l.041-.04Z" />
    </svg>
  );
}

function TabIconFinished({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 14" fill="currentColor" aria-hidden>
      <path d="M0 .5h6.255a.667.667 0 0 1 .596.369l.482.964h4A.667.667 0 0 1 12 2.5v7.333a.666.666 0 0 1-.667.667H7.08a.667.667 0 0 1-.596-.369L6 9.167H1.333v4H0V.5Z" />
    </svg>
  );
}

function TabIconMy({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 39 38" fill="currentColor" aria-hidden>
      <path d="m9.391 21.312 7.068 7.072-2.826 2.828 2.83 2.83-2.828 2.828-4.95-4.95-5.658 5.658L.2 34.75l5.658-5.66-4.95-4.948 2.828-2.828 2.828 2.826 2.826-2.828h.002ZM1.291.5l7.092.006 23.634 23.636 2.83-2.828 2.828 2.828-4.948 4.95 5.656 5.658-2.828 2.828-5.658-5.658-4.95 4.95-2.828-2.828 2.828-2.83-23.65-23.65L1.291.5Zm28.914 0 7.086.006.004 7.046-8.106 8.104-7.072-7.07L30.205.5Z" />
    </svg>
  );
}

const CASE_BATTLE_TAB_UNDERLINE_SEGMENT_COUNT = 50;
const CASE_BATTLE_TAB_UNDERLINE_STAGGER_MS = 10;

/** 选中 tab 底部金色条（分段生长 + 底层渐变微光）；动画见 tailwind.config.js */
function CaseBattleTabActiveIndicator() {
  return (
    <div
      className="pointer-events-none absolute -bottom-4 left-0 right-0 flex flex-nowrap gap-1 overflow-hidden lg:bottom-0"
      aria-hidden
    >
      <div className="absolute inset-0 h-1 animate-tab-glow bg-gradient-to-r from-transparent via-gold-400 to-transparent opacity-50" />
      {Array.from({ length: CASE_BATTLE_TAB_UNDERLINE_SEGMENT_COUNT }, (_, i) => (
        <div
          key={i}
          className="h-1 w-px flex-shrink-0 origin-bottom animate-tab-bar-in bg-gold-400 will-change-transform"
          style={{ animationDelay: `${i * CASE_BATTLE_TAB_UNDERLINE_STAGGER_MS}ms` }}
        />
      ))}
    </div>
  );
}

function StatIconActive({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 49" fill="currentColor" aria-hidden>
      <path d="m47.002 6.5-7.266.006L15.524 30.73l-2.9-2.898-2.897 2.898 5.07 5.073-5.795 5.799 2.897 2.898 5.797-5.799 5.07 5.073 2.898-2.898-2.897-2.9 24.229-24.238.006-7.238Z" />
      <path d="M6.77 32.642C2.864 28.78 1.884 22.604 4.611 17.75c1.758-3.23 5.086-5.538 8.665-6.113 3.99-.677 8.194.7 10.98 3.522l7.929-7.93C26.45 1.464 17.417.222 10.33 4.423.146 10.486-1.44 24.492 6.729 32.683l.041-.04Z" />
    </svg>
  );
}

function StatIconOnline({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 49 39" aria-hidden>
      <path fill="currentColor" d="M24.147 21.41c5.815 0 10.528-4.714 10.528-10.528S29.962.354 24.147.354c-5.814 0-10.528 4.714-10.528 10.528S18.333 21.41 24.147 21.41Z" />
      <path fill="currentColor" d="M31.56 22.291a13.524 13.524 0 0 1-7.415 2.21c-2.734 0-5.278-.817-7.413-2.21-4.293 1.759-7.318 5.974-7.318 10.9v1.684a2.61 2.61 0 0 0 2.113 2.573 67.125 67.125 0 0 0 25.237 0 2.609 2.609 0 0 0 2.113-2.573V33.19c0-4.924-3.025-9.14-7.318-10.9Z" />
      <path fill="currentColor" d="M36.536 4.347c-.145 0-.277.034-.42.043a13.542 13.542 0 0 1 1.651 6.494c0 3.755-1.527 7.158-3.992 9.624.868.306 1.789.505 2.76.505a8.333 8.333 0 0 0 0-16.667Z" />
      <path fill="currentColor" d="M10.527 10.882c0-2.35.598-4.562 1.65-6.494-.14-.005-.274-.041-.418-.041a8.333 8.333 0 0 0 0 16.665c.972 0 1.893-.2 2.76-.506a13.574 13.574 0 0 1-3.992-9.624Z" />
      <path fill="currentColor" d="M43.081 22.026a11.418 11.418 0 0 1-4.425 1.857c2.084 2.584 3.312 5.826 3.312 9.31v1.182c1.65-.17 3.174-.404 4.552-.667a2.071 2.071 0 0 0 1.673-2.039v-1.333c0-3.63-2.082-6.77-5.112-8.31Z" />
      <path fill="currentColor" d="M6.323 33.191c0-3.484 1.228-6.725 3.312-9.31a11.392 11.392 0 0 1-4.425-1.857C2.18 23.565.098 26.705.098 30.336v1.333c0 .993.697 1.85 1.673 2.037 1.377.265 2.901.498 4.552.667V33.19Z" />
    </svg>
  );
}

function StatIconTotal({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 39 38" fill="currentColor" aria-hidden>
      <path d="m9.391 21.312 7.068 7.072-2.826 2.828 2.83 2.83-2.828 2.828-4.95-4.95-5.658 5.658L.2 34.75l5.658-5.66-4.95-4.948 2.828-2.828 2.828 2.826 2.826-2.828h.002ZM1.291.5l7.092.006 23.634 23.636 2.83-2.828 2.828 2.828-4.948 4.95 5.656 5.658-2.828 2.828-5.658-5.658-4.95 4.95-2.828-2.828 2.828-2.83-23.65-23.65L1.291.5Zm28.914 0 7.086.006.004 7.046-8.106 8.104-7.072-7.07L30.205.5Z" />
    </svg>
  );
}

/* ---------- 顶栏 ---------- */

function ListChromeHeader() {
  const { t } = useI18n();
  /** 列表固定 `/battles`；Tab 仅占位 UI，筛选/已结束/我的对接后再接逻辑，路由始终不变 */

  const tabs = [
    {
      id: "active" as const,
      testId: "bttls-statistics-filter-active-bttls",
      label: t("caseBattleTabActive"),
      Icon: TabIconActive,
      iconClass: "icon scale-95 transform opacity-100 h-4 w-4 lg:h-[18px] lg:w-[18px]",
    },
    {
      id: "finished" as const,
      testId: "bttls-statistics-filter-finished-bttls",
      label: t("caseBattleTabFinished"),
      Icon: TabIconFinished,
      iconClass: "icon h-4 w-6 transform opacity-100",
    },
    {
      id: "my" as const,
      testId: "bttls-statistics-filter-my-bttls",
      label: t("caseBattleTabMy"),
      Icon: TabIconMy,
      iconClass: "icon h-4 w-4 transform opacity-100 lg:h-5 lg:w-5",
    },
  ] as const;

  const tabItems = tabs.map(({ id, testId, label, Icon, iconClass }) => {
    const active = id === "active";
    return (
      <span
        key={id}
        data-testid={testId}
        aria-current={active ? "true" : undefined}
        className={`case-battle-tab relative flex flex-shrink-0 px-2 py-3 transition-colors duration-200 sm:px-5 lg:h-[90px] lg:px-2 lg:py-0 ${
          active ? "text-gold" : "text-navy-200"
        }`}
      >
        <span className="relative flex flex-shrink-0 items-center gap-1.5 text-sm font-semibold lg:text-sm">
          <Icon className={`flex-shrink-0 ${iconClass}`} />
          {label}
        </span>
        {active ? <CaseBattleTabActiveIndicator /> : null}
      </span>
    );
  });

  return (
    <div data-testid="case-bttl-list-header">
      <div className="mx-auto hidden overflow-hidden bg-navy-800 xl:block">
        <div
          className="container relative mx-auto flex w-full max-w-none items-center justify-between px-4 sm:px-6 md:px-8"
          style={contentPadStyle}
        >
          <div className="bg-navy-700 pt-2 lg:bg-transparent lg:pt-0">
            <div className="flex items-center justify-around gap-4 overflow-x-auto py-4 lg:justify-end lg:py-0">
              {tabItems}
            </div>
          </div>
          <ListChromeCreateBattleCta variant="header" />
        </div>
      </div>

      <div className="w-full overflow-x-hidden bg-navy-800 xl:hidden">
        <ContentPad>
          <div className="bg-navy-700 pt-2 max-lg:-mx-4 max-lg:px-4 max-lg:sm:-mx-6 max-lg:sm:px-6 max-lg:md:-mx-8 max-lg:md:px-8 lg:mx-0 lg:bg-transparent lg:px-0 lg:pt-0">
            <div className="flex items-center justify-around gap-4 overflow-x-auto py-4 hide-scrollbar lg:justify-end lg:py-0">
              {tabItems}
            </div>
          </div>
        </ContentPad>
      </div>
    </div>
  );
}

/* ---------- 筛选 + 门票 ---------- */

function ListChromeFilters() {
  const { t } = useI18n();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [playersOpen, setPlayersOpen] = useState(false);
  const [category, setCategory] = useState("all");
  const [players, setPlayers] = useState("any");

  const catBtnRef = useRef<HTMLButtonElement | null>(null);
  const catMenuRef = useRef<HTMLDivElement | null>(null);
  const playBtnRef = useRef<HTMLButtonElement | null>(null);
  const playMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const n = e.target as Node;
      if (categoryOpen && !catMenuRef.current?.contains(n) && !catBtnRef.current?.contains(n)) {
        setCategoryOpen(false);
      }
      if (playersOpen && !playMenuRef.current?.contains(n) && !playBtnRef.current?.contains(n)) {
        setPlayersOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [categoryOpen, playersOpen]);

  const categoryLabel = category === "all" ? t("caseBattleFilterAll") : t("caseBattleFilterAll");
  const playersButtonLabel = useMemo(() => {
    if (players === "any") return t("caseBattleFilterPlayerCount");
    return `${t("caseBattleFilterPlayerCount")}: ${players}`;
  }, [players, t]);

  return (
    <div className="w-full border-t border-navy-500 bg-navy-700 py-5 opacity-100 transition duration-500 md:bg-navy-700">
      <ContentPad className="flex w-full flex-col-reverse flex-wrap items-center gap-4 overflow-hidden md:flex-row md:gap-6">
        <div className="hidden w-full flex-row items-center gap-5 md:flex md:w-auto">
          <div className="relative w-[160px]">
            <button
              ref={catBtnRef}
              type="button"
              className="dropdown flex h-[42px] w-full items-center gap-2 rounded border-none bg-navy-600 px-[14px] text-navy-200 transition-colors hover:bg-navy-500"
              aria-expanded={categoryOpen}
              aria-haspopup="menu"
              onClick={() => {
                setCategoryOpen((o) => !o);
                setPlayersOpen(false);
              }}
            >
              <div className="overflow-hidden whitespace-nowrap px-3 text-base lg:text-10px !px-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium uppercase text-navy-200">{categoryLabel}</span>
                </div>
              </div>
              <div className="dropdown-arrow ml-auto">
                <svg
                  className={`icon block h-2.5 w-2.5 flex-shrink-0 transition-transform duration-200 ${categoryOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 10 6"
                  fill="none"
                  aria-hidden
                >
                  <path d="M1 1L5 5L9 1" stroke="currentColor" />
                </svg>
              </div>
            </button>
            {categoryOpen ? (
              <div
                ref={catMenuRef}
                className="absolute left-0 right-0 z-30 mt-1 rounded border border-navy-500 bg-navy-600 py-1 shadow-lg"
                role="menu"
              >
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-xs uppercase text-navy-200 hover:bg-navy-500"
                  onClick={() => {
                    setCategory("all");
                    setCategoryOpen(false);
                  }}
                >
                  {t("caseBattleFilterAll")}
                </button>
              </div>
            ) : null}
          </div>

          <div className="relative w-[220px]">
            <button
              ref={playBtnRef}
              type="button"
              className="dropdown flex h-[42px] w-full items-center gap-3 rounded border-none bg-navy-600 px-[14px] text-navy-200 transition-colors hover:bg-navy-500"
              aria-expanded={playersOpen}
              aria-haspopup="menu"
              onClick={() => {
                setPlayersOpen((o) => !o);
                setCategoryOpen(false);
              }}
            >
              <div className="overflow-hidden whitespace-nowrap px-3 text-base lg:text-10px !px-0">
                <div className="flex items-center gap-3">
                  <svg
                    stroke="currentColor"
                    fill="currentColor"
                    strokeWidth="0"
                    viewBox="0 0 24 24"
                    className="h-[14px] w-[14px] flex-shrink-0 text-navy-200"
                    aria-hidden
                  >
                    <path d="M4 22C4 17.5817 7.58172 14 12 14C16.4183 14 20 17.5817 20 22H4ZM12 13C8.685 13 6 10.315 6 7C6 3.685 8.685 1 12 1C15.315 1 18 3.685 18 7C18 10.315 15.315 13 12 13Z" />
                  </svg>
                  <span className="text-xs font-medium uppercase text-navy-200">{playersButtonLabel}</span>
                </div>
              </div>
              <div className="dropdown-arrow ml-auto">
                <svg
                  className={`icon block h-2.5 w-2.5 flex-shrink-0 transition-transform duration-200 ${playersOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 10 6"
                  fill="none"
                  aria-hidden
                >
                  <path d="M1 1L5 5L9 1" stroke="currentColor" />
                </svg>
              </div>
            </button>
            {playersOpen ? (
              <div
                ref={playMenuRef}
                className="absolute left-0 right-0 z-30 mt-1 rounded border border-navy-500 bg-navy-600 py-1 shadow-lg"
                role="menu"
              >
                {(["any", "2", "3", "4"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="block w-full px-3 py-2 text-left text-xs uppercase text-navy-200 hover:bg-navy-500"
                    onClick={() => {
                      setPlayers(p);
                      setPlayersOpen(false);
                    }}
                  >
                    {p === "any" ? t("caseBattleFilterAll") : p}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex h-[42px] items-center rounded bg-navy-600 px-[15px]">
            <label className="pointer-events-none mb-0 flex cursor-not-allowed select-none items-center whitespace-nowrap text-center text-xs font-semibold uppercase text-navy-400 opacity-40">
              <input className="peer hidden" type="checkbox" disabled />
              <div className="mr-3 flex h-4 min-h-4 w-4 min-w-4 items-center justify-center overflow-hidden rounded-[0.25rem] border border-solid border-navy-200 bg-white">
                <svg
                  className="icon h-2.5 w-2.5 fill-current text-navy-800 opacity-35"
                  viewBox="0 0 13.032 10.185"
                  fill="none"
                  aria-hidden
                >
                  <path d="M1.06 4.157l3.908 3.908 7-7" fill="none" stroke="currentColor" strokeWidth="3" />
                </svg>
              </div>
              <span className="mb-0 text-xs font-semibold uppercase tracking-tight text-navy-200">
                {t("caseBattleFilterJoinBalance")}
              </span>
            </label>
          </div>

          <button
            type="button"
            className="flex h-[42px] w-[42px] items-center justify-center rounded bg-navy-600 transition-colors hover:bg-navy-500"
            aria-label={t("caseBattleResetFiltersAria")}
            onClick={() => {
              setCategory("all");
              setPlayers("any");
            }}
          >
            <svg
              stroke="currentColor"
              fill="currentColor"
              strokeWidth="0"
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px] text-white"
              aria-hidden
            >
              <path d="M13.9999 18.9966H20.9999V20.9966H11.9999L8.00229 20.9991L1.51457 14.5113C1.12405 14.1208 1.12405 13.4877 1.51457 13.0971L12.1212 2.49053C12.5117 2.1 13.1449 2.1 13.5354 2.49053L21.3136 10.2687C21.7041 10.6592 21.7041 11.2924 21.3136 11.6829L13.9999 18.9966ZM15.6567 14.5113L19.1922 10.9758L12.8283 4.61185L9.29275 8.14738L15.6567 14.5113Z" />
            </svg>
          </button>
        </div>

        <div className="flex w-full gap-3 lg:ml-auto lg:w-auto lg:gap-6">
          <div className="relative flex h-[42px] min-w-0 flex-1 items-center gap-3 rounded bg-[#663C16] px-[6px] py-[6px] lg:h-[50px] lg:w-[261px] lg:flex-none lg:px-3 lg:py-0">
            <svg
              className="icon h-[30px] w-[30px] flex-shrink-0 text-orange-400"
              viewBox="0 0 17 12"
              fill="currentColor"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12.625 1.0498C12.9702 1.0498 13.25 0.769983 13.25 0.424805C13.25 0.260772 13.1868 0.111499 13.0834 0H16C16.5523 0 17 0.447715 17 1V4C15.8954 4 15 4.89543 15 6C15 7.10457 15.8954 8 17 8V11C17 11.5523 16.5523 12 16 12H13.1588C13.2167 11.9053 13.25 11.7939 13.25 11.6748C13.25 11.3296 12.9702 11.0498 12.625 11.0498C12.2798 11.0498 12 11.3296 12 11.6748C12 11.7939 12.0333 11.9053 12.0912 12H1C0.447715 12 0 11.5523 0 11V8C1.10457 8 2 7.10457 2 6C2 4.89543 1.10457 4 0 4V1C0 0.447715 0.447715 0 1 0H12.1666C12.0632 0.111499 12 0.260772 12 0.424805C12 0.769983 12.2798 1.0498 12.625 1.0498ZM13.25 2.6748C13.25 3.01998 12.9702 3.2998 12.625 3.2998C12.2798 3.2998 12 3.01998 12 2.6748C12 2.32963 12.2798 2.0498 12.625 2.0498C12.9702 2.0498 13.25 2.32963 13.25 2.6748ZM12.625 5.5498C12.9702 5.5498 13.25 5.26998 13.25 4.9248C13.25 4.57963 12.9702 4.2998 12.625 4.2998C12.2798 4.2998 12 4.57963 12 4.9248C12 5.26998 12.2798 5.5498 12.625 5.5498ZM13.25 7.1748C13.25 7.51998 12.9702 7.7998 12.625 7.7998C12.2798 7.7998 12 7.51998 12 7.1748C12 6.82963 12.2798 6.5498 12.625 6.5498C12.9702 6.5498 13.25 6.82963 13.25 7.1748ZM12.625 10.0498C12.9702 10.0498 13.25 9.76998 13.25 9.4248C13.25 9.07963 12.9702 8.7998 12.625 8.7998C12.2798 8.7998 12 9.07963 12 9.4248C12 9.76998 12.2798 10.0498 12.625 10.0498Z"
                fill="currentColor"
              />
            </svg>
            <div className="flex flex-col items-start">
              <p className="text-sm font-semibold uppercase leading-none text-orange-400">0</p>
              <p className="text-10px font-semibold uppercase leading-none text-white">{t("caseBattleTicketBalance")}</p>
            </div>
            <div className="group h-min w-min normal-case absolute right-[11px] top-[11px] flex items-center lg:relative lg:right-auto lg:top-auto lg:ml-auto">
              <button type="button" className="-m-2 h-min w-min cursor-pointer p-2" aria-label={t("caseBattleTicketInfoAria")}>
                <svg
                  className="icon text-opacity-50 duration-200 group-hover:text-opacity-100 h-5 w-5 text-orange-400 lg:h-6 lg:w-6"
                  viewBox="0 0 15 14"
                  aria-hidden
                >
                  <g clipPath="url(#caseBattleTicketInfoIcon)">
                    <path
                      fill="currentColor"
                      d="M7.5 12.833a5.833 5.833 0 1 1 0-11.666 5.833 5.833 0 0 1 0 11.666Zm-.583-6.416v3.5h1.166v-3.5H6.917Zm0-2.334V5.25h1.166V4.083H6.917Z"
                    />
                  </g>
                  <defs>
                    <clipPath id="caseBattleTicketInfoIcon">
                      <path fill="#fff" d="M.5 0h14v14H.5z" />
                    </clipPath>
                  </defs>
                </svg>
              </button>
            </div>
          </div>

          <button
            type="button"
            className="flex h-[42px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded bg-navy-500 text-xs font-bold uppercase text-white transition-colors hover:bg-navy-400 md:hidden"
            aria-label={t("caseBattleSortBy")}
          >
            <svg className="icon h-[18px] w-[18px] shrink-0" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path
                fill="currentColor"
                d="M9 5H5.50088L5.5 15.5H3.75V5H0.25L4.625 0.625L9 5ZM17.75 12L13.375 16.375L9 12H12.5V1.5H14.25V12H17.75Z"
              />
            </svg>
            <span className="truncate">{t("caseBattleSortBy")}</span>
          </button>
        </div>

        <ListChromeCreateBattleCta wrapClassName="xl:hidden" />
      </ContentPad>
    </div>
  );
}

/* ---------- 暂停 ---------- */

function ListChromePauseButton() {
  const { t } = useI18n();
  const { livePaused, setLivePaused } = useBattleListLive();
  const [panelExpanded, setPanelExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const textBlockRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<SVGSVGElement>(null);
  const didSyncPauseLayoutRef = useRef(false);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const textBlock = textBlockRef.current;
    const chevron = chevronRef.current;
    if (!panel || !textBlock || !chevron) return;

    if (!didSyncPauseLayoutRef.current) {
      didSyncPauseLayoutRef.current = true;
      gsap.set(panel, { width: CASE_BATTLE_PAUSE_PANEL_COLLAPSED_PX, x: 0 });
      gsap.set(textBlock, { autoAlpha: 0 });
      gsap.set(chevron, { rotation: 90, transformOrigin: "50% 50%" });
      return;
    }

    gsap.killTweensOf([panel, textBlock, chevron]);

    if (panelExpanded) {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo(
          panel,
          { width: CASE_BATTLE_PAUSE_PANEL_COLLAPSED_PX, x: 14 },
          { width: CASE_BATTLE_PAUSE_PANEL_EXPANDED_PX, x: 0, duration: 0.55 },
          0,
        )
        .to(textBlock, { autoAlpha: 1, duration: 0.4 }, 0.12)
        .to(chevron, { rotation: -90, duration: 0.48 }, 0);
    } else {
      gsap
        .timeline({ defaults: { ease: "power3.inOut" } })
        .to(textBlock, { autoAlpha: 0, duration: 0.22 }, 0)
        .to(panel, { width: CASE_BATTLE_PAUSE_PANEL_COLLAPSED_PX, x: 0, duration: 0.46 }, 0.08)
        .to(chevron, { rotation: 90, duration: 0.42 }, 0.04);
    }
  }, [panelExpanded]);

  return (
    <div className="fixed bottom-5 right-0 z-20 max-md:bottom-[calc(1.25rem+60px+env(safe-area-inset-bottom,0px))]">
      <div
        ref={panelRef}
        data-testid="case_battle_list_pause_button"
        className="flex h-20 items-stretch overflow-hidden rounded-lg bg-navy-900 pr-4 will-change-[width,transform]"
      >
        <button
          type="button"
          className="group flex shrink-0 cursor-pointer items-center justify-center rounded-l-lg px-2 transition-colors duration-150 hover:bg-navy-900"
          aria-expanded={panelExpanded}
          aria-label={t("caseBattleLivePanelToggleAria")}
          onClick={() => setPanelExpanded((v) => !v)}
        >
          <svg
            ref={chevronRef}
            className="icon h-3 w-3 text-navy-400 transition-colors duration-150 group-hover:text-white"
            viewBox="0 0 10 6"
            fill="none"
            aria-hidden
          >
            <path d="M1 1L5 5L9 1" stroke="currentColor" />
          </svg>
        </button>
        <button
          type="button"
          className={`ml-1 flex items-center text-left ${panelExpanded ? "space-x-4" : "px-1"}`}
          aria-label={livePaused ? t("continueAction") : t("caseBattlePauseLive")}
          onClick={() => setLivePaused(!livePaused)}
        >
          <div className="grid-stack shrink-0 rounded-full">
            {livePaused ? (
              <svg className="icon h-6 w-6 text-lime-400" viewBox="0 0 31 31" fill="currentColor" aria-hidden>
                <path d="M6.45866 4.40039C5.92629 4.40039 5.41477 4.61194 5.0397 4.98701C4.66462 5.36209 4.45312 5.8736 4.45312 6.40597V24.5298C4.45312 25.0622 4.66462 25.5737 5.0397 25.9488C5.41477 26.3239 5.92629 26.5354 6.45866 26.5354H10.4699C11.0022 26.5354 11.5138 26.3239 11.8888 25.9488C12.2639 25.5737 12.4754 25.0622 12.4754 24.5298V6.40597C12.4754 5.8736 12.2639 5.36209 11.8888 4.98701C11.5138 4.61194 11.0022 4.40039 10.4699 4.40039H6.45866ZM20.0872 4.40039C19.5548 4.40039 19.0433 4.61194 18.6682 4.98701C18.2932 5.36209 18.0817 5.8736 18.0817 6.40597V24.5298C18.0817 25.0622 18.2932 25.5737 18.6682 25.9488C19.0433 26.3239 19.5548 26.5354 20.0872 26.5354H24.0984C24.6308 26.5354 25.1423 26.3239 25.5174 25.9488C25.8924 25.5737 26.104 25.0622 26.104 24.5298V6.40597C26.104 5.8736 25.8924 5.36209 25.5174 4.98701C25.1423 4.61194 24.6308 4.40039 24.0984 4.40039H20.0872Z" />
              </svg>
            ) : (
              <svg className="icon h-6 w-6 text-red-500" viewBox="0 0 31 31" fill="currentColor" aria-hidden>
                <path d="M15.5003 30.9167C6.98572 30.9167 0.0836792 24.0146 0.0836792 15.5C0.0836792 6.98539 6.98572 0.0833435 15.5003 0.0833435C24.015 0.0833435 30.917 6.98539 30.917 15.5C30.917 24.0146 24.015 30.9167 15.5003 30.9167ZM10.8753 10.875V20.125H13.9587V10.875H10.8753ZM17.042 10.875V20.125H20.1253V10.875H17.042Z" />
              </svg>
            )}
          </div>
          <div ref={textBlockRef} className="min-w-0 text-xs leading-none" aria-hidden={!panelExpanded}>
            <div className="font-bold uppercase">
              <p className={livePaused ? "text-lime-400" : "text-red-500"}>{livePaused ? t("continueAction") : t("caseBattlePauseLive")}</p>
            </div>
            <p className="uppercase text-navy-200">{t("caseBattleLiveBattlesLabel")}</p>
          </div>
        </button>
      </div>
    </div>
  );
}

/* ---------- 统计 ---------- */

function ListChromeStats() {
  const { t } = useI18n();

  return (
    <ContentPad>
      <div className="order-1 my-5 flex h-[100px] max-w-none flex-wrap rounded-lg bg-navy-900 md:flex-row md:flex-nowrap lg:order-none">
        <div className="relative flex w-full items-center justify-center">
          <div className="hide-scrollbar flex max-w-none items-center justify-center gap-9 overflow-x-auto whitespace-nowrap px-5 md:gap-12 lg:mr-4 lg:px-0 xl:gap-16">
            <div className="flex flex-shrink-0 items-center justify-center gap-4">
              <StatIconActive className="icon h-7 w-7 flex-shrink-0 self-center text-gold lg:h-10 lg:w-10" />
              <div className="flex flex-col justify-center sm:items-start">
                <h4
                  data-testid="bttls-statistics-active-counter"
                  className="text-base font-semibold tabular-nums leading-none text-gold lg:text-xl"
                >
                  —
                </h4>
                <p className="text-10px font-semibold uppercase text-navy-200 sm:text-xs">{t("caseBattleStatActive")}</p>
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center justify-center gap-4">
              <StatIconOnline className="icon h-7 w-7 flex-shrink-0 self-center text-gold lg:h-10 lg:w-10" />
              <div className="flex flex-col justify-center sm:items-start">
                <h4
                  data-testid="bttls-statistics-in-bttl-lobby-counter"
                  className="text-base font-semibold tabular-nums leading-none text-gold lg:text-xl"
                >
                  —
                </h4>
                <p className="text-10px font-semibold uppercase text-navy-200 sm:text-xs">{t("caseBattleStatOnline")}</p>
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center justify-center gap-4">
              <StatIconTotal className="icon h-7 w-7 flex-shrink-0 self-center text-gold lg:h-10 lg:w-10" />
              <div className="flex flex-col justify-center sm:items-start">
                <h4
                  data-testid="bttls-statistics-total-bttls-counter"
                  className="text-base font-semibold tabular-nums leading-none text-gold lg:text-xl"
                >
                  —
                </h4>
                <p className="text-10px font-semibold uppercase text-navy-200 sm:text-xs">{t("caseBattleStatTotal")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ContentPad>
  );
}

/* ---------- 关于 ---------- */

function ListChromeAbout() {
  const { t } = useI18n();

  return (
    <ContentPad className="mt-8 pb-8">
      <header className="my-10 flex items-center justify-center gap-x-10 md:justify-between">
        <h3 className="flex flex-shrink-0 items-center gap-x-3 text-center text-xl font-bold uppercase text-navy-200 md:text-left">
          {t("caseBattleAboutTitle")}
        </h3>
        <div className="hidden h-[15px] flex-shrink-0 flex-wrap gap-[7px] overflow-hidden md:flex">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="h-full w-px bg-navy-500" />
          ))}
        </div>
      </header>
      <p className="text-sm font-normal leading-relaxed text-navy-400">{t("caseBattleAboutBody")}</p>
    </ContentPad>
  );
}

/* ---------- 对战列表表头（行数据后续接入） ---------- */

function ListBattleTableChrome() {
  const { t } = useI18n();
  const { livePaused } = useBattleListLive();

  const { data: fightListRes } = useQuery({
    queryKey: ["battleList"],
    queryFn: () => api.getFightList(),
    refetchInterval: livePaused ? false : 1000,
    refetchIntervalInBackground: !livePaused,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 0,
  });

  const { data: boxListRes } = useQuery({
    queryKey: ["boxList", "caseBattleListPackPrices"],
    queryFn: () =>
      api.getBoxList({
        sort_type: "1",
        type: "1,2",
      }),
    staleTime: 60_000,
  });

  const serverTimestampSec = useMemo(() => {
    const payload = fightListRes as
      | { t2?: number; data?: { t2?: number }; timestamp?: number; server_time?: number }
      | undefined;
    const direct = payload?.t2 ?? payload?.data?.t2 ?? payload?.timestamp ?? payload?.server_time;
    const n = Number(direct);
    if (Number.isFinite(n)) return n;
    return Math.floor(Date.now() / 1000);
  }, [fightListRes]);

  const rawEntries = useMemo<RawBattleListItem[]>(() => {
    const payload = fightListRes?.data;
    if (Array.isArray(payload?.data)) {
      return payload.data as RawBattleListItem[];
    }
    if (Array.isArray(payload?.list)) {
      return payload.list as RawBattleListItem[];
    }
    if (Array.isArray(payload)) {
      return payload as RawBattleListItem[];
    }
    return [];
  }, [fightListRes]);

  const cards = useMemo(
    () => buildBattleListCards(rawEntries.length ? rawEntries : undefined, serverTimestampSec),
    [rawEntries, serverTimestampSec],
  );

  const sortedCards = useMemo(() => [...cards].sort((a, b) => b.createdAt - a.createdAt), [cards]);

  const catalogBeanById = useMemo(() => {
    const m = new Map<string, number>();
    if (boxListRes?.code === 100000 && Array.isArray(boxListRes.data)) {
      for (const box of boxListRes.data as Record<string, unknown>[]) {
        const id = String(box.id ?? box.box_id ?? "");
        const bean = Number(box.bean ?? 0);
        if (id && Number.isFinite(bean)) m.set(id, bean);
      }
    }
    return m;
  }, [boxListRes]);

  return (
    <>
      <div className="order-5 mt-2 w-full min-w-0 md:hidden" style={caseBattleListTablePadXStyle}>
        <div className="w-full max-w-none min-w-0 transition-opacity duration-150 ease-out opacity-100">
          {sortedCards.map((card) => (
            <CaseBattleListMobileCard key={card.id} card={card} />
          ))}
        </div>
      </div>
      <div
        className="order-5 hidden w-full min-w-0 min-h-screen overflow-x-auto opacity-100 transition-opacity duration-500 md:order-none md:block"
        style={caseBattleListTablePadXStyle}
      >
        <table className="case-battle-list-table relative w-full max-w-none border-separate border-spacing-x-0 border-spacing-y-0">
          <VisuallyHiddenTableCaption text={t("caseBattleListPlaceholder")} />
          <colgroup>
            <col className="cb-c-round" />
            <col className="cb-c-packs" />
            <col className="cb-c-value" />
            <col className="cb-c-players" />
            <col className="cb-c-status" />
          </colgroup>
          <thead className="bg-navy-700 before:block before:h-[22px] before:bg-navy-800 before:content-[''] after:block after:h-[22px] after:bg-navy-800 after:content-['']">
            <tr className="h-10">
              <th scope="col" className="cb-c-round rounded-l-md text-xs font-semibold uppercase">
                <div className="flex items-center justify-center gap-2 text-navy-400">{t("caseBattleListThRound")}</div>
              </th>
              <th scope="col" className="cb-c-packs text-xs font-semibold uppercase">
                <div className="case-battle-list-packs-cell-inner flex items-center justify-center gap-2 text-navy-400">
                  {t("caseBattleListThPacks")}
                </div>
              </th>
              <th scope="col" className="cb-c-value text-xs font-semibold uppercase">
                <div className="flex cursor-pointer items-center justify-center gap-2 text-navy-400">
                  {t("caseBattleListThValue")}
                  <div className="grid place-items-center">
                    <svg className="icon h-0 w-0 opacity-0 transition-all duration-200" viewBox="0 0 12 10" aria-hidden>
                      <path d="m6 0 6 10H0L6 0Z" fill="currentColor" />
                    </svg>
                    <div className="h-[2px] w-[6px] bg-navy-400 opacity-100 transition-all duration-200" aria-hidden />
                  </div>
                </div>
              </th>
              <th scope="col" className="cb-c-players text-xs font-semibold uppercase text-navy-400">
                {t("caseBattleListThPlayers")}
              </th>
              <th scope="col" className="cb-c-status rounded-r-md text-xs font-semibold uppercase">
                <div className="flex items-center justify-center gap-2 text-navy-400">{t("caseBattleListThStatus")}</div>
              </th>
            </tr>
          </thead>
          <tbody className="relative">
            {sortedCards.map((card) => (
              <CaseBattleListTableRow key={card.id} card={card} catalogBeanById={catalogBeanById} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function VisuallyHiddenTableCaption({ text }: { text: string }) {
  return <caption className="sr-only">{text}</caption>;
}

/* ---------- 页面入口（唯一 page 文件） ---------- */

export default function BattlesListPage() {
  return (
    <BattleListLiveProvider>
      <main
        id="main-view"
        className="relative z-[19] min-h-screen overflow-x-hidden bg-navy-800 bg-[length:2570px] bg-[center_top] bg-no-repeat"
        style={{ minHeight: "100vh" }}
      >
        <div className="bg-navy-800 pb-6">
          <ListChromeHeader />
          <ListChromeFilters />
          <ListChromePauseButton />
          <ListBattleTableChrome />
          <ListChromeStats />
          <ListChromeAbout />
        </div>
      </main>
    </BattleListLiveProvider>
  );
}
