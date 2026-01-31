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
  if (status === 0) return t('claimStatusPendingReview'); // 待审核
  if (status === 1) return t('completedStatus'); // 已完成
  if (status === 2) return t('withdrawalStatusReturned'); // 已退回
  return t('unknown');
};

const getStatusColor = (status: number) => {
  if (status === 0) return '#F6AD55'; // 待审核 - 黄色
  if (status === 1) return '#48BB78'; // 已完成 - 绿色
  if (status === 2) return '#EB4B4B'; // 已退回 - 红色
  return '#FFFFFF';
};

const formatAmount = (value?: string | number): string => {
  if (!value) return '0';
  const num = Number(value);
  if (isNaN(num)) return String(value);
  // 如果是整数，返回整数形式；否则保留小数但去掉末尾的0
  if (num % 1 === 0) {
    return num.toString();
  }
  // 使用 parseFloat 去掉末尾的0，然后转回字符串
  return parseFloat(num.toString()).toString();
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
            <Link href="/account/transfers" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountTransfersTitle')}</span></Link>
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
                const currencyName = String(item?.currency_name ?? '').trim();
                const currencyChain = String(item?.currency_chain ?? '').trim();
                const methodText =
                  currencyName && currencyChain
                    ? `${currencyName}-${currencyChain}`
                    : currencyName
                      ? currencyName
                      : currencyChain
                        ? currencyChain
                        : (item?.channel || '—');
                const bean = item?.bean ? `$${Number(item.bean).toFixed(2)}` : '—';
                const createdAt = formatDate(item?.created_at);
                const status = item?.status ?? -1;
                const statusText = getStatusText(status, t);
                const statusColor = getStatusColor(status);
                const formattedAmount = formatAmount(item?.bean);
                const titleLeft = `${formattedAmount} ${methodText}`;

                return (
                  <div
                    key={item?.id ?? index}
                    className="rounded-lg p-6"
                    style={{ backgroundColor: '#22272B' }}
                  >
                    <div className="flex justify-between items-center pb-4" style={{ color: '#FFFFFF' }}>
                      <div className="flex gap-3 items-center">
                        <h2 className="whitespace-nowrap" style={{ color: '#FFFFFF' }}>
                          {titleLeft}
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
                        <span className="font-semibold">{methodText}</span>
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


