"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type SVGProps } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/app/components/I18nProvider";
import { AddBattleRoundCasePriceSlider } from "@/app/components/AddBattleRoundCasePriceSlider";
import {
  AddBattleRoundCaseWeaponCasesSection,
  type AddBattleRoundCasePackItem,
} from "@/app/components/AddBattleRoundCaseWeaponCasesSection";
import { api } from "@/app/lib/api";

/** GSAP 弹层动效（浅入浅出：轻缩放 + 透明度过渡） */
const MODAL_BACKDROP_SEC = 0.22;
const MODAL_PANEL_SEC = 0.28;
const MODAL_OVERLAP_SEC = 0.12;
/** 弹窗礼包列表最多展示条数 */
const MODAL_PACK_DISPLAY_LIMIT = 20;
const MODAL_SCALE_FROM = 0.96;
const MODAL_EASE_OUT = "power2.out";
const MODAL_EASE_IN = "power2.in";

function IconClose(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="icon h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden {...props}>
      <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
    </svg>
  );
}

function IconSearch(props: SVGProps<SVGSVGElement>) {
  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 24 24" className="block h-4 w-4 text-navy-300" aria-hidden {...props}>
      <path d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168Z" />
    </svg>
  );
}

function IconSortArrows(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="icon mr-2 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="none" aria-hidden {...props}>
      <path fill="currentColor" d="M9 5H5.50088L5.5 15.5H3.75V5H0.25L4.625 0.625L9 5ZM17.75 12L13.375 16.375L9 12H12.5V1.5H14.25V12H17.75Z" />
    </svg>
  );
}

function IconWalletSmall(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="icon h-[14px] w-[14px]" viewBox="0 0 18 18" fill="currentColor" aria-hidden {...props}>
      <path d="M16.499 4.5h-5.25a4.5 4.5 0 1 0 0 9h5.25V15a.75.75 0 0 1-.75.75h-13.5a.75.75 0 0 1-.75-.75V3a.75.75 0 0 1 .75-.75h13.5a.75.75 0 0 1 .75.75v1.5ZM11.249 6h6v6h-6a3 3 0 0 1 0-6Zm0 2.25v1.5h2.25v-1.5h-2.25Z" />
    </svg>
  );
}

function IconHeart(props: SVGProps<SVGSVGElement>) {
  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 24 24" className="h-[15px] w-[15px] text-navy-200" aria-hidden {...props}>
      <path d="M12.001 4.52853C14.35 2.42 17.98 2.49 20.2426 4.75736C22.5053 7.02472 22.583 10.637 20.4786 12.993L11.9999 21.485L3.52138 12.993C1.41705 10.637 1.49571 7.01901 3.75736 4.75736C6.02157 2.49315 9.64519 2.41687 12.001 4.52853Z" />
    </svg>
  );
}

function IconEraserSmall(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 15 15" width={24} height={24} fill="currentColor" className="h-[14px] w-[14px] text-navy-200" aria-hidden {...props}>
      <path d="M8.6666 11.5833H12.7499V12.7499H7.49993L5.16777 12.7511L1.38368 8.96703C1.27432 8.85763 1.21289 8.70929 1.21289 8.55461C1.21289 8.39993 1.27432 8.25158 1.38368 8.14219L7.56993 1.95478C7.62411 1.90054 7.68844 1.85751 7.75926 1.82816C7.83007 1.7988 7.90598 1.78369 7.98264 1.78369C8.0593 1.78369 8.13521 1.7988 8.20602 1.82816C8.27684 1.85751 8.34117 1.90054 8.39535 1.95478L12.9325 6.49194C13.0419 6.60133 13.1033 6.74968 13.1033 6.90436C13.1033 7.05904 13.0419 7.20738 12.9325 7.31678L8.6666 11.5833ZM9.63318 8.96703L11.6953 6.90436L7.98293 3.19203L5.92085 5.25469L9.63318 8.96703Z" />
    </svg>
  );
}

