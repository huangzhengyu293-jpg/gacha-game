import { memo } from "react";
import type { CSSProperties, ImgHTMLAttributes } from "react";

/** 深色背景上用（约等于原先 `fill="#fff"` 的用法） */
const LOGO_ON_DARK_BG = "/logo.svg";
/** 浅色背景上用（约等于原先在中性浅底上的深色/灰色标） */
const LOGO_ON_LIGHT_BG = "/logo-black.svg";

export type LogoIconProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  /**
   * 与旧版矢量 Logo 一致：用于选择深浅资源。
   * - 未传、或白色系：用 `logo.svg`（深色底场景）
   * - 其它（如交易区 `#474A4D`、`#34383C`）：`logo-black.svg` 作形，并按该 hex 填色（与旧 fill 一致）
   */
  color?: string;
  /** 显式指定场景，覆盖由 `color` 推断的结果 */
  variant?: "onDark" | "onLight";
};

function normalizeHexLike(s: string): string {
  return s.replace(/\s/g, "").toLowerCase();
}

function isLightOnDarkContext(color?: string): boolean {
  if (color == null || color === "") return true;
  const c = normalizeHexLike(color);
  return (
    c === "#fff" ||
    c === "#ffffff" ||
    c === "white" ||
    c === "rgb(255,255,255)" ||
    c === "rgba(255,255,255,1)" ||
    c === "rgb(255, 255, 255)" ||
    c === "rgba(255, 255, 255, 1)"
  );
}

/** 交易等浅色底上的品牌灰：与旧版矢量 fill 一致，需按传入 hex 着色（非纯黑 PNG + opacity） */
const TRADE_BRAND_GRAY_HEX = new Set(["#474a4d", "#34383c"]);

function isTradeBrandGray(color?: string): boolean {
  if (!color) return false;
  return TRADE_BRAND_GRAY_HEX.has(normalizeHexLike(color));
}

function tradeGrayMaskStyle(color: string, maskUrl: string): CSSProperties {
  const bg = normalizeHexLike(color);
  return {
    backgroundColor: bg,
    WebkitMaskImage: `url(${maskUrl})`,
    maskImage: `url(${maskUrl})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskSize: "contain",
    maskSize: "contain",
  };
}

function resolveSrc(variant: LogoIconProps["variant"], color?: string): string {
  if (variant === "onDark") return LOGO_ON_DARK_BG;
  if (variant === "onLight") return LOGO_ON_LIGHT_BG;
  return isLightOnDarkContext(color) ? LOGO_ON_DARK_BG : LOGO_ON_LIGHT_BG;
}

function LogoIconComponent({
  color,
  variant,
  className,
  width,
  height,
  alt = "",
  style,
  ...rest
}: LogoIconProps) {
  const src = resolveSrc(variant, color);
  const useTradeGrayMask = isTradeBrandGray(color) && src === LOGO_ON_LIGHT_BG;

  if (useTradeGrayMask) {
    return (
      <span
        className={["inline-block max-h-full max-w-full align-middle", className].filter(Boolean).join(" ")}
        style={{
          width: width ?? undefined,
          height: height ?? undefined,
          ...tradeGrayMaskStyle(color!, LOGO_ON_LIGHT_BG),
          ...style,
        }}
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        {...rest}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={["inline-block max-h-full max-w-full object-contain align-middle", className]
        .filter(Boolean)
        .join(" ")}
      style={style}
      draggable={false}
      {...rest}
    />
  );
}

export const LogoIcon = memo(LogoIconComponent);
