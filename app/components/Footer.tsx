"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { useI18n, type Lang } from "./I18nProvider";
import { LogoIcon } from "./icons/Logo";
import { keyDropPoppins } from "./KeyDropPoppins";
import { BATTLE_LIST_PATH } from "@/app/lib/battleRoutes";

const KD_IMG = "https://key-drop.com/web/KD/static/images/footer";

/** 页脚正文档：14px / 10.5px（独立于 Tailwind 默认 text-base、text-xs） */
const FB = "text-[14px]";
const FX = "text-[10.5px]";

/** 法律摘要与 SEO 段：固定英文，不参与 i18n */
const FOOTER_RIGHTS_LINE_EN = "All rights reserved.";
const FOOTER_COPYRIGHT_LINE_EN = "Copyright © 2026 FlameDraw. All rights reserved.";
const FOOTER_REGISTRY_EN =
  "Registration and disclosures: see Terms and Privacy Policy. Corporate entities including FlameDraw Limited are described in the legal notice.";
const FOOTER_SEO_BODY_EN = `FlameDraw is a digital pack and entertainment platform. You can explore packs, join battles, exchange items, and try draws—with transparent rules and a focus on account security.

Packs show contents and odds before you open. Battles let players compete under shared rules. Exchange helps you swap items; draws offer multiplier-style play with visible risk cues.

We publish provably fair tooling and policies explaining how outcomes are generated. Contact live support or our support email for help with your account, deposits, or withdrawals.

Play responsibly: spend only what you can afford, keep entertainment balanced with daily life, and review our Terms and Privacy Policy regularly.`;

const FOOTER_STAT_VALUES = {
  online: 8_331,
  users: 13_931_429,
  opened: 553_324_193,
  upgrades: 171_799_329,
  battles: 53_848_188,
} as const;

function statLocale(lang: Lang): string {
  const map: Record<string, string> = {
    zh: "zh-CN",
    en: "en-US",
    ko: "ko-KR",
    ja: "ja-JP",
    ru: "ru-RU",
    es: "es-ES",
    vi: "vi-VN",
  };
  return map[lang as string] ?? "en-US";
}

function formatFooterStat(n: number, lang: Lang): string {
  return n.toLocaleString(statLocale(lang));
}

const REGISTRY_CANVAS_CSS_W = 324;
const REGISTRY_FONT_SIZE_PX = 10.5;
const REGISTRY_LINE_HEIGHT_PX = Math.round(REGISTRY_FONT_SIZE_PX * 1.35);

function wrapRegistryLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const words = normalized.split(" ");
  const lines: string[] = [];
  let line = "";

  const breakLongWord = (word: string): string => {
    let part = "";
    for (const ch of word) {
      const next = part + ch;
      if (ctx.measureText(next).width <= maxW) part = next;
      else {
        if (part) lines.push(part);
        part = ch;
      }
    }
    return part;
  };

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxW) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      if (ctx.measureText(word).width <= maxW) {
        line = word;
      } else {
        line = breakLongWord(word);
      }
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** KeyDrop 同款 canvas：多行自动换行，不截断、无省略号 */
function FooterRegistryCanvas({ text }: { text: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cssW = REGISTRY_CANVAS_CSS_W;
    const maxW = cssW;
    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

    const draw = () => {
      ctx.font = `400 ${REGISTRY_FONT_SIZE_PX}px ${keyDropPoppins.style.fontFamily}`;
      const lines = wrapRegistryLines(ctx, text, maxW);
      const cssH = Math.max(REGISTRY_LINE_HEIGHT_PX, lines.length * REGISTRY_LINE_HEIGHT_PX + 4);

      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#6B7289";
      ctx.font = `400 ${REGISTRY_FONT_SIZE_PX}px ${keyDropPoppins.style.fontFamily}`;
      ctx.textBaseline = "top";

      let y = 2;
      for (const line of lines) {
        ctx.fillText(line, 0, y);
        y += REGISTRY_LINE_HEIGHT_PX;
      }
    };

    draw();
    if (typeof document !== "undefined" && document.fonts?.ready) {
      void document.fonts.ready.then(draw);
    }
  }, [text]);

  return (
    <canvas
      ref={ref}
      aria-label={text}
      role="img"
      className=""
      width={648}
      height={60}
    />
  );
}

