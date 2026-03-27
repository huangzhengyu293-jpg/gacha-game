import { Poppins } from "next/font/google";

/** 仅用于 KeyDrop 顶栏与同款导航抽屉 / 账户面板 */
export const keyDropPoppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  fallback: ["sans-serif"],
});