function IconAddBox(props: SVGProps<SVGSVGElement>) {
  const uid = useId().replace(/:/g, "");
  const clip = `${uid}-addbox`;
  return (
    <svg className="icon h-6 w-6 md:h-[24px] md:w-[24px]" viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <g clipPath={`url(#${clip})`}>
        <path
          d="M4 3H20C20.2652 3 20.5196 3.10536 20.7071 3.292C20.8946 3.48043 21 3.73478 21 4V20C21 20.2652 20.8946 20.5196 20.7071 20.7071C20.5196 20.8946 20.2652 21 20 21H4C3.73478 21 3.48043 20.8946 3.29289 20.7071C3.10536 20.5196 3 20.2652 3 20V4C3 3.73478 3.10536 3.48043 3.29289 3.29289C3.48043 3.10536 3.73478 3 4 3ZM11 11H7V13H11V17H13V13H17V11H13V7H11V11Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id={clip}>
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

function IconDepositPlus(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="icon h-[17px] w-[17px] text-grass-green transition-transform duration-200" viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        fill="currentColor"
        d="M17.833 6.166c-3.216-3.216-8.45-3.216-11.666 0-3.217 3.217-3.217 8.45 0 11.667 3.216 3.216 8.45 3.216 11.666 0 3.217-3.216 3.217-8.45 0-11.667zm-5.008 9.917h-1.65v-3.258H7.917v-1.65h3.258V7.916h1.65v3.259h3.258v1.65h-3.258v3.258z"
      />
    </svg>
  );
}

export type AddBattleRoundCaseSelection = AddBattleRoundCasePackItem & { quantity: number };

function selectionsToQuantityRecord(rows: AddBattleRoundCaseSelection[]): Record<string, number> {
  const next: Record<string, number> = {};
  for (const row of rows) {
    if (row.quantity > 0) next[row.id] = row.quantity;
  }
  return next;
}

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm?: (packs: AddBattleRoundCaseSelection[]) => void;
  /** 与创建对战页已选礼包同步，弹窗每次打开时恢复为当前页的选中数量 */
  initialSelections?: AddBattleRoundCaseSelection[];
};

