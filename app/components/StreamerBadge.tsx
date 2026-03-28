import React from "react";

type StreamerBadgeProps = {
  size?: "xs" | "sm";
  className?: string;
};

const SIZE_PX = {
  xs: 18,
  sm: 22,
} as const;

/** 主播标识：使用麦克风图标，替代原文案「主播」 */
export default function StreamerBadge({ size = "sm", className }: StreamerBadgeProps) {
  const h = SIZE_PX[size];
  return (
    <span
      className={["inline-flex items-center justify-center leading-none", className].filter(Boolean).join(" ")}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- 小图标静态资源 */}
      <img
        src="/images/zhubo.png"
        alt=""
        width={h}
        height={h}
        className="object-contain object-bottom select-none"
        style={{ height: h, width: "auto", maxWidth: h + 4 }}
        draggable={false}
      />
    </span>
  );
}
