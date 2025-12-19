'use client';

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import AccountMobileMenu from "../components/AccountMobileMenu";
import { useI18n } from "@/app/components/I18nProvider";
import { useAuth } from "@/app/hooks/useAuth";
import { getWithdrawalLog } from "@/api/common";

dayjs.extend(customParseFormat);

const formatDate = (value?: string) => {
  if (!value) return "--";
  const parsed = dayjs(value, ["YYYY-MM-DD HH:mm:ss", "YYYY/MM/DD HH:mm:ss"], true);
  if (parsed.isValid()) return parsed.format("MM-DD-YYYY HH:mm");
  const fallback = dayjs(value);
  return fallback.isValid() ? fallback.format("MM-DD-YYYY HH:mm") : value;
};

const getStatusText = (status: number, t: (key: string) => string) => {
  if (status === 0) return t('failed');
  if (status === 1) return t('processing');
  if (status === 2) return t('confirmed');
  return t('unknown');
};

const getStatusColor = (status: number) => {
  if (status === 0) return '#EB4B4B'; // 失败 - 红色
  if (status === 1) return '#F6AD55'; // 处理中 - 黄色
  if (status === 2) return '#48BB78'; // 已确认 - 绿色
  return '#FFFFFF';
};

export default function WithdrawalsPage() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  
  const { data } = useQuery({
    queryKey: ['withdrawalLog'],
    queryFn: () => getWithdrawalLog(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const records = useMemo(() => {
    if (!data?.data) return [];
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.data.data)) return data.data.data;
    return [];
  }, [data]);

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
            <Link href="/account/withdrawals" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item--active"><span className="font-bold">{t('accountWithdrawalsTitle')}</span></Link>
            <Link href="/account/claims" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountClaimsTitle')}</span></Link>
            <Link href="/account/sales" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountSalesTitle')}</span></Link>
            <Link href="/account/battles" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountBattlesTitle')}</span></Link>
            <Link href="/account/packs" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountPacksTitle')}</span></Link>
            <Link href="/account/transactions" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountTransactionsTitle')}</span></Link>
            <Link href="/account/draws" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountDrawsTitle')}</span></Link>
            <Link href="/account/referrals" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('referrals')}</span></Link>
          </div>
        </div>
        <div className="flex flex-col items-start w-full lg:flex-1 min-w-0 gap-2">
          <div className="flex justify-between items-center self-stretch pb-1 pt-4 lg:pt-0 min-w-0">
            <AccountMobileMenu />
            <h1 className="text-2xl font-bold hidden lg:block" style={{ color: '#FFFFFF' }}>{t('accountWithdrawalsTitle')}</h1>
          </div>
          {records.length === 0 ? (
            <div className="flex flex-col gap-3 items-center justify-center py-12 self-stretch">
              <span className="font-semibold" style={{ color: '#FFFFFF' }}>{t('noWithdrawals')}</span>
            </div>
          ) : (
            <div className="self-stretch space-y-6 z-10">
              {records.map((item: any, index: number) => {
                const channel = item?.channel || '—';
                const bean = item?.bean ? `$${Number(item.bean).toFixed(2)}` : '—';
                const createdAt = formatDate(item?.created_at);
                const status = item?.status ?? -1;
                const statusText = getStatusText(status, t);
                const statusColor = getStatusColor(status);

                return (
                  <div
                    key={item?.id ?? index}
                    className="rounded-lg p-6"
                    style={{ backgroundColor: '#22272B' }}
                  >
                    <div className="flex justify-between items-center pb-4" style={{ color: '#FFFFFF' }}>
                      <div className="flex gap-3 items-center">
                        <h2 className="whitespace-nowrap" style={{ color: '#FFFFFF' }}>
                          {channel}
                        </h2>
                      </div>
                      <span style={{ color: '#FFFFFF' }}>{createdAt}</span>
                    </div>
                    <div className="flex w-full h-[1px] mb-6" style={{ backgroundColor: '#34383C' }} />
                    <div className="flex gap-10" style={{ color: '#FFFFFF' }}>
                      <div className="flex flex-col items-start gap-2">
                        <span className="font-semibold">{t('amountUsd')}:</span>
                        <span className="font-semibold">{t('method')}:</span>
                        <span className="font-semibold">{t('status')}:</span>
                      </div>
                      <div className="flex flex-col items-start gap-2 col-span-3 overflow-hidden">
                        <span>{bean}</span>
                        <span className="font-semibold">{channel}</span>
                        <span className="font-extrabold text-sm" style={{ color: statusColor }}>
                          {statusText}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


