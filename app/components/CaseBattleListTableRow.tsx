"use client";

import Link from "next/link";
import { Fragment } from "react";
import type { BattleListCard, ParticipantPreview } from "@/app/battles/battleListSource";
import { computeScenarioPackTotalUsd } from "@/app/battles/battleListSource";
import { useI18n } from "@/app/components/I18nProvider";
import { battleDetailPath } from "@/app/lib/battleRoutes";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function formatUsd(value: number) {
  return currencyFormatter.format(value ?? 0);
}

function fillTpl(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
}

function buildJoinLabel(card: BattleListCard, t: ReturnType<typeof useI18n>["t"]) {
  if (card.isTeamBattle && card.teams && card.teams.length >= 2) {
    const a = card.teams[0].members.length;
    const b = card.teams[1].members.length;
    return fillTpl(t("caseBattleListJoinTeamVersus"), { teamA: String(a), teamB: String(b) });
  }
  if (card.isTeamBattle && card.teamStructure) {
    return fillTpl(t("caseBattleListJoinWithStructure"), { structure: card.teamStructure });
  }
  return t("caseBattleListJoinSolo");
}

function CaseBattleListPackCard({
  name,
  qty,
  src,
  alt,
  activeRow,
  showQty = true,
}: {
  name: string;
  qty: number;
  src: string;
  alt: string;
  activeRow: boolean;
  showQty?: boolean;
}) {
  return (
    <div
      data-testid="bttl-scenario-case-name"
      className="relative flex aspect-[270/375] h-full w-[60px] max-w-[85px] flex-shrink-0 flex-col items-center overflow-hidden rounded-sm pb-2 text-xs uppercase"
    >
      <img alt={alt} src={src} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"
        aria-hidden
      />
      {showQty ? (
        <div className="relative flex w-full justify-start">
          <div
            className={`flex h-5 w-5 items-center justify-center rounded-br-sm rounded-tl-sm ${activeRow ? "bg-navy-500/50" : "bg-navy-500"}`}
          >
            <p className="text-xs font-semibold leading-none text-white">{qty}</p>
          </div>
        </div>
      ) : null}
      <div
        className={`relative mt-auto max-w-[90%] overflow-hidden break-words rounded-sm px-1.5 py-1 text-center text-[9px] font-semibold leading-none text-white ${activeRow ? "bg-navy-700/50" : "bg-navy-700"}`}
      >
        <div className="line-clamp-1">{name}</div>
      </div>
    </div>
  );
}

