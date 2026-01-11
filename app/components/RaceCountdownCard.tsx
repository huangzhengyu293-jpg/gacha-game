"use client";

import { memo, useEffect, useState } from "react";
import { useI18n } from "./I18nProvider";

type CountdownFormat = "hms" | "dhms";
type CountdownLabelKey = "raceEndsIn" | "raffleStartsIn";

type Props = {
  title: string;
  getRemainingMs: () => number;
  format: CountdownFormat;
  labelKey: CountdownLabelKey;
  introImageSrc?: string; // 可选：活动介绍弹窗图片
  introAutoOpenSessionKey?: string; // 可选：首次进入（本标签页）自动弹一次
};

export const RaceCountdownCard = memo(function RaceCountdownCard({
  title,
  getRemainingMs,
  format,
  labelKey,
  introImageSrc,
  introAutoOpenSessionKey,
}: Props) {
  const { t } = useI18n();
  const [countdownText, setCountdownText] = useState<string>(t("calculating"));
  const [introOpen, setIntroOpen] = useState(false);

  useEffect(() => {
    if (!introImageSrc || !introAutoOpenSessionKey) return;
    if (typeof window === "undefined") return;
    try {
      const seen = window.sessionStorage.getItem(introAutoOpenSessionKey);
      if (seen) return;
      window.sessionStorage.setItem(introAutoOpenSessionKey, "1");
      setIntroOpen(true);
    } catch {
      // ignore
    }
  }, [introAutoOpenSessionKey, introImageSrc]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const formatHMS = (ms: number) => {
      const unitHour = t("timeUnitHour");
      const unitMinute = t("timeUnitMinute");
      const unitSecond = t("timeUnitSecond");
      if (ms <= 0) return `0${unitHour} 0${unitMinute} 0${unitSecond}`;
      const totalSeconds = Math.floor(ms / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return `${hours}${unitHour} ${minutes}${unitMinute} ${seconds}${unitSecond}`;
    };

    const formatDHMS = (ms: number) => {
      const unitDay = t("timeUnitDay");
      const unitHour = t("timeUnitHour");
      const unitMinute = t("timeUnitMinute");
      const unitSecond = t("timeUnitSecond");
      if (ms <= 0) return `0${unitDay} 0${unitHour} 0${unitMinute} 0${unitSecond}`;
      const totalSeconds = Math.floor(ms / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return `${days}${unitDay} ${hours}${unitHour} ${minutes}${unitMinute} ${seconds}${unitSecond}`;
    };

    const tick = () => {
      const ms = getRemainingMs();
      setCountdownText(format === "hms" ? formatHMS(ms) : formatDHMS(ms));
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [format, getRemainingMs, t]);

  return (
    <div className="rounded-lg p-4 md:p-8" style={{ backgroundColor: "#22272B" }}>
      <div className="relative rounded-lg overflow-hidden" style={{ backgroundColor: "#1d2125" }}>
        <div
          className="absolute -top-6 left-0 w-full overflow-hidden rounded-lg pointer-events-none"
          style={{ height: "calc(100% + 1.5rem)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/theme/default/flag.png"
            alt=""
            className="absolute top-0 object-contain object-top w-[260px] h-[195px] xxs:w-[300px] xxs:h-[240px] sm:w-[426px] sm:h-[340px]"
            style={{ left: "-110px", zIndex: 0 }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/theme/default/flag.png"
            alt=""
            className="absolute top-0 object-contain object-top w-[260px] h-[195px] xxs:w-[300px] xxs:h-[240px] sm:w-[426px] sm:h-[340px]"
            style={{ right: "-110px", transform: "scaleX(-1)", zIndex: 0 }}
          />
        </div>
        <div className="relative flex flex-col items-center pt-9 pb-6 md:pb-12 px-3">
          <p className="font-changa text-base sm:text-[25px] lg:text-[32px] text-white mb-3 md:mb-4 leading-none text-center">
            {title}
          </p>
          <p
            className="flex items-center justify-center font-semibold text-white text-sm md:text-base border border-solid rounded-lg min-h-11 px-4 text-center"
            style={{ borderColor: "#34383c", backgroundColor: "#1d2125" }}
          >
            {t(labelKey).replace("{time}", countdownText)}
          </p>
          {introImageSrc ? (
            <button
              type="button"
              className="mt-3 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative text-sm font-bold select-none h-10 px-5"
              style={{ backgroundColor: "#34383C", color: "#FFFFFF", cursor: "pointer" }}
              onClick={() => setIntroOpen(true)}
            >
              {t("activityIntro")}
            </button>
          ) : null}
        </div>
      </div>

      {introImageSrc && introOpen ? (
        <div
          className="fixed inset-0 z-[120] bg-black/[0.48] flex items-center justify-center px-4"
          style={{ pointerEvents: "auto" }}
          onClick={() => setIntroOpen(false)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={introImageSrc}
              alt=""
              className="block max-w-[95vw] max-h-[90vh] object-contain"
            />
            <button
              type="button"
              className="absolute right-2 top-2 rounded-lg w-8 h-8 flex items-center justify-center"
              style={{ backgroundColor: "rgba(0,0,0,0.45)", color: "#FFFFFF" }}
              onClick={() => setIntroOpen(false)}
              aria-label={t("close")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-x"
              >
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
});


