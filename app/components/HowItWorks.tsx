"use client";

import React, { useState } from "react";

function HowItWorksCard({ step, title, desc, imgAlt, imgSrc, imgWidth, imgHeight }: { step: string; title: string; desc: string; imgAlt: string; imgSrc: string; imgWidth: number; imgHeight: number }) {
  return (
    <div data-component="HowItWorksCard" className="rounded-lg p-6 flex flex-col items-center justify-between overflow-hidden h-72" style={{ backgroundColor: '#22272B' }}>
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-72 md:w-full transition-opacity duration-200 rounded-full" style={{ filter: 'blur(20px)', opacity: 0.55, background: 'radial-gradient(circle, rgba(96,165,250,0.55) 0%, rgba(96,165,250,0) 70%)' }} />
        <div className="relative" style={{ zIndex: 1 }}>
          <img alt={imgAlt} loading="lazy" decoding="async" src={imgSrc} width={imgWidth} height={imgHeight} style={{ color: 'transparent' }} />
        </div>
      </div>
      <div className="flex flex-col justify-center items-center gap-4" style={{ zIndex: 1 }}>
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-base font-extrabold" style={{ color: '#FFFFFF' }}>{step}. {title}</h3>
          <p className="text-base font-semibold text-center leading-tight" style={{ color: '#7A8084' }}>{desc}</p>
        </div>
      </div>
    </div>
  );
}

