"use client";

import Link from "next/link";
import { Fragment } from "react";
import type { BattleListCard, ParticipantPreview } from "@/app/battles/battleListSource";
import { useI18n } from "@/app/components/I18nProvider";
import { battleDetailPath } from "@/app/lib/battleRoutes";

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

function MobileRoundBadge({ packOpenCount, activeRow }: { packOpenCount: number; activeRow: boolean }) {
  return (
    <div className="relative flex h-[50px] w-[50px] flex-shrink-0 items-center justify-center rounded-full text-sm transition">
      <svg className="icon absolute left-0 top-0 h-full w-full" viewBox="0 0 74 82" aria-hidden>
        <path
          d="M33.25 1.74254C35.5705 0.402789 38.4295 0.40279 40.75 1.74254L69.1231 18.1237C71.4436 19.4635 72.8731 21.9394 72.8731 24.6189V57.3813C72.8731 60.0608 71.4436 62.5368 69.1231 63.8765L40.75 80.2577C38.4295 81.5975 35.5705 81.5975 33.25 80.2577L4.87693 63.8765C2.55643 62.5368 1.12693 60.0608 1.12693 57.3813V24.6189C1.12693 21.9394 2.55643 19.4635 4.87693 18.1237L33.25 1.74254Z"
          fill={activeRow ? "#0D0D0F" : "#324600"}
          stroke={activeRow ? "#1F1F27" : "#324600"}
        />
      </svg>
      <div
        className="absolute left-[7%] top-1/2 h-px w-[86%] -translate-y-1/2"
        style={{ backgroundColor: activeRow ? "rgb(46, 50, 68)" : "rgb(116, 144, 44)" }}
        aria-hidden
      />
      <div className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2">
        <svg className="icon h-full w-full" viewBox="0 0 56 62" aria-hidden>
          <path
            d="M25.25 1.66531C26.9517 0.682827 29.0483 0.682827 30.75 1.66531L52.0298 13.9512C53.7315 14.9337 54.7798 16.7494 54.7798 18.7143V43.2861C54.7798 45.2511 53.7315 47.0668 52.0298 48.0493L30.75 60.3352C29.0483 61.3177 26.9517 61.3177 25.25 60.3352L3.9702 48.0493C2.26849 47.0668 1.2202 45.2511 1.2202 43.2861V18.7143C1.2202 16.7494 2.26849 14.9337 3.9702 13.9512L25.25 1.66531Z"
            fill={activeRow ? "#1F1F27" : "#324600"}
            stroke={activeRow ? "#2E3244" : "#74902C"}
          />
        </svg>
      </div>
      <div
        data-testid="single-bttl-rounds-counter"
        className="z-10 flex h-[56%] w-[56%] items-center justify-center overflow-hidden text-center font-bold"
        style={{ color: activeRow ? "rgb(184, 188, 208)" : "rgb(214, 255, 111)" }}
      >
        {packOpenCount}
      </div>
    </div>
  );
}

export function CaseBattleListMobileCard({ card }: { card: BattleListCard }) {
  const { t } = useI18n();
  const activeRow = card.status !== 0;
  const joinLabel = buildJoinLabel(card, t);
  const cardShell = activeRow ? "bg-navy-700/50" : "bg-navy-700";
  const labelFor = (name: string) => fillTpl(t("caseBattleListPackImageAlt"), { name });

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
      <IconSummonSlot className="icon h-[24px] w-[24px] scale-75 text-lime-300 transition-transform duration-200 group-hover:scale-100 sm:h-[32px] sm:w-[32px]" />
    </button>
  );

  const teams = card.teams;
  const hasTeams = Boolean(card.isTeamBattle && teams && teams.length >= 2);

  const playersBlock = hasTeams && teams ? (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <div className="flex min-w-0 items-center justify-center gap-0.5 sm:gap-2 sm:rounded-full sm:bg-navy-800 sm:p-1">
        {teams[0].members.map((m, mi) =>
          m ? renderFilled(m, `${teams[0].id}-m-${mi}`) : renderEmpty(`${teams[0].id}-e-${mi}`),
        )}
      </div>
      <p className="shrink-0 text-xs font-bold uppercase text-navy-200">{t("caseBattleListVs")}</p>
      <div className="flex min-w-0 items-center justify-center gap-0.5 sm:gap-2 sm:rounded-full sm:bg-navy-800 sm:p-1">
        {teams[1].members.map((m, mi) =>
          m ? renderFilled(m, `${teams[1].id}-m-${mi}`) : renderEmpty(`${teams[1].id}-e-${mi}`),
        )}
      </div>
    </div>
  ) : (
    (() => {
      const slotCount =
        card.participantSlots.length > 0
          ? card.participantSlots.length
          : Math.max(card.participants.length, Number(card.raw?.num) || 0, 1);
      const slots =
        card.participantSlots.length === slotCount
          ? card.participantSlots
          : Array.from({ length: slotCount }, (_, index) => card.participants[index] ?? null);
      return (
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <div
            className={`flex min-w-0 flex-wrap items-center justify-center gap-0.5 sm:gap-2 sm:rounded-full sm:p-1 ${activeRow ? "" : "sm:bg-navy-800"}`}
          >
            {slots.map((p, i) => (
              <Fragment key={`${card.id}-m-${i}`}>
                {p ? renderFilled(p, `${card.id}-p-${i}`) : renderEmpty(`${card.id}-e-${i}`)}
              </Fragment>
            ))}
          </div>
        </div>
      );
    })()
  );

  return (
    <div className={`relative mb-2 w-full min-w-0 rounded-md ${cardShell}`}>
      <div className="relative z-10 flex flex-col gap-2.5 p-3">
        <div className="flex items-center gap-1.5">
          <MobileRoundBadge packOpenCount={card.packCount} activeRow={activeRow} />
          <div className="hide-scrollbar flex flex-1 gap-1.5 overflow-x-auto">
            {card.packAggregates.map((row) => (
              <div key={row.boxId} className="relative h-10 w-[29px] flex-shrink-0 overflow-hidden rounded-sm">
                <img
                  alt={labelFor(row.name)}
                  src={row.imageSrc}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          {playersBlock}
          <Link
            data-testid="bttl-list-join-view-btn"
            href={battleDetailPath(card.id)}
            className={`button flex h-[42px] w-[160px] shrink-0 items-center justify-center rounded px-8 py-2 text-[10px] font-semibold uppercase transition-colors ${
              activeRow
                ? "bg-navy-600 text-white hover:bg-navy-500"
                : "border border-lime-300 bg-grass-green text-lime-300 hover:border-lime-400 hover:bg-[#3d5200] hover:text-lime-400"
            }`}
          >
            {activeRow ? (
              <>
                <IconWatchBattle className="mr-2 h-5 w-5 shrink-0 text-white" />
                <span>{t("caseBattleListWatch")}</span>
              </>
            ) : (
              <>
                <IconJoinBattle className="mr-2 h-5 w-5 shrink-0 text-lime-300" />
                <span>{joinLabel}</span>
              </>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
