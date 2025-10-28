"use client";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "./I18nProvider";

export default function Footer() {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [gamesOpen, setGamesOpen] = useState(true);
  const [legalOpen, setLegalOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  
  function MobileAccordion({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode; }) {
    const contentRef = useRef<HTMLDivElement | null>(null);
    const [contentHeight, setContentHeight] = useState(0);
    const [hasCalculated, setHasCalculated] = useState(false);

    // Only calculate height when opening for the first time or on window resize
    useEffect(() => {
      const calc = () => {
        if (contentRef.current) {
          setContentHeight(contentRef.current.scrollHeight);
          setHasCalculated(true);
        }
      };
      
      if (open && !hasCalculated) {
        // Use setTimeout to ensure DOM is updated
        setTimeout(calc, 0);
      }
      
      window.addEventListener('resize', calc);
      return () => window.removeEventListener('resize', calc);
    }, [open, hasCalculated]);

    // Reset calculation flag when closing
    useEffect(() => {
      if (!open) {
        setHasCalculated(false);
      }
    }, [open]);

    return (
      <div className="rounded-lg px-0 bg-black">
        <h3 className="flex">
          <button
            type="button"
            aria-expanded={open}
            onClick={onToggle}
            className={`flex flex-1 items-center justify-between transition-all text-left text-white font-extrabold text-base py-2`}
          >
            {title}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-chevron-down h-4 w-4 shrink-0 text-white transition-transform duration-300 ${open ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"></path></svg>
          </button>
        </h3>
        <div
          style={{ maxHeight: open ? `${contentHeight}px` : '0px', transition: 'max-height 300ms ease', willChange: 'max-height' }}
          className="overflow-hidden"
        >
          <div
            ref={contentRef}
            style={{ opacity: open ? 1 : 0, transition: 'opacity 250ms ease 50ms' }}
            className="pt-0"
          >
            {children}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col w-full items-center bg-black">
      <div className="flex flex-col md:flex-row gap-4 w-full max-w-screen-xl py-6 md:py-8 px-4">
        <div className="flex flex-1 flex-col gap-2 max-w-[560px]">
          <div className="flex items-center">
            <div className="size-6 mr-3 text-white">
              <svg viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.21192 7.42225C1.15968 8.23994 0.158879 10.5665 0.976565 12.6187L12.821 42.346C13.6387 44.3982 15.9652 45.399 18.0174 44.5813L34.739 37.9188C36.7913 37.1012 37.7921 34.7746 36.9744 32.7224L25.13 2.99512C24.3123 0.942884 21.9857 -0.0579184 19.9335 0.759768L3.21192 7.42225Z" fill="currentColor"></path>
                <path d="M35.8047 22.5693L35.7383 6.50156C35.7292 4.29244 33.931 2.50898 31.7219 2.5181L27.822 2.5342L35.8047 22.5693Z" fill="currentColor"></path>
                <path d="M38.0241 27.9748L44.3787 13.2168C45.2524 11.1878 44.3158 8.83469 42.2868 7.96101L38.7048 6.41865L38.0241 27.9748Z" fill="currentColor"></path>
              </svg>
            </div>
            <h1 className="text-xl text-white font-black">{t("brand")}</h1>
          </div>
          <h3 className="text-base text-gray-400 max-w-72 my-2">{t("slogan")}</h3>
        </div>

        {/* Mobile accordion */}
        <div className="flex flex-col gap-3 md:hidden">
          <MobileAccordion title={t("games")} open={gamesOpen} onToggle={() => setGamesOpen(!gamesOpen)}>
            <div className="flex flex-col min-w-44 gap-1 py-0 pb-1">
              <p className="text-base font-semibold text-gray-400">{t("packs")}</p>
              <p className="text-base font-semibold text-gray-400">{t("battles")}</p>
              <p className="text-base font-semibold text-gray-400">{t("deals")}</p>
              <p className="text-base font-semibold text-gray-400">{t("events")}</p>
              <p className="text-base font-semibold text-gray-400">{t("rewards")}</p>
            </div>
          </MobileAccordion>

          <MobileAccordion title={t("legal")} open={legalOpen} onToggle={() => setLegalOpen(!legalOpen)}>
            <div className="flex flex-col min-w-44 gap-1 py-0 pb-1">
              <p className="text-base font-semibold text-gray-400">{t("fairness")}</p>
              <p className="text-base font-semibold text-gray-400">{t("privacy")}</p>
              <p className="text-base font-semibold text-gray-400">{t("terms")}</p>
            </div>
          </MobileAccordion>

          <div className="flex flex-col gap-2">
            <p className="text-base text-white font-bold">{t("community")}</p>
            <div className="flex gap-3">
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-gray-600 text-base text-white font-bold hover:bg-gray-500 disabled:text-gray-400 select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8">
                <div className="size-5">
                  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.9025 1.90625H13.97L9.45313 7.06875L14.7669 14.0938H10.6063L7.3475 9.83312L3.61875 14.0938H1.55L6.38125 8.57188L1.28375 1.90625H5.55L8.49563 5.80062L11.9025 1.90625ZM11.1769 12.8563H12.3225L4.9275 3.07875H3.69813L11.1769 12.8563Z" fill="currentColor"></path></svg>
                </div>
              </button>
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-gray-600 text-base text-white font-bold hover:bg-gray-500 disabled:text-gray-400 select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram size-5"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
              </button>
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-gray-600 text-base text-white font-bold hover:bg-gray-500 disabled:text-gray-400 select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube size-5"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path><path d="m10 15 5-3-5-3z"></path></svg>
              </button>
            </div>
          </div>

          {/* Mobile language selector */}
          <div className="flex flex-col gap-2 mt-2">
            <p className="text-base text-gray-400">{t("chooseLanguage")}</p>
            <div className="relative w-auto min-w-52">
              <button onClick={() => setOpen(!open)} className="flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 border-gray-700 bg-black text-base text-white font-bold">
                <span>{lang === "zh" ? "中文" : lang === "en" ? "English" : lang === "ko" ? "한국어" : "日本語"}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down h-4 w-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
              </button>
              {open && (
                <div className="absolute left-0 right-0 mt-1 rounded-md border border-gray-700 bg-black text-white shadow-lg z-10">
                  <button onClick={() => { setLang("zh"); setOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-900">中文</button>
                  <button onClick={() => { setLang("en"); setOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-900">English</button>
                  <button onClick={() => { setLang("ko"); setOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-900">한국어</button>
                  <button onClick={() => { setLang("ja"); setOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-900">日本語</button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile support */}
          <div className="flex flex-col mt-2">
            <p className="text-base text-white font-bold">{t("support")}</p>
            <p className="text-base font-semibold text-gray-400">{t("email")}</p>
          </div>
        </div>

        {/* Desktop columns */}
        <div className="hidden md:flex flex-1 flex-wrap justify-between gap-4">
          <div className="flex flex-col min-w-44 gap-1">
            <p className="text-base text-white font-bold">{t("games")}</p>
            <p className="text-base text-gray-400">{t("packs")}</p>
            <p className="text-base text-gray-400">{t("battles")}</p>
            <p className="text-base text-gray-400">{t("deals")}</p>
            <p className="text-base text-gray-400">{t("events")}</p>
            <p className="text-base text-gray-400">{t("rewards")}</p>
          </div>
          <div className="flex flex-col min-w-44 gap-1">
            <p className="text-base text-white font-bold">{t("legal")}</p>
            <p className="text-base text-gray-400">{t("fairness")}</p>
            <p className="text-base text-gray-400">{t("privacy")}</p>
            <p className="text-base text-gray-400">{t("terms")}</p>
            <div className="flex flex-col gap-2 mt-3">
              <p className="text-base text-white font-bold">{t("community")}</p>
              <div className="flex gap-3">
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-gray-600 text-base text-white font-bold hover:bg-gray-500 disabled:text-gray-400 select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8">
                  <div className="size-5">
                    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.9025 1.90625H13.97L9.45313 7.06875L14.7669 14.0938H10.6063L7.3475 9.83312L3.61875 14.0938H1.55L6.38125 8.57188L1.28375 1.90625H5.55L8.49563 5.80062L11.9025 1.90625ZM11.1769 12.8563H12.3225L4.9275 3.07875H3.69813L11.1769 12.8563Z" fill="currentColor"></path></svg>
                  </div>
                </button>
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-gray-600 text-base text-white font-bold hover:bg-gray-500 disabled:text-gray-400 select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram size-5"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                </button>
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-gray-600 text-base text-white font-bold hover:bg-gray-500 disabled:text-gray-400 select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube size-5"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path><path d="m10 15 5-3-5-3z"></path></svg>
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col min-w-44 gap-6">
            <div className="flex flex-col">
              <p className="text-base text-gray-400">{t("chooseLanguage")}</p>
              <div className="relative w-auto min-w-52">
                <button onClick={() => setOpen(!open)} className="flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 border-gray-700 bg-black text-base text-white font-bold">
                  <span>{lang === "zh" ? "中文" : lang === "en" ? "English" : lang === "ko" ? "한국어" : "日本語"}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down h-4 w-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                </button>
                {open && (
                  <div className="absolute left-0 right-0 mt-1 rounded-md border border-gray-700 bg-black text-white shadow-lg z-10">
                    <button onClick={() => { setLang("zh"); setOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-900">中文</button>
                    <button onClick={() => { setLang("en"); setOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-900">English</button>
                    <button onClick={() => { setLang("ko"); setOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-900">한국어</button>
                    <button onClick={() => { setLang("ja"); setOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-900">日本語</button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <p className="text-base text-white font-bold">{t("support")}</p>
              <p className="text-base text-gray-400">{t("email")}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full bg-gray-800 h-[1px]"></div>
      <div className="flex flex-col md:flex-row gap-4 w-full max-w-screen-xl py-4 px-4">
        <p className="text-xs">
          <span className="text-gray-400">{t("copyright")}</span>
          <span>. </span>
          <span className="text-gray-500">{t("legalBrandNote")}</span>
        </p>
      </div>
    </div>
  );
}


