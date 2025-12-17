'use client';

import React, { Fragment, useEffect, useRef } from "react";
import type { BattleListCard } from "@/app/battles/battleListSource";
import { getModeVisual, getSpecialOptionLabels } from "@/app/battles/modeVisuals";
import BattleConnectorIcon from "./BattleConnectorIcon";
import SlotSpinnerIcon from "./SlotSpinnerIcon";
import InfoTooltip from "@/app/components/InfoTooltip";
import { useI18n } from "@/app/components/I18nProvider";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const formatCurrency = (value: number) => currencyFormatter.format(value ?? 0);

type BattleListCardItemProps = {
  card: BattleListCard;
  labels: {
    cost: string;
    opened: string;
    preparing: string;
    waiting: string;
    inProgress: string;
    waitingBlocks: string;
    button: string;
    join: string;
    modeClassic: string;
    modeShare: string;
    modeSprint: string;
    modeJackpot: string;
    modeElimination: string;
  };
  onPrimaryAction?: () => void;
  buttonColors?: {
    default: string;
    hover: string;
  };
  isPendingBattle?: boolean;
  onPendingAction?: () => void;
};

const DEFAULT_BUTTON_COLORS = {
  default: "#34383C",
  hover: "#3C4044",
};

function EmptySlotAvatar() {
  return (
    <div
      className="flex m-[1px] rounded-full items-center content-center justify-center"
      style={{ height: 32, width: 32 }}
    >
      <SlotSpinnerIcon />
    </div>
  );
}

function Avatar({ src, alt = "", svg }: { src?: string; alt?: string; svg?: React.ReactNode }) {
  const sanitizedSrc = typeof src === "string" && src.trim().length > 0 ? src : undefined;

  return (
    <div className="overflow-hidden border rounded-full border-gray-700" style={{ borderWidth: 1 }}>
      <div className="relative rounded-full overflow-hidden" style={{ width: 32, height: 32 }}>
        {svg ? (
          svg
        ) : sanitizedSrc ? (
          <img
            alt={alt}
            loading="lazy"
            decoding="async"
            src={sanitizedSrc}
            style={{ position: "absolute", height: "100%", width: "100%", inset: 0, objectFit: "cover", color: "transparent" }}
          />
        ) : (
          <div
            className="flex m-[1px] rounded-full items-center content-center justify-center"
            style={{ height: 32, width: 32 }}
          >
            <SlotSpinnerIcon />
          </div>
        )}
      </div>
    </div>
  );
}

