'use client';

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import AccountMobileMenu from "../components/AccountMobileMenu";
import { useI18n } from "@/app/components/I18nProvider";
import { useAuth } from "@/app/hooks/useAuth";
import { api } from "@/app/lib/api";
import DealsPaginationBar from "@/app/components/DealsPaginationBar";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useMemo, useState } from "react";

dayjs.extend(customParseFormat);

type DrawRecord = {
  id: number;
  type?: number | string;
  money?: string;
  price?: string;
  created_at?: string;
  draw_card_log?: Array<{
    status?: number | string;
  }>;
};

const difficultyLabel = (type?: number | string, t?: (k: string) => string) => {
  const numeric = Number(type);
  if (numeric === 1) return t ? t("drawDifficultyEasy") : "Easy";
  if (numeric === 2) return t ? t("drawDifficultyMedium") : "Medium";
  if (numeric === 3) return t ? t("drawDifficultyHard") : "Hard";
  return t ? t("drawDifficultyUnknown") : "Unknown";
};

const formatDate = (value?: string) => {
  if (!value) return "--";
  const parsed = dayjs(value, ["YYYY-MM-DD HH:mm:ss", "YYYY/MM/DD HH:mm:ss"], true);
  if (parsed.isValid()) return parsed.format("MM-DD-YYYY HH:mm");
  const fallback = dayjs(value);
  return fallback.isValid() ? fallback.format("MM-DD-YYYY HH:mm") : value;
};

export default function DrawsPage() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(0);
  const pageSize = 25;

  

  const { data } = useQuery({
    queryKey: ["draw-my-record"],
    queryFn: api.drawMyRecord,
    enabled: isAuthenticated,
    staleTime: 0,
  });

  const records: DrawRecord[] = useMemo(
    () => (Array.isArray((data as any)?.data) ? ((data as any).data as DrawRecord[]) : []),
    [data],
  );

  const total = records.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const startIndex = currentPage * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const pageItems = records.slice(startIndex, endIndex);
  const paginationMeta = {
    start: total > 0 ? startIndex + 1 : 0,
    end: endIndex,
    total,
  };

  return (
    <div className="w-full max-w-screen-xl px-4 pt-4 pb-40 mx-auto" style={{ color: '#7A8084' }}>
      <style>{`
        .acct-menu-item { background-color: transparent; color: #7A8084; }
        .acct-menu-item:hover { background-color: #34383C; color: #FFFFFF; }
        .acct-menu-item--active { background-color: #34383C; color: #FFFFFF; }
      `}</style>
      <div className="flex flex-col lg:flex-row items-start gap-0 lg:gap-10">
        <div className="hidden lg:flex flex-col gap-4 w-[220px] flex-none">
          <div className="flex flex-col gap-3 items-stretch w-full">
            <span className="text-sm font-bold text-white/40">{t('accountSection')}</span>
            <Link href="/account" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountProfile')}</span></Link>
            <Link href="/account/deposits" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountDepositsTitle')}</span></Link>
            <Link href="/account/withdrawals" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountWithdrawalsTitle')}</span></Link>
            <Link href="/account/transfers" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountTransfersTitle')}</span></Link>
            <Link href="/account/claims" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountClaimsTitle')}</span></Link>
            <Link href="/account/sales" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountSalesTitle')}</span></Link>
            <Link href="/account/battles" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountBattlesTitle')}</span></Link>
            <Link href="/account/packs" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountPacksTitle')}</span></Link>
            <Link href="/account/transactions" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountTransactionsTitle')}</span></Link>
            <Link href="/account/draws" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item--active"><span className="font-bold">{t('accountDrawsTitle')}</span></Link>
            <Link href="/account/referrals" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('referrals')}</span></Link>
          </div>
        </div>
        <div className="flex flex-col items-start w-full lg:flex-1 min-w-0 gap-2">
          <div className="flex justify-between items-center self-stretch pb-1 pt-4 lg:pt-0 min-w-0">
            <AccountMobileMenu />
            <h1 className="text-2xl font-bold hidden lg:block" style={{ color: '#FFFFFF' }}>{t('accountDrawsTitle')}</h1>
          </div>
          {records.length === 0 ? (
            <div className="flex flex-col gap-3 items-center justify-center py-12 self-stretch">
              <span className="font-semibold" style={{ color: '#FFFFFF' }}>{t('noDraws')}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4 self-stretch">
              <DealsPaginationBar
                start={paginationMeta.start}
                end={paginationMeta.end}
                total={paginationMeta.total}
                onPrev={() => setPage((p) => Math.max(0, p - 1))}
                onNext={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabledPrev={currentPage === 0}
                disabledNext={currentPage >= pageCount - 1}
              />
              <div className="self-stretch space-y-6 z-10">
                {pageItems.map((item) => {
                  const totalCards = Array.isArray(item.draw_card_log) ? item.draw_card_log.length : 0;
                  const receivedCount = Array.isArray(item.draw_card_log)
                    ? item.draw_card_log.filter((log) => Number(log?.status) === 2).length
                    : 0;
                  const title = `${t("drawGameTitle")} - ${difficultyLabel(item.type, t)}`;
                  return (
                    <div key={item.id} className="rounded-lg p-6" style={{ backgroundColor: '#22272B', color: '#FAFAFA' }}>
                      <div className="flex justify-between items-center pb-4" style={{ color: '#FAFAFA' }}>
                        <span className="truncate text-lg font-bold mr-2">{title}</span>
                        <span className="whitespace-nowrap">{formatDate(item.created_at)}</span>
                      </div>
                      <div className="flex w-full h-[1px] mb-6" style={{ backgroundColor: '#34383C' }} />
                      <div className="flex justify-between items-center">
                        <div className="flex gap-10 max-w-[100%] lg:max-w-[100%]">
                          <div className="flex-none flex flex-col items-start gap-2">
                            <span className="font-semibold">{t("drawLabelDifficulty")}</span>
                            <span className="font-semibold">{t("drawLabelPurchasePrice")}</span>
                            <span className="font-semibold">{t("drawLabelClaimedItems")}</span>
                            <span className="font-semibold">{t("drawLabelClaimedValue")}</span>
                          </div>
                          <div className="flex flex-col items-start overflow-hidden max-w-full gap-2">
                            <span className="truncate max-w-full">{difficultyLabel(item.type)}</span>
                            <span className="truncate max-w-full">${item.money ?? '--'}</span>
                            <span className="truncate max-w-full">{receivedCount} of {totalCards}</span>
                            <span className="truncate max-w-full">${item.price ?? '--'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <DealsPaginationBar
                start={paginationMeta.start}
                end={paginationMeta.end}
                total={paginationMeta.total}
                onPrev={() => setPage((p) => Math.max(0, p - 1))}
                onNext={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabledPrev={currentPage === 0}
                disabledNext={currentPage >= pageCount - 1}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


