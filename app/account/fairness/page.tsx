'use client';

import Link from "next/link";
import AccountMobileMenu from "../components/AccountMobileMenu";
import BestLiveSidebar from "../../components/BestLiveSidebar";
import { useI18n } from "@/app/components/I18nProvider";

export default function FairnessPage() {
  const { t } = useI18n();
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
            <Link href="/account/packs" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
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
          <div className="flex flex-col gap-3 items-stretch w-full">
            <span className="text-sm font-bold text-white/40">{t('settingsSection')}</span>
            <Link href="/account/fairness" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item--active">
              <span className="font-bold">{t('accountFairnessTitle')}</span>
            </Link>
            <Link href="/account/security" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">{t('accountSecurityTitle')}</span>
            </Link>
          </div>
        </div>

        {/* 中间内容 */}
        <div className="flex flex-col items-start w-full lg:flex-1 min-w-0 gap-2">
          <div className="flex justify-between items-center self-stretch pb-1 pt-4 lg:pt-0">
            <AccountMobileMenu />
            <h1 className="text-2xl font-bold hidden lg:block" style={{ color: '#FFFFFF' }}>{t('accountFairnessTitle')}</h1>
          </div>

          <div className="flex flex-col items-start gap-2">
            <h3 className="text-lg font-bold" style={{ color: '#FFFFFF' }}>{t('changeClientSeedTitle')}</h3>
            <p className="text-base" style={{ color: '#FFFFFF' }}>{t('changeClientSeedDesc')}</p>
            <div className="flex flex-col gap-6 w-full lg:w-xl pt-6 self-stretch">
              <div className="space-y-2 max-w-[600px]">
                <label htmlFor="seed" className="text-base font-bold" style={{ color: '#FFFFFF' }}>{t('clientSeedLabel')}</label>
                <input id="seed" className="flex h-10 w-full rounded-md border-0 px-3 py-2 text-base" style={{ backgroundColor: '#292F34', color: '#FFFFFF' }} defaultValue="677e9b0d-9c1e-42b7-9d03-d94559c93ab4" />
              </div>
              <div className="flex">
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base text-white font-bold disabled:text-gray-400 select-none h-10 px-6 min-w-[200px]" style={{ backgroundColor: '#60A5FA' }}>{t('saveClientSeed')}</button>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start pt-10 gap-2">
            <h3 className="text-base font-bold" style={{ color: '#FFFFFF' }}>{t('serverSeedHashTitle')}</h3>
            <p className="text-base" style={{ color: '#FFFFFF' }}>{t('serverSeedHashDesc')}</p>
            <div className="flex flex-col gap-6 w-full lg:w-xl pt-6 self-stretch max-w-[600px]">
              <input id="serverHash" readOnly className="flex h-10 w-full rounded-md border-0 px-3 py-2 text-base" style={{ backgroundColor: '#292F34', color: '#FFFFFF' }} defaultValue="bc8245c0d66ce7cf0afea0ca1d747e3f59581ce8c6decd4fa8d0efbfdc9c546b6c2c83467eb10f1c00244a6c8c152d4d153e0b2add2734a375671576cefd25e9" />
            </div>
          </div>

          <div className="flex flex-col items-start pt-10 gap-2">
            <h3 className="text-base font-bold" style={{ color: '#FFFFFF' }}>{t('verifyRandomTitle')}</h3>
            <p className="text-base pb-4" style={{ color: '#FFFFFF' }}>{t('verifyRandomDesc')}</p>
            <div className="p-4 whitespace-pre-wrap font-mono text-[13px] rounded" style={{ backgroundColor: '#22272B', color: '#FFFFFF' }}>{`import crypto from 'crypto'

export const sha512 = (value: string) => crypto.createHash('sha512').update(value).digest('hex')

export const combineSeeds = (clientSeed: string, serverSeed: string, nonce: number) => sha512(\`${'${clientSeed}:${serverSeed}:${nonce}'}\`)

export const getTicketNumber = (hash: string) => {
  const hashInt = BigInt('0x' + hash)
  const maxInt = BigInt(1_000_000)
  return Number((hashInt % maxInt) + BigInt(1))
}`}</div>
          </div>
        </div>

        {/* 右侧侧边栏（最佳开启 / 直播开启） */}
        <BestLiveSidebar
          bestOpensTitle={t('bestOpens')}
          liveTitle={t('liveStart')}
        />
      </div>
    </div>
  );
}


