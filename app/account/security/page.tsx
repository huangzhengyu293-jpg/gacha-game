"use client";

'use client';

import Link from "next/link";
import AccountMobileMenu from "../components/AccountMobileMenu";
import { useEffect, useState } from "react";
import { useI18n } from "@/app/components/I18nProvider";

type SessionInfo = {
    id: string;
    ip: string;
    location: string;
    firstLogin: string;
    isCurrent: boolean;
};

export default function SecurityPage() {
    const { t } = useI18n();
    const [sessions, setSessions] = useState<SessionInfo[] | null>(null);

    useEffect(() => {
        // 模拟前端获取（后端可提供 /api/account/sessions）
        const timer = setTimeout(() => {
            setSessions([
                {
                    id: "cmhhv059w0fepl40mlofoa6ap",
                    ip: "221.113.109.183",
                    location: "澀谷區",
                    firstLogin: "Mon Nov 03 2025",
                    isCurrent: true,
                },
            ]);
        }, 400);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="w-full max-w-screen-xl px-4 pt-4 pb-40 mx-auto" style={{ color: '#7A8084' }}>
            <style>{`
        .acct-menu-item { background-color: transparent; color: #7A8084; }
        .acct-menu-item:hover { background-color: #34383C; color: #FFFFFF; }
        .acct-menu-item--active { background-color: #34383C; color: #FFFFFF; }
        .btn-dark { background-color: #34383C; color: #FFFFFF; }
        .btn-dark:hover { background-color: #3C4044; }
      `}</style>
            <div className="flex flex-col lg:flex-row items-start gap-0 lg:gap-10">
                {/* 左侧菜单 */}
                <div className="hidden lg:flex flex-col gap-4 w-[220px] flex-none">
                    <div className="flex flex-col gap-3 items-stretch w-full">
                        <span className="text-sm font-bold text-white/40">{t('accountSection')}</span>
                        <Link href="/account" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountProfile')}</span></Link>
                        <Link href="/account/deposits" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountDepositsTitle')}</span></Link>
                        <Link href="/account/withdrawals" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountWithdrawalsTitle')}</span></Link>
                        <Link href="/account/claims" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountClaimsTitle')}</span></Link>
                        <Link href="/account/sales" className="inline-flex itemscenter gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountSalesTitle')}</span></Link>
                        <Link href="/account/battles" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountBattlesTitle')}</span></Link>
                        <Link href="/account/packs" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountPacksTitle')}</span></Link>
                        <Link href="/account/transactions" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountTransactionsTitle')}</span></Link>
                        <Link href="/account/draws" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountDrawsTitle')}</span></Link>
                        <Link href="/account/referrals" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('referrals')}</span></Link>
                    </div>
                </div>

                {/* 右侧内容 */}
                <div className="flex flex-col items-start w-full lg:flex-1 min-w-0 gap-4">
                    <div className="flex justify-between items-center self-stretch pb-1 pt-4 lg:pt-0">
                        <AccountMobileMenu />
                        <h1 className="text-2xl font-bold hidden lg:block" style={{ color: '#FFFFFF' }}>{t('accountSecurityTitle')}</h1>
                    </div>

                    {/* 更改密码 */}
                    <div className="flex flex-col items-start p-6 gap-6 rounded-lg w-full" style={{ backgroundColor: '#22272B' }}>
                        <div className="flex flex-col gap-2">
                            <h3 className="text-xl font-bold" style={{ color: '#7A8084' }}>{t('changePasswordTitle')}</h3>
                            <p className="text-base" style={{ color: '#FFFFFF' }}>{t('changePasswordDesc')}</p>
                        </div>
                        <button className="btn-dark inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative text-base font-bold select-none h-10 px-6 min-w-72">{t('requestPasswordReset')}</button>
                    </div>

                    {/* 双重认证 */}
                    <div className="flex flex-col items-start p-6 gap-6 rounded-lg w-full" style={{ backgroundColor: '#22272B' }}>
                        <div className="flex flex-col gap-2">
                            <h3 className="text-xl font-bold" style={{ color: '#7A8084' }}>{t('twoFactorTitle')}</h3>
                            <p className="text-base" style={{ color: '#FFFFFF' }}>{t('twoFactorDesc')}</p>
                        </div>
                        <button className="btn-dark inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative text-base font-bold select-none h-10 px-6 min-w-72">{t('enable2FA')}</button>
                    </div>

                    {/* 活动会话 */}
                    <div className="flex flex-col items-start p-6 gap-6 rounded-lg w-full" style={{ backgroundColor: '#22272B' }}>
                        <div className="flex flex-col gap-2">
                            <h3 className="text-xl font-bold" style={{ color: '#7A8084' }}>{t('activeSessionsTitle')}</h3>
                            <p className="text-base" style={{ color: '#FFFFFF' }}>{t('activeSessionsDesc')}</p>
                        </div>

                        {Array.isArray(sessions) && sessions.length > 0 ? (
                          <div className="flex flex-col gap-6 w-full">
                            <div className="flex w-full h-[1px] bg-gray-650"></div>
                            <div className="flex flex-wrap md:flex-nowrap items-start gap-y-6 gap-x-3 w-full">
                              {/* 左+中 固定在同一行 */}
                              <div className="flex items-start gap-3 w-full md:w-auto min-w-0">
                                {/* 左列：标题（小屏可缩小，最大 220） */}
                                <div className="flex flex-col gap-2 shrink-0" style={{ width: 'clamp(140px, 35vw, 220px)' }}>
                                  <p className="text-base" style={{ color: '#7A8084' }}>{t('sessionIdLabel')}</p>
                                  <p className="text-base" style={{ color: '#7A8084' }}>{t('ipAddressLabel')}</p>
                                  <p className="text-base" style={{ color: '#7A8084' }}>{t('locationLabel')}</p>
                                  <p className="text-base" style={{ color: '#7A8084' }}>{t('firstLoginLabel')}</p>
                                </div>
                                {/* 中列：内容（不超过父容器；自适应剩余空间；可换行；默认330 最小210） */}
                                <div className="flex flex-col gap-2 min-w-0" style={{ flex: '1 1 330px', minWidth: 330, maxWidth: 330 }}>
                                  <p className="text-base text-white break-all">{sessions[0].id}</p>
                                  <p className="text-base text-white break-all">{sessions[0].ip}</p>
                                  <p className="text-base text-white break-all">{sessions[0].location}</p>
                                  <p className="text-base text-white break-all">{sessions[0].firstLogin}</p>
                                </div>
                              </div>
                              {/* 右列：状态（小屏换行到底部，md 起并排） */}
                              <div className="flex items-start basis-full md:basis-auto md:shrink-0">
                                <div className="flex items-center gap-2">
                                  <div className="flex justify-center items-center rounded-full min-h-4 min-w-4 size-4" style={{ backgroundColor: '#22C55E' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check size-2.5 text-white"><path d="M20 6 9 17l-5-5"></path></svg>
                                  </div>
                                  <p className="text-base" style={{ color: '#FFFFFF' }}>{sessions[0].isCurrent ? t('currentSession') : t('activeSession')}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : null}
                    </div>
                </div>

                {/* 右侧空白（安全页不需要右侧 feed） */}
            </div>
        </div>
    );
}


