"use client";

import Image from "next/image";
import { useI18n } from "@/app/components/I18nProvider";

export type AddBattleRoundCasePackItem = {
  id: string;
  title: string;
  price: number;
  image: string;
};

const VERTICAL_RULE_COUNT = 56;
const SKELETON_COUNT = 12;
const MAX_PACK_QTY = 999;
/** 与参考 large 栅格 6 列对齐：补足行尾空位（仅视觉占位） */
const LG_GRID_COLS = 6;

function formatUsd(n: number) {
  return `US$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function lgRowPlaceholderCount(packCount: number) {
  if (packCount <= 0) return 0;
  const r = packCount % LG_GRID_COLS;
  return r === 0 ? 0 : LG_GRID_COLS - r;
}

type Props = {
  packs: AddBattleRoundCasePackItem[];
  isLoading: boolean;
  packQuantities: Record<string, number>;
  onTogglePack: (id: string) => void;
  onBumpQuantity: (id: string, delta: number) => void;
  onQuantityCommit: (id: string, qty: number) => void;
};

export function AddBattleRoundCaseWeaponCasesSection({
  packs,
  isLoading,
  packQuantities,
  onTogglePack,
  onBumpQuantity,
  onQuantityCommit,
}: Props) {
  const { t } = useI18n();
  const trailingPlaceholders = lgRowPlaceholderCount(packs.length);

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col">
      <div className="relative mb-0 mt-2 block h-full min-h-0 w-full lg:mt-0">
        <div className="custom-scrollbar relative z-0 h-full min-h-0 w-full overflow-y-scroll">
          <div className="pb-25">
            <div className="mb-3 flex w-full items-center justify-between">
              <p className="py-2 font-goldman text-[20px] uppercase text-navy-200 md:py-4">{t("addBattleCaseWeaponCasesHeading")}</p>
              <div className="flex items-center">
                <div className="hidden h-[15px] gap-2 sm:flex">
                  {Array.from({ length: VERTICAL_RULE_COUNT }, (_, i) => (
                    <div key={i} className="h-full w-[1px] shrink-0 bg-navy-500" />
                  ))}
                </div>
              </div>
            </div>

            {isLoading ? (
              <div
                data-testid="add-bttl-round-case-cards-grid"
                className="grid w-full grid-cols-2 justify-items-center gap-2 overflow-x-hidden pb-1 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 lg:gap-6"
              >
                {Array.from({ length: SKELETON_COUNT }, (_, i) => (
                  <div
                    key={i}
                    className="aspect-[270/375] w-full animate-pulse rounded-[8px] bg-navy-700/60 md:rounded-[10px]"
                    aria-hidden
                  />
                ))}
              </div>
            ) : packs.length === 0 ? (
              <p className="py-8 text-center text-sm text-navy-300">{t("addBattleCaseNoMatchingFilters")}</p>
            ) : (
              <div
                data-testid="add-bttl-round-case-cards-grid"
                className="grid w-full grid-cols-2 justify-items-center gap-2 overflow-x-hidden pb-1 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 lg:gap-6"
              >
                {packs.map((pack) => {
                  const qty = packQuantities[pack.id] ?? 0;
                  const selected = qty > 0;
                  const priceLabel = formatUsd(pack.price);
                  const cardDescriptionText = `${priceLabel}. ${
                    selected
                      ? t("addBattleCaseCardAriaSelected").replace("{qty}", String(qty))
                      : t("addBattleCaseCardAriaNotSelected")
                  }`;
                  const stepperRegionId = `add-bttl-pack-stepper-${pack.id}`;
                  const titleId = `add-bttl-card-title-${pack.id}`;
                  const cardDescId = `add-bttl-card-desc-${pack.id}`;

                  return (
                    <div
                      key={pack.id}
                      data-testid="add-bttl-round-case-card"
                      data-state={selected ? "selected" : "default"}
                      className={`relative aspect-[270/375] w-full overflow-hidden rounded-[8px] border bg-no-repeat transition-all duration-200 md:rounded-[10px] ${
                        selected
                          ? "border-gold-400 shadow-case-hover hover:border-gold-400 hover:shadow-case-hover"
                          : "border-navy-800 hover:border-gold-400 hover:shadow-case-hover"
                      }`}
                    >
                      {pack.image ? (
                        <Image
                          alt=""
                          loading="lazy"
                          src={pack.image}
                          fill
                          className={`pointer-events-none absolute inset-0 z-0 object-cover ${selected ? "brightness-[25%]" : ""}`}
                          sizes="(max-width: 640px) 46vw, (max-width: 768px) 31vw, 18vw"
                          unoptimized
                        />
                      ) : (
                        <div
                          className={`pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-navy-600 via-navy-800 to-navy-900 ${selected ? "brightness-[25%]" : ""}`}
                          aria-hidden
                        />
                      )}
                      <span
                        data-testid="add-bttl-round-case-card-price"
                        className="absolute right-2 top-2 z-20 rounded bg-navy-800 px-3 py-1.5 text-xs font-semibold text-white"
                        aria-hidden
                      >
                        {priceLabel}
                      </span>
                      <span id={cardDescId} className="sr-only">
                        {cardDescriptionText}
                      </span>
                      <div
                        role="button"
                        tabIndex={0}
                        aria-pressed={selected}
                        aria-labelledby={titleId}
                        aria-describedby={selected ? `${cardDescId} ${stepperRegionId}` : cardDescId}
                        className={`absolute left-0 right-0 top-0 z-10 flex cursor-pointer flex-col outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-800 ${
                          /* 与步进器 bottom-2 + h-11 对齐，避免多余留白（原站 title 与 stepper 紧挨） */
                          selected ? "bottom-[calc(0.5rem+2.75rem)]" : "bottom-0"
                        }`}
                        onClick={() => onTogglePack(pack.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onTogglePack(pack.id);
                          }
                        }}
                      >
                        <p
                          id={titleId}
                          className={`relative z-10 mx-auto mt-auto flex h-[26.25px] w-full min-w-0 max-w-[112px] items-center justify-center overflow-hidden rounded bg-black px-1 text-center text-sm font-semibold uppercase leading-none text-white ${
                            selected ? "mb-0" : "mb-2"
                          }`}
                          title={pack.title}
                        >
                          <span className="min-w-0 max-w-full truncate">{pack.title}</span>
                        </p>
                      </div>
                      <div
                        id={stepperRegionId}
                        data-stepper
                        role="group"
                        className={`absolute bottom-2 left-2 right-2 z-20 h-11 items-center justify-between rounded-md bg-navy-900 ${
                          selected ? "flex" : "hidden"
                        }`}
                      >
                        <button
                          type="button"
                          data-testid="my-bttl-case-minus-btn-modal"
                          className="ml-1 flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-navy-700 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:pointer-events-none disabled:cursor-not-allowed"
                          aria-label={t("addBattleCasePackDecreaseAria")}
                          onClick={() => onBumpQuantity(pack.id, -1)}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          className="input mx-1.5 w-full min-w-0 rounded-md border-0 bg-transparent p-0 text-center text-xl text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          data-testid="my-bttl-case-card-counter-modal"
                          aria-label={t("addBattleCasePackQuantityInputAria").replace("{title}", pack.title)}
                          min={1}
                          max={MAX_PACK_QTY}
                          value={qty}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (!Number.isNaN(v)) onQuantityCommit(pack.id, v);
                          }}
                        />
                        <button
                          type="button"
                          data-testid="my-bttl-case-plus-btn-modal"
                          disabled={qty >= MAX_PACK_QTY}
                          className="mr-1 flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-navy-700 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-25"
                          aria-label={t("addBattleCasePackIncreaseAria")}
                          onClick={() => onBumpQuantity(pack.id, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
                {Array.from({ length: trailingPlaceholders }, (_, i) => (
                  <div
                    key={`grid-pad-${i}`}
                    className="relative flex aspect-[270/375] w-full flex-col items-center justify-center rounded-[8px] border border-solid border-navy-700/80 bg-dark-navy-500/20 bg-cover text-center md:rounded-[10px]"
                    aria-hidden
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
