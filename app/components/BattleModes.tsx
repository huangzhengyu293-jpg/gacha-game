"use client";

import React from "react";
import { useI18n } from "./I18nProvider";

type Mode = {
  id: string;
  title: string;
  accentColor: string; // 例: '#DBEAFE', '#DCFCE7', 'transparent'
  cost: string; // 已格式化金额
  rightBadgeCount: number;
  avatars: Array<{ src: string; alt?: string; isSvg?: boolean; svg?: React.ReactNode }>;
  crownLeft?: React.ReactNode; // 左侧皇冠装饰（已停用）
  crownRight?: React.ReactNode; // 右侧皇冠装饰（已停用）
  gallery: Array<{ src: string; alt?: string }>;
  actionText: string;
};

// crown 装饰移除（/_next/image 资源无效）

function Avatar({ src, alt = '', svg }: { src?: string; alt?: string; svg?: React.ReactNode }) {
  return (
    <div className="overflow-hidden border rounded-full border-gray-700" style={{ borderWidth: 1 }}>
      <div className="relative rounded-full overflow-hidden" style={{ width: 32, height: 32 }}>
        {svg ? svg : (
          <img alt={alt} loading="lazy" decoding="async" src={src || ''} style={{ position: 'absolute', height: '100%', width: '100%', inset: 0, objectFit: 'cover', color: 'transparent' }} />
        )}
      </div>
    </div>
  );
}

function Gallery({ items }: { items: Array<{ src: string; alt?: string }> }) {
  return (
    <div className="flex w-full overflow-hidden">
      <div className="rounded-lg m-[1px] flex gap-3 pr-2 md:pr-[282px] py-1.5" style={{ height: 108 }}>
        {items.map((g, i) => (
          <img key={i} alt={g.alt || ''} loading="eager" width={63} height={96} decoding="async" src={g.src} style={{ color: 'transparent', opacity: 0.32, cursor: 'pointer' }} />
        ))}
      </div>
    </div>
  );
}

