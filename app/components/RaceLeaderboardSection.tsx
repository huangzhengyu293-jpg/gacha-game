"use client";

import { useI18n } from "./I18nProvider";
import { RaceCountdownCard } from "./RaceCountdownCard";
import type { TablePlayer, TopThreePlayer } from "../lib/consumeLeaderboard";

type Props = {
  title: string;
  countdown: {
    getRemainingMs: () => number;
    format: "hms" | "dhms";
    labelKey: "raceEndsIn" | "raffleStartsIn";
  };
  introImageSrc?: string;
  showCountdown?: boolean; // 默认 true；限时活动页需要倒计时不随 tab 切换时可关掉
  tablePrizeCellWidthClassName?: string; // 可选：表格奖励列固定宽度（宽度不够则省略号）
  topThreeGridClassName?: string; // 可选：前三名布局（用于小屏不挤压）
  openedColWidthClassName?: string; // 可选：表格“已开启”列宽度（小屏可压窄）
  equalizeDataColsOnMobile?: boolean; // 小屏：除 # 外其余三列等宽
  mobileDataColsMode?: "equal" | "3-2-2"; // 仅在 equalizeDataColsOnMobile=true 时生效
  mobileRankColWidthPx?: number; // 仅在 equalizeDataColsOnMobile=true 时生效（# 列宽度）
  idPrefix: string;
  topThree: TopThreePlayer[];
  tableData: TablePlayer[];
};

