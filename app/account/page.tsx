import CopyableId from "../components/CopyableId";
import Link from "next/link";
import DatePickerField from "../components/DatePickerField";
import AccountMobileMenu from "./components/AccountMobileMenu";

export default function AccountPage() {
  return (
    <div className="w-full max-w-screen-xl px-4 pt-4 pb-40 mx-auto" style={{ color: '#7A8084' }}>
      <style>{`
        .acct-menu-item { background-color: transparent; color: #7A8084; }
        .acct-menu-item:hover { background-color: #34383C; color: #FFFFFF; }
        .acct-menu-item--active { background-color: #34383C; color: #FFFFFF; }
        .btn-dark { background-color: #34383C; color: #FFFFFF; }
        .btn-dark:hover { background-color: #3C4044; }
        .acct-input::placeholder { color: #FFFFFF; opacity: 0.7; }
        .acct-input-muted { color: #7A8084; }
        .acct-input-muted::placeholder { color: #7A8084; opacity: 1; }
      `}</style>
      <div className="flex flex-col lg:flex-row items-start gap-0 lg:gap-10">
        {/* 左侧菜单 */}
        <div className="hidden lg:flex flex-col gap-4 w-[220px] flex-none">
          <div className="flex flex-col gap-3 items-stretch w-full">
            <span className="text-sm font-bold text-white/40">账户</span>
            <Link href="/account" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md" style={{ backgroundColor: '#34383C', color: '#FFFFFF' }}>
              <span className="font-bold">个人资料</span>
            </Link>
            <Link href="/account/deposits" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">存款</span>
            </Link>
            <Link href="/account/withdrawals" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">提款</span>
            </Link>
            <Link href="/account/claims" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">领取</span>
            </Link>
            <Link href="/account/sales" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">销售</span>
            </Link>
            <Link href="/account/battles" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">对战历史</span>
            </Link>
            <Link href="/account/packs" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">礼包历史</span>
            </Link>
            <Link href="/account/transactions" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">交易历史</span>
            </Link>
            <Link href="/account/draws" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">抽奖历史</span>
            </Link>
            <Link href="/account/referrals" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">推荐</span>
            </Link>
          </div>
          <div className="flex flex-col gap-3 items-stretch w-full">
            <span className="text-sm font-bold text-white/40">设置</span>
            <Link href="/account/fairness" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">公平性</span>
            </Link>
            <Link href="/account/security" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">安全</span>
            </Link>
          </div>
        </div>

        {/* 右侧内容 */}
        <div className="flex flex-col items-start w-full lg:flex-1 min-w-0 gap-2">
          <div className="flex justify-between items-center self-stretch pb-1 pt-4 lg:pt-0 min-w-0">
            <AccountMobileMenu />
            <h1 className="text-2xl font-bold hidden lg:block" style={{ color: '#FFFFFF' }}>个人资料</h1>
            <CopyableId id="cmhb4suqa00agjy0fd3eqxb4n" />
          </div>
          <div className="flex flex-col w-full gap-4">
            <div className="flex flex-col items-stretch w-full p-6 rounded-lg" style={{ backgroundColor: '#22272B' }}>
              <h3 className="text-xl text-white font-bold pb-4">基本信息</h3>
              <div className="flex w-full h-[1px]" style={{ backgroundColor: '#292F34' }}></div>
            <div className="flex flex-row items-start py-6">
                <div className="flex min-w-40 items-center">
                  <label className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-base text-white" htmlFor="profilePicture">个人头像</label>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-help cursor-pointer size-4 text-white ml-2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                </div>
                <div className="flex flex-row gap-4 items-start flex-1 justify-between">
                  <div className="flex gap-4">
                    <div className="flex relative rounded-full overflow-clip items-end cursor-pointer">
                      <div className="overflow-hidden rounded-full" style={{ borderWidth: 0 }}>
                        <div className="relative rounded-full overflow-hidden" style={{ width: 64, height: 64 }}>
                          <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
                            <mask id="avt-acct" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36"><rect width="36" height="36" rx="72" fill="#FFFFFF"></rect></mask>
                            <g mask="url(#avt-acct)"><rect width="36" height="36" fill="#EDD75A"></rect><rect x="0" y="0" width="36" height="36" transform="translate(-4 8) rotate(188 18 18) scale(1.2)" fill="#333333" rx="36"></rect><g transform="translate(-4 4) rotate(-8 18 18)"><path d="M13,21 a1,0.75 0 0,0 10,0" fill="#FFFFFF"></path><rect x="11" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect><rect x="23" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect></g></g>
                          </svg>
                        </div>
                      </div>
                      <div className="flex absolute left-0 right-0 justify-center" style={{ backgroundColor: 'rgba(86, 89, 91, 0.5)' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-camera size-4 text-white m-1"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-base" style={{ color: '#7A8084' }}>个人头像有助于个性化您的账户。</p>
                      <div className="flex"><button className="btn-dark inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none h-9 px-6 py-[10px]">生成头像</button></div>
                    </div>
                    <input className="h-10 w-full rounded-md border border-gray-600 focus:border-gray-600 bg-gray-800 px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-700 interactive-focus !-outline-offset-1 hidden" id="profilePicture" type="file" />
                  </div>
                </div>
              </div>
              <div className="flex w-full h-[1px]" style={{ backgroundColor: '#292F34' }}></div>
              <div className="flex flex-row items-start pt-6">
                <div className="flex min-w-40 items-center mt-0 xs:mt-2"><label className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-base text-white" htmlFor="username">用户名</label><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-help cursor-pointer size-4 text-white ml-2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg></div>
                <div className="flex w-full max-w-[540px] flex-col gap-6"><input className="acct-input flex h-10 w-full rounded-md border-0 px-3 py-2 text-base" id="username" maxLength={20} placeholder="您的用户名" type="text" defaultValue="mortified_panda" style={{ backgroundColor: '#292F34', color: '#FFFFFF' }} /><button className="btn-dark inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none h-10 px-6 self-end min-w-36">保存</button></div>
              </div>
            </div>
            <div className="flex flex-col items-stretch w-full p-6 rounded-lg" style={{ backgroundColor: '#22272B' }}>
              <h3 className="text-xl text-white font-bold pb-2">个人信息</h3>
              <p className="text-base pb-4 max-w-[700px]" style={{ color: '#7A8084' }}>
                您可能需要在将来提供一种或多种形式的个人身份证明。您提供的信息应与您的身份证件上的信息一致。您可能无法在将来更改此信息。请在提交前仔细检查。
              </p>
              <div className="flex w-full h-[1px]" style={{ backgroundColor: '#292F34' }}></div>
              <div className="flex flex-row items-center py-6">
                <label className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-base text-white min-w-40" htmlFor="legalName">全名</label>
                <input className="acct-input acct-input-muted flex h-10 w-full rounded-md border-0 px-3 py-2 text-base max-w-[540px]" id="legalName" maxLength={50} placeholder="名字和姓氏" type="text" defaultValue="" style={{ backgroundColor: '#292F34' }} />
              </div>
              <div className="flex w-full h-[1px]" style={{ backgroundColor: '#292F34' }}></div>
              <div className="flex flex-row items-center py-6">
                <label className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-base text-white min-w-40" htmlFor="dOb">出生日期</label>
                <DatePickerField id="dOb" defaultValue="2025-11-02" />
              </div>
              <div className="flex w-full h-[1px]" style={{ backgroundColor: '#292F34' }}></div>
              <div className="flex flex-row items-start pt-6">
                <label className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-base text-white min-w-40" htmlFor="address">居住地址</label>
                <div className="flex w-full max-w-[540px] flex-col gap-4">
                  <input className="acct-input acct-input-muted flex h-10 w-full rounded-md border-0 px-3 py-2 text-base max-w-[540px]" id="address1" maxLength={50} placeholder="地址行 1" type="text" defaultValue="" style={{ backgroundColor: '#292F34' }} />
                  <input className="acct-input acct-input-muted flex h-10 w-full rounded-md border-0 px-3 py-2 text-base max-w-[540px]" id="address2" maxLength={50} placeholder="地址行 2" type="text" defaultValue="" style={{ backgroundColor: '#292F34' }} />
                  <input className="acct-input acct-input-muted flex h-10 w-full rounded-md border-0 px-3 py-2 text-base max-w-[540px]" id="city" maxLength={50} placeholder="城市" type="text" defaultValue="" style={{ backgroundColor: '#292F34' }} />
                  <input className="acct-input acct-input-muted flex h-10 w-full rounded-md border-0 px-3 py-2 text-base max-w-[540px]" id="state" maxLength={50} placeholder="州/省" type="text" defaultValue="" style={{ backgroundColor: '#292F34' }} />
                  <input className="acct-input acct-input-muted flex h-10 w-full rounded-md border-0 px-3 py-2 text-base max-w-[540px]" id="zip" maxLength={15} placeholder="邮政编码" type="text" defaultValue="" style={{ backgroundColor: '#292F34' }} />
                  <button type="button" role="combobox" aria-expanded="false" aria-autocomplete="none" data-state="closed" className="flex h-10 w-full items-center justify-between rounded-md px-3 py-2 text-base max-w-[540px]" style={{ backgroundColor: '#292F34', color: '#7A8084' }}>
                    <span style={{ pointerEvents: 'none' }}>国家</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down h-4 w-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                  </button>
                  <input className="acct-input acct-input-muted flex h-10 w-full rounded-md border-0 px-3 py-2 text-base max-w-[540px]" id="phone" maxLength={50} placeholder="(123) 456-7890" type="tel" defaultValue="" style={{ backgroundColor: '#292F34' }} />
                  <button className="btn-dark inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none h-10 px-6 self-end min-w-36 mt-2">保存</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


