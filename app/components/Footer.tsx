"use client";
import { useEffect, useRef, useState, memo } from "react";
import InlineSelect from "./InlineSelect";
import { useI18n } from "./I18nProvider";
import { LogoIcon } from "./icons/Logo";

// Hoisted accordion to avoid remounts on Footer re-renders
const MobileAccordionBase = ({ title, defaultOpen, children }: { title: string; defaultOpen: boolean; children: React.ReactNode; }) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(defaultOpen);
  const [contentHeight, setContentHeight] = useState(0);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const calc = () => {
      if (contentRef.current) {
        setContentHeight(contentRef.current.scrollHeight);
        setHasCalculated(true);
      }
    };
    if (open && !hasCalculated) setTimeout(calc, 0);
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [open, hasCalculated]);

  useEffect(() => { if (!open) setHasCalculated(false); }, [open]);

  const handleToggle = () => {
    setAnimate(true);
    setTimeout(() => setAnimate(false), 360);
    setOpen(v => !v);
    setTimeout(() => setAnimate(false), 400);
  };

  return (
    <div className="rounded-lg px-0 bg-black">
      <h3 className="flex">
        <button
          type="button"
          aria-expanded={open}
          onClick={handleToggle}
          className={`flex flex-1 items-center justify-between transition-all text-left font-extrabold text-base py-2`}
          style={{ color: '#FFFFFF' }}
        >
          {title}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-chevron-down h-4 w-4 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} style={{ color: '#FFFFFF' }}><path d="m6 9 6 6 6-6"></path></svg>
        </button>
      </h3>
      <div
        style={{ maxHeight: open ? `${contentHeight}px` : '0px', transition: animate ? 'max-height 300ms ease' : 'none', willChange: 'max-height' }}
        className="overflow-hidden"
      >
        <div
          ref={contentRef}
          style={{ opacity: open ? 1 : 0, transition: animate ? 'opacity 250ms ease 50ms' : 'none' }}
          className="pt-0"
        >
          {children}
        </div>
      </div>
    </div>
  );
};

const MobileAccordionMemo = memo(MobileAccordionBase, (prev, next) => prev.title === next.title && prev.defaultOpen === next.defaultOpen);

