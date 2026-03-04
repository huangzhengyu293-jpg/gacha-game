/** 根字体 16px 时：px ÷ 16 = rem */
const ROOT_FONT_SIZE = 16;

/**
 * 将设计稿的 px 转为 rem（默认根字体 16px）
 * 例：pxToRem(32) => '2rem'，pxToRem(24) => '1.5rem'
 */
export function pxToRem(px: number): string {
  return `${px / ROOT_FONT_SIZE}rem`;
}
