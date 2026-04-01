import localFont from "next/font/local";

/**
 * 与参考站一致的 Poppins：使用 `public/fonts/poppins` 内下载的 woff2（latin + latin-ext）。
 * `goldman-bold-latin.woff2` 非 Poppins，未列入。
 * 字重 300–700；无 800/900 时浏览器会对近邻字重做合成。
 */
export const keyDropPoppins = localFont({
  src: [
    {
      path: "../../public/fonts/poppins/poppins-300-latin.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/poppins/poppins-300-latin-ext.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/poppins/poppins-400-latin.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/poppins/poppins-400-latin-ext.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/poppins/poppins-500-latin.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/poppins/poppins-500-latin-ext.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/poppins/poppins-600-latin.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/poppins/poppins-600-latin-ext.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/poppins/poppins-700-latin.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/poppins/poppins-700-latin-ext.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-poppins",
  display: "swap",
  fallback: ["sans-serif"],
});
