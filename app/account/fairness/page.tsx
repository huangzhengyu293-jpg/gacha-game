import Link from "next/link";
import AccountMobileMenu from "../components/AccountMobileMenu";
import LiveFeedElement from "../../components/LiveFeedElement";
import LiveFeedTicker from "../../components/LiveFeedTicker";

export default function FairnessPage() {
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
            <Link href="/account" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
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
            <Link href="/account/fairness" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item--active">
              <span className="font-bold">公平性</span>
            </Link>
            <Link href="/account/security" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">安全</span>
            </Link>
          </div>
        </div>

        {/* 中间内容 */}
        <div className="flex flex-col items-start w-full lg:flex-1 min-w-0 gap-2">
          <div className="flex justify-between items-center self-stretch pb-1 pt-4 lg:pt-0">
            <AccountMobileMenu />
            <h1 className="text-2xl font-bold hidden lg:block" style={{ color: '#FFFFFF' }}>公平性</h1>
          </div>

          <div className="flex flex-col items-start gap-2">
            <h3 className="text-lg font-bold" style={{ color: '#FFFFFF' }}>更改您的客户端种子</h3>
            <p className="text-base" style={{ color: '#FFFFFF' }}>这是一个随机字符串，用于（与服务器种子和随机数结合）生成随机数。您可以随时更改您的客户端种子。</p>
            <div className="flex flex-col gap-6 w-full lg:w-xl pt-6 self-stretch">
              <div className="space-y-2 max-w-[600px]">
                <label htmlFor="seed" className="text-base font-bold" style={{ color: '#FFFFFF' }}>客户端种子</label>
                <input id="seed" className="flex h-10 w-full rounded-md border-0 px-3 py-2 text-base" style={{ backgroundColor: '#292F34', color: '#FFFFFF' }} defaultValue="677e9b0d-9c1e-42b7-9d03-d94559c93ab4" />
              </div>
              <div className="flex">
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base text-white font-bold disabled:text-gray-400 select-none h-10 px-6 min-w-[200px]" style={{ backgroundColor: '#60A5FA' }}>保存客户端种子</button>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start pt-10 gap-2">
            <h3 className="text-base font-bold" style={{ color: '#FFFFFF' }}>服务器种子哈希</h3>
            <p className="text-base" style={{ color: '#FFFFFF' }}>这是用于（与客户端种子和随机数结合）生成随机数的随机字符串的哈希表示。未哈希的服务器种子将在每次购买后在您的购买历史中显示。您可以使用未哈希的服务器种子来验证随机数生成器的公平性。服务器种子在每次购买后更新。</p>
            <div className="flex flex-col gap-6 w-full lg:w-xl pt-6 self-stretch max-w-[600px]">
              <input id="serverHash" readOnly className="flex h-10 w-full rounded-md border-0 px-3 py-2 text-base" style={{ backgroundColor: '#292F34', color: '#FFFFFF' }} defaultValue="bc8245c0d66ce7cf0afea0ca1d747e3f59581ce8c6decd4fa8d0efbfdc9c546b6c2c83467eb10f1c00244a6c8c152d4d153e0b2add2734a375671576cefd25e9" />
            </div>
          </div>

          <div className="flex flex-col items-start pt-10 gap-2">
            <h3 className="text-base font-bold" style={{ color: '#FFFFFF' }}>验证随机性</h3>
            <p className="text-base pb-4" style={{ color: '#FFFFFF' }}>为了确保透明度，我们提供了一系列可用于验证结果公平性的功能。您可以使用这些功能来验证购买后收到的 VRF 结果。您可以在您的礼包购买和/或对战历史中找到用于礼包开启或对战的服务器种子、客户端种子和随机数。</p>
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

        {/* 右侧侧边栏（复刻 Best Opens / Live Feed） */}
        <div className="hidden lg:block flex-shrink-0" style={{ width: '224px' }}>
          <div className="rounded-lg px-0 pb-4 pt-0 h-fit">
            <div className="flex pb-4 gap-2 items-center">
              <div className="flex size-4 text-yellow-400">
                <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7.5" stroke="#EB4B4B" strokeOpacity="0.5"></circle><circle cx="8" cy="8" r="2" fill="#EB4B4B"></circle></svg>
              </div>
              <p className="text-base text-white font-extrabold">最佳开启</p>
            </div>
            <div className="live-feed flex flex-col gap-3">
              <LiveFeedElement
                index={0}
                href="/packs/1"
                avatarUrl="https://ik.imagekit.io/hr727kunx/profile_pictures/cm0aij6zj00561rzns7vbtwxi/cm0aij6zj00561rzns7vbtwxi_68ZiGZar8.png?tr=w-128,c-at_max"
                productImageUrl="https://ik.imagekit.io/hr727kunx/products/cm9ln14rj0002l50g0sajx4dg_2344464__pFeElsrMCp?tr=w-1080,c-at_max"
                packImageUrl="https://ik.imagekit.io/hr727kunx/community_packs/cm18eb8ji001kugiildnpy8fm/packs/cm18eb8ji001kugiildnpy8fm_hQOMiytlLO.png?tr=q-50,w-1080,c-at_max"
                title="Audemars Piguet Stainless Steel USA Edition"
                priceLabel="$65,000.00"
              />
              <LiveFeedElement
                index={1}
                href="/packs/2"
                avatarUrl="https://ik.imagekit.io/hr727kunx/profile_pictures/cm0aij6zj00561rzns7vbtwxi/cm0aij6zj00561rzns7vbtwxi_68ZiGZar8.png?tr=w-128,c-at_max"
                productImageUrl="https://ik.imagekit.io/hr727kunx/packs/cmgmus9260000l80gpntkfktl_3232094__fSM1fwIYl1?tr=w-1080,c-at_max"
                packImageUrl="https://ik.imagekit.io/hr727kunx/packs/cmh2lqffk001al10paqslua2f_2229948__zIR8y5q-G?tr=w-1080,c-at_max"
                title="Limited Edition Pack"
                priceLabel="$2.99"
                glowColor="#6EE7B7"
              />
              <LiveFeedElement
                index={2}
                href="/packs/3"
                avatarUrl="https://ik.imagekit.io/hr727kunx/profile_pictures/cm0aij6zj00561rzns7vbtwxi/cm0aij6zj00561rzns7vbtwxi_68ZiGZar8.png?tr=w-128,c-at_max"
                productImageUrl="https://ik.imagekit.io/hr727kunx/packs/cmgo6ok710000k10g5r0il5rk_7104681__d8no0nmco?tr=w-1080,c-at_max"
                packImageUrl="https://ik.imagekit.io/hr727kunx/packs/cmgo8hdp90000l40gxmfk970t_5020787__2hFmzl5eh?tr=w-1080,c-at_max"
                title="Special Drop"
                priceLabel="$5.00"
                glowColor="#60A5FA"
              />
            </div>
          </div>
          <div className="rounded-lg px-0 pb-4 pt-0 h-fit mt-6">
            <div className="flex pb-4 gap-2 items-center">
              <div className="flex size-4 text-yellow-400">
                <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7.5" stroke="#EB4B4B" strokeOpacity="0.5"></circle><circle cx="8" cy="8" r="2" fill="#EB4B4B"></circle></svg>
              </div>
              <p className="text-base text-white font-extrabold">直播开启</p>
            </div>
            <LiveFeedTicker maxItems={9} intervalMs={2000} />
          </div>
        </div>
      </div>
    </div>
  );
}