type FaqItem = { q: string; a?: string };

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const contentRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  return (
    <div className="flex flex-col gap-4 flex-1">
      {items.map((it, idx) => {
        const open = idx === openIdx;
        const contentEl = contentRefs.current[idx];
        const maxH = open && contentEl ? contentEl.scrollHeight : 0;
        return (
          <div key={idx} data-state={open ? 'open' : 'closed'} data-orientation="vertical" className="rounded-lg px-4" style={{ backgroundColor: '#22272B' }}>
            <h3 data-orientation="vertical" data-state={open ? 'open' : 'closed'} className="flex">
              <button
                type="button"
                aria-expanded={open}
                className="flex flex-1 items-center justify-between py-4 transition-all text-left text-base font-extrabold"
                style={{ color: '#FFFFFF' }}
                onClick={() => setOpenIdx(open ? null : idx)}
              >
                {it.q}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 transition-transform duration-200" style={{ color: '#FFFFFF', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <path d="m6 9 6 6 6-6"></path>
                </svg>
              </button>
            </h3>
            <div
              role="region"
              data-orientation="vertical"
              className="overflow-hidden text-base"
              style={{ color: '#FFFFFF', maxHeight: maxH, transition: 'max-height 260ms ease' }}
            >
              <div
                ref={(el) => { contentRefs.current[idx] = el; }}
                className="pb-3 pr-2"
                style={{ color: '#FFFFFF' }}
              >
                {it.a || ''}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function HowItWorks() {
  const faqLeft: FaqItem[] = [
    { q: '什么是 FlameDraw', a: 'FlameDraw 通过其游戏化的购物方式革新了在线购物，提供包含您熟悉和喜爱的顶级品牌多样化产品的数字礼包。所有礼包在开启前都会显示价格、产品范围和获胜机会，确保安全、透明和令人兴奋的购物体验。' },
    { q: 'FlameDraw 安全公平吗？', a: '当然！FlameDraw 成立于 2022 年，旨在树立诚信新标准，并使用 EOS 区块链技术确保安全性。我们坚持透明与诚信，为所有用户提供公平、愉快的体验。想了解我们对公平性的承诺及算法原理，请访问 https://flamedraw.com/fairness。' },
    { q: 'FlameDraw 值得信赖吗？', a: '当然。信任与安全是 FlameDraw 的核心。我们充满活力的社区、实时的客服响应以及严密的风控体系，都展示了我们打造安全可靠平台的承诺。您可以放心在 FlameDraw 获得值得信赖的体验。' },
    { q: '如何开启礼包？', a: '在页面顶部的“礼包”标签下浏览全部礼包。每个礼包都会展示独特设计、主题、包含的产品及其概率。找到心仪礼包并确保余额充足后，点击“开启”即可欣赏动画并揭晓奖励。如果转轴落在金色的 FlameDraw 符号上，就能赢得大奖！' },
  ];
  const faqRight: FaqItem[] = [
    { q: '如何存款？', a: '只需点击页面右上角的“存款”按钮，即可看到可用的多种存款方式。您可以随时点击同一按钮存入更多资金。需要注意的是，因为地区或账户类型等因素，部分用户暂时无法使用银行卡支付；如果遇到卡支付失败，请稍后再试或改用其他方式。' },
    { q: '加密货币存款未到账？', a: '如果加密货币存款尚未入账，请保持冷静：先查看您外部钱包的交易历史，找到转入 FlameDraw 的记录并复制交易哈希（txid）。部分钱包会提供到 etherscan.io 等区块浏览器的链接，便于查看详情。准备好交易哈希（txid）与 FlameDraw 账户 ID 后，发送邮件至 support@flamedraw.com 联系客服，我们会尽快帮您入账。' },
    { q: '什么是对战？', a: '对战为开启礼包提供了激动人心的替代玩法。玩家使用相同礼包进行竞争，累计获得的物品总价值最高者赢得全部奖励。进入“对战”标签即可加入或创建房间，选择对手数量、礼包和游戏模式。如果想立即开始，也可以邀请机器人加入对战。' },
    { q: '如何获得支持？', a: '如需更多帮助，欢迎随时联系支持团队。您可通过 support@flamedraw.com 将问题与账户信息发送给我们，我们会尽快回复并协助解决任何疑问。' },
  ];

  return (
    <div className="flex flex-col items-stretch gap-4">
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <div className="size-6" style={{ color: '#9CA3AF' }}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.9 20C9.80858 20.979 12.0041 21.2442 14.0909 20.7478C16.1777 20.2513 18.0186 19.0258 19.2818 17.2922C20.545 15.5585 21.1474 13.4307 20.9806 11.2921C20.8137 9.1536 19.8886 7.14496 18.3718 5.62818C16.855 4.1114 14.8464 3.18624 12.7078 3.0194C10.5693 2.85257 8.44147 3.45503 6.70782 4.71823C4.97417 5.98143 3.74869 7.8223 3.25222 9.9091C2.75575 11.9959 3.02094 14.1914 4 16.1L2 22L7.9 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M9.09003 8.99999C9.32513 8.33166 9.78918 7.7681 10.4 7.40912C11.0108 7.05015 11.7289 6.91893 12.4272 7.0387C13.1255 7.15848 13.7588 7.52151 14.2151 8.06352C14.6714 8.60552 14.9211 9.29151 14.92 9.99999C14.92 12 11.92 13 11.92 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M12 17H12.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path></svg>
        </div>
        <h3 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>使用说明</h3>
      </div>

      {/* 三步卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HowItWorksCard step="01" title="开启礼包" desc="找到您的完美礼包并体验在线兴奋！" imgAlt="Open Packs" imgSrc="/theme/default/openPacks.webp" imgWidth={189} imgHeight={126} />
        <HowItWorksCard step="02" title="赢取物品" desc="每个礼包都会发现一个您熟悉和喜爱的顶级品牌产品！" imgAlt="Win Items" imgSrc="/theme/default/winItems.webp" imgWidth={268} imgHeight={163} />
        <HowItWorksCard step="03" title="现金或领取" desc="出售不需要的物品，提取现金或等待发货！" imgAlt="Cash or Claim" imgSrc="/theme/default/cashOrClaim.webp" imgWidth={236} imgHeight={153} />
      </div>

      {/* FAQ */}
      <div data-orientation="vertical">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <FaqAccordion items={faqLeft} />
          <FaqAccordion items={faqRight} />
        </div>
      </div>
    </div>
  );
}


