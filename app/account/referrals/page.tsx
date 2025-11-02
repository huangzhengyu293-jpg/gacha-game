"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import AccountMobileMenu from "../components/AccountMobileMenu";

export default function ReferralsPage() {
  const referralCode = "30558719";
  const [claimAmount] = useState<number>(0);
  const isZero = claimAmount <= 0;
  const copyLink = useCallback(async () => {
    try {
      const url = `${window.location.origin}/?ref=${referralCode}`;
      await navigator.clipboard.writeText(url);
      // eslint-disable-next-line no-console
      console.log("[Referral] Copied link:", url);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }, []);

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      // eslint-disable-next-line no-console
      console.log("[Referral] Copied code:", referralCode);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }, []);

  return (
    <div className="w-full max-w-screen-xl px-4 pt-4 pb-40 mx-auto" style={{ color: '#7A8084' }}>
      <style>{`
        .acct-menu-item { background-color: transparent; color: #7A8084; }
        .acct-menu-item:hover { background-color: #34383C; color: #FFFFFF; }
        .acct-menu-item--active { background-color: #34383C; color: #FFFFFF; }
      `}</style>
      <div className="flex flex-col lg:flex-row items-start gap-0 lg:gap-10">
        {/* 左侧菜单 */}
        <div className="hidden lg:flex flex-col gap-4 w-[220px] flex-none">
          <div className="flex flex-col gap-3 items-stretch w-full">
            <span className="text-sm font-bold text-white/40">账户</span>
            <Link href="/account" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">个人资料</span></Link>
            <Link href="/account/deposits" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">存款</span></Link>
            <Link href="/account/withdrawals" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">提款</span></Link>
            <Link href="/account/claims" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">领取</span></Link>
            <Link href="/account/sales" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">销售</span></Link>
            <Link href="/account/battles" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">对战历史</span></Link>
            <Link href="/account/packs" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">礼包历史</span></Link>
            <Link href="/account/transactions" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">交易历史</span></Link>
            <Link href="/account/draws" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">抽奖历史</span></Link>
            <Link href="/account/referrals" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item--active"><span className="font-bold">推荐</span></Link>
          </div>
          <div className="flex flex-col gap-3 items-stretch w-full">
            <span className="text-sm font-bold text-white/40">设置</span>
            <Link href="/account/fairness" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">公平性</span></Link>
            <Link href="/account/security" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">安全</span></Link>
          </div>
        </div>

        {/* 右侧内容 */}
        <div className="flex flex-col items-start w-full lg:flex-1 min-w-0 gap-2">
          <div className="flex justify-between items-center self-stretch pb-1 pt-4 lg:pt-0 min-w-0">
            <AccountMobileMenu />
            <h1 className="text-2xl font-bold hidden lg:block" style={{ color: '#FFFFFF' }}>联盟计划</h1>
            <button onClick={copyLink} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-sm font-bold select-none h-8 px-3" style={{ backgroundColor: '#34383C', color: '#FFFFFF' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy size-3 text-white"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0 0 0 0 0"></path><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
              复制联盟链接
            </button>
          </div>

          <div className="flex flex-col gap-6 items-stretch self-stretch pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-lg p-4" style={{ backgroundColor: '#22272B' }}>
                <dt className="text-sm" style={{ color: '#FFFFFF' }}>您的推荐码</dt>
                <dd className="font-extrabold text-white text-2xl leading-9">
                  <div className="flex items-center justify-between max-w-full">
                    <div className="overflow-hidden max-w-full">
                      <span className="block truncate">{referralCode}</span>
                    </div>
                    <div className="flex justify-center">
                      <button onClick={copyCode} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8" style={{ backgroundColor: '#34383C', color: '#FFFFFF' }}>
                        <div className="size-4">
                          <svg viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M5 19.3148H16C17.0609 19.3148 18.0783 18.8934 18.8284 18.1432C19.5786 17.3931 20 16.3757 20 15.3148V9.31482C20 9.0496 19.8946 8.79525 19.7071 8.60771C19.5196 8.42018 19.2652 8.31482 19 8.31482C18.7348 8.31482 18.4804 8.42018 18.2929 8.60771C18.1054 8.79525 18 9.0496 18 9.31482V15.3148C18 15.8453 17.7893 16.354 17.4142 16.729C17.0391 17.1041 16.5304 17.3148 16 17.3148H5C4.46957 17.3148 3.96086 17.1041 3.58579 16.729C3.21071 16.354 3 15.8453 3 15.3148V4.31482C3 3.78439 3.21071 3.27568 3.58579 2.90061C3.96086 2.52553 4.46957 2.31482 5 2.31482H11C11.2652 2.31482 11.5196 2.20946 11.7071 2.02193C11.8946 1.83439 12 1.58004 12 1.31482C12 1.0496 11.8946 0.795249 11.7071 0.607713C11.5196 0.420176 11.2652 0.314819 11 0.314819H5C3.93913 0.314819 2.92172 0.736247 2.17157 1.48639C1.42143 2.23654 1 3.25395 1 4.31482V15.3148C1 16.3757 1.42143 17.3931 2.17157 18.1432C2.92172 18.8934 3.93913 19.3148 5 19.3148ZM18.7137 0.647063C18.6229 0.610833 18.5271 0.587846 18.4266 0.575067C17.9949 0.520613 17.5058 0.68662 17.1335 1.05888L8.23888 9.95351C7.65401 10.5384 7.57636 11.4088 8.06388 11.8963C8.2448 12.0772 8.47947 12.1795 8.73284 12.2079C8.87002 12.2226 9.01435 12.2164 9.15701 12.187C9.3601 12.1468 9.56204 12.0609 9.74878 11.9349C9.8387 11.8726 9.92557 11.8023 10.0066 11.7213L18.9013 2.82665C19.2404 2.48748 19.409 2.05377 19.3962 1.65221C19.3917 1.52691 19.3695 1.40546 19.3308 1.29227C19.2782 1.14044 19.1937 1.00127 19.0763 0.883883L18.9962 0.812061L18.9222 0.756251C18.8575 0.713143 18.7871 0.675827 18.7137 0.647063Z" fill="currentColor"></path></svg>
                        </div>
                      </button>
                    </div>
                  </div>
                </dd>
              </div>
              <div className="rounded-lg p-4" style={{ backgroundColor: '#22272B' }}>
                <dt className="text-sm" style={{ color: '#FFFFFF' }}>已推荐用户</dt>
                <div className="h-[44px] flex items-center"><dd className="font-extrabold text-white text-2xl leading-9">0</dd></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-lg p-4" style={{ backgroundColor: '#22272B' }}>
                <dt className="text-sm" style={{ color: '#FFFFFF' }}>总存款</dt>
                <div className="h-[44px] flex items-center"><dd className="font-extrabold text-white text-2xl leading-9">$0.00</dd></div>
              </div>
              <div className="rounded-lg p-4" style={{ backgroundColor: '#22272B' }}>
                <dt className="text-sm" style={{ color: '#FFFFFF' }}>总开启次数</dt>
                <div className="h-[44px] flex items-center"><dd className="font-extrabold text-white text-2xl leading-9">$0.00</dd></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-lg p-4" style={{ backgroundColor: '#22272B' }}>
                <dt className="text-sm" style={{ color: '#FFFFFF' }}>总收益</dt>
                <div className="h-[44px] flex items-center"><dd className="font-extrabold text-white text-2xl leading-9">$0.00</dd></div>
              </div>
              <div className="rounded-lg p-4" style={{ backgroundColor: '#22272B' }}>
                <dt className="text-sm" style={{ color: '#FFFFFF' }}>未领取收益</dt>
                <div className="h-[44px] flex items-center"><dd className="font-extrabold text-white text-2xl leading-9">$0.00</dd></div>
              </div>
            </div>

            <div className="rounded-lg p-4" style={{ backgroundColor: '#22272B', height: 112 }}>
              <form className="flex h-full flex-col">
                <div className="flex h-full gap-2">
                  <div className="flex h-full flex-1 flex-col justify-between">
                    <label className="font-bold text-base" htmlFor="claim-amount" style={{ color: '#FFFFFF' }}>可领取金额</label>
                    <div className="flex gap-3" id="claim-amount-group">
                      <input
                        id="claim-amount"
                        className="flex h-10 w-full rounded-md px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-extrabold border-0"
                        placeholder="0.00"
                        step={0.01}
                        min={0}
                        max={999999}
                        disabled
                        type="number"
                        value={claimAmount}
                        name="amount"
                        readOnly
                        style={{ backgroundColor: '#262B2F', color: isZero ? '#7A8084' : '#FFFFFF' }}
                      />
                      <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none h-10 px-6" type="submit" disabled={isZero} style={{ backgroundColor: '#34383C', color: isZero ? '#7A8084' : '#FFFFFF' }}>领取</button>
                      <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none h-10 px-6" type="button" disabled={isZero} style={{ backgroundColor: '#34383C', color: isZero ? '#7A8084' : '#FFFFFF' }}>全部领取</button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