export function AddBattleRoundCaseModal({ open, onClose, onConfirm, initialSelections = [] }: Props) {
  const { t } = useI18n();
  const [displayed, setDisplayed] = useState(open);
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);
  const enterTlRef = useRef<gsap.core.Timeline | null>(null);
  const [search, setSearch] = useState("");
  const [priceFilterMin, setPriceFilterMin] = useState<number | null>(null);
  const [priceFilterMax, setPriceFilterMax] = useState<number | null>(null);
  const [packQuantities, setPackQuantities] = useState<Record<string, number>>({});
  const latestInitialSelectionsRef = useRef(initialSelections);
  latestInitialSelectionsRef.current = initialSelections;
  const didSeedOpenSessionRef = useRef(false);

  const onCloseRef = useRef(onClose);
  const onConfirmRef = useRef(onConfirm);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    onConfirmRef.current = onConfirm;
  }, [onConfirm]);

  useEffect(() => {
    if (open) {
      closingRef.current = false;
      setDisplayed(true);
    }
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      didSeedOpenSessionRef.current = false;
      return;
    }
    if (!didSeedOpenSessionRef.current) {
      didSeedOpenSessionRef.current = true;
      setPackQuantities(selectionsToQuantityRecord(latestInitialSelectionsRef.current));
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setPriceFilterMin(null);
      setPriceFilterMax(null);
      setPackQuantities({});
    }
  }, [open]);

  const togglePackSelection = useCallback((id: string) => {
    setPackQuantities((prev) => {
      const cur = prev[id] ?? 0;
      const next = { ...prev };
      if (cur > 0) delete next[id];
      else next[id] = 1;
      return next;
    });
  }, []);

  const bumpPackQuantity = useCallback((id: string, delta: number) => {
    setPackQuantities((prev) => {
      const cur = prev[id] ?? 0;
      const n = cur + delta;
      const next = { ...prev };
      if (n <= 0) delete next[id];
      else next[id] = Math.min(999, n);
      return next;
    });
  }, []);

  const setPackQuantityExact = useCallback((id: string, qty: number) => {
    setPackQuantities((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = Math.min(999, qty);
      return next;
    });
  }, []);

  const { data: boxListData, isLoading: boxListLoading } = useQuery({
    queryKey: ["boxList", "addBattleRoundCaseModal"],
    queryFn: () =>
      api.getBoxList({
        sort_type: "1",
        type: "1,2",
      }),
    enabled: displayed,
    staleTime: 30_000,
  });

  const allPacks = useMemo((): AddBattleRoundCasePackItem[] => {
    if (boxListData?.code === 100000 && Array.isArray(boxListData.data)) {
      return boxListData.data.map((box: { id?: unknown; box_id?: unknown; name?: string; title?: string; bean?: unknown; cover?: string }) => ({
        id: String(box.id ?? box.box_id ?? ""),
        title: box.name || box.title || "",
        price: Number(box.bean ?? 0),
        image: typeof box.cover === "string" ? box.cover : "",
      }));
    }
    return [];
  }, [boxListData]);

  const priceDomain = useMemo(() => {
    if (!allPacks.length) return { min: 0, max: 1 };
    const prices = allPacks.map((p) => p.price);
    const minV = Math.min(...prices);
    const maxV = Math.max(...prices);
    if (minV === maxV) {
      return { min: Math.max(0, minV - 0.01), max: maxV + 0.01 };
    }
    return { min: minV, max: maxV };
  }, [allPacks]);

  useEffect(() => {
    if (!displayed || !allPacks.length) return;
    setPriceFilterMin((prev) => (prev === null ? priceDomain.min : prev));
    setPriceFilterMax((prev) => (prev === null ? priceDomain.max : prev));
  }, [displayed, allPacks.length, priceDomain.min, priceDomain.max]);

  const formatMoneyLabel = useCallback((n: number) => {
    return `US$${n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, []);

  const onPriceRangeChange = useCallback((min: number, max: number) => {
    setPriceFilterMin(min);
    setPriceFilterMax(max);
  }, []);

  const resetPriceFilter = useCallback(() => {
    setPriceFilterMin(priceDomain.min);
    setPriceFilterMax(priceDomain.max);
  }, [priceDomain.min, priceDomain.max]);

  const filteredPacks = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = allPacks;
    if (q) {
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }
    if (priceFilterMin !== null && priceFilterMax !== null) {
      list = list.filter((p) => p.price >= priceFilterMin && p.price <= priceFilterMax);
    }
    return list.slice(0, MODAL_PACK_DISPLAY_LIMIT);
  }, [allPacks, search, priceFilterMin, priceFilterMax]);

  const sliderReady =
    allPacks.length > 0 && priceFilterMin !== null && priceFilterMax !== null && priceDomain.max > priceDomain.min;

  useEffect(() => {
    if (!displayed) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [displayed]);

  const playExit = useCallback((then?: () => void) => {
    const backdrop = backdropRef.current;
    const panel = panelRef.current;
    if (!backdrop || !panel) {
      then?.();
      return;
    }
    if (closingRef.current) return;
    enterTlRef.current?.kill();
    enterTlRef.current = null;
    gsap.killTweensOf([backdrop, panel]);
    closingRef.current = true;
    gsap
      .timeline({
        onComplete: () => {
          then?.();
          closingRef.current = false;
        },
      })
      .to(panel, {
        autoAlpha: 0,
        scale: MODAL_SCALE_FROM,
        duration: MODAL_PANEL_SEC,
        ease: MODAL_EASE_IN,
      })
      .to(
        backdrop,
        {
          autoAlpha: 0,
          duration: MODAL_BACKDROP_SEC,
          ease: MODAL_EASE_IN,
        },
        0,
      );
  }, []);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    playExit(() => {
      setDisplayed(false);
      onCloseRef.current();
    });
  }, [playExit]);

  const hasPackSelection = useMemo(() => Object.values(packQuantities).some((q) => q > 0), [packQuantities]);

  const modalSelectedPackCount = useMemo(
    () => Object.values(packQuantities).reduce((acc, q) => acc + Math.max(0, q), 0),
    [packQuantities],
  );

  const modalSelectedTotalUsd = useMemo(() => {
    let sum = 0;
    for (const [id, qty] of Object.entries(packQuantities)) {
      if (qty <= 0) continue;
      const meta = allPacks.find((p) => p.id === id);
      if (meta) sum += meta.price * qty;
    }
    return sum;
  }, [allPacks, packQuantities]);

  const handleConfirmSelection = useCallback(() => {
    if (!hasPackSelection) return;
    const packs: AddBattleRoundCaseSelection[] = [];
    for (const [id, quantity] of Object.entries(packQuantities)) {
      if (quantity <= 0) continue;
      const meta = allPacks.find((p) => p.id === id);
      if (meta) packs.push({ ...meta, quantity });
    }
    if (packs.length === 0) return;
    playExit(() => {
      setDisplayed(false);
      onCloseRef.current();
      onConfirmRef.current?.(packs);
    });
  }, [allPacks, hasPackSelection, packQuantities, playExit]);

  useLayoutEffect(() => {
    if (!displayed) return;
    const backdrop = backdropRef.current;
    const panel = panelRef.current;
    if (!backdrop || !panel) return;
    enterTlRef.current?.kill();
    gsap.killTweensOf([backdrop, panel]);
    gsap.set(backdrop, { autoAlpha: 0 });
    gsap.set(panel, {
      autoAlpha: 0,
      scale: MODAL_SCALE_FROM,
      transformOrigin: "50% 50%",
    });
    const tl = gsap
      .timeline()
      .to(backdrop, {
        autoAlpha: 1,
        duration: MODAL_BACKDROP_SEC,
        ease: MODAL_EASE_OUT,
      })
      .to(
        panel,
        {
          autoAlpha: 1,
          scale: 1,
          duration: MODAL_PANEL_SEC,
          ease: MODAL_EASE_OUT,
        },
        `-=${MODAL_OVERLAP_SEC}`,
      );
    enterTlRef.current = tl;
    return () => {
      tl.kill();
      enterTlRef.current = null;
    };
  }, [displayed]);

  useEffect(() => {
    if (!displayed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [displayed, requestClose]);

  if (!displayed || typeof document === "undefined") return null;

  const node = (
    <div
      ref={rootRef}
      className="fixed bottom-0 left-0 right-0 top-0 z-50 flex items-center overflow-auto backdrop-filter-none"
      role="presentation"
    >
      <div ref={backdropRef} className="fixed inset-0 bg-black/80 backdrop-blur-[3px]" aria-hidden />
      <div
        className="relative z-10 flex min-h-full w-full items-center justify-center px-3 py-4 sm:px-4 md:px-6"
        aria-hidden={false}
        onClick={requestClose}
        role="presentation"
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={t("addBattleCaseModalAria")}
          className="w-full max-w-[95vw] xl:max-w-[1300px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            data-testid="add-bttl-round-case-modal"
            className="relative flex h-[100dvh] w-full max-w-full min-h-0 flex-col overflow-hidden rounded-md pt-4 sm:h-[min(100dvh,920px)] md:gap-4"
          >
            <div className="relative mb-0 flex w-full min-w-0 shrink-0 flex-col lg:mb-2">
              <div className="flex w-full items-center justify-between gap-2 pr-1">
                <h3 className="px-1 py-4 text-[24px] font-normal leading-tight text-white">{t("addBattleCaseModalTitle")}</h3>
                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 appearance-none items-center justify-center rounded-[4px] bg-navy-500 p-3 text-10px font-semibold uppercase text-white outline-none ring-1 ring-transparent transition-colors duration-200 hover:bg-navy-500 focus-visible:outline-none focus-visible:ring disabled:cursor-default disabled:opacity-50 active:bg-navy-600 active:ring-navy-200 md:h-[42px] md:w-[42px] md:p-5 lg:h-[42px] lg:w-[42px]"
                  aria-label={t("close")}
                  onClick={requestClose}
                >
                  <IconClose />
                </button>
              </div>

              <div className="rounded-md bg-navy-700 p-[9px] sm:p-0 sm:pl-[9px]">
                <div className="grid h-full grid-cols-1 items-center gap-y-[12px] sm:gap-[12px] xl:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]">
                  <div className="flex min-w-0 w-full gap-2">
                    <div className="relative flex min-w-0 w-full">
                      <input
                        type="text"
                        className="input -mr-9 h-[42px] min-w-0 w-full border-none bg-navy-800 pl-4 pr-9 text-[12px] text-white placeholder-navy-400 outline-none focus:ring-1 focus:ring-gold-400/40"
                        data-testid="add-bttl-round-case-search-input"
                        placeholder={t("searchPlaceholder")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      <div className="absolute right-3 flex h-[42px] w-9 items-center justify-center p-2">
                        <IconSearch />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="button button-secondary col-start-1 flex h-14 w-full items-center justify-center border-none bg-navy-600 text-base text-white sm:hidden"
                  >
                    <IconSortArrows />
                    <span>{t("caseBattleSortBy")}</span>
                  </button>

                  <div className="col-start-2 flex gap-4">
                    <div className="hidden items-center gap-3 transition-opacity duration-200 sm:flex">
                      <button
                        type="button"
                        data-testid="add-bttl-round-case-standard-tab"
                        className={`flex h-[42px] w-[120px] items-center justify-center rounded px-9 text-[12px] font-bold uppercase text-white transition-colors duration-200 ${
                          modalSelectedPackCount > 0
                            ? "border border-white bg-navy-500 hover:bg-navy-400"
                            : "border border-transparent bg-navy-500 hover:bg-navy-400"
                        }`}
                      >
                        <span className="relative">
                          <div className="flex items-center justify-center gap-1 whitespace-nowrap text-xs md:gap-2">
                            {t("addBattleCaseStandardTab")}
                            <span
                              className={`flex shrink-0 items-center justify-center rounded bg-navy-500 text-xs font-bold text-navy-400 min-[400px]:text-sm ${
                                modalSelectedPackCount > 0
                                  ? "h-[21px] min-w-[24px] px-0.5 tabular-nums"
                                  : "h-[21px] w-0 min-w-0 overflow-hidden p-0 opacity-0 lg:w-0"
                              }`}
                              aria-hidden={modalSelectedPackCount === 0}
                            >
                              {modalSelectedPackCount > 0 ? modalSelectedPackCount : null}
                            </span>
                          </div>
                        </span>
                      </button>
                      <button
                        type="button"
                        disabled
                        title={t("addBattleCaseJokerDisabled")}
                        aria-label={t("addBattleCaseJokerDisabled")}
                        className="flex h-[42px] w-[120px] cursor-not-allowed items-center justify-center rounded bg-violet-400/90 px-9 text-[12px] font-bold uppercase text-white opacity-50 transition-opacity duration-200"
                      >
                        <span className="relative">
                          <div className="flex items-center justify-center gap-1 whitespace-nowrap text-xs md:gap-2">
                            {t("addBattleCaseJokerTab")}
                            <span className="flex w-0 shrink-0 items-center justify-center rounded bg-violet-600 text-navy-50 transition-all duration-200 lg:w-0" />
                          </div>
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="col-start-3 ml-[15px] mr-[7px] hidden gap-[12px] sm:flex">
                    <button
                      type="button"
                      className="flex h-[31px] w-[31px] appearance-none items-center justify-center rounded-md bg-navy-500 px-4 text-10px font-semibold uppercase leading-[1.5] text-white outline-none ring-1 ring-transparent transition-colors duration-200 hover:bg-navy-500 focus:outline-none focus-visible:outline-none focus-visible:ring disabled:cursor-default disabled:opacity-50 active:bg-navy-600 active:ring-navy-200 sm:px-2 lg:whitespace-nowrap"
                      aria-label={t("deposits")}
                    >
                      <IconWalletSmall className="h-[15px] w-[15px] text-navy-200" />
                    </button>
                    <button
                      type="button"
                      className="relative flex h-[31px] w-[31px] appearance-none items-center justify-center rounded-md bg-navy-500 px-4 text-10px font-semibold uppercase leading-[1.5] text-white outline-none ring-1 ring-transparent transition-colors duration-200 hover:bg-navy-500 focus:outline-none focus-visible:outline-none focus-visible:ring disabled:cursor-default disabled:opacity-50 active:bg-navy-600 active:ring-navy-200 sm:px-2 lg:whitespace-nowrap"
                      aria-label={t("favorite")}
                    >
                      <IconHeart />
                    </button>
                  </div>

                  <div className="col-start-4 hidden w-full min-w-0 items-center justify-between lg:flex">
                    <div className="flex items-center gap-[15px]">
                      <div className="whitespace-nowrap text-[10px] font-bold uppercase leading-tight tracking-wide text-navy-200 transition-colors hover:text-white">
                        <span className="inline-block text-left">
                          {t("addBattleCaseChoosePrice")
                            .split("\n")
                            .map((line, i) => (
                              <span key={i}>
                                {i > 0 ? <br /> : null}
                                {line}
                              </span>
                            ))}
                        </span>
                      </div>
                      <div className="flex h-9 w-[236px] items-center">
                        <div className="w-full px-1.5 transition-opacity duration-200">
                          {sliderReady ? (
                            <AddBattleRoundCasePriceSlider
                              domainMin={priceDomain.min}
                              domainMax={priceDomain.max}
                              valueMin={priceFilterMin!}
                              valueMax={priceFilterMax!}
                              onChange={onPriceRangeChange}
                              formatLabel={formatMoneyLabel}
                              ariaMinLabel={t("addBattleCaseSliderHandleMinAria")}
                              ariaMaxLabel={t("addBattleCaseSliderHandleMaxAria")}
                            />
                          ) : (
                            <div className="relative h-9 w-full opacity-40">
                              <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-[7px] bg-[#2E3244]" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={resetPriceFilter}
                      disabled={!sliderReady}
                      className="ml-[21px] flex h-[31px] w-[31px] appearance-none items-center justify-center rounded-md bg-navy-500 px-4 text-10px font-semibold uppercase leading-[1.5] text-white outline-none ring-1 ring-transparent transition-colors duration-200 hover:bg-navy-500 focus:outline-none focus-visible:outline-none focus-visible:ring disabled:cursor-not-allowed disabled:opacity-40 active:bg-navy-600 active:ring-navy-200 sm:px-2 lg:whitespace-nowrap"
                      aria-label={t("addBattleCaseResetPriceFilterAria")}
                    >
                      <IconEraserSmall />
                    </button>
                  </div>

                  <div className="group relative z-50 col-start-5 hidden h-[60px] items-center rounded-md bg-navy-500 p-[6px] sm:flex">
                    <Link
                      data-testid="refill-deposit-btn"
                      href="/account/deposits"
                      className="relative z-10 flex h-full items-center gap-x-3 rounded bg-grass-green px-[6px] md:min-w-[185px] min-[2560px]:h-[50px] min-[2560px]:px-[10px]"
                    >
                      <div className="hidden h-[20px] w-[20px] items-center justify-center rounded-sm bg-[#2d4a32] text-[12px] font-semibold leading-[normal] text-lime-400 min-[400px]:flex md:h-[30px] md:w-[30px] md:text-[16px]">
                        <IconWalletSmall className="h-[14px] w-[14px]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold tabular-nums leading-none text-lime-400 md:text-[12px] min-[1600px]:text-[14px]">
                          <span className="relative">
                            <span data-testid="header-account-money-balance" className="absolute left-0">
                              US$0.00
                            </span>
                            <span className="pointer-events-none opacity-0">US$0.00</span>
                          </span>
                        </p>
                        <p className="mt-[2px] hidden whitespace-nowrap text-[10px] font-semibold uppercase leading-none tracking-wider text-white md:flex">
                          {t("walletBalanceNav")}
                        </p>
                      </div>
                      <div className="ml-auto flex h-[20px] w-[20px] items-center justify-center rounded-sm bg-lime-400 text-lg font-semibold md:h-[30px] md:w-[30px]">
                        <IconDepositPlus />
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <AddBattleRoundCaseWeaponCasesSection
              packs={filteredPacks}
              isLoading={boxListLoading}
              packQuantities={packQuantities}
              onTogglePack={togglePackSelection}
              onBumpQuantity={bumpPackQuantity}
              onQuantityCommit={setPackQuantityExact}
            />

            {/* 整块弹窗底部渐隐（父级无整面底色时叠在毛玻璃背板上） */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 z-[40] h-[min(32vh,240px)] bg-gradient-to-t from-navy-900 via-navy-900/80 to-transparent"
            />

            <div className="pointer-events-none absolute bottom-0 left-1/2 z-[60] flex w-screen max-w-[100vw] -translate-x-1/2 flex-shrink-0 justify-center rounded-t-lg p-3 pt-10 sm:w-full sm:max-w-none md:p-6 md:pt-12">
              <button
                type="button"
                className="button pointer-events-auto relative z-10 flex h-14 w-full max-w-[calc(100vw-24px)] items-center justify-center rounded bg-lime-300 text-base font-semibold text-gray-900 shadow-[0_8px_28px_rgba(0,0,0,0.28)] enabled:hover:bg-[#DEFF8C] disabled:cursor-not-allowed disabled:bg-navy-600 disabled:text-navy-400 disabled:opacity-90 sm:max-w-none md:w-[500px]"
                data-testid="add-bttl-round-case-submit-btn"
                disabled={!hasPackSelection}
                onClick={handleConfirmSelection}
              >
                <span className="flex flex-col items-center gap-1 sm:flex-row sm:gap-[12px]">
                  <span className="hidden shrink-0 sm:block">
                    <IconAddBox />
                  </span>
                  <span className="flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5 text-center leading-tight">
                    <span>{t("addBattleCaseSubmitLead")}</span>
                    <span
                      data-testid="add-bttl-round-case-submit-btn-price"
                      className="font-semibold tabular-nums"
                    >
                      {formatMoneyLabel(modalSelectedTotalUsd)}
                    </span>
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