export default function Footer() {
  const { lang, setLang, t } = useI18n();
  // 保留初始展开偏好，具体开合由子组件自管理，避免父级重渲染干扰动画
  const gamesDefaultOpen = true;
  const legalDefaultOpen = false;
  
  // MobileAccordion hoisted at module scope (see top of file)
  
  const communityBtnBase = { backgroundColor: '#2A2D35', color: '#FFFFFF', cursor: 'pointer' as const };
  const onEnter = (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; };
  const onLeave = (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2A2D35'; };

  // language options handled by InlineSelect

  // (language dropdown now uses InlineSelect; no global click handler needed)

  // no-op: accordion is self-controlled; no parent toggles required

  return (
    <div className="flex flex-col w-full items-center bg-black">
      <div className="flex flex-col md:flex-row gap-4 w-full mx-auto max-w-[1280px] py-6 md:py-8 px-4">
        <div className="flex flex-1 flex-col gap-2 max-w-[560px]">
          <div className="flex items-center">
            <LogoIcon width={24} height={24} color="#FFFFFF" className="mr-3 w-6 h-6" aria-hidden />
            <h1 className="text-xl font-black" style={{ color: '#FFFFFF' }}>{t("brand")}</h1>
          </div>
          <h3 className="text-base max-w-72 my-2" style={{ color: '#7A8084' }}>{t("slogan")}</h3>
        </div>

        {/* Mobile accordion */}
        <div className="flex flex-col gap-3 md:hidden">
          <MobileAccordionMemo title={t("games")} defaultOpen={gamesDefaultOpen}>
            <div className="flex flex-col min-w-44 gap-1 py-0 pb-1">
              <a href="/packs" className="text-base font-semibold cursor-pointer" style={{ color: '#7A8084' }}>{t("packs")}</a>
              <a href="/battles" className="text-base font-semibold cursor-pointer" style={{ color: '#7A8084' }}>{t("battles")}</a>
              <a href="/deals" className="text-base font-semibold cursor-pointer" style={{ color: '#7A8084' }}>{t("deals")}</a>
              <a href="/events" className="text-base font-semibold cursor-pointer" style={{ color: '#7A8084' }}>{t("events")}</a>
              <a href="/rewards" className="text-base font-semibold cursor-pointer" style={{ color: '#7A8084' }}>{t("rewards")}</a>
            </div>
          </MobileAccordionMemo>

          <MobileAccordionMemo title={t("legal")} defaultOpen={legalDefaultOpen}>
            <div className="flex flex-col min-w-44 gap-1 py-0 pb-1">
              <a href="/fairness" className="text-base font-semibold cursor-pointer" style={{ color: '#7A8084' }}>{t("fairness")}</a>
              <p className="text-base font-semibold" style={{ color: '#7A8084' }}>{t("privacy")}</p>
              <p className="text-base font-semibold" style={{ color: '#7A8084' }}>{t("terms")}</p>
            </div>
          </MobileAccordionMemo>

          <div className="flex flex-col gap-2">
            <p className="text-base font-bold" style={{ color: '#FFFFFF' }}>{t("community")}</p>
            <div className="flex gap-3">
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8" style={communityBtnBase} onMouseEnter={onEnter} onMouseLeave={onLeave}>
                <div className="size-5" style={{ color: '#FFFFFF' }}>
                  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.9025 1.90625H13.97L9.45313 7.06875L14.7669 14.0938H10.6063L7.3475 9.83312L3.61875 14.0938H1.55L6.38125 8.57188L1.28375 1.90625H5.55L8.49563 5.80062L11.9025 1.90625ZM11.1769 12.8563H12.3225L4.9275 3.07875H3.69813L11.1769 12.8563Z" fill="currentColor"></path></svg>
                </div>
              </button>
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8" style={communityBtnBase} onMouseEnter={onEnter} onMouseLeave={onLeave}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram size-5" style={{ color: '#FFFFFF' }}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
              </button>
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8" style={communityBtnBase} onMouseEnter={onEnter} onMouseLeave={onLeave}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube size-5" style={{ color: '#FFFFFF' }}><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path><path d="m10 15 5-3-5-3z"></path></svg>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <p className="text-base" style={{ color: '#7A8084' }}>{t("chooseLanguage")}</p>
            <div className="w-auto min-w-52">
              <InlineSelect
                value={lang}
                onChange={(v) => setLang(v as any)}
                options={[
                  { label: '中文', value: 'zh' },
                  { label: 'English', value: 'en' },
                  { label: '한국어', value: 'ko' },
                  { label: '日本語', value: 'ja' },
                ]}
              />
            </div>
          </div>

          <div className="flex flex-col mt-2">
            <p className="text-base font-bold" style={{ color: '#FFFFFF' }}>{t("support")}</p>
            <p className="text-base" style={{ color: '#7A8084' }}>{t("email")}</p>
          </div>
        </div>

        {/* Desktop columns */}
        <div className="hidden md:flex flex-1 flex-wrap justify-between gap-4">
          <div className="flex flex-col min-w-44 gap-1">
            <p className="text-base font-bold" style={{ color: '#FFFFFF' }}>{t("games")}</p>
            <a href="/packs" className="text-base cursor-pointer" style={{ color: '#7A8084' }}>{t("packs")}</a>
            <a href="/battles" className="text-base cursor-pointer" style={{ color: '#7A8084' }}>{t("battles")}</a>
            <a href="/deals" className="text-base cursor-pointer" style={{ color: '#7A8084' }}>{t("deals")}</a>
            <a href="/events" className="text-base cursor-pointer" style={{ color: '#7A8084' }}>{t("events")}</a>
            <a href="/rewards" className="text-base cursor-pointer" style={{ color: '#7A8084' }}>{t("rewards")}</a>
          </div>
          <div className="flex flex-col min-w-44 gap-1">
            <p className="text-base font-bold" style={{ color: '#FFFFFF' }}>{t("legal")}</p>
            <a href="/fairness" className="text-base cursor-pointer" style={{ color: '#7A8084' }}>{t("fairness")}</a>
            <p className="text-base" style={{ color: '#7A8084' }}>{t("privacy")}</p>
            <p className="text-base" style={{ color: '#7A8084' }}>{t("terms")}</p>
            <div className="flex flex-col gap-2 mt-3">
              <p className="text-base font-bold" style={{ color: '#FFFFFF' }}>{t("community")}</p>
              <div className="flex gap-3">
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8" style={communityBtnBase} onMouseEnter={onEnter} onMouseLeave={onLeave}>
                  <div className="size-5" style={{ color: '#FFFFFF' }}>
                    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.9025 1.90625H13.97L9.45313 7.06875L14.7669 14.0938H10.6063L7.3475 9.83312L3.61875 14.0938H1.55L6.38125 8.57188L1.28375 1.90625H5.55L8.49563 5.80062L11.9025 1.90625ZM11.1769 12.8563H12.3225L4.9275 3.07875H3.69813L11.1769 12.8563Z" fill="currentColor"></path></svg>
                  </div>
                </button>
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8" style={communityBtnBase} onMouseEnter={onEnter} onMouseLeave={onLeave}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram size-5" style={{ color: '#FFFFFF' }}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                </button>
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8" style={communityBtnBase} onMouseEnter={onEnter} onMouseLeave={onLeave}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube size-5" style={{ color: '#FFFFFF' }}><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path><path d="m10 15 5-3-5-3z"></path></svg>
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col min-w-44 gap-6">
            <div className="flex flex-col">
              <p className="text-base" style={{ color: '#7A8084' }}>{t("chooseLanguage")}</p>
              <div className="w-auto min-w-52">
                <InlineSelect
                  value={lang}
                  onChange={(v) => setLang(v as any)}
                  options={[
                    { label: '中文', value: 'zh' },
                    { label: 'English', value: 'en' },
                    { label: '한국어', value: 'ko' },
                    { label: '日本語', value: 'ja' },
                  ]}
                />
              </div>
            </div>
            <div className="flex flex-col">
              <p className="text-base font-bold" style={{ color: '#FFFFFF' }}>{t("support")}</p>
              <p className="text-base" style={{ color: '#7A8084' }}>{t("email")}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full" style={{ backgroundColor: '#374151', height: 1 }}></div>
      <div className="flex flex-col md:flex-row gap-4 w-full mx-auto max-w-[1248px] py-4 px-4">
        <p className="text-xs" style={{ color: '#7A8084' }}>
          <span>{t("copyright")}</span>
          <span> </span>
          <span style={{ color: '#5A5E62' }}>{t("legalBrandNote")}</span>
        </p>
      </div>
    </div>
  );
}


