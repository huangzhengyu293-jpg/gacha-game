"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AccountMobileMenu from "../components/AccountMobileMenu";
import { api } from "@/app/lib/api";
import DealsPaginationBar from "@/app/components/DealsPaginationBar";

export default function SalesPage() {
  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["accountSalesStorage", "status-2"],
    queryFn: () => api.getUserStorage(2),
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

  const PAGE_SIZE = 25;
  const [pageIndex, setPageIndex] = useState(0);

  const pagedRecords = useMemo(() => {
    const start = pageIndex * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return records.slice(start, end);
  }, [records, pageIndex]);

  const paginationMeta = useMemo(() => {
    const total = records.length;
    const start = total > 0 ? pageIndex * PAGE_SIZE + 1 : 0;
    const end = total > 0 ? Math.min(total, (pageIndex + 1) * PAGE_SIZE) : 0;
    return { start, end, total };
  }, [records, pageIndex]);

  const hasPrev = pageIndex > 0;
  const hasNext = paginationMeta.end < paginationMeta.total;

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
            <span className="text-sm font-bold text-white/40">账户</span>
            <Link href="/account" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">个人资料</span></Link>
            <Link href="/account/deposits" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">存款</span></Link>
            <Link href="/account/withdrawals" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">提款</span></Link>
            <Link href="/account/claims" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">领取</span></Link>
            <Link href="/account/sales" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item--active"><span className="font-bold">销售</span></Link>
            <Link href="/account/battles" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">对战历史</span></Link>
            <Link href="/account/packs" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">礼包历史</span></Link>
            <Link href="/account/transactions" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">交易历史</span></Link>
            <Link href="/account/draws" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">抽奖历史</span></Link>
            <Link href="/account/referrals" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">推荐</span></Link>
          </div>
          <div className="flex flex-col gap-3 items-stretch w-full">
            <span className="text-sm font-bold text-white/40">设置</span>
            <Link href="/account/fairness" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">公平性</span></Link>
            <Link href="/account/security" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">安全</span></Link>
          </div>
        </div>
        <div className="flex flex-col items-start w-full lg:flex-1 min-w-0 gap-2">
          <div className="flex justify-between items-center self-stretch pb-1 pt-4 lg:pt-0 min-w-0">
            <AccountMobileMenu />
            <h1 className="text-2xl font-bold hidden lg:block" style={{ color: '#FFFFFF' }}>销售</h1>
          </div>
          {isLoading ? (
            <div className="flex flex-col gap-3 items-center justify-center py-12 self-stretch">
              <span className="font-semibold" style={{ color: '#FFFFFF' }}>加载中...</span>
            </div>
          ) : isError ? (
            <div className="flex flex-col gap-3 items-center justify-center py-12 self-stretch">
              <span className="font-semibold" style={{ color: '#FFFFFF' }}>加载失败，请稍后重试。</span>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col gap-3 items-center justify-center py-12 self-stretch">
              <span className="font-semibold" style={{ color: '#FFFFFF' }}>您还没有任何销售记录。</span>
            </div>
          ) : (
            <div className="self-stretch space-y-6 z-10">
              <DealsPaginationBar
                start={paginationMeta.start}
                end={paginationMeta.end}
                total={paginationMeta.total}
                onPrev={() => hasPrev && setPageIndex((prev) => Math.max(0, prev - 1))}
                onNext={() => hasNext && setPageIndex((prev) => prev + 1)}
                disabledPrev={!hasPrev}
                disabledNext={!hasNext}
              />

              {pagedRecords.map((item: any, idx: number) => {
                const awards = item?.awards || item?.award || {};
                const title = awards?.name
                  ? `${awards.name} - $${Number(awards?.bean ?? 0).toFixed(2)}`
                  : item?.name || item?.item_name || `记录 ${paginationMeta.start + idx}`;
                const brand = "--";
                const priceRaw = awards?.bean ?? item?.price ?? item?.amount ?? item?.bean ?? item?.value;
                const priceLabel =
                  priceRaw !== undefined && priceRaw !== null
                    ? `$${Number(priceRaw || 0).toFixed(2)}`
                    : "-";
                const createdAt = item?.created_at || item?.time || item?.updated_at || "";
                const productLabel = awards?.name || item?.product || item?.item || item?.item_name || title;
                const cover = awards?.cover;
                return (
                  <div
                    key={item?.id ?? idx}
                    className="rounded-lg p-6"
                    style={{ backgroundColor: '#22272b' }}
                  >
                    <div className="flex justify-between items-center pb-4 text-white">
                      <span className="truncate text-lg font-bold mr-2">{title}</span>
                      <span
                        className="whitespace-nowrap"
                        style={{ fontSize: 16, fontFamily: 'Urbanist, sans-serif' }}
                      >
                        {createdAt}
                      </span>
                    </div>
                    <div className="flex w-full h-[1px] mb-6" style={{ backgroundColor: '#34383C' }} />
                    <div className="flex justify-between items-center text-white">
                      <div className="flex gap-10 max-w-[100%] lg:max-w-[calc(100%-150px)]">
                        <div className="flex-none flex flex-col items-start gap-2">
                          <span className="font-semibold">产品:</span>
                          <span className="font-semibold">品牌:</span>
                          <span className="font-semibold">金额 USD:</span>
                        </div>
                        <div className="flex flex-col items-start overflow-hidden max-w-full gap-2">
                          <span className="truncate max-w-full">{productLabel}</span>
                          <span className="truncate max-w-full">{brand}</span>
                          <span className="truncate max-w-full">{priceLabel}</span>
                        </div>
                      </div>
                      <div className="hidden lg:flex p-4 self-start items-center justify-center rounded-lg bg-gray-100 flex-none">
                        <div className=" flex items-center justify-center w-[100px] h-[100px] relative">
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

              <DealsPaginationBar
                start={paginationMeta.start}
                end={paginationMeta.end}
                total={paginationMeta.total}
                disabledPrev
                disabledNext
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