export default function Footer() {
  const { lang, t } = useI18n();
  const [seoExpanded, setSeoExpanded] = useState(false);

  const stats: {
    icon: string;
    value: string;
    label: string;
    wideHidden?: boolean;
  }[] = [
    { icon: "footer-online.svg", value: formatFooterStat(FOOTER_STAT_VALUES.online, lang), label: t("footerStatOnline") },
    { icon: "footer-user.svg", value: formatFooterStat(FOOTER_STAT_VALUES.users, lang), label: t("footerStatUsers") },
    { icon: "footer-key.svg", value: formatFooterStat(FOOTER_STAT_VALUES.opened, lang), label: t("footerStatOpenedPacks") },
    {
      icon: "footer-upgrade.svg",
      value: formatFooterStat(FOOTER_STAT_VALUES.upgrades, lang),
      label: t("footerStatUpgrades"),
      wideHidden: true,
    },
    {
      icon: "footer-sword.svg",
      value: formatFooterStat(FOOTER_STAT_VALUES.battles, lang),
      label: t("footerStatBattles"),
      wideHidden: true,
    },
  ];

  const seoParagraphs = FOOTER_SEO_BODY_EN.split("\n\n");

  return (
    <footer
      data-testid="main-page-footer-div"
      className={`${keyDropPoppins.className} mt-9 w-full bg-navy-900 px-[17.5px]`}
    >
      <div className="flex w-full flex-col items-center gap-6 pb-7 pt-9 lg:flex-row lg:items-center lg:justify-between">
        <Link
          href="/terms"
          className="group relative flex h-[72px] w-[288px] shrink-0 items-center overflow-hidden rounded-md bg-play-responsibly transition-all hover:shadow-lg"
        >
          <img
            src={`${KD_IMG}/banner-deco-left.png?v=232`}
            alt=""
            className="pointer-events-none absolute -left-[30px] -top-[10px] w-[154px] rotate-[20deg] opacity-40"
          />
          <img
            src={`${KD_IMG}/banner-deco-right.png?v=232`}
            alt=""
            className="pointer-events-none absolute -right-[20px] -top-[60px] w-[147px] -rotate-[13deg] opacity-30"
          />
          <div className="absolute inset-0 flex items-center gap-3 pl-4 pr-2.5">
            <div className="shrink-0 -rotate-[12deg]">
              <img
                src={`${KD_IMG}/banner-app-icon.png?v=232`}
                alt=""
                className="h-[51px] w-[47px] rounded-xl object-cover"
              />
            </div>
            <div className="flex flex-col gap-0.5 uppercase">
              <span className={`${FB} font-bold leading-none text-gold-400`}>{t("footerPlayResponsiblyTitle")}</span>
              <span className={`${FX} font-semibold leading-none text-white`}>{t("footerPlayResponsiblySub")}</span>
            </div>
            <div className="ml-auto shrink-0">
              <img
                src={`${KD_IMG}/arrow-right.svg?v=232`}
                alt=""
                className="h-6 w-6 transition-transform group-hover:translate-x-0.5"
              />
            </div>
          </div>
        </Link>

        <div className="flex flex-wrap items-center justify-center gap-4 lg:flex-nowrap lg:gap-10">
          {stats.map((row, i) => (
            <div
              key={row.icon}
              className={`flex items-center gap-1 ${row.wideHidden ? "hidden md:flex" : ""}`}
            >
              <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center">
                <img
                  src={`${KD_IMG}/${row.icon}?v=232`}
                  alt=""
                  className={`h-[18px] w-[18px] object-contain ${i === 0 ? "!h-[15px] !w-[15px]" : ""}`}
                />
              </div>
              <div className="flex flex-col gap-[5px]">
                <span className={`whitespace-nowrap ${FB} font-semibold leading-none text-white`}>{row.value}</span>
                <span className={`whitespace-nowrap ${FX} font-medium leading-none text-navy-400`}>{row.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col gap-8 py-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex shrink-0 flex-col items-center gap-6 lg:items-start">
          <div className="flex h-[49px] min-h-[49px] w-full min-w-0 max-w-xl justify-center lg:justify-start">
            <Link
              href="/"
              aria-label={t("footerLogoAria")}
              className="flex h-full min-w-0 max-w-full items-end gap-3"
            >
              <LogoIcon
                className="h-full max-h-[49px] w-auto shrink-0 text-navy-400"
                color="currentColor"
                aria-hidden
              />
              <span className="min-w-0 truncate text-[38px] font-bold leading-[38px] text-navy-400">
                {t("brand")}
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3 lg:gap-[19px]">
            <a
              href="https://twitter.com/"
              target="_blank"
              rel="noopener noreferrer nofollow"
              aria-label="X"
              className="flex h-[38px] w-[38px] shrink-0 cursor-pointer items-center justify-center transition-opacity hover:opacity-80"
            >
              <img src={`${KD_IMG}/social-x.svg?v=232`} alt="X" className="h-full w-full object-contain" />
            </a>
            <a
              href="https://instagram.com/"
              target="_blank"
              rel="noopener noreferrer nofollow"
              aria-label="Instagram"
              className="flex h-[38px] w-[38px] shrink-0 cursor-pointer items-center justify-center transition-opacity hover:opacity-80"
            >
              <img src={`${KD_IMG}/social-ig.svg?v=232`} alt="Instagram" className="h-full w-full object-contain" />
            </a>
            <a
              href="https://facebook.com/"
              target="_blank"
              rel="noopener noreferrer nofollow"
              aria-label="Facebook"
              className="flex h-[38px] w-[38px] shrink-0 cursor-pointer items-center justify-center transition-opacity hover:opacity-80"
            >
              <img src={`${KD_IMG}/social-fb.svg?v=232`} alt="Facebook" className="h-full w-full object-contain" />
            </a>
            <a
              href="https://discord.com/"
              target="_blank"
              rel="noopener noreferrer nofollow"
              aria-label="Discord"
              className="flex h-[38px] w-[38px] shrink-0 cursor-pointer items-center justify-center transition-opacity hover:opacity-80"
            >
              <img src={`${KD_IMG}/social-dc.svg?v=232`} alt="Discord" className="h-full w-full object-contain" />
            </a>
            <a
              href="https://t.me/"
              target="_blank"
              rel="noopener noreferrer nofollow"
              aria-label="Telegram"
              className="flex h-[38px] w-[38px] shrink-0 cursor-pointer items-center justify-center rounded-sm bg-navy-700 transition-opacity hover:opacity-80"
            >
              <img src={`${KD_IMG}/social-tg.svg?v=232`} alt="Telegram" className="h-6 w-6 object-contain" />
            </a>
            <a
              href="https://youtube.com/"
              target="_blank"
              rel="noopener noreferrer nofollow"
              aria-label="YouTube"
              className="flex h-[38px] w-[38px] shrink-0 cursor-pointer items-center justify-center rounded-sm bg-navy-700 transition-opacity hover:opacity-80"
            >
              <img src={`${KD_IMG}/social-yt.svg?v=232`} alt="YouTube" className="h-6 w-6 object-contain" />
            </a>
          </div>

          <p className={`text-center ${FX} font-normal leading-normal text-navy-400 lg:text-left`}>
            {FOOTER_RIGHTS_LINE_EN}
            <br />
            {FOOTER_COPYRIGHT_LINE_EN}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8 lg:justify-end lg:gap-10">
          <div className="flex flex-col gap-[11px]">
            <span className={`${FX} font-semibold leading-6 text-white`}>{t("footerColCustomer")}</span>
            <ul className={`list-disc ${FX} font-normal text-navy-250`}>
              <li className="ms-[18px] leading-[25px]">
                <Link href="/fairness" className="text-navy-250 transition-colors duration-150 hover:text-white">
                  {t("footerProvablyFair")}
                </Link>
              </li>
              <li className="ms-[18px] leading-[25px]">
                <Link href="/terms" className="text-navy-250 transition-colors duration-150 hover:text-white">
                  {t("terms")}
                </Link>
              </li>
              <li className="ms-[18px] leading-[25px]">
                <Link href="/privacy-policy" className="text-navy-250 transition-colors duration-150 hover:text-white">
                  {t("footerAmlPolicy")}
                </Link>
              </li>
              <li className="ms-[18px] leading-[25px]">
                <Link href="/privacy-policy" className="text-navy-250 transition-colors duration-150 hover:text-white">
                  {t("privacy")}
                </Link>
              </li>
              <li className="ms-[18px] leading-[25px]">
                <Link
                  href="mailto:support@flamedraw.com"
                  className="text-navy-250 transition-colors duration-150 hover:text-white"
                >
                  {t("support")}
                </Link>
              </li>
              <li className="ms-[18px] leading-[25px]">
                <Link href="/fairness" className="text-navy-250 transition-colors duration-150 hover:text-white">
                  {t("footerFaq")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-[11px]">
            <span className={`${FX} font-semibold leading-6 text-white`}>{t("footerColAccount")}</span>
            <ul className={`list-disc ${FX} font-normal text-navy-250`}>
              <li className="ms-[18px] leading-[25px]">
                <Link href="/account" className="text-navy-250 transition-colors duration-150 hover:text-white">
                  {t("kdMenuMyAccount")}
                </Link>
              </li>
              <li className="ms-[18px] leading-[25px]">
                <Link href="/account/referrals" className="text-navy-250 transition-colors duration-150 hover:text-white">
                  {t("kdMenuAffiliate")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-[11px]">
            <span className={`${FX} font-semibold leading-6 text-white`}>{t("brand")}</span>
            <ul className={`list-disc ${FX} font-normal text-navy-250`}>
              <li className="ms-[18px] leading-[25px]">
                <Link href="/packs" className="text-navy-250 transition-colors duration-150 hover:text-white">
                  {t("packs")}
                </Link>
              </li>
              <li className="ms-[18px] leading-[25px]">
                <Link href={BATTLE_LIST_PATH} className="text-navy-250 transition-colors duration-150 hover:text-white">
                  {t("battles")}
                </Link>
              </li>
              <li className="ms-[18px] leading-[25px]">
                <Link href="/exchange" className="text-navy-250 transition-colors duration-150 hover:text-white">
                  {t("exchangeItems")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-[11px]">
            <span className={`${FX} font-semibold leading-6 text-white opacity-0 select-none`} aria-hidden>
              {t("brand")}
            </span>
            <ul className={`list-disc ${FX} font-normal text-navy-250`}>
              <li className="ms-[18px] leading-[25px]">
                <Link href="/draw" className="text-navy-250 transition-colors duration-150 hover:text-white">
                  {t("drawGameTitle")}
                </Link>
              </li>
              <li className="ms-[18px] leading-[25px]">
                <Link href="/account/claims" className="text-navy-250 transition-colors duration-150 hover:text-white">
                  {t("claims")}
                </Link>
              </li>
              <li className="ms-[18px] leading-[25px]">
                <Link href="/events" className="text-navy-250 transition-colors duration-150 hover:text-white">
                  {t("events")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="w-full">
        <div className="flex gap-0.5 overflow-hidden rounded-lg bg-navy-800">
          {[
            ["pay-visa.svg", "Visa"],
            ["pay-mastercard.svg", "Mastercard"],
            ["pay-sofort.svg", "Sofort"],
            ["pay-trustly.svg", "Trustly"],
            ["pay-paypal.svg", "PayPal"],
          ].map(([file, alt], idx) => (
            <div
              key={file}
              className={`flex h-[70px] flex-1 items-center justify-center bg-navy-700 ${
                idx === 2 ? "hidden md:flex" : ""
              } ${idx === 3 ? "hidden md:flex" : ""} ${idx === 4 ? "hidden lg:flex" : ""}`}
            >
              <img
                className="block h-full w-full max-h-[28px] max-w-[100px] object-contain opacity-80"
                loading="lazy"
                src={`${KD_IMG}/${file}?v=232`}
                alt={alt}
              />
            </div>
          ))}
          <div className="flex h-[70px] flex-1 items-center justify-center bg-navy-700">
            <span className={`whitespace-nowrap text-center ${FX} font-semibold text-navy-400`}>{t("footerMorePayments")}</span>
          </div>
        </div>
      </div>

      <div className="w-full pb-4 pt-8">
        <div className={`flex flex-col items-center gap-4 ${FX} font-normal leading-normal text-navy-400 lg:flex-row lg:items-start lg:justify-between`}>
          <div className="text-center lg:max-w-[580px] lg:text-left">
            <p className="uppercase">
              {FOOTER_RIGHTS_LINE_EN}
              <br />
              {FOOTER_COPYRIGHT_LINE_EN}
            </p>
          </div>
          <div className="flex justify-end text-center lg:max-w-[526px] lg:text-right">
            <FooterRegistryCanvas text={FOOTER_REGISTRY_EN} />
          </div>
        </div>

        <div className="mt-5 hidden sm:block">
          <div
            role="button"
            tabIndex={0}
            aria-expanded={seoExpanded}
            aria-label={t("footerExpandSeoAria")}
            className="cursor-pointer transition-opacity hover:opacity-80 focus:outline-none"
            onClick={() => setSeoExpanded((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSeoExpanded((v) => !v);
              }
            }}
          >
            <div
              className="relative overflow-hidden"
              style={{
                maskImage: seoExpanded ? undefined : "linear-gradient(black 60%, transparent 100%)",
                maxHeight: seoExpanded ? "none" : 120,
                height: "auto",
              }}
            >
              <div className={`text-left ${FX} font-normal leading-normal text-navy-400`}>
                {seoParagraphs.map((para, i) => (
                  <span key={i}>
                    {i > 0 ? (
                      <>
                        <br />
                        <br />
                      </>
                    ) : null}
                    {para}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