export function RaceLeaderboardSection({
  title,
  countdown,
  introImageSrc,
  showCountdown = true,
  tablePrizeCellWidthClassName,
  topThreeGridClassName,
  openedColWidthClassName,
  equalizeDataColsOnMobile = false,
  mobileDataColsMode = "equal",
  mobileRankColWidthPx = 42,
  idPrefix,
  topThree,
  tableData,
}: Props) {
  const { t } = useI18n();
  const arrangedTopThree = topThree.length === 3 ? [topThree[1], topThree[0], topThree[2]] : topThree;
  const remainingWidth = `calc(100% - ${mobileRankColWidthPx}px)`;
  const colW3 = `calc(${remainingWidth} * 3 / 7)`;
  const colW2 = `calc(${remainingWidth} * 2 / 7)`;

  return (
    <>
      {showCountdown ? (
        <RaceCountdownCard title={title} {...countdown} introImageSrc={introImageSrc} />
      ) : null}

      {/* 排行榜 */}
      <div className="relative py-4 sm:py-6">
        <div className={topThreeGridClassName ?? "grid grid-cols-3 gap-2 sm:gap-4 md:gap-8"}>
          {arrangedTopThree.map((player) => {
            const placementClasses = {
              1: { text: "text-placement-first", border: "border-placement-first", z: "z-0" },
              2: { text: "text-placement-second", border: "border-placement-second", z: "z-10" },
              3: { text: "text-placement-third", border: "border-placement-third", z: "z-10" },
            };
            const placement =
              placementClasses[player.rank as keyof typeof placementClasses] || placementClasses[2];

            return (
              <div key={player.rank}>
                <div
                  className={`rounded-lg w-full border border-solid relative ${placement.z}`}
                  style={{ borderColor: "#34383c" }}
                >
                  <div className="absolute -top-[2px] left-1/2 -translate-x-1/2" style={{ zIndex: 50 }}>
                    <div
                      className={`h-[18.9px] w-[54.97px] sm:h-[19px] sm:w-[55px] md:h-[32px] md:w-[93px] ${placement.text}`}
                    >
                      <svg viewBox="0 0 93 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        <path
                          d="M0 4C0 1.79086 1.79086 0 4 0H89C91.2091 0 93 1.79086 93 4V20.6233C93 22.5735 91.5937 24.2394 89.6712 24.5666L46.3392 31.9423C46.1147 31.9805 45.8853 31.9801 45.661 31.941L3.31464 24.5765C1.39868 24.2432 0 22.5803 0 20.6356V4Z"
                          fill="currentColor"
                        ></path>
                      </svg>
                    </div>
                    <p className="absolute top-0.5 text-center w-full font-extrabold text-[10px] sm:text-[12px] md:text-[14px] text-black">
                      {t("placementLabel").replace("{rank}", String(player.rank))}
                    </p>
                  </div>
                  <div
                    className="relative flex flex-col gap-1 sm:gap-1 md:gap-2 items-center px-2 sm:px-4 md:px-7 pb-3 sm:pb-2 md:pb-4 pt-6 sm:pt-6 md:pt-12 w-full rounded-t-lg"
                    style={{ backgroundColor: "#22272b" }}
                  >
                    <div className="relative">
                      <div className={`overflow-hidden border rounded-full ${placement.border}`} style={{ borderWidth: "2px" }}>
                        <div className="relative rounded-full overflow-hidden w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12">
                          {player.avatarImage ? (
                            <img
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="pointer-events-none"
                              sizes="(min-width: 0px) 100px"
                              srcSet={`${player.avatarImage}?tr=w-16,c-at_max 16w, ${player.avatarImage}?tr=w-32,c-at_max 32w, ${player.avatarImage}?tr=w-48,c-at_max 48w`}
                              src={player.avatarImage}
                              style={{ position: "absolute", height: "100%", width: "100%", inset: 0, objectFit: "cover", color: "transparent" }}
                            />
                          ) : (
                            <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                              <mask id={`${idPrefix}-${player.avatar}`} maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
                                <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
                              </mask>
                              <g mask={`url(#${idPrefix}-${player.avatar})`}>
                                <rect width="36" height="36" fill={player.rank === 1 ? "#0C8F8F" : "#333333"}></rect>
                                <rect
                                  x="0"
                                  y="0"
                                  width="36"
                                  height="36"
                                  transform={player.rank === 1 ? "translate(7 7) rotate(157 18 18) scale(1.1)" : "translate(5 5) rotate(135 18 18) scale(1)"}
                                  fill={player.rank === 1 ? "#EDF2F7" : "#0C8F8F"}
                                  rx="6"
                                ></rect>
                                <g transform={player.rank === 1 ? "translate(3.5 3.5) rotate(-7 18 18)" : "translate(7 3) rotate(-5 18 18)"}>
                                  <path d={player.rank === 1 ? "M13,20 a1,0.75 0 0,0 10,0" : "M13,19 a1,0.75 0 0,0 10,0"} fill={player.rank === 1 ? "#000000" : "#FFFFFF"}></path>
                                  <rect x={player.rank === 1 ? "12" : "14"} y="14" width="1.5" height="2" rx="1" stroke="none" fill={player.rank === 1 ? "#000000" : "#FFFFFF"}></rect>
                                  <rect x={player.rank === 1 ? "22" : "20"} y="14" width="1.5" height="2" rx="1" stroke="none" fill={player.rank === 1 ? "#000000" : "#FFFFFF"}></rect>
                                </g>
                              </g>
                            </svg>
                          )}
                        </div>
                      </div>
                      <div
                        className="px-0.5 py-0.5 flex items-center justify-center rounded-full border absolute z-10 -bottom-0.5 sm:-bottom-1 w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 -left-0.5 sm:-left-1"
                        style={{ backgroundColor: "#22272b", borderColor: "#33373c" }}
                      >
                        <span className="text-[8px] sm:text-[10px] md:text-[12px] font-bold leading-none text-white">{player.packCount}</span>
                      </div>
                    </div>
                    <p className="text-white text-[10px] sm:text-[12px] md:text-[14px] font-semibold mt-0.5 sm:mt-1">{player.name}</p>
                    <div className="border border-solid rounded-lg py-0.5 sm:py-1 md:py-2 w-full" style={{ borderColor: "#34383c" }}>
                      <p className="font-extrabold text-[10px] sm:text-[12px] md:text-[14px] w-full text-center" style={{ color: "#68d391" }}>
                        {player.prize}
                      </p>
                    </div>
                        <div
                          className="mt-1 border border-solid rounded-lg py-0.5 sm:py-1 md:py-2 w-full"
                          style={{ borderColor: "#34383c" }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            alt=""
                            src={
                              player.rank === 1
                                ? "/theme/default/11.png"
                                : player.rank === 2
                                  ? "/theme/default/22.png"
                                  : "/theme/default/33.png"
                            }
                            className="block w-full max-w-full h-11 sm:h-12 md:h-14 object-contain"
                          />
                        </div>
                  </div>
                  <div className="py-2 sm:py-1.5 md:py-2 px-2 sm:px-3 md:px-4 w-full rounded-br-lg rounded-bl-lg" style={{ backgroundColor: "#292f34" }}>
                    <p className="text-[9px] sm:text-[11px] md:text-[13px] font-semibold text-center sm:leading-tight" style={{ color: "#cbd5db" }}>
                      <span className="block">{t("openedLabel")}</span>
                      <span className="block">{player.opened}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 表格：从第4名开始 */}
      <div className="relative w-full overflow-hidden">
        <table className={`w-full caption-bottom text-sm ${equalizeDataColsOnMobile ? 'table-fixed sm:table-auto' : ''}`}>
          {equalizeDataColsOnMobile ? (
            <colgroup>
              <col style={{ width: `${mobileRankColWidthPx}px` }} />
              {mobileDataColsMode === "3-2-2" ? (
                <>
                  <col style={{ width: colW3 }} />
                  <col style={{ width: colW2 }} />
                  <col style={{ width: colW2 }} />
                </>
              ) : (
                <>
                  <col style={{ width: `calc(${remainingWidth} / 3)` }} />
                  <col style={{ width: `calc(${remainingWidth} / 3)` }} />
                  <col style={{ width: `calc(${remainingWidth} / 3)` }} />
                </>
              )}
            </colgroup>
          ) : null}
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors data-[state=selected]:bg-gray-600">
              <th
                className="h-12 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0"
                style={{ color: "#7A8185", width: mobileRankColWidthPx }}
              >
                #
              </th>
              <th
                className={`h-12 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 ${equalizeDataColsOnMobile ? 'sm:w-1/2' : 'w-1/2'}`}
                style={{ color: "#7A8185" }}
              >
                {t("raceWinners")}
              </th>
              <th
                className={`h-12 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 ${equalizeDataColsOnMobile ? 'w-auto' : ''} ${openedColWidthClassName ?? ''}`}
                style={{ color: "#7A8185" }}
              >
                {t("openedLabel")}
              </th>
              <th
                className={`h-12 px-4 align-middle font-medium [&:has([role=checkbox])]:pr-0 text-right ${equalizeDataColsOnMobile ? 'w-auto' : ''}`}
                style={{ color: "#7A8185" }}
              >
                {t("prizeLabel")}
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {tableData.map((row) => (
              <tr key={row.rank} className="border-b transition-colors hover:bg-[#111417] data-[state=selected]:bg-gray-600">
                <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 font-extrabold" style={{ color: "#7A8084" }}>
                  {row.rank}
                </td>
                <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                  <div className="flex gap-2 items-center">
                    <div className="overflow-hidden border rounded-full border-white" style={{ borderWidth: "1px" }}>
                      <div className="relative rounded-full overflow-hidden" style={{ width: 24, height: 24 }}>
                        {row.avatarImage ? (
                          <img
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="pointer-events-none"
                            sizes="(min-width: 0px) 100px"
                            srcSet={`${row.avatarImage}?tr=w-16,c-at_max 16w, ${row.avatarImage}?tr=w-32,c-at_max 32w, ${row.avatarImage}?tr=w-48,c-at_max 48w`}
                            src={row.avatarImage}
                            style={{ position: "absolute", height: "100%", width: "100%", inset: 0, objectFit: "cover", color: "transparent" }}
                          />
                        ) : (
                          <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                            <mask id={`${idPrefix}-table-${row.avatar}`} maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
                              <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
                            </mask>
                            <g mask={`url(#${idPrefix}-table-${row.avatar})`}>
                              <rect width="36" height="36" fill="#333333"></rect>
                              <rect x="0" y="0" width="36" height="36" transform="translate(4 4) rotate(30 18 18) scale(1)" fill="#0C8F8F" rx="6"></rect>
                              <g transform="translate(6 -5) rotate(0 18 18)">
                                <path d="M15 19c2 1 4 1 6 0" stroke="#FFFFFF" fill="none" strokeLinecap="round"></path>
                                <rect x="14" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
                                <rect x="20" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
                              </g>
                            </g>
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="relative flex w-full h-9 flex-1">
                      <div className="absolute flex inset-0 items-center">
                        <p className="text-white font-extrabold text-ellipsis overflow-hidden whitespace-nowrap w-full max-w-full">
                          {row.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </td>
                <td
                  className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 text-white font-extrabold whitespace-nowrap overflow-hidden text-ellipsis ${openedColWidthClassName ?? ''}`}
                >
                  <span className="inline-block max-w-full overflow-hidden text-ellipsis align-middle">
                    {row.tickets.toLocaleString()}
                  </span>
                </td>
                <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right font-extrabold" style={{ color: "#68d391" }}>
                  <div className="inline-flex items-center gap-2 max-w-full ml-auto">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="" src="/theme/default/44.png" className="block w-4 h-4 object-contain flex-none" />
                    <span
                      className={`block min-w-0 whitespace-nowrap overflow-hidden text-ellipsis align-middle ${tablePrizeCellWidthClassName ?? ''}`}
                      title={row.prize}
                    >
                      {row.prize}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}


