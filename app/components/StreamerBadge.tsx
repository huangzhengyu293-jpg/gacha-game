import React from "react";
import { useI18n } from "@/app/components/I18nProvider";

type StreamerBadgeProps = {
  size?: "xs" | "sm";
  className?: string;
};

export default function StreamerBadge({ size = "sm", className }: StreamerBadgeProps) {
  const { t } = useI18n();
  const sizing =
    size === "xs"
      ? "h-4 px-1.5 text-[10px]"
      : "h-[18px] px-2 text-xxs sm:text-xs";

  return (
    <span
      className={[
        "inline-flex items-center justify-center whitespace-nowrap rounded-full",
        "border border-[#2B2F33] bg-[#1D2125] text-[#E1E7EF]",
        "font-bold leading-none",
        sizing,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {t("streamerLabel")}
    </span>
  );
}


