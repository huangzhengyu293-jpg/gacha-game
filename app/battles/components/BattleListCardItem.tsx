'use client';

import React, { Fragment } from "react";
import type { BattleListCard } from "@/app/battles/battleListSource";
import { getModeVisual, getSpecialOptionIcons } from "@/app/battles/modeVisuals";

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
    button: string;
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

const SLOT_SPINNER_BASE_COLOR = "#5A5E62";
const SLOT_SPINNER_ACCENT_COLOR = "#7A8084";

function SlotSpinnerIcon() {
  return (
    <svg
      aria-hidden="true"
      className="w-8 h-8 animate-spin"
      viewBox="0 0 100 101"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
        fill={SLOT_SPINNER_BASE_COLOR}
      />
      <path
        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
        fill={SLOT_SPINNER_ACCENT_COLOR}
      />
    </svg>
  );
}

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

function Gallery({ items }: { items: Array<{ src: string; alt?: string }> }) {
  return (
    <div className="flex w-full overflow-hidden">
      <div className="rounded-lg m-[1px] flex gap-3 pr-2 md:pr-[282px] py-1.5" style={{ height: 108 }}>
        {items.map((g, i) => (
          <img
            key={`${g.src}-${i}`}
            alt={g.alt || ""}
            loading="lazy"
            width={63}
            height={96}
            decoding="async"
            src={g.src}
            style={{ color: "transparent", opacity: 0.32, cursor: "pointer" }}
          />
        ))}
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

const DefaultConnectorIcon = () => (
  <div className="h-[14px] w-[14px] text-gray-400 flex items-center justify-center">
    <svg viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.04798 4.77821C0.887314 4.61754 0.798011 4.39901 0.800175 4.1718L0.830497 0.988182C0.835516 0.461282 1.26142 0.0353727 1.78832 0.0303551L4.97194 3.84193e-05C5.19915 -0.00212522 5.41768 0.0871769 5.57835 0.247844L10.0071 4.67661L5.47675 9.20697L1.04798 4.77821ZM20.0141 0.0140547C19.7869 0.0118908 19.5683 0.101193 19.4077 0.261861L7.30719 12.3623L11.8376 16.8927L23.938 4.79223C24.0987 4.63156 24.188 4.41303 24.1858 4.18582L24.1555 1.0022C24.1505 0.475301 23.7246 0.049393 23.1977 0.0443749L20.0141 0.0140547ZM4.40089 12.8752C4.11764 12.592 3.6584 12.592 3.37515 12.8752L2.00749 14.2429C1.72424 14.5261 1.72424 14.9854 2.00749 15.2686L3.80254 17.0637C4.08579 17.3469 4.08579 17.8062 3.80254 18.0894L0.212439 21.6795C-0.0708128 21.9628 -0.0708128 22.422 0.212438 22.7053L1.49462 23.9874C1.77787 24.2707 2.23711 24.2707 2.52036 23.9874L6.11047 20.3973C6.39372 20.1141 6.85296 20.1141 7.13621 20.3973L8.93126 22.1924C9.21451 22.4756 9.67375 22.4756 9.957 22.1924L11.3247 20.8247C11.6079 20.5415 11.6079 20.0822 11.3247 19.799L4.40089 12.8752ZM13.6753 19.799C13.3921 20.0822 13.3921 20.5415 13.6753 20.8247L15.043 22.1924C15.3262 22.4756 15.7855 22.4756 16.0687 22.1924L17.8638 20.3973C18.147 20.1141 18.6063 20.1141 18.8895 20.3973L22.4796 23.9874C22.7629 24.2707 23.2221 24.2707 23.5054 23.9874L24.7876 22.7053C25.0708 22.422 25.0708 21.9628 24.7876 21.6795L21.1975 18.0894C20.9142 17.8062 20.9142 17.3469 21.1975 17.0637L22.9925 15.2686C23.2758 14.9854 23.2758 14.5261 22.9925 14.2429L21.6249 12.8752C21.3416 12.592 20.8824 12.592 20.5991 12.8752L13.6753 19.799Z"
        fill="currentColor"
      ></path>
    </svg>
  </div>
);

const VsIcon = () => (
  <div className="text-gray-400 font-bold text-xs tracking-widest px-2 select-none">VS</div>
);

export default function BattleListCardItem({
  card,
  labels,
  onPrimaryAction,
  buttonColors,
  isPendingBattle = false,
  onPendingAction,
}: BattleListCardItemProps) {
  const modeVisual = getModeVisual(card.mode, card.title);
  const optionIcons = getSpecialOptionIcons(card.specialOptions);
  const Connector = card.connectorStyle === "share" ? ShareConnectorIcon : DefaultConnectorIcon;
  const entryCost = formatCurrency(card.entryCost);
  const openedValue = formatCurrency(card.totalOpenedValue);
  const hasTeams = Boolean(card.isTeamBattle && card.teams?.length);
  const maxSlots = Math.max(card.participants.length, Number(card.raw?.num) || 0);

  const renderParticipants = () => {
    if (hasTeams && card.teams && card.teams.length > 0) {
      const teams = card.teams;
      return (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {teams.map((team, teamIdx) => (
            <Fragment key={team.id}>
              <div className="flex items-center gap-1">
                {team.members.map((member) => (
                  <Avatar key={member.id} src={member.avatar} alt={member.name} />
                ))}
              </div>
              {teamIdx < teams.length - 1 && <VsIcon />}
            </Fragment>
          ))}
        </div>
      );
    }

    const slotCount = maxSlots > 0 ? maxSlots : card.participants.length;
    const participantSlots = Array.from({ length: slotCount }, (_, index) => card.participants[index] ?? null);

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

  const buttonLabel = isPendingBattle ? "加入对战" : labels.button;
  const buttonColor = isPendingBattle
    ? {
        default: "#4299e1",
        hover: "#5ab0ff",
      }
    : buttonColors;
  const resolvedButtonColors = buttonColor ?? buttonColors ?? DEFAULT_BUTTON_COLORS;

  return (
    <div className="cursor-pointer">
      <div
        className="flex relative flex-col md:flex-row items-center p-4 rounded-lg cursor-pointer min-w-0 transition-colors"
        style={{ backgroundColor: "#22272B" }}
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
              {modeVisual.label}
            </p>
            {optionIcons.map((icon, idx) => (
              <span key={`option-${card.id}-${idx}`} className="flex items-center justify-center">
                {icon}
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
            <Gallery items={card.packImages} />
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
              {labels.opened}：{openedValue}
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

