'use client';

import Link from "next/link";
import { useMemo } from "react";
import AccountMobileMenu from "../components/AccountMobileMenu";
import { useI18n } from "@/app/components/I18nProvider";
import { useAuth } from "@/app/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getReceivePhysicalLogs } from "@/api/user";

const getClaimStatusText = (status: number, t: (key: string) => string) => {
  if (status === 0) return t('claimStatusPendingReview');
  if (status === 1) return t('claimStatusShipped');
  if (status === 2) return t('claimStatusReturnedToStorage');
  return t('unknown');
};

const getClaimStatusColor = (status: number) => {
  // 参考提现页的红/黄/绿配色
  if (status === 2) return '#EB4B4B'; // 已退回背包 - 红色
  if (status === 0) return '#F6AD55'; // 待审核 - 黄色
  if (status === 1) return '#48BB78'; // 已发货 - 绿色
  return '#FFFFFF';
};

export default function ClaimsPage() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['receivePhysicalLogs'],
    queryFn: () => getReceivePhysicalLogs(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const records = useMemo(() => {
    if (!data?.data) return [];
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray((data.data as any)?.data)) return (data.data as any).data;
    if (Array.isArray((data.data as any)?.rows)) return (data.data as any).rows;
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
            <Link href="/account/withdrawals" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountWithdrawalsTitle')}</span></Link>
            <Link href="/account/transfers" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountTransfersTitle')}</span></Link>
            <Link href="/account/claims" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item--active"><span className="font-bold">{t('accountClaimsTitle')}</span></Link>
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
            <h1 className="text-2xl font-bold hidden lg:block" style={{ color: '#FFFFFF' }}>{t('accountClaimsTitle')}</h1>
          </div>
          {isLoading ? (
            <div className="flex flex-col gap-3 items-center justify-center py-12 self-stretch">
              <span className="font-semibold" style={{ color: '#FFFFFF' }}>{t('loading')}</span>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col gap-3 items-center justify-center py-12 self-stretch">
              <span className="font-semibold" style={{ color: '#FFFFFF' }}>{t('noClaims')}</span>
            </div>
          ) : (
            <div className="self-stretch space-y-6 z-10">
              {records.map((item: any, index: number) => {
                const awards = item?.store?.awards ?? item?.store_awards ?? item?.awards ?? {};
                const cover = awards?.cover;
                const productName = String(awards?.name ?? '').trim() || '—';
                const amountRaw = awards?.bean ?? 0;
                const amountNumber = Number(amountRaw);
                const amountText = Number.isFinite(amountNumber) ? `$${amountNumber.toFixed(2)}` : '—';

                const status = Number(item?.status ?? -1);
                const statusText = getClaimStatusText(status, t);
                const statusColor = getClaimStatusColor(status);

                const title = productName && productName !== '—'
                  ? `${productName} - ${amountText}`
                  : amountText;

                const expressNumber = String(item?.express_number ?? '').trim();
                const showExpress = status === 1 && Boolean(expressNumber);

                return (
                  <div
                    key={item?.id ?? index}
                    className="rounded-lg p-6"
                    style={{ backgroundColor: '#22272B' }}
                  >
                    <div className="flex justify-between items-center pb-4 text-white">
                      <span className="truncate text-lg font-bold mr-2">{title}</span>
                      <span className="whitespace-nowrap font-extrabold text-sm" style={{ color: statusColor }}>
                        {statusText}
                      </span>
                    </div>
                    <div className="flex w-full h-[1px] mb-6" style={{ backgroundColor: '#34383C' }} />
                    <div className="flex justify-between items-center text-white">
                      <div className="flex gap-10 max-w-[100%] lg:max-w-[calc(100%-150px)]">
                        <div className="flex-none flex flex-col items-start gap-2">
                          <span className="font-semibold">{t('productLabel')}:</span>
                          <span className="font-semibold">{t('amountUsdLabel')}:</span>
                          {showExpress ? (
                            <span className="font-semibold">{t('expressNumberLabel')}:</span>
                          ) : null}
                        </div>
                        <div className="flex flex-col items-start overflow-hidden max-w-full gap-2">
                          <span className="truncate max-w-full">{productName}</span>
                          <span className="truncate max-w-full">{amountText}</span>
                          {showExpress ? (
                            <span className="truncate max-w-full">{expressNumber}</span>
                          ) : null}
                        </div>
                      </div>
                      <div className="hidden lg:flex p-4 self-start items-center justify-center rounded-lg bg-gray-100 flex-none">
                        <div className="flex items-center justify-center w-[100px] h-[100px] relative">
                          <div className="size-24 flex justify-center">
                            {cover ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={cover} alt={productName} className="w-24 h-24 object-cover rounded-md" />
                            ) : (
                              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-24 h-24">
                                <rect x="8" y="8" width="84" height="84" rx="8" fill="#E5E7EB" />
                                <path d="M32 58L44 46L60 62L68 54L84 70V80H16V68L32 58Z" fill="#CBD5E1" />
                                <circle cx="34" cy="36" r="8" fill="#CBD5E1" />
                              </svg>
                            )}
                          </div>
                        </div>
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


