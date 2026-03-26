"use client";

import { offset } from "@floating-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, forwardRef, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { getUserInviter, type ReferralDownlineRange, type ReferralDownlineRow } from "@/api/referrals";
import DatePickerField from "../components/DatePickerField";
import DealsPaginationBar from "../components/DealsPaginationBar";
import LoadingSpinnerIcon from "../components/icons/LoadingSpinner";
import { useI18n } from "../components/I18nProvider";
import { showGlobalToast } from "../components/ToastProvider";
import { useAuth } from "@/app/hooks/useAuth";

const PINGFANG = '"PingFang SC", "PingFang SC", sans-serif';
const INVITE_BAR_FILL = "color-mix(in srgb, rgb(131, 133, 153) 10%, rgb(35, 39, 44))";
const TILE_EDGE = "linear-gradient(180deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0))";
const TILE_FILL = "color-mix(in srgb, rgb(131, 133, 153) 10%, rgb(35, 39, 44))";

function FissionSectionCard({
  title,
  children,
  contentClassName,
  desktopCardHeight = 596,
}: {
  title: string;
  children?: ReactNode;
  contentClassName?: string;
  desktopCardHeight?: 596 | 360 | 913 | "auto";
}) {
  const contentCls =
    contentClassName ?? "min-h-0 flex-1 overflow-auto px-6 max-sm:px-3";

  const heightClass =
    desktopCardHeight === "auto"
      ? "h-auto min-h-[360px] max-sm:min-h-0"
      : desktopCardHeight === 360
        ? "h-[360px] max-sm:h-auto max-sm:min-h-[240px]"
        : desktopCardHeight === 913
          ? "h-[913px] max-sm:h-auto max-sm:min-h-[320px]"
          : "h-[596px] max-sm:h-auto max-sm:min-h-[320px]";

  return (
    <div className="relative w-full min-w-0">
      <div
        className={`relative flex w-full flex-col rounded-[0_40px_40px_40px] border border-white/[0.04] bg-[#23272C] backdrop-blur-[10px] max-sm:rounded-[0_24px_24px_24px] max-sm:pb-4 ${heightClass}`}
      >
        <div
          className="absolute left-0 top-0 z-10 flex h-[70px] w-[250px] -translate-y-1/2 items-center justify-center bg-[#161616] text-[28px] font-semibold leading-[40px] text-white max-sm:left-3 max-sm:h-14 max-sm:w-auto max-sm:max-w-[min(100%,240px)] max-sm:px-4 max-sm:text-base max-sm:leading-[22px]"
          style={{
            borderRadius: "100px 100px 8px 100px",
            fontFamily: '"PingFang SC", "PingFang SC", sans-serif',
            fontStyle: "normal",
          }}
        >
          {title}
        </div>
        <div className={contentCls}>{children}</div>
      </div>
    </div>
  );
}