function ModeCard({ mode }: { mode: Mode }) {
  const { t } = useI18n();
  return (
    <div className="cursor-pointer">
      <div className="flex relative flex-col md:flex-row items-center p-4 rounded-lg cursor-pointer min-w-0" style={{ backgroundColor: '#1A1B1E' }}>
        <div className="absolute top-0 left-[35%] md:left-0 h-1.5 md:h-full w-[30%] md:w-1.5 rounded-b-lg md:rounded-r-none md:rounded-l-lg" style={{ backgroundColor: mode.accentColor }}></div>

        {/* 左侧信息列 */}
        <div className="flex flex-col items-center gap-2 w-full md:w-[21rem] min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-base text-gray-400 font-extrabold">{mode.title}</p>
          </div>

          <div className="flex items-center gap-1">
            {/* 左皇冠 + 头像 */}
            <div className="relative" style={{ opacity: 1 }}>
              <Avatar svg={undefined} src={mode.avatars[0]?.src} />
            </div>
            <div className="h-[14px] w-[14px] text-gray-400">
              <svg viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.1806 0.652964C9.50276 -0.217654 10.7342 -0.217655 11.0563 0.652963L13.2 6.44613C13.3013 6.71985 13.5171 6.93566 13.7908 7.03694L19.584 9.1806C20.4546 9.50276 20.4546 10.7342 19.584 11.0563L13.7908 13.2C13.5171 13.3013 13.3013 13.5171 13.2 13.7908L11.0563 19.584C10.7342 20.4546 9.50276 20.4546 9.1806 19.584L7.03694 13.7908C6.93566 13.5171 6.71985 13.3013 6.44613 13.2L0.652964 11.0563C-0.217654 10.7342 -0.217655 9.50276 0.652963 9.1806L6.44613 7.03694C6.71985 6.93566 6.93566 6.71985 7.03694 6.44613L9.1806 0.652964Z" fill="currentColor"></path></svg>
            </div>
            <div className="relative" style={{ opacity: 1 }}>
              <Avatar svg={undefined} src={mode.avatars[1]?.src} />
            </div>
            <div className="h-[14px] w-[14px] text-gray-400">
              <svg viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.1806 0.652964C9.50276 -0.217654 10.7342 -0.217655 11.0563 0.652963L13.2 6.44613C13.3013 6.71985 13.5171 6.93566 13.7908 7.03694L19.584 9.1806C20.4546 9.50276 20.4546 10.7342 19.584 11.0563L13.7908 13.2C13.5171 13.3013 13.3013 13.5171 13.2 13.7908L11.0563 19.584C10.7342 20.4546 9.50276 20.4546 9.1806 19.584L7.03694 13.7908C6.93566 13.5171 6.71985 13.3013 6.44613 13.2L0.652964 11.0563C-0.217654 10.7342 -0.217655 9.50276 0.652963 9.1806L6.44613 7.03694C6.71985 6.93566 6.93566 6.71985 7.03694 6.44613L9.1806 0.652964Z" fill="currentColor"></path></svg>
            </div>
            <div className="relative" style={{ opacity: 1 }}>
              <Avatar svg={undefined} src={mode.avatars[2]?.src} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-400 font-extrabold">{t('cost')}：</p>
            <p className="text-sm text-white font-extrabold">{mode.cost}</p>
          </div>
        </div>

        {/* 中部画廊 */}
        <div className="flex flex-1 min-w-0 self-stretch md:self-center py-1">
          <div className="flex relative w-full rounded-lg overflow-hidden" style={{ backgroundColor: '#0F1012' }}>
            <Gallery items={mode.gallery} />
            <div className="flex absolute justify-center items-center top-0 right-0 gap-1 py-[2.5px] px-1 m-1 rounded" style={{ backgroundColor: '#232529' }}>
              <div className="size-3">
                <svg viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.155 15.8964V2.37359C13.155 1.06143 12.0936 0 10.7814 0H2.37359C1.06143 0 0 1.06143 0 2.37359V15.8964C0 17.2085 1.06143 18.27 2.37359 18.27H10.7814C12.0936 18.27 13.155 17.2085 13.155 15.8964Z" fill="currentColor"></path><path d="M15.5286 2.00584L13.9908 1.72168C14.0326 1.93062 14.0577 2.15628 14.0577 2.37358V15.8964C14.0577 17.7016 12.5867 19.1726 10.7814 19.1726H7.95654L12.1688 19.9582C13.4559 20.2006 14.6929 19.3481 14.9352 18.061L17.4175 4.76388C17.6598 3.4768 16.8074 2.23986 15.5203 1.99748L15.5286 2.00584Z" fill="currentColor"></path></svg>
              </div>
              <p className="text-sm text-white font-bold">{mode.rightBadgeCount}</p>
            </div>
          </div>
        </div>

        {/* 右侧按钮列 */}
        <div className="flex flex-col items-center gap-2 w-full md:w-[12rem] overflow-hidden min-w-0">
          <div className="overflow-hidden max-w-full px-4">
            <p className="text-base text-gray-400 font-bold text-center truncate">{t('opened')}：$60,921.00</p>
          </div>
          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base text-white font-bold disabled:text-gray-400 select-none h-10 px-6 w-40 m-[1px] hover:brightness-110" style={{ backgroundColor: '#232529' }}>
            {t('viewResults')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BattleModes() {
  const { t } = useI18n();
  const modes: Mode[] = [
    {
      id: 'share',
      title: t('shareMode'),
      accentColor: '#00FF00',
      cost: '$345.30',
      rightBadgeCount: 5,
      avatars: [
        { src: 'https://ik.imagekit.io/hr727kunx/profile_pictures/packbot32.png?tr=w-128,c-at_max' },
        { src: 'https://ik.imagekit.io/hr727kunx/profile_pictures/packbot21.png?tr=w-128,c-at_max' },
        { src: 'https://ik.imagekit.io/hr727kunx/profile_pictures/packbot32.png?tr=w-128,c-at_max' }
      ],
      crownLeft: undefined,
      crownRight: undefined,
      gallery: [
        { src: 'https://ik.imagekit.io/hr727kunx/community_packs/cm18eb8ji001kugiildnpy8fm/packs/cm18eb8ji001kugiildnpy8fm_hQOMiytlLO.png?tr=q-50,w-128,c-at_max' },
        { src: 'https://ik.imagekit.io/hr727kunx/community_packs/cm26flgi701cpm4zlkfg9r5rs/packs/cm26flgi701cpm4zlkfg9r5rs_kSVR2aWAW.png?tr=q-50,w-128,c-at_max' },
        { src: 'https://ik.imagekit.io/hr727kunx/community_packs/cm18eb8ji001kugiildnpy8fm/packs/cm18eb8ji001kugiildnpy8fm_hQOMiytlLO.png?tr=q-50,w-128,c-at_max' },
        { src: 'https://ik.imagekit.io/hr727kunx/packs/clnbe51bh0002mj16f3okhxel_140233__MGmAsXEkC?tr=q-50,w-128,c-at_max' },
        { src: 'https://ik.imagekit.io/hr727kunx/community_packs/cm26flgi701cpm4zlkfg9r5rs/packs/cm26flgi701cpm4zlkfg9r5rs_kSVR2aWAW.png?tr=q-50,w-128,c-at_max' }
      ],
      actionText: '查看结果'
    },
    {
      id: 'jackpot',
      title: t('jackpot'),
      accentColor: '#004C71',
      cost: '$135.25',
      rightBadgeCount: 8,
      avatars: [
        { src: 'https://ik.imagekit.io/hr727kunx/profile_pictures/packbot4.png?tr=w-128,c-at_max' },
        { src: 'https://ik.imagekit.io/hr727kunx/profile_pictures/packbot18.png?tr=w-128,c-at_max' },
        { src: 'https://ik.imagekit.io/hr727kunx/profile_pictures/packbot27.png?tr=w-128,c-at_max' }
      ],
      crownLeft: undefined,
      crownRight: undefined,
      gallery: [
        { src: 'https://ik.imagekit.io/hr727kunx/packs/clnbe51bh0002mj16f3okhxel_140233__MGmAsXEkC?tr=q-50,w-128,c-at_max' },
        { src: 'https://ik.imagekit.io/hr727kunx/packs/clnbe51bh0002mj16f3okhxel_140233__MGmAsXEkC?tr=q-50,w-128,c-at_max' },
        { src: 'https://ik.imagekit.io/hr727kunx/packs/clnbe51bh0002mj16f3okhxel_140233__MGmAsXEkC?tr=q-50,w-128,c-at_max' },
        { src: 'https://ik.imagekit.io/hr727kunx/packs/clnbe51bh0002mj16f3okhxel_140233__MGmAsXEkC?tr=q-50,w-128,c-at_max' },
        { src: 'https://ik.imagekit.io/hr727kunx/packs/clnbe51bh0002mj16f3okhxel_140233__MGmAsXEkC?tr=q-50,w-128,c-at_max' },
        { src: 'https://ik.imagekit.io/hr727kunx/packs/clnbe51bh0002mj16f3okhxel_140233__MGmAsXEkC?tr=q-50,w-128,c-at_max' },
        { src: 'https://ik.imagekit.io/hr727kunx/packs/clnbe51bh0002mj16f3okhxel_140233__MGmAsXEkC?tr=q-50,w-128,c-at_max' },
        { src: 'https://ik.imagekit.io/hr727kunx/packs/clnbe51bh0002mj16f3okhxel_140233__MGmAsXEkC?tr=q-50,w-128,c-at_max' },
      ],
      actionText: '查看结果'
    },
    {
      id: 'normal',
      title: t('normalMode'),
      accentColor: 'transparent',
      cost: '$75.33',
      rightBadgeCount: 6,
      avatars: [
        { src: 'https://ik.imagekit.io/hr727kunx/profile_pictures/packbot8.png?tr=w-128,c-at_max' },
        { src: 'https://ik.imagekit.io/hr727kunx/profile_pictures/packbot23.png?tr=w-128,c-at_max' },
        { src: 'https://ik.imagekit.io/hr727kunx/profile_pictures/packbot29.png?tr=w-128,c-at_max' }
      ],
      crownLeft: undefined,
      crownRight: undefined,
      gallery: [
        { src: 'https://ik.imagekit.io/hr727kunx/community_packs/cm9svs3ht00xwla0fuv44wwcn/packs/cm9svs3ht00xwla0fuv44wwcn_w1VitJRmZ2.png?tr=q-50,w-128,c-at_max' },
        { src: 'https://ik.imagekit.io/hr727kunx/community_packs/cm9svs3ht00xwla0fuv44wwcn/packs/cm9svs3ht00xwla0fuv44wwcn_RwRDrSxN6.png?tr=q-50,w-128,c-at_max' },
        { src: 'https://ik.imagekit.io/hr727kunx/packs/clnbe51bh0002mj16f3okhxel_140233__MGmAsXEkC?tr=q-50,w-128,c-at_max' },
        { src: 'https://ik.imagekit.io/hr727kunx/packs/clnbe51bh0002mj16f3okhxel_140233__MGmAsXEkC?tr=q-50,w-128,c-at_max' },
        { src: 'https://ik.imagekit.io/hr727kunx/packs/clnbe51bh0002mj16f3okhxel_140233__MGmAsXEkC?tr=q-50,w-128,c-at_max' },
        { src: 'https://ik.imagekit.io/hr727kunx/community_packs/cm9svs3ht00xwla0fuv44wwcn/packs/cm9svs3ht00xwla0fuv44wwcn_QIp3zilQ3.png?tr=q-50,w-128,c-at_max' }
      ],
      actionText: '查看结果'
      ,
    }
  ];

  return (
    <div className="flex flex-col items-stretch gap-4">
      {modes.map((m) => (
        <ModeCard key={m.id} mode={m} />
      ))}
    </div>
  );
}


