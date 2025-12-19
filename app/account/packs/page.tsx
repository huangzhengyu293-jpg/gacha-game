"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import AccountMobileMenu from "../components/AccountMobileMenu";
import { api } from "@/app/lib/api";
import { useI18n } from "@/app/components/I18nProvider";

export default function PacksPage() {
  const { t } = useI18n();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["accountPackHistory"],
    queryFn: () => api.getBoxUserRecord(),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const records = useMemo(() => {
    const payload = data?.data as any;
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  }, [data]);

  return (
    <div className="w-full max-w-screen-xl px-4 pt-4 pb-40 mx-auto" style={{ color: "#7A8084" }}>
      <style>{`
        .acct-menu-item { background-color: transparent; color: #7A8084; }
        .acct-menu-item:hover { background-color: #34383C; color: #FFFFFF; }
        .acct-menu-item--active { background-color: #34383C; color: #FFFFFF; }
      `}</style>
      <div className="flex flex-col lg:flex-row items-start gap-0 lg:gap-10">
        <div className="hidden lg:flex flex-col gap-4 w-[220px] flex-none">
          <div className="flex flex-col gap-3 items-stretch w-full">
            <span className="text-sm font-bold text-white/40">{t('accountSection')}</span>
            <Link href="/account" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">{t('accountProfile')}</span>
            </Link>
            <Link href="/account/deposits" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">{t('accountDepositsTitle')}</span>
            </Link>
            <Link href="/account/withdrawals" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">{t('accountWithdrawalsTitle')}</span>
            </Link>
            <Link href="/account/claims" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">{t('accountClaimsTitle')}</span>
            </Link>
            <Link href="/account/sales" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">{t('accountSalesTitle')}</span>
            </Link>
            <Link href="/account/battles" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">{t('accountBattlesTitle')}</span>
            </Link>
            <Link href="/account/packs" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item--active">
              <span className="font-bold">{t('accountPacksTitle')}</span>
            </Link>
            <Link href="/account/transactions" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">{t('accountTransactionsTitle')}</span>
            </Link>
            <Link href="/account/draws" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">{t('accountDrawsTitle')}</span>
            </Link>
            <Link href="/account/referrals" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">{t('referrals')}</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-start w-full lg:flex-1 min-w-0 gap-2">
          <div className="flex justify-between items-center self-stretch pb-1 pt-4 lg:pt-0 min-w-0">
            <AccountMobileMenu />
            <h1 className="text-2xl font-bold hidden lg:block" style={{ color: "#FFFFFF" }}>
              {t('accountPacksTitle')}
            </h1>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-3 items-center justify-center py-12 self-stretch">
              <span className="font-semibold" style={{ color: "#FFFFFF" }}>
                {t('loading')}
              </span>
            </div>
          ) : isError ? (
            <div className="flex flex-col gap-3 items-center justify-center py-12 self-stretch">
              <span className="font-semibold" style={{ color: "#FFFFFF" }}>
                {t('loadFailedRetry')}
              </span>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col gap-3 items-center justify-center py-12 self-stretch">
              <span className="font-semibold" style={{ color: "#FFFFFF" }}>
                {t('noPackHistory')}
              </span>
            </div>
          ) : (
            <div className="self-stretch space-y-6 z-10">
              {records.map((item: any, idx: number) => {
                const awards = item?.awards || item?.award || {};
                const title = awards?.name
                  ? `${awards.name} - $${Number(awards?.bean ?? 0).toFixed(2)}`
                  : item?.name || item?.item_name || `记录 ${idx + 1}`;
                const priceRaw = awards?.bean ?? item?.price ?? item?.amount ?? item?.bean ?? item?.value;
                const priceLabel =
                  priceRaw !== undefined && priceRaw !== null ? `$${Number(priceRaw || 0).toFixed(2)}` : "-";
                const createdAt = item?.created_at || item?.time || item?.updated_at || "";
                const productLabel = awards?.name || item?.product || item?.item || item?.item_name || title;
                const brand = "--";
                const cover = awards?.cover;

                return (
                  <div
                    key={item?.id ?? idx}
                    className="rounded-lg p-6"
                    style={{ backgroundColor: "#22272b" }}
                  >
                    <div className="flex justify-between items-center pb-4 text-white">
                      <span className="truncate text-lg font-bold mr-2">{title}</span>
                      <span className="whitespace-nowrap" style={{ fontSize: 16, fontFamily: "Urbanist, sans-serif" }}>
                        {createdAt}
                      </span>
                    </div>
                    <div className="flex w-full h-[1px] mb-6" style={{ backgroundColor: "#34383C" }} />
                    <div className="flex justify-between items-center text-white">
                      <div className="flex gap-10 max-w-[100%] lg:max-w-[calc(100%-150px)]">
                        <div className="flex-none flex flex-col items-start gap-2">
                          <span className="font-semibold">{t('productLabel')}:</span>
                          <span className="font-semibold">{t('brandLabel')}:</span>
                          <span className="font-semibold">{t('amountUsdLabel')}:</span>
                        </div>
                        <div className="flex flex-col items-start overflow-hidden max-w-full gap-2">
                          <span className="truncate max-w-full">{productLabel}</span>
                          <span className="truncate max-w-full">{brand}</span>
                          <span className="truncate max-w-full">{priceLabel}</span>
                        </div>
                      </div>
                      <div className="hidden lg:flex p-4 self-start items-center justify-center rounded-lg bg-gray-100 flex-none">
                        <div className="flex items-center justify-center w-[100px] h-[100px] relative">
                          <div className="size-24 flex justify-center">
                            {cover ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={cover} alt={productLabel} className="w-24 h-24 object-cover rounded-md" />
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