function toClipboardUrl(displayUrl: string) {
  const trimmed = displayUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function FissionInviteLinkBar({ inviteUrl = "flamedraw.com/r/ABCD12345678910111213" }: { inviteUrl?: string }) {
  const { t } = useI18n();

  const onCopy = useCallback(async () => {
    const raw = inviteUrl.trim();
    if (!raw || raw === "—") {
      showGlobalToast({
        title: t("copyFailed"),
        description: t("pleaseCopyInviteLinkManually"),
        variant: "error",
        durationMs: 2000,
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(toClipboardUrl(inviteUrl));
      showGlobalToast({
        title: t("copySuccess"),
        description: t("inviteLinkCopiedToClipboard"),
        variant: "success",
        durationMs: 2000,
      });
    } catch {
      showGlobalToast({
        title: t("copyFailed"),
        description: t("pleaseCopyInviteLinkManually"),
        variant: "error",
        durationMs: 2000,
      });
    }
  }, [inviteUrl, t]);

  return (
    <div
      className="mx-auto h-[82px] w-full max-w-[1172px] shrink-0 rounded-[45px] p-px max-sm:h-auto max-sm:min-h-[72px] max-sm:rounded-[24px]"
      style={{
        background: "linear-gradient(180deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0))",
      }}
    >
      <div
        className="flex h-full min-h-0 w-full flex-row items-center justify-between gap-0 rounded-[44px] px-10 max-sm:flex-col max-sm:gap-3 max-sm:rounded-[23px] max-sm:px-4 max-sm:py-3 max-sm:justify-between"
        style={{ background: INVITE_BAR_FILL }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-5 max-sm:gap-3">
          <img
            src="/images/lianjie.png"
            alt=""
            width={30}
            height={30}
            className="size-[30px] shrink-0 object-contain max-sm:size-6"
          />
          <p
            className="min-w-0 truncate text-[22px] leading-[22px] text-white max-sm:break-all max-sm:text-[13px] max-sm:leading-[18px]"
            style={{
              fontFamily: PINGFANG,
              fontWeight: 400,
              fontStyle: "normal",
              textAlign: "left",
            }}
          >
            {inviteUrl}
          </p>
        </div>
        <div className="flex w-auto shrink-0 items-center max-sm:w-full max-sm:justify-end max-sm:border-t max-sm:border-white/10 max-sm:pt-3">
          <div
            className="h-6 w-0 shrink-0 border-l border-[rgba(255,255,255,0.19)] max-sm:hidden"
            aria-hidden
          />
          <button
            type="button"
            onClick={onCopy}
            className="ml-[25px] cursor-pointer border-0 bg-transparent p-0 text-[22px] leading-[22px] tracking-[1px] text-white transition-opacity hover:opacity-90 max-sm:ml-0 max-sm:text-[15px] max-sm:leading-5 max-sm:tracking-normal"
            style={{
              fontFamily: PINGFANG,
              fontWeight: 600,
              fontStyle: "normal",
              textAlign: "left",
            }}
          >
            {t("copyLinkLabel")}
          </button>
        </div>
      </div>
    </div>
  );
}

type TileUnit = "copy" | "people" | "dollar" | "kindling";
type MyDataTitleKey =
  | "fissionStatReferralCodeTitle"
  | "fissionStatInviteCountTitle"
  | "fissionStatSubRechargeTitle"
  | "fissionStatSubFlowTitle"
  | "fissionStatKindlingTitle";

function StatUnit({
  unit,
  t,
  onCopy,
}: {
  unit: TileUnit;
  t: ReturnType<typeof useI18n>["t"];
  onCopy: () => void;
}) {
  const unitStyle = {
    fontFamily: PINGFANG,
    fontWeight: 400,
    fontSize: 18,
    lineHeight: "24px",
    height: 24,
    color: "#FFFFFF",
    textAlign: "left" as const,
    fontStyle: "normal" as const,
  };

  if (unit === "copy") {
    return (
      <button
        type="button"
        onClick={onCopy}
        className="shrink-0 cursor-pointer border-0 bg-transparent p-0 underline decoration-solid"
        style={{ ...unitStyle, textDecorationLine: "underline" }}
      >
        {t("fissionUnitCopy")}
      </button>
    );
  }
  if (unit === "people") {
    return (
      <span className="shrink-0" style={unitStyle}>
        {t("fissionUnitPeople")}
      </span>
    );
  }
  if (unit === "dollar") {
    return (
      <span className="shrink-0" style={unitStyle}>
        $
      </span>
    );
  }
  return (
    <img
      src="/images/huozhong.png"
      alt=""
      width={44}
      height={44}
      className="size-11 shrink-0 object-contain"
    />
  );
}

function MyDataStatTile({
  titleKey,
  value,
  unit,
  t,
}: {
  titleKey: MyDataTitleKey;
  value: string;
  unit: TileUnit;
  t: ReturnType<typeof useI18n>["t"];
}) {
  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      showGlobalToast({
        title: t("copySuccess"),
        description: t("referralCodeCopiedToClipboard"),
        variant: "success",
        durationMs: 2000,
      });
    } catch {
      showGlobalToast({
        title: t("copyFailed"),
        description: t("pleaseCopyReferralCodeManually"),
        variant: "error",
        durationMs: 2000,
      });
    }
  }, [value, t]);

  const titleStyle = {
    fontFamily: PINGFANG,
    fontWeight: 400,
    fontSize: 18,
    lineHeight: "18px",
    height: 18,
    color: "#FFFFFF",
    textAlign: "left" as const,
    fontStyle: "normal" as const,
  };

  const valueStyle = {
    fontFamily: PINGFANG,
    fontWeight: 600,
    fontSize: 40,
    lineHeight: "40px",
    height: 40,
    color: "#FFFFFF",
    textAlign: "left" as const,
    fontStyle: "normal" as const,
  };

  return (
    <div
      className="h-[140px] w-full max-w-[370px] justify-self-start rounded-2xl p-px"
      style={{ background: TILE_EDGE }}
    >
      <div
        className="flex h-full w-full flex-col rounded-[15px] backdrop-blur-[10px]"
        style={{ background: TILE_FILL }}
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pt-[30px] pl-[30px] pr-3">
          <p className="m-0 min-w-0 truncate" style={titleStyle}>
            {t(titleKey)}
          </p>
          <div className="mt-[22px] w-full min-w-0">
            <div className="flex w-fit max-w-full min-w-0 items-end gap-3">
              <span className="min-w-0 shrink truncate" style={valueStyle}>
                {value}
              </span>
              <StatUnit unit={unit} t={t} onCopy={onCopy} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FissionMyDataGrid({
  tiles,
}: {
  tiles: { titleKey: MyDataTitleKey; value: string; unit: TileUnit }[];
}) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-2 gap-x-[22px] gap-y-[30px] max-sm:grid-cols-1 max-sm:gap-y-[30px]">
      {tiles.map((row) => (
        <MyDataStatTile key={row.titleKey} titleKey={row.titleKey} value={row.value} unit={row.unit} t={t} />
      ))}
    </div>
  );
}

type LeaderRow = { rank: number; name: string; rewardUsd: string };

const MOCK_ROWS: LeaderRow[] = [
  { rank: 1, name: "PlayerOne", rewardUsd: "66,000" },
  { rank: 2, name: "PlayerTwo", rewardUsd: "58,200" },
  { rank: 3, name: "PlayerThree", rewardUsd: "45,000" },
  { rank: 4, name: "NovaStorm", rewardUsd: "32,100" },
  { rank: 5, name: "EchoBlade", rewardUsd: "28,900" },
  { rank: 6, name: "PixelFox", rewardUsd: "24,000" },
  { rank: 7, name: "LunaRay", rewardUsd: "19,500" },
  { rank: 8, name: "IronVolt", rewardUsd: "15,200" },
  { rank: 9, name: "SkyLine", rewardUsd: "12,800" },
  { rank: 10, name: "DeltaNine", rewardUsd: "11,000" },
  { rank: 11, name: "Quantum", rewardUsd: "9,600" },
  { rank: 12, name: "RivenX", rewardUsd: "8,400" },
];

function TopThreeRibbon({ rank }: { rank: 1 | 2 | 3 }) {
  const textClass =
    rank === 1 ? "text-placement-first" : rank === 2 ? "text-placement-second" : "text-placement-third";

  return (
    <div
      className={`relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md ${textClass}`}
    >
      <svg
        viewBox="0 0 93 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <path
          d="M0 4C0 1.79086 1.79086 0 4 0H89C91.2091 0 93 1.79086 93 4V20.6233C93 22.5735 91.5937 24.2394 89.6712 24.5666L46.3392 31.9423C46.1147 31.9805 45.8853 31.9801 45.661 31.941L3.31464 24.5765C1.39868 24.2432 0 22.5803 0 20.6356V4Z"
          fill="currentColor"
        />
      </svg>
      <span className="relative z-10 text-xs font-extrabold leading-none text-black">{rank}</span>
    </div>
  );
}

function RankRest({ rank }: { rank: number }) {
  return (
    <span
      className="m-0 flex size-6 shrink-0 items-center justify-center font-semibold text-white"
      style={{
        fontFamily: PINGFANG,
        fontSize: 16,
        lineHeight: "16px",
        fontStyle: "normal",
      }}
    >
      {rank}
    </span>
  );
}

function LeaderRowItem({ row, rewardLabel }: { row: LeaderRow; rewardLabel: string }) {
  const isTopThree = row.rank >= 1 && row.rank <= 3;

  const nameStyle = {
    fontFamily: PINGFANG,
    fontWeight: 600,
    fontSize: 16,
    lineHeight: "16px",
    height: 16,
    color: "#FFFFFF",
    textAlign: "left" as const,
    fontStyle: "normal" as const,
  };

  const rewardLabelStyle = {
    fontFamily: PINGFANG,
    fontWeight: 400,
    fontSize: 14,
    lineHeight: "14px",
    height: 14,
    color: "rgba(255,255,255,0.5)",
    textAlign: "left" as const,
    fontStyle: "normal" as const,
  };

  const amountStyle = {
    fontFamily: PINGFANG,
    fontWeight: 600,
    fontSize: 16,
    lineHeight: "16px",
    color: "#FFFFFF",
    textAlign: "left" as const,
    fontStyle: "normal" as const,
  };

  return (
    <div
      className="flex h-[76px] w-full shrink-0 items-center rounded-2xl pl-5 backdrop-blur-[10px]"
      style={{ background: TILE_FILL }}
    >
      <div className="flex h-full w-6 shrink-0 flex-col items-center justify-center">
        {isTopThree ? <TopThreeRibbon rank={row.rank as 1 | 2 | 3} /> : <RankRest rank={row.rank} />}
      </div>
      <div
        className="ml-2.5 size-11 shrink-0 overflow-hidden rounded-full border border-solid"
        style={{ borderColor: "#555555" }}
      >
        <div className="h-full w-full bg-[#34383C]" aria-hidden />
      </div>
      <div className="ml-2.5 flex h-11 min-w-0 flex-1 flex-col justify-between">
        <p className="m-0 min-w-0 truncate" style={nameStyle}>
          {row.name}
        </p>
        <div className="flex min-w-0 flex-row flex-wrap items-end gap-x-2 gap-y-0">
          <span className="m-0 shrink-0" style={rewardLabelStyle}>
            {rewardLabel}
          </span>
          <span className="m-0 min-w-0 truncate" style={amountStyle}>
            ${row.rewardUsd}
          </span>
        </div>
      </div>
    </div>
  );
}

function FissionLeaderboardList() {
  const { t } = useI18n();
  const rewardLabel = t("fissionRewardAmountLabel");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="h-[542px] w-full min-h-0 shrink-0 max-sm:h-[min(420px,55vh)]">
        <div className="exchange-scroll h-full overflow-x-hidden overflow-y-auto">
          <div className="flex flex-col gap-4 pb-2 pr-1 pt-2">
            {MOCK_ROWS.map((row) => (
              <LeaderRowItem key={row.rank} row={row} rewardLabel={rewardLabel} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FissionTwinPanels() {
  const { t } = useI18n();
  const { user } = useAuth();

  const referralCode = useMemo(() => String((user?.userInfo as { invite_code?: string } | undefined)?.invite_code ?? ""), [
    user?.userInfo,
  ]);
  const subordinateNum = useMemo(
    () => Number((user?.userInfo as { subordinate_num?: number } | undefined)?.subordinate_num ?? 0),
    [user?.userInfo],
  );
  const subordinateRecharge = useMemo(
    () => Number((user?.userInfo as { subordinate_rechange?: number } | undefined)?.subordinate_rechange ?? 0),
    [user?.userInfo],
  );
  const subordinateFlow = useMemo(
    () => Number((user?.userInfo as { subordinate_flow?: number } | undefined)?.subordinate_flow ?? 0),
    [user?.userInfo],
  );

  const myDataTiles = useMemo(() => {
    const money = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : "0.00");
    return [
      { titleKey: "fissionStatReferralCodeTitle" as const, value: referralCode || "—", unit: "copy" as const },
      { titleKey: "fissionStatInviteCountTitle" as const, value: String(Number.isFinite(subordinateNum) ? subordinateNum : 0), unit: "people" as const },
      { titleKey: "fissionStatSubRechargeTitle" as const, value: money(subordinateRecharge), unit: "dollar" as const },
      { titleKey: "fissionStatSubFlowTitle" as const, value: money(subordinateFlow), unit: "dollar" as const },
      { titleKey: "fissionStatKindlingTitle" as const, value: "—", unit: "kindling" as const },
    ];
  }, [referralCode, subordinateFlow, subordinateNum, subordinateRecharge]);

  return (
    <div className="mt-[76px] flex w-full max-w-[1440px] shrink-0 gap-9 max-sm:mt-10 max-sm:flex-col max-sm:gap-8 max-sm:px-3">
      <div className="min-w-0 flex-1">
        <FissionSectionCard
          title={t("fissionMyDataTitle")}
          contentClassName="min-h-0 flex-1 overflow-auto px-10 pt-[81px] max-sm:px-4 max-sm:pt-10"
        >
          <FissionMyDataGrid tiles={myDataTiles} />
        </FissionSectionCard>
      </div>
      <div className="min-w-0 flex-1">
        <FissionSectionCard
          title={t("fissionLeaderboardTitle")}
          contentClassName="min-h-0 flex-1 overflow-hidden px-[35px] pt-[54px] max-sm:px-4 max-sm:pt-8"
        >
          <FissionLeaderboardList />
        </FissionSectionCard>
      </div>
    </div>
  );
}

const REWARD_BOX_TILES = [
  { titleKey: "fissionRewardBoxTier1" as const, cost: 5 },
  { titleKey: "fissionRewardBoxTier2" as const, cost: 10 },
  { titleKey: "fissionRewardBoxTier3" as const, cost: 30 },
  { titleKey: "fissionRewardBoxTier4" as const, cost: 50 },
];

const REWARD_TEXT_24: CSSProperties = {
  height: 24,
  fontFamily: "PingFangSC, PingFang SC, sans-serif",
  fontWeight: 400,
  fontSize: 24,
  color: "#FFFFFF",
  lineHeight: "24px",
  textAlign: "left",
  fontStyle: "normal",
};

function FissionRewardBoxTile({
  titleKey,
  cost,
  t,
}: {
  titleKey: (typeof REWARD_BOX_TILES)[number]["titleKey"];
  cost: number;
  t: ReturnType<typeof useI18n>["t"];
}) {
  return (
    <div className="h-[260px] w-[292px] shrink-0 rounded-2xl p-px" style={{ background: TILE_EDGE }}>
      <div className="flex h-full w-full flex-col rounded-[15px] backdrop-blur-[10px]" style={{ background: TILE_FILL }}>
        <div className="flex min-h-0 flex-1 flex-col px-[30px] pt-[30px]">
          <p className="m-0 shrink-0 truncate" style={REWARD_TEXT_24}>
            {t(titleKey)}
          </p>
          <p className="m-0 mt-[18px] h-6 shrink-0 truncate text-left leading-6" style={REWARD_TEXT_24}>
            <span className="text-white">{t("fissionRewardBoxCostPrefix")}</span>
            <span style={{ color: "#FFB93A" }}>{cost}</span>
            <span className="text-white"> {t("fissionRewardBoxKindlingUnit")}</span>
          </p>
          <button
            type="button"
            className="m-0 mt-[23px] box-border flex h-7 w-[71px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[rgba(255,255,255,0.3)] bg-transparent p-0 text-white"
            style={{
              fontFamily: "PingFangSC, PingFang SC, sans-serif",
              fontWeight: 400,
              fontSize: 18,
              color: "#FFFFFF",
              lineHeight: "25px",
              fontStyle: "normal",
            }}
          >
            {t("fissionRewardBoxOpen")}
          </button>
        </div>
      </div>
    </div>
  );
}

function FissionRewardBoxSection() {
  const { t } = useI18n();

  return (
    <div className="mt-16 w-full max-w-[1440px] shrink-0 max-sm:mt-10 max-sm:px-3">
      <FissionSectionCard
        title={t("fissionRewardBoxTitle")}
        desktopCardHeight="auto"
        contentClassName="box-border pt-[60px] pl-10 pr-10 pb-10 max-sm:px-4 max-sm:pb-8 max-sm:pt-8"
      >
        <div className="flex w-full flex-wrap justify-center gap-6 max-sm:gap-4">
          {REWARD_BOX_TILES.map((row) => (
            <FissionRewardBoxTile key={row.titleKey} titleKey={row.titleKey} cost={row.cost} t={t} />
          ))}
        </div>
      </FissionSectionCard>
    </div>
  );
}

function FissionReferrerDownlinesChevron() {
  return (
    <span
      className="inline-block shrink-0"
      style={{
        width: 7,
        height: 11,
        background: "rgba(255,255,255,0.7)",
        clipPath: "polygon(0 0, 0 100%, 100% 50%)",
      }}
      aria-hidden
    />
  );
}

const DOWNLINES_FILTER_MUTED = "#5B5F63";

const DOWNLINES_FILTER_TITLE_STYLE: CSSProperties = {
  height: 20,
  fontFamily: "PingFangSC, PingFang SC, sans-serif",
  fontWeight: 400,
  fontSize: 20,
  color: DOWNLINES_FILTER_MUTED,
  lineHeight: "20px",
  textAlign: "left",
  fontStyle: "normal",
};

const DOWNLINES_DATE_TEXT_STYLE: CSSProperties = {
  height: 18,
  fontFamily: "PingFangSC, PingFang SC, sans-serif",
  fontWeight: 400,
  fontSize: 18,
  color: DOWNLINES_FILTER_MUTED,
  lineHeight: "18px",
  textAlign: "left",
  fontStyle: "normal",
};

function ymdHyphenToSlash(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return ymd;
  return `${m[1]}/${m[2]}/${m[3]}`;
}

/** react-datepicker 范围值为「yyyy-MM-dd - yyyy-MM-dd」，不能用 /-/ 拆，否则会把单日拆成年/月/日三段。 */
function parseRangePickerDisplay(value: string, placeholder: string): [string, string] {
  const v = (value || "").trim();
  if (!v) return [placeholder, placeholder];

  const ymd = "(\\d{4}-\\d{2}-\\d{2})";
  const both = new RegExp(`^${ymd}\\s*-\\s*${ymd}$`);
  const mBoth = both.exec(v);
  if (mBoth) {
    return [ymdHyphenToSlash(mBoth[1]) || placeholder, ymdHyphenToSlash(mBoth[2]) || placeholder];
  }

  const startOnly = new RegExp(`^${ymd}\\s*-\\s*$`);
  const mStart = startOnly.exec(v);
  if (mStart) {
    return [ymdHyphenToSlash(mStart[1]) || placeholder, placeholder];
  }

  const single = new RegExp(`^${ymd}$`);
  const mSingle = single.exec(v);
  if (mSingle) {
    return [ymdHyphenToSlash(mSingle[1]) || placeholder, placeholder];
  }

  return [placeholder, placeholder];
}

const FissionDownlinesDateRangeTrigger = forwardRef<
  HTMLDivElement,
  {
    id?: string;
    placeholder?: string;
    value?: string;
    onClick?: () => void;
    "aria-label"?: string;
  }
>(function FissionDownlinesDateRangeTrigger(
  { id, placeholder: placeholderProp, value = "", onClick, "aria-label": ariaLabel },
  ref,
) {
  const placeholder = placeholderProp ?? "";
  const [left, right] = useMemo(
    () => parseRangePickerDisplay(String(value), placeholder),
    [value, placeholder],
  );

  return (
    <div
      id={id}
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.currentTarget.click();
        }
      }}
      className="box-border flex h-[58px] w-full max-w-[362px] shrink-0 cursor-pointer items-end justify-between rounded-lg bg-[rgba(255,255,255,0.1)] py-5 pl-6 pr-[14px] outline-none"
    >
      <div className="flex min-w-0 flex-1 items-end gap-10">
        <span className="min-w-0 max-w-[45%] shrink truncate text-left" style={DOWNLINES_DATE_TEXT_STYLE}>
          {left}
        </span>
        <div className="h-[18px] w-px shrink-0 bg-[#5B5F63]" aria-hidden />
        <span className="min-w-0 max-w-[45%] shrink truncate text-left" style={DOWNLINES_DATE_TEXT_STYLE}>
          {right}
        </span>
      </div>
      <span className="pointer-events-none ml-2 flex size-[18px] shrink-0 items-end justify-center">
        <img src="/images/Calendar.png" alt="" width={18} height={18} className="block size-[18px] object-contain" />
      </span>
    </div>
  );
});

function FissionDownlinesDateFilter({
  t,
  start,
  end,
  minDate,
  maxDate,
  onRangeChange,
}: {
  t: ReturnType<typeof useI18n>["t"];
  start: string;
  end: string;
  minDate: string;
  maxDate: string;
  onRangeChange: (s: string, e: string) => void;
}) {
  const placeholder = t("fissionDatePlaceholder");

  return (
    <div className="flex min-w-0 flex-col">
      <p className="m-0 mb-[25px]" style={DOWNLINES_FILTER_TITLE_STYLE}>
        {t("fissionFilterDateRangeTitle")}
      </p>
      <DatePickerField
        id="fission-downlines-daterange"
        mode="range"
        startValue={start}
        endValue={end}
        minDate={minDate}
        maxDate={maxDate}
        onRangeChange={onRangeChange}
        placeholder={placeholder}
        wrapperClassName="w-full max-w-[362px]"
        customInput={<FissionDownlinesDateRangeTrigger aria-label={t("fissionFilterDateRangeTitle")} />}
        popperModifiers={[offset({ mainAxis: -10, crossAxis: 0 })]}
        popperProps={{ strategy: "fixed" }}
      />
    </div>
  );
}

function FissionDownlinesUsernameFilter({
  t,
  value,
  onChange,
}: {
  t: ReturnType<typeof useI18n>["t"];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <p className="m-0 mb-[25px]" style={DOWNLINES_FILTER_TITLE_STYLE}>
        {t("fissionFilterUsernameTitle")}
      </p>
      <div className="box-border flex h-[58px] w-full max-w-[362px] shrink-0 items-center rounded-lg bg-[rgba(255,255,255,0.1)] pl-6 pr-[14px]">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          placeholder={t("fissionUsernamePlaceholder")}
          className="h-full w-full min-w-0 flex-1 border-0 bg-transparent p-0 outline-none ring-0 placeholder:text-[#5B5F63]"
          style={DOWNLINES_DATE_TEXT_STYLE}
        />
      </div>
    </div>
  );
}

type FissionDownlineTableRow = {
  rowKey: string;
  ordinal: number;
  username: string;
  recharge: string;
  consume: string;
};

const DOWNLINES_TABLE_HEAD_GRID_CLASS =
  "grid min-w-0 flex-1 grid-cols-4 items-center gap-2 max-sm:gap-x-1.5 max-sm:gap-y-1";

const DOWNLINES_TABLE_ROW_GRID_CLASS =
  "grid min-w-0 grid-cols-4 items-center gap-2 max-sm:gap-x-1.5 max-sm:gap-y-1";

/** 表体可视区 = 10 行 × 行高（与下行 min-h / padding 一致） */
const DOWNLINES_TABLE_VISIBLE_ROW_COUNT = 10;
const DOWNLINES_TABLE_ROW_HEIGHT_DESKTOP = 52;
const DOWNLINES_TABLE_ROW_HEIGHT_MOBILE = 42;
const DOWNLINES_TABLE_BODY_HEIGHT_DESKTOP =
  DOWNLINES_TABLE_VISIBLE_ROW_COUNT * DOWNLINES_TABLE_ROW_HEIGHT_DESKTOP;
const DOWNLINES_TABLE_BODY_HEIGHT_MOBILE =
  DOWNLINES_TABLE_VISIBLE_ROW_COUNT * DOWNLINES_TABLE_ROW_HEIGHT_MOBILE;

const DOWNLINES_TABLE_HEAD_CELL_CLASS =
  "min-w-0 whitespace-normal break-words text-left not-italic max-sm:text-[12px] max-sm:leading-[14px] max-sm:font-normal sm:text-[18px] sm:leading-[18px] sm:font-normal";

function FissionDownlinesDataTable({
  t,
  rows,
  loading,
}: {
  t: ReturnType<typeof useI18n>["t"];
  rows: FissionDownlineTableRow[];
  loading: boolean;
}) {
  const empty = !loading && rows.length === 0;

  return (
    <>
      <style>{`
        .fission-downlines-table-scroll {
          height: ${DOWNLINES_TABLE_BODY_HEIGHT_MOBILE}px;
        }
        @media (min-width: 640px) {
          .fission-downlines-table-scroll {
            height: ${DOWNLINES_TABLE_BODY_HEIGHT_DESKTOP}px;
          }
        }
      `}</style>
      <div className="mt-[30px] box-border flex w-full min-w-0 shrink-0 flex-col overflow-hidden rounded-lg bg-[rgba(255,255,255,0.05)]">
      <div className="flex h-[66px] w-full shrink-0 items-center rounded-t-lg bg-[rgba(255,255,255,0.05)] px-6 py-0 max-sm:h-auto max-sm:min-h-[52px] max-sm:py-2.5 max-sm:pl-3 max-sm:pr-2.5">
        <div className={DOWNLINES_TABLE_HEAD_GRID_CLASS}>
          <span className={DOWNLINES_TABLE_HEAD_CELL_CLASS} style={{ fontFamily: PINGFANG, color: DOWNLINES_FILTER_MUTED }}>
            {t("referralTableUserIndex")}
          </span>
          <span className={DOWNLINES_TABLE_HEAD_CELL_CLASS} style={{ fontFamily: PINGFANG, color: DOWNLINES_FILTER_MUTED }}>
            {t("referralTableUsername")}
          </span>
          <span className={DOWNLINES_TABLE_HEAD_CELL_CLASS} style={{ fontFamily: PINGFANG, color: DOWNLINES_FILTER_MUTED }}>
            {t("referralTableRecharge")}
          </span>
          <span className={DOWNLINES_TABLE_HEAD_CELL_CLASS} style={{ fontFamily: PINGFANG, color: DOWNLINES_FILTER_MUTED }}>
            {t("referralTableConsume")}
          </span>
        </div>
      </div>
      <div className="fission-downlines-table-scroll exchange-scroll flex shrink-0 flex-col overflow-y-auto overflow-x-hidden rounded-b-lg bg-[#2D3237]">
        {loading ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-4 py-10">
            <LoadingSpinnerIcon size={22} indicatorColor="rgba(255,255,255,0.7)" trackColor="rgba(255,255,255,0.12)" />
            <span
              className="text-base font-semibold text-white/60"
              style={{ fontFamily: PINGFANG }}
            >
              {t("loadingText")}
            </span>
          </div>
        ) : empty ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-10">
            <img
              src="/images/kong.png"
              alt={t("fissionDownlinesTableEmpty")}
              width={121}
              height={130}
              className="h-[130px] w-[121px] max-sm:h-[108px] max-sm:w-[100px] shrink-0 object-contain"
            />
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-white/[0.06]">
            {rows.map((row) => (
              <div
                key={`${row.rowKey}`}
                className={`${DOWNLINES_TABLE_ROW_GRID_CLASS} min-h-[42px] px-6 py-4 text-left text-white max-sm:px-2.5 max-sm:py-3 sm:min-h-[52px]`}
                style={{
                  fontFamily: "PingFangSC, PingFang SC, sans-serif",
                }}
              >
                <span className="min-w-0 max-sm:text-[13px] max-sm:leading-[18px] sm:text-[16px] sm:leading-[20px] truncate">
                  {row.ordinal}
                </span>
                <span className="min-w-0 max-sm:text-[13px] max-sm:leading-[18px] sm:text-[16px] sm:leading-[20px] truncate">
                  {row.username}
                </span>
                <span className="min-w-0 max-sm:text-[13px] max-sm:leading-[18px] sm:text-[16px] sm:leading-[20px] truncate">
                  {row.recharge}
                </span>
                <span className="min-w-0 max-sm:text-[13px] max-sm:leading-[18px] sm:text-[16px] sm:leading-[20px] truncate">
                  {row.consume}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}

function fissionDownlineFormatMoney(v: unknown) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

function FissionReferrerDownlinesSection() {
  const { t } = useI18n();
  const { user } = useAuth();

  const referralDateMin = "2025-01-01";
  const referralDateMax = useMemo(() => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const y = endOfMonth.getFullYear();
    const m = String(endOfMonth.getMonth() + 1).padStart(2, "0");
    const d = String(endOfMonth.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  const [downlineRange, setDownlineRange] = useState<ReferralDownlineRange>(5);
  const [downlineStartDate, setDownlineStartDate] = useState("");
  const [downlineEndDate, setDownlineEndDate] = useState("");
  const [downlineKeywordInput, setDownlineKeywordInput] = useState("");
  const [downlineKeyword, setDownlineKeyword] = useState("");
  const [downlinePage, setDownlinePage] = useState(1);

  useEffect(() => {
    const handle = setTimeout(() => setDownlineKeyword(downlineKeywordInput.trim()), 400);
    return () => clearTimeout(handle);
  }, [downlineKeywordInput]);

  const useCustomDownlineDatetime = Boolean(downlineStartDate && downlineEndDate);
  const downlineStartDatetime = useMemo(() => {
    if (!useCustomDownlineDatetime) return "";
    return `${downlineStartDate} 00:00:00`;
  }, [downlineStartDate, useCustomDownlineDatetime]);
  const downlineEndDatetime = useMemo(() => {
    if (!useCustomDownlineDatetime) return "";
    return `${downlineEndDate} 23:59:59`;
  }, [downlineEndDate, useCustomDownlineDatetime]);

  const { data: downlineResp, isLoading: downlineLoading } = useQuery({
    queryKey: [
      "userInviter",
      user?.token,
      downlinePage,
      downlineRange,
      downlineKeyword,
      downlineStartDate,
      downlineEndDate,
    ],
    queryFn: () =>
      getUserInviter({
        page: downlinePage,
        keyword: downlineKeyword,
        ...(useCustomDownlineDatetime
          ? { start_datetime: downlineStartDatetime, end_datetime: downlineEndDatetime }
          : { type: downlineRange }),
      }),
    enabled: Boolean(user?.token),
    staleTime: 30_000,
  });

  const downlineRowsRaw: ReferralDownlineRow[] = useMemo(() => {
    const root = downlineResp?.data as
      | {
          data?: unknown;
          list?: unknown;
          rows?: unknown;
        }
      | unknown[]
      | undefined;
    if (Array.isArray(root)) {
      return root.filter(Boolean) as ReferralDownlineRow[];
    }
    const r = root as { data?: unknown; list?: unknown; rows?: unknown } | undefined;
    const nested = r?.data as { data?: unknown; list?: unknown; rows?: unknown } | undefined;
    const rows =
      r && Array.isArray(r.data)
        ? r.data
        : r && Array.isArray(r.list)
          ? r.list
          : r && Array.isArray(r.rows)
            ? r.rows
            : nested && Array.isArray(nested.data)
              ? nested.data
              : nested && Array.isArray(nested.list)
                ? nested.list
                : nested && Array.isArray(nested.rows)
                  ? nested.rows
                  : [];
    return Array.isArray(rows) ? (rows as ReferralDownlineRow[]).filter(Boolean) : [];
  }, [downlineResp]);

  const downlinePagination = useMemo(() => {
    const root = downlineResp?.data as Record<string, unknown> | undefined;
    const dataNested =
      root?.data && typeof root.data === "object" && root.data !== null
        ? (root.data as Record<string, unknown>)
        : undefined;
    const meta = root?.meta as Record<string, unknown> | undefined;
    const pagination = root?.pagination as Record<string, unknown> | undefined;
    const totalRaw =
      root?.total ??
      root?.count ??
      dataNested?.total ??
      dataNested?.count ??
      meta?.total ??
      pagination?.total ??
      0;
    const perPageRaw =
      root?.per_page ??
      root?.page_size ??
      root?.limit ??
      dataNested?.per_page ??
      meta?.per_page ??
      pagination?.per_page ??
      0;
    const currentRaw =
      root?.current_page ??
      root?.page ??
      dataNested?.current_page ??
      meta?.current_page ??
      pagination?.page ??
      downlinePage;
    const lastRaw =
      root?.last_page ??
      root?.total_page ??
      dataNested?.last_page ??
      meta?.last_page ??
      pagination?.last_page ??
      0;

    const total = Number(totalRaw);
    const perPageFallback = downlineRowsRaw.length > 0 ? downlineRowsRaw.length : 10;
    const perPageNum = Number(perPageRaw);
    const perPage = Number.isFinite(perPageNum) && perPageNum > 0 ? perPageNum : perPageFallback;
    const currentNum = Number(currentRaw);
    const current = Number.isFinite(currentNum) && currentNum > 0 ? currentNum : downlinePage;
    const lastNum = Number(lastRaw);
    const last =
      Number.isFinite(lastNum) && lastNum > 0
        ? lastNum
        : Number.isFinite(total) && total > 0
          ? Math.ceil(total / perPage)
          : 0;

    const start = total > 0 ? (current - 1) * perPage + 1 : 0;
    const end = total > 0 ? Math.min(total, (current - 1) * perPage + downlineRowsRaw.length) : 0;
    const hasPrev = current > 1;
    const hasNext = last > 0 ? current < last : downlineRowsRaw.length >= perPage;

    return { total: Number.isFinite(total) ? total : 0, perPage, current, last, start, end, hasPrev, hasNext };
  }, [downlinePage, downlineResp, downlineRowsRaw]);

  const tableRows = useMemo((): FissionDownlineTableRow[] => {
    const { current, perPage } = downlinePagination;
    return downlineRowsRaw.map((row, idx) => {
      const name = String(row?.name ?? row?.username ?? row?.user_name ?? row?.email ?? "—");
      const recharge = fissionDownlineFormatMoney(
        row?.inviter_recharge ?? row?.recharge ?? row?.deposit ?? row?.subordinate_rechange ?? 0,
      );
      const consume = fissionDownlineFormatMoney(
        row?.inviter_consume ?? row?.consume ?? row?.flow ?? row?.subordinate_flow ?? 0,
      );
      return {
        rowKey: String(row?.id ?? `${current}-${idx}-${name}`),
        ordinal: (current - 1) * perPage + idx + 1,
        username: name,
        recharge: `$${recharge}`,
        consume: `$${consume}`,
      };
    });
  }, [downlinePagination, downlineRowsRaw]);

  const rangeSelectOptions = useMemo(
    () => [
      { label: t("referralFilterToday"), value: "1" },
      { label: t("referralFilterYesterday"), value: "2" },
      { label: t("referralFilterThisMonth"), value: "3" },
      { label: t("referralFilterLastWeek"), value: "4" },
      { label: t("referralFilterAll"), value: "5" },
    ],
    [t],
  );

  const rangeTriggerLabel = useMemo(() => {
    if (useCustomDownlineDatetime) return t("referralFilterDatetime");
    return (
      rangeSelectOptions.find((o) => o.value === String(downlineRange))?.label ?? t("referralFilterAll")
    );
  }, [downlineRange, rangeSelectOptions, t, useCustomDownlineDatetime]);

  const [rangeMenuOpen, setRangeMenuOpen] = useState(false);
  const [hoveredRangeValue, setHoveredRangeValue] = useState<string | null>(null);
  const rangeMenuWrapRef = useRef<HTMLDivElement | null>(null);

  const applyDownlineRangeValue = useCallback((v: string) => {
    const n = Number(v);
    const safe = (Number.isFinite(n) ? n : 5) as number;
    const next = (safe >= 1 && safe <= 5 ? safe : 5) as ReferralDownlineRange;
    setDownlineRange(next);
    setDownlineStartDate("");
    setDownlineEndDate("");
    setDownlinePage(1);
  }, []);

  useEffect(() => {
    if (!rangeMenuOpen) return;
    function handlePointerDown(e: MouseEvent) {
      if (rangeMenuWrapRef.current && !rangeMenuWrapRef.current.contains(e.target as Node)) {
        setRangeMenuOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setRangeMenuOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [rangeMenuOpen]);

  return (
    <div className="mt-[75px] w-full max-w-[1440px] shrink-0 max-sm:mt-10 max-sm:px-3">
      <FissionSectionCard
        title={t("fissionReferrerDownlinesTitle")}
        desktopCardHeight="auto"
        contentClassName="relative box-border flex min-h-0 flex-1 flex-col px-10 pb-[45px] pt-8 max-sm:min-h-0 max-sm:px-4 max-sm:pb-8 max-sm:pt-6"
      >
        <div ref={rangeMenuWrapRef} className="absolute right-10 top-8 z-[55] max-sm:right-4">
          <button
            type="button"
            aria-expanded={rangeMenuOpen}
            aria-label={rangeTriggerLabel}
            onClick={() => setRangeMenuOpen((o) => !o)}
            className="box-border flex h-9 min-w-[95px] max-w-[min(220px,calc(100vw-6rem))] shrink-0 cursor-pointer items-center justify-center gap-[10px] rounded-[19px] border border-[rgba(255,255,255,0.61)] bg-[rgba(255,255,255,0.09)] px-3 py-0"
          >
            <span
              className="min-w-0 flex-1 truncate text-left text-white"
              style={{
                fontFamily: "PingFangSC, PingFang SC, sans-serif",
                fontWeight: 500,
                fontSize: 17,
                lineHeight: "17px",
                fontStyle: "normal",
              }}
            >
              {rangeTriggerLabel}
            </span>
            <FissionReferrerDownlinesChevron />
          </button>
          {rangeMenuOpen ? (
            <div
              className="absolute right-0 z-[60] mt-2 w-[208px] max-w-[min(208px,calc(100vw-2rem))] rounded-lg shadow-lg"
              style={{ backgroundColor: "#22272B" }}
            >
              <div className="flex max-h-[min(320px,70vh)] flex-col overflow-y-auto overflow-x-hidden p-1">
                {rangeSelectOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className="flex h-10 w-full cursor-pointer items-center rounded-md px-3 text-left text-base font-bold text-white transition-colors"
                    style={{
                      backgroundColor: hoveredRangeValue === opt.value ? "#34383C" : "#22272B",
                    }}
                    onMouseEnter={() => setHoveredRangeValue(opt.value)}
                    onMouseLeave={() => setHoveredRangeValue((prev) => (prev === opt.value ? null : prev))}
                    onClick={() => {
                      applyDownlineRangeValue(opt.value);
                      setRangeMenuOpen(false);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-[47px] flex w-full flex-wrap gap-10 max-sm:flex-col max-sm:gap-8">
          <FissionDownlinesDateFilter
            t={t}
            start={downlineStartDate}
            end={downlineEndDate}
            minDate={referralDateMin}
            maxDate={referralDateMax}
            onRangeChange={(s, e) => {
              setDownlineStartDate(s);
              setDownlineEndDate(e);
              setDownlinePage(1);
            }}
          />
          <FissionDownlinesUsernameFilter
            t={t}
            value={downlineKeywordInput}
            onChange={(v) => {
              setDownlineKeywordInput(v);
              setDownlinePage(1);
            }}
          />
        </div>

        <FissionDownlinesDataTable t={t} rows={tableRows} loading={downlineLoading} />

        <div className="mt-3 w-full min-w-0 shrink-0">
          <DealsPaginationBar
            start={downlinePagination.start}
            end={downlinePagination.end}
            total={downlinePagination.total}
            onPrev={() => downlinePagination.hasPrev && setDownlinePage((p) => Math.max(1, p - 1))}
            onNext={() => downlinePagination.hasNext && setDownlinePage((p) => p + 1)}
            disabledPrev={!downlinePagination.hasPrev}
            disabledNext={!downlinePagination.hasNext}
            hideRangeText
          />
        </div>
      </FissionSectionCard>
    </div>
  );
}

function buildFissionInviteDisplayUrl(code: string) {
  const trimmed = code.trim();
  if (!trimmed) return "";
  if (typeof window !== "undefined") {
    const host = window.location.host || "flamedraw.com";
    return `${host}/r/${trimmed}`;
  }
  return `flamedraw.com/r/${trimmed}`;
}

export default function FissionNavPage() {
  const { user } = useAuth();
  const inviteUrl = useMemo(() => {
    const code = String((user?.userInfo as { invite_code?: string } | undefined)?.invite_code ?? "");
    return buildFissionInviteDisplayUrl(code);
  }, [user?.userInfo]);

  return (
    <div className="flex w-full flex-1 flex-col items-center pb-8 max-sm:pb-6">
      <img
        src="/images/liebian.png"
        alt="邀请好友赚火种"
        className="w-full max-w-[1440px] shrink-0 object-contain"
        width={2880}
        height={914}
      />

      <div className="relative mt-[35px] w-full max-w-[1440px] shrink-0 max-sm:mt-4 max-sm:px-3">
        <div className="flex h-[192px] w-full flex-col items-center rounded-[0_40px_40px_40px] border border-white/[0.04] bg-[#23272C] pt-[70px] backdrop-blur-[10px] max-sm:h-auto max-sm:rounded-[0_24px_24px_24px] max-sm:pt-14 max-sm:pb-4">
          <div className="w-full max-sm:px-1">
            <FissionInviteLinkBar inviteUrl={inviteUrl || "—"} />
          </div>
        </div>
        <div
          className="absolute left-0 top-0 z-10 flex h-[70px] w-[250px] -translate-y-1/2 items-center justify-center bg-[#161616] text-[28px] font-semibold leading-[40px] text-white max-sm:left-3 max-sm:h-14 max-sm:w-auto max-sm:max-w-[min(100%,240px)] max-sm:px-4 max-sm:text-base max-sm:leading-[22px]"
          style={{
            borderRadius: "100px 100px 8px 100px",
            fontFamily: '"PingFang SC", "PingFang SC", sans-serif',
            fontStyle: "normal",
          }}
        >
          我的邀请链接:
        </div>
      </div>

      <FissionTwinPanels />

      <FissionRewardBoxSection />

      <FissionReferrerDownlinesSection />
    </div>
  );
}