function Gallery({
  items,
  highlightedIndex,
  canScroll = true,
}: {
  items: Array<{ src: string; alt?: string }>;
  highlightedIndex?: number;
  canScroll?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRefs = useRef<Array<HTMLImageElement | null>>([]);
  const [tailSpacer, setTailSpacer] = React.useState(0);

  useEffect(() => {
    const resize = () => {
      if (!containerRef.current) return;
      // 给尾部留下整屏宽的空间，保证最后一项在小屏也能居中
      setTailSpacer(containerRef.current.clientWidth);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    if (!canScroll) return;
    if (highlightedIndex === undefined || highlightedIndex === null) return;
    const container = containerRef.current;
    const target = imgRefs.current[highlightedIndex];
    if (!container || !target) return;

    const containerWidth = container.clientWidth;
    const maxScroll = container.scrollWidth - containerWidth;
    const targetCenter = target.offsetLeft + target.clientWidth / 2;
    const desiredLeft = Math.max(0, Math.min(maxScroll, targetCenter - containerWidth / 2));

    container.scrollTo({ left: desiredLeft, behavior: "smooth" });
  }, [highlightedIndex, items.length, canScroll]);

  return (
    <div className="flex w-full overflow-hidden" ref={containerRef}>
      <div className="rounded-lg m-[1px] flex gap-3 pr-2 md:pr-[282px] py-1.5" style={{ height: 108 }}>
        {items.map((g, i) => {
          const isActive = highlightedIndex === i;
          return (
            <img
              key={`${g.src}-${i}`}
              ref={(el) => {
                imgRefs.current[i] = el;
              }}
              alt={g.alt || ""}
              loading="lazy"
              width={63}
              height={96}
              decoding="async"
              src={g.src}
              style={{
                color: "transparent",
                opacity: isActive ? 1 : 0.32,
                borderRadius: 8,
                cursor: "pointer",
                transition: "opacity 160ms ease",
              }}
            />
          );
        })}
        <div style={{ minWidth: tailSpacer }} />
      </div>
    </div>
  );
}

const ShareConnectorIcon = () => (
  <div className="h-[14px] w-[14px] text-gray-400 flex items-center justify-center">
    <svg viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9.1806 0.652964C9.50276 -0.217654 10.7342 -0.217655 11.0563 0.652963L13.2 6.44613C13.3013 6.71985 13.5171 6.93566 13.7908 7.03694L19.584 9.1806C20.4546 9.50276 20.4546 10.7342 19.584 11.0563L13.7908 13.2C13.5171 13.3013 13.3013 13.5171 13.2 13.7908L11.0563 19.584C10.7342 20.4546 9.50276 20.4546 9.1806 19.584L7.03694 13.7908C6.93566 13.5171 6.71985 13.3013 6.44613 13.2L0.652964 11.0563C-0.217654 10.7342 -0.217655 9.50276 0.652963 9.1806L6.44613 7.03694C6.71985 6.93566 6.93566 6.71985 7.03694 6.44613L9.1806 0.652964Z"
        fill="currentColor"
      ></path>
    </svg>
  </div>
);

export default function BattleListCardItem({
  card,
  labels,
  onPrimaryAction,
  buttonColors,
  isPendingBattle = false,
  onPendingAction,
}: BattleListCardItemProps) {
  const { t } = useI18n();
  const modeVisual = getModeVisual(card.mode, card.title);
  const optionLabels = getSpecialOptionLabels(card.specialOptions);
  const Connector = card.connectorStyle === "share" ? ShareConnectorIcon : BattleConnectorIcon;
  const entryCost = formatCurrency(card.entryCost);
  const openedValue = formatCurrency(card.totalOpenedValue);
  const modeLabel = (() => {
    switch (card.mode) {
      case "classic":
        return labels.modeClassic;
      case "share":
        return labels.modeShare;
      case "sprint":
        return labels.modeSprint;
      case "jackpot":
        return labels.modeJackpot;
      case "elimination":
        return labels.modeElimination;
      default:
        return modeVisual.label;
    }
  })();
  const hasTeams = Boolean(card.isTeamBattle && card.teams?.length);
  const maxSlots =
    card.participantSlots?.length && card.participantSlots.length > 0
      ? card.participantSlots.length
      : Math.max(card.participants.length, Number(card.raw?.num) || 0);

  const renderParticipants = () => {
    if (hasTeams && card.participants.length) {
      const membersPerTeam = card.teamStructure === "3v3" ? 3 : 2;
      const teamCount =
        card.teamStructure === "2v2v2"
          ? 3
          : Math.max(1, Math.floor(card.participants.length / membersPerTeam));
      const teams = Array.from({ length: teamCount }, (_, idx) => {
        const start = idx * membersPerTeam;
        const members = Array.from({ length: membersPerTeam }, (_, i) => card.participants[start + i] ?? null);
        return { id: `team-${idx}`, members };
      });
      return (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {teams.map((team, teamIdx) => (
            <Fragment key={team.id || `team-${teamIdx}`}>
              <div className="flex items-center gap-1">
                {team.members.map((member, memberIdx) =>
                  member ? (
                    <Avatar key={member.id || `member-${memberIdx}`} src={member.avatar} alt={member.name} />
                  ) : (
                    <EmptySlotAvatar key={`slot-${teamIdx}-${memberIdx}`} />
                  ),
                )}
              </div>
              {teamIdx < teams.length - 1 && <BattleConnectorIcon />}
            </Fragment>
          ))}
        </div>
      );
    }

    const slotCount = maxSlots > 0 ? maxSlots : Math.max(card.participants.length, 1);
    const participantSlots =
      card.participantSlots && card.participantSlots.length === slotCount
        ? card.participantSlots
        : Array.from({ length: slotCount }, (_, index) => card.participants[index] ?? null);

    return (
      <div className="flex flex-wrap items-center justify-center gap-1">
        {participantSlots.map((participant, index) => {
          const fallbackKey = `slot-${card.id}-${index}`;
          const participantKey =
            participant && participant.id !== undefined && participant.id !== null
              ? `${card.id}-${participant.id}`
              : fallbackKey;
          return (
            <Fragment key={participantKey}>
            {participant ? (
              <Avatar src={participant.avatar} alt={participant.name} />
            ) : (
              <EmptySlotAvatar />
            )}
            {index < participantSlots.length - 1 && <Connector />}
          </Fragment>
          );
        })}
      </div>
    );
  };

  const buttonLabel = isPendingBattle ? labels.join : labels.button;
  const isWaitingState = card.status === 0;
  const isTimeBasedInProgress =
    card.status === 2 &&
    typeof card.currentRound === "number" &&
    typeof card.totalRounds === "number" &&
    card.currentRound <= card.totalRounds;
  const statusText = (() => {
    if (isWaitingState) return labels.waiting; // 等待玩家
    if (card.status === 1) return labels.waitingBlocks; // 等待区块中
    if (card.status === 2) {
      if (typeof card.currentRound !== "number" || typeof card.totalRounds !== "number") {
        return labels.inProgress;
      }
      return isTimeBasedInProgress ? labels.inProgress : `${labels.opened}：${openedValue}`;
    }
    return `${labels.opened}：${openedValue}`;
  })();
  const buttonColor = isPendingBattle
    ? {
        default: "#4299e1",
        hover: "#5ab0ff",
      }
    : buttonColors;
  const resolvedButtonColors = buttonColor ?? buttonColors ?? DEFAULT_BUTTON_COLORS;
  const handleCardClick = () => {
    if (isPendingBattle && onPendingAction) {
      onPendingAction();
      return;
    }
    if (onPrimaryAction) {
      onPrimaryAction();
    }
  };

  return (
    <div className="cursor-pointer">
      <div
        className="flex relative flex-col md:flex-row items-center p-4 rounded-lg cursor-pointer min-w-0 transition-colors"
        style={{ backgroundColor: "#22272B" }}
        onClick={handleCardClick}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.backgroundColor = "#2A2D35";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.backgroundColor = "#22272B";
        }}
      >
        <div
          className="absolute top-0 left-[35%] md:left-0 h-1.5 md:h-full w-[30%] md:w-1.5 rounded-b-lg md:rounded-r-none md:rounded-l-lg"
          style={{ backgroundColor: modeVisual.accentColor }}
        />

        <div className="flex flex-col items-center gap-2 w-full md:w-[21rem] min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-base font-extrabold" style={{ color: "#7A8084" }}>
              {modeLabel}
            </p>
            {optionLabels.map((option, idx) => (
              <span key={`option-${card.id}-${idx}`} className="flex items-center justify-center">
                <InfoTooltip
                  content={t(option.key)}
                  trigger={option.icon}
                  buttonClassName="inline-flex items-center justify-center cursor-pointer p-0 border-0 bg-transparent hover:bg-transparent"
                  usePortal={true}
                />
              </span>
            ))}
          </div>

          {renderParticipants()}

          <div className="flex items-center gap-2">
            <p className="text-sm font-extrabold" style={{ color: "#7A8084" }}>
              {labels.cost}：
            </p>
            <p className="text-sm text-white font-extrabold">{entryCost}</p>
          </div>
        </div>

        <div className="flex flex-1 min-w-0 self-stretch md:self-center py-1">
          <div className="flex relative w-full rounded-lg overflow-hidden" style={{ backgroundColor: "#0F1012" }}>
            <Gallery
              items={card.packImages}
              highlightedIndex={card.currentPackIndex}
              canScroll={card.status === 2}
            />
            <div className="flex absolute justify-center items-center top-0 right-0 gap-1 py-[2.5px] px-1 m-1 rounded" style={{ backgroundColor: "#232529", color: "#FFFFFF" }}>
              <div className="size-3 text-white">
                <svg viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.155 15.8964V2.37359C13.155 1.06143 12.0936 0 10.7814 0H2.37359C1.06143 0 0 1.06143 0 2.37359V15.8964C0 17.2085 1.06143 18.27 2.37359 18.27H10.7814C12.0936 18.27 13.155 17.2085 13.155 15.8964Z" fill="currentColor"></path>
                  <path d="M15.5286 2.00584L13.9908 1.72168C14.0326 1.93062 14.0577 2.15628 14.0577 2.37358V15.8964C14.0577 17.7016 12.5867 19.1726 10.7814 19.1726H7.95654L12.1688 19.9582C13.4559 20.2006 14.6929 19.3481 14.9352 18.061L17.4175 4.76388C17.6598 3.4768 16.8074 2.23986 15.5203 1.99748L15.5286 2.00584Z" fill="currentColor"></path>
                </svg>
              </div>
              <p className="text-sm text-white font-bold">{card.packCount}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 w-full md:w-[12rem] overflow-hidden min-w-0">
          <div className="overflow-hidden max-w-full px-4">
            <p className="text-base font-bold text-center truncate" style={{ color: "#7A8084" }}>
              {statusText}
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base text-white font-bold select-none h-10 px-6 w-40 m-[1px]"
            style={{ backgroundColor: resolvedButtonColors.default }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = resolvedButtonColors.hover;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = resolvedButtonColors.default;
            }}
            onClick={isPendingBattle && onPendingAction ? onPendingAction : onPrimaryAction}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

