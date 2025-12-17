"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import AccountMobileMenu from "../components/AccountMobileMenu";
import { api } from "@/app/lib/api";
import { useI18n } from "@/app/components/I18nProvider";
import DealsPaginationBar from "@/app/components/DealsPaginationBar";
import BattleListCardItem from "@/app/battles/components/BattleListCardItem";
import { buildBattleListCards } from "@/app/battles/battleListSource";
import type { RawBattleListItem } from "@/app/components/bettlesListData";

export default function BattlesPage() {
  const router = useRouter();
  const { t } = useI18n();
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["accountBattles"],
    queryFn: () => api.getMyBattleList(),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const rawList = useMemo<RawBattleListItem[]>(() => {
    const payload = data?.data as any;
    if (!payload) return [];
    if (Array.isArray(payload)) return payload as RawBattleListItem[];
    if (Array.isArray(payload.data)) return payload.data as RawBattleListItem[];
    if (Array.isArray(payload.list)) return payload.list as RawBattleListItem[];
    return [];
  }, [data]);

  const cards = useMemo(() => buildBattleListCards(rawList), [rawList]);
  const paginationMeta = useMemo(() => {
    const total = cards.length;
    const start = total > 0 ? 1 : 0;
    const end = total;
    return { start, end, total };
  }, [cards.length]);

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
            <Link href="/account/claims" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountClaimsTitle')}</span></Link>
            <Link href="/account/sales" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountSalesTitle')}</span></Link>
            <Link href="/account/battles" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item--active"><span className="font-bold">{t('accountBattlesTitle')}</span></Link>
            <Link href="/account/packs" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountPacksTitle')}</span></Link>
            <Link href="/account/transactions" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountTransactionsTitle')}</span></Link>
            <Link href="/account/draws" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountDrawsTitle')}</span></Link>
            <Link href="/account/referrals" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('referrals')}</span></Link>
          </div>
          <div className="flex flex-col gap-3 items-stretch w-full">
            <span className="text-sm font-bold text-white/40">{t('settingsSection')}</span>
            <Link href="/account/fairness" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountFairnessTitle')}</span></Link>
            <Link href="/account/security" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountSecurityTitle')}</span></Link>
          </div>
        </div>
        <div className="flex flex-col items-start w-full lg:flex-1 min-w-0 gap-2">
          <div className="flex justify-between items-center self-stretch pb-1 pt-4 lg:pt-0 min-w-0">
            <AccountMobileMenu />
            <h1 className="text-2xl font-bold hidden lg:block" style={{ color: '#FFFFFF' }}>{t('accountBattlesTitle')}</h1>
          </div>
          <div className="flex flex-col gap-4 self-stretch">
            { cards.length === 0 ? (
              <div className="flex flex-col gap-3 items-center justify-center py-12 self-stretch">
                <span className="font-semibold" style={{ color: '#FFFFFF' }}>{t('noBattles')}</span>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <DealsPaginationBar
                  start={paginationMeta.start}
                  end={paginationMeta.end}
                  total={paginationMeta.total}
                  disabledPrev
                  disabledNext
                />
                <div className="flex flex-col gap-4">
                  {cards.map((card) => {
                    const isWaiting = Number(card.status) === 0;
                    const displayCard = Number(card.status) === 2 ? { ...card, status: 3 } : card;
                    return (
                      <BattleListCardItem
                        key={card.id}
                        // 对战历史只展示已完成：status=2 直接按“已开启”展示
                        card={displayCard}
                        labels={{
                          cost: t("cost"),
                            opened: t("opened"),
                          preparing: t('preparing'),
                          waiting: t('waitingPlayers'),
                            inProgress: t('battleInProgress'),
                            waitingBlocks: t('waitingBlocks'),
                          button: isWaiting ? t('joinBattle') : t("viewResults"),
                          join: t('joinBattle'),
                          modeClassic: t('battleModeClassic'),
                          modeShare: t('battleModeShare'),
                          modeSprint: t('battleModeSprint'),
                          modeJackpot: t('battleModeJackpot'),
                          modeElimination: t('battleModeElimination'),
                        }}
                        buttonColors={
                          isWaiting
                            ? {
                                default: "#4299e1",
                                hover: "#5ab0ff",
                              }
                            : undefined
                        }
                        onPrimaryAction={() => router.push(`/battles/${card.id}`)}
                      />
                    );
                  })}
                </div>
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
    </div>
  );
}


