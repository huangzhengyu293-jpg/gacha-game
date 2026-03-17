"use client";

import React, { useMemo, useState } from "react";
import { useI18n } from "./I18nProvider";

type FaqItem = { q: string; a?: string };

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const contentRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  return (
    <div className="flex flex-col gap-4 flex-1">
      {items.map((it, idx) => {
        const open = idx === openIdx;
        const contentEl = contentRefs.current[idx];
        const maxH = open && contentEl ? contentEl.scrollHeight : 0;
        return (
          <div key={idx} data-state={open ? 'open' : 'closed'} data-orientation="vertical" className="rounded-lg px-4" style={{ backgroundColor: '#22272B' }}>
            <h3 data-orientation="vertical" data-state={open ? 'open' : 'closed'} className="flex">
              <button
                type="button"
                aria-expanded={open}
                className="flex flex-1 items-center justify-between py-4 transition-all text-left text-base font-extrabold"
                style={{ color: '#FFFFFF' }}
                onClick={() => setOpenIdx(open ? null : idx)}
              >
                {it.q}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 transition-transform duration-200" style={{ color: '#FFFFFF', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <path d="m6 9 6 6 6-6"></path>
                </svg>
              </button>
            </h3>
            <div
              role="region"
              data-orientation="vertical"
              className="overflow-hidden text-base"
              style={{ color: '#FFFFFF', maxHeight: maxH, transition: 'max-height 260ms ease' }}
            >
              <div
                ref={(el) => { contentRefs.current[idx] = el; }}
                className="pb-3 pr-2"
                style={{ color: '#FFFFFF' }}
              >
                {it.a || ''}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function HowItWorks() {
  const { t } = useI18n();
  const faqLeft: FaqItem[] = useMemo(() => ([
    { q: t("faqWhatIsQ"), a: t("faqWhatIsA") },
    // { q: t("faqIsSafeQ"), a: t("faqIsSafeA") }, // 已移除：FlameDraw 安全公平吗？
    { q: t("faqTrustQ"), a: t("faqTrustA") },
    { q: t("faqHowOpenQ"), a: t("faqHowOpenA") },
    { q: t("faqGetSupportQ"), a: t("faqGetSupportA") },
  ]), [t]);
  const faqRight: FaqItem[] = useMemo(() => ([
    { q: t("faqHowDepositQ"), a: t("faqHowDepositA") },
    { q: t("faqCryptoPendingQ"), a: t("faqCryptoPendingA") },
    { q: t("faqWhatBattleQ"), a: t("faqWhatBattleA") },
  ]), [t]);

  return (
    <div className="flex flex-col items-stretch gap-4">
      <div className="flex items-center gap-2">
        <div className="size-6" style={{ color: '#9CA3AF' }}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.9 20C9.80858 20.979 12.0041 21.2442 14.0909 20.7478C16.1777 20.2513 18.0186 19.0258 19.2818 17.2922C20.545 15.5585 21.1474 13.4307 20.9806 11.2921C20.8137 9.1536 19.8886 7.14496 18.3718 5.62818C16.855 4.1114 14.8464 3.18624 12.7078 3.0194C10.5693 2.85257 8.44147 3.45503 6.70782 4.71823C4.97417 5.98143 3.74869 7.8223 3.25222 9.9091C2.75575 11.9959 3.02094 14.1914 4 16.1L2 22L7.9 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M9.09003 8.99999C9.32513 8.33166 9.78918 7.7681 10.4 7.40912C11.0108 7.05015 11.7289 6.91893 12.4272 7.0387C13.1255 7.15848 13.7588 7.52151 14.2151 8.06352C14.6714 8.60552 14.9211 9.29151 14.92 9.99999C14.92 12 11.92 13 11.92 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M12 17H12.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path></svg>
        </div>
        <h3 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>{t("howItWorksTitle")}</h3>
      </div>

      <div data-orientation="vertical">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <FaqAccordion items={faqLeft} />
          <FaqAccordion items={faqRight} />
        </div>
      </div>
    </div>
  );
}