function CaseBattleListPacksScroll({
  packAggregates,
  activeRow,
  labelFor,
  showQty,
}: {
  packAggregates: BattleListCard["packAggregates"];
  activeRow: boolean;
  labelFor: (name: string) => string;
  showQty: boolean;
}) {
  const fadeTo = activeRow ? "to-[#1F1F27]" : "to-navy-700";
  return (
    <>
      {packAggregates.map((row) => (
        <CaseBattleListPackCard
          key={row.boxId}
          name={row.name}
          qty={row.quantity}
          src={row.imageSrc}
          alt={labelFor(row.name)}
          activeRow={activeRow}
          showQty={showQty}
        />
      ))}
      <div
        className={`pointer-events-none absolute left-0 top-0 z-10 hidden h-full w-20 bg-gradient-to-l from-transparent opacity-0 transition-opacity duration-200 ${fadeTo}`}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute right-0 top-0 z-10 hidden h-full w-20 bg-gradient-to-r from-transparent opacity-100 transition-opacity duration-200 ${fadeTo}`}
        aria-hidden
      />
    </>
  );
}

function IconJoinBattle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 39 38" fill="currentColor" aria-hidden>
      <path d="m9.391 21.312 7.068 7.072-2.826 2.828 2.83 2.83-2.828 2.828-4.95-4.95-5.658 5.658L.2 34.75l5.658-5.66-4.95-4.948 2.828-2.828 2.828 2.826 2.826-2.828h.002ZM1.291.5l7.092.006 23.634 23.636 2.83-2.828 2.828 2.828-4.948 4.95 5.656 5.658-2.828 2.828-5.658-5.658-4.95 4.95-2.828-2.828 2.828-2.83-23.65-23.65L1.291.5Zm28.914 0 7.086.006.004 7.046-8.106 8.104-7.072-7.07L30.205.5Z" />
    </svg>
  );
}

function IconWatchBattle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        fill="currentColor"
        d="M10 4.167c-6.36 0-8.272 5.514-8.29 5.57L1.622 10l.088.263c.018.056 1.93 5.57 8.29 5.57 6.361 0 8.273-5.514 8.29-5.57L18.38 10l-.088-.263c-.018-.056-1.93-5.57-8.29-5.57zm0 9.166A3.337 3.337 0 016.667 10 3.337 3.337 0 0110 6.667 3.337 3.337 0 0113.334 10 3.337 3.337 0 0110 13.333z"
      />
      <path fill="currentColor" d="M10 8.333A1.69 1.69 0 008.333 10 1.69 1.69 0 0010 11.667 1.69 1.69 0 0011.666 10 1.69 1.69 0 0010 8.333z" />
    </svg>
  );
}

function IconSummonSlot({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        fill="currentColor"
        d="M17.833 6.166c-3.216-3.216-8.45-3.216-11.666 0-3.217 3.217-3.217 8.45 0 11.667 3.216 3.216 8.45 3.216 11.666 0 3.217-3.216 3.217-8.45 0-11.667zm-5.008 9.917h-1.65v-3.258H7.917v-1.65h3.258V7.916h1.65v3.259h3.258v1.65h-3.258v3.258z"
      />
    </svg>
  );
}

function TablePlayersCell({ card, activeRow }: { card: BattleListCard; activeRow: boolean }) {
  const { t } = useI18n();

  const renderFilled = (member: ParticipantPreview, key: string) => (
    <div key={key} className="relative flex items-center justify-center">
      <div className="h-[21px] w-[21px] rounded-full border-2 border-[#433519] p-[3px] sm:h-10 sm:w-10">
        {member.avatar ? (
          <img
            src={member.avatar}
            alt={member.name || t("unknownPlayer")}
            loading="lazy"
            decoding="async"
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <div className="h-full w-full rounded-full bg-navy-600" aria-hidden />
        )}
      </div>
    </div>
  );

  const renderEmpty = (key: string) => (
    <button
      key={key}
      type="button"
      className="group flex h-[21px] w-[21px] cursor-pointer items-center justify-center rounded-full bg-grass-green sm:h-10 sm:w-10"
      aria-label={t("summonBot")}
    >
      <IconSummonSlot className="icon h-[24px] w-[24px] scale-75 text-lime-300 transition-transform duration-200 group-hover:scale-100 lg:h-[32px] lg:w-[32px]" />
    </button>
  );

  const hasTeams = Boolean(card.isTeamBattle && card.teams?.length);

  if (hasTeams && card.teams) {
    return (
      <div className={`flex flex-wrap justify-center ${activeRow ? "gap-2 lg:gap-4" : "gap-2 lg:gap-[14px]"}`}>
        {card.teams.map((team) => (
          <div
            key={team.id}
            className="flex items-center justify-center gap-0.5 sm:gap-2 sm:rounded-full sm:bg-navy-800 sm:p-1"
          >
            {team.members.map((m, mi) =>
              m ? renderFilled(m, `${team.id}-m-${mi}`) : renderEmpty(`${team.id}-e-${mi}`),
            )}
          </div>
        ))}
      </div>
    );
  }

  const slotCount =
    card.participantSlots.length > 0
      ? card.participantSlots.length
      : Math.max(card.participants.length, Number(card.raw?.num) || 0, 1);
  const slots =
    card.participantSlots.length === slotCount
      ? card.participantSlots
      : Array.from({ length: slotCount }, (_, index) => card.participants[index] ?? null);

  return (
    <div className={`flex flex-wrap justify-center ${activeRow ? "gap-2 lg:gap-4" : "gap-2 lg:gap-[14px]"}`}>
      <div
        className={`flex items-center justify-center gap-0.5 sm:gap-2 sm:rounded-full sm:p-1 ${activeRow ? "" : "sm:bg-navy-800"}`}
      >
        {slots.map((p, i) => (
          <Fragment key={`${card.id}-slot-${i}`}>{p ? renderFilled(p, `${card.id}-p-${i}`) : renderEmpty(`${card.id}-e-${i}`)}</Fragment>
        ))}
      </div>
    </div>
  );
}

export function CaseBattleListTableRow({
  card,
  catalogBeanById,
}: {
  card: BattleListCard;
  catalogBeanById: Map<string, number>;
}) {
  const { t } = useI18n();
  const joinLabel = buildJoinLabel(card, t);
  const scenarioTotal = computeScenarioPackTotalUsd(card, catalogBeanById);
  const priceLabel = formatUsd(scenarioTotal);
  const packOpenCount = card.packCount;
  const activeRow = card.status !== 0;
  const rowCellBg = activeRow ? "bg-navy-700/50" : "bg-navy-700";

  const packLabel = (name: string) => fillTpl(t("caseBattleListPackImageAlt"), { name });

  return (
    <>
      <tr className="relative z-0 max-xl:mb-0 xl:mb-[2px]" style={{ opacity: 1 }}>
      <td
        className={`cb-c-round relative align-middle rounded-tl-lg max-xl:rounded-bl-none xl:rounded-bl-lg ${rowCellBg}`}
      >
        <div className="relative mx-3 flex h-[50px] w-[50px] items-center justify-center rounded-full text-sm transition">
          <svg className="icon absolute left-0 top-0 h-full w-full" viewBox="0 0 74 82" aria-hidden>
            <path
              d="M33.25 1.74254C35.5705 0.402789 38.4295 0.40279 40.75 1.74254L69.1231 18.1237C71.4436 19.4635 72.8731 21.9394 72.8731 24.6189V57.3813C72.8731 60.0608 71.4436 62.5368 69.1231 63.8765L40.75 80.2577C38.4295 81.5975 35.5705 81.5975 33.25 80.2577L4.87693 63.8765C2.55643 62.5368 1.12693 60.0608 1.12693 57.3813V24.6189C1.12693 21.9394 2.55643 19.4635 4.87693 18.1237L33.25 1.74254Z"
              fill={activeRow ? "#4D2858" : "#324600"}
              stroke={activeRow ? "#4D2858" : "#324600"}
            />
          </svg>
          <div
            className="absolute left-[7%] top-1/2 h-px w-[86%] -translate-y-1/2"
            style={{
              backgroundColor: activeRow ? "rgb(154, 80, 176)" : "rgb(116, 144, 44)",
            }}
            aria-hidden
          />
          <div className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2">
            <svg className="icon h-full w-full" viewBox="0 0 56 62" aria-hidden>
              <path
                d="M25.25 1.66531C26.9517 0.682827 29.0483 0.682827 30.75 1.66531L52.0298 13.9512C53.7315 14.9337 54.7798 16.7494 54.7798 18.7143V43.2861C54.7798 45.2511 53.7315 47.0668 52.0298 48.0493L30.75 60.3352C29.0483 61.3177 26.9517 61.3177 25.25 60.3352L3.9702 48.0493C2.26849 47.0668 1.2202 45.2511 1.2202 43.2861V18.7143C1.2202 16.7494 2.26849 14.9337 3.9702 13.9512L25.25 1.66531Z"
                fill={activeRow ? "#4D2858" : "#324600"}
                stroke={activeRow ? "#9A50B0" : "#74902C"}
              />
            </svg>
          </div>
          <div
            data-testid="single-bttl-rounds-counter"
            className="z-10 flex h-[56%] w-[56%] items-center justify-center overflow-hidden text-center font-bold"
            style={{ color: activeRow ? "rgb(206, 130, 227)" : "rgb(214, 255, 111)" }}
          >
            {packOpenCount}
          </div>
        </div>
      </td>

      <td
        className={`cb-c-packs relative max-w-[450px] max-xl:px-0 max-xl:align-middle pl-3 pr-1 xl:max-w-[280px] 2xl:max-w-[450px] xl:py-[0.625rem] xl:align-middle ${rowCellBg}`}
      >
        <div className="relative h-full min-h-0 xl:mr-2">
          <div className="case-battle-list-packs-cell-inner relative flex h-full gap-x-2 overflow-x-auto hide-scrollbar">
            <CaseBattleListPacksScroll
              packAggregates={card.packAggregates}
              activeRow={activeRow}
              labelFor={packLabel}
              showQty
            />
          </div>
        </div>
      </td>

      <td className={`cb-c-value relative p-0 align-middle ${rowCellBg}`}>
        <div className="mx-5 flex h-full min-h-0 w-[132px] max-xl:min-h-[var(--cb-list-pack-row-height)] items-center justify-center rounded-bl-lg rounded-tl-lg">
          <div
            data-testid="batttle-list-bttl-cost"
            className={`w-fit rounded px-3 py-1.5 text-center text-xs font-semibold lg:text-sm ${activeRow ? "bg-navy-600 text-navy-200" : "bg-grass-green text-lime-300"}`}
          >
            <span>{priceLabel}</span>
          </div>
        </div>
      </td>

      <td className={`cb-c-players relative w-full align-middle xl:w-auto ${rowCellBg}`}>
        <div className="flex max-xl:h-full max-xl:min-h-[var(--cb-list-pack-row-height)] items-center justify-center xl:h-auto xl:min-h-0 xl:w-[400px]">
          <TablePlayersCell card={card} activeRow={activeRow} />
        </div>
      </td>

      <td className={`cb-c-status min-w-0 overflow-hidden p-0 align-middle ${rowCellBg}`}>
        <div
          className={`relative h-full min-h-0 w-full min-w-0 overflow-hidden border-l max-xl:min-h-[var(--cb-list-pack-row-height)] max-xl:rounded-tr-lg xl:rounded-br-md xl:rounded-tr-md ${activeRow ? "border-transparent" : "border-navy-700"}`}
        >
          <div className="relative z-10 flex w-full min-w-0 max-xl:h-full max-xl:min-h-[var(--cb-list-pack-row-height)] items-center justify-center px-2 xl:h-auto xl:min-h-0">
            <Link
              data-testid="bttl-list-join-view-btn"
              className={`button mx-auto flex h-[42px] w-[200px] items-center justify-center rounded px-9 py-2.5 text-xs font-bold uppercase transition-colors ${
                activeRow
                  ? "bg-navy-600 text-white hover:bg-navy-500"
                  : "border border-lime-300 bg-grass-green text-lime-300 hover:border-lime-400 hover:bg-[#3d5200] hover:text-lime-400"
              }`}
              href={battleDetailPath(card.id)}
            >
              {activeRow ? (
                <>
                  <IconWatchBattle className="icon mr-2 h-5 w-5 shrink-0" />
                  <span>{t("caseBattleListWatch")}</span>
                </>
              ) : (
                <>
                  <IconJoinBattle className="icon mr-2 h-5 w-5 shrink-0" />
                  <span>{joinLabel}</span>
                </>
              )}
            </Link>
          </div>
        </div>
      </td>
    </tr>

      <tr className="case-battle-list-row-packs relative z-[1] -mt-px xl:hidden" style={{ opacity: 1 }}>
        <td colSpan={5} className={`max-w-[97vw] rounded-b-lg p-0 ${rowCellBg}`}>
          <div className="relative rounded-b-lg px-5 py-3">
            <div className="case-battle-list-packs-cell-inner relative flex h-full gap-x-2 overflow-x-auto hide-scrollbar">
              <CaseBattleListPacksScroll
                packAggregates={card.packAggregates}
                activeRow={activeRow}
                labelFor={packLabel}
                showQty={false}
              />
            </div>
          </div>
        </td>
      </tr>
      <tr aria-hidden className="case-battle-list-entry-gap">
        <td colSpan={5} className="h-[2px] max-h-[2px] overflow-hidden border-0 bg-navy-800 p-0" />
      </tr>
    </>
  );
}
