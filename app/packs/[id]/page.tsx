"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useI18n } from "../../components/I18nProvider";
import GachaWheel, { GachaWheelHandle } from "../../components/GachaWheel";

export default function PackDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { t } = useI18n();
  const goBack = () => router.back();
  const wheelLeftRef = useRef<GachaWheelHandle>(null);
  const wheelRightRef = useRef<GachaWheelHandle>(null);
  const [isFastMode, setIsFastMode] = useState(false);

  const handleOneButton = () => {
    if (isFastMode) {
      wheelLeftRef.current?.spinDemoFast?.();
      wheelRightRef.current?.spinDemoFast?.();
    } else {
      wheelLeftRef.current?.spinDemo?.();
      wheelRightRef.current?.spinDemo?.();
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 md:px-8" style={{ paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)', paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)' }}>
      <div className="flex w-full max-w-screen-xl mx-auto px-0 -mb-6 justify-between items-center">
        <button onClick={goBack} className="inline-flex items-center justify-center whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-transparent text-base text-gray-400 font-bold hover:text-white select-none h-10 px-0 gap-0">
          <div className="size-5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M8 3L3 8L8 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path><path d="M13 8L3 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path></svg>
          </div>
          <p className="text-sm text-white font-bold ml-2">{t('backToPacks')}</p>
        </button>

        <div className="flex justify-center items-center gap-1">
          <div className="size-5 mr-1 text-white">
            <svg viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.21192 7.42225C1.15968 8.23994 0.158879 10.5665 0.976565 12.6187L12.821 42.346C13.6387 44.3982 15.9652 45.399 18.0174 44.5813L34.739 37.9188C36.7913 37.1012 37.7921 34.7746 36.9744 32.7224L25.13 2.99512C24.3123 0.942884 21.9857 -0.0579184 19.9335 0.759768L3.21192 7.42225Z" fill="currentColor"></path><path d="M35.8047 22.5693L35.7383 6.50156C35.7292 4.29244 33.931 2.50898 31.7219 2.5181L27.822 2.5342L35.8047 22.5693Z" fill="currentColor"></path><path d="M38.0241 27.9748L44.3787 13.2168C45.2524 11.1878 44.3158 8.83469 42.2868 7.96101L38.7048 6.41865L38.0241 27.9748Z" fill="currentColor"></path></svg>
          </div>
          <p className="text-white text-lg font-black">PackDraw</p>
        </div>

        <div className="flex gap-2 w-[113.5px]" />
      </div>

      {/* 柏青哥转轮 - 上行：从左往右回正 */}
      <div className="mt-8">
        <GachaWheel ref={wheelLeftRef} highSpeedDuration={0.62} bounceDirection={'left'} />
      </div>

      {/* 柏青哥转轮 - 下行：从右往左回正 */}
      <div className="mt-8">
        <GachaWheel ref={wheelRightRef} highSpeedDuration={0.62} bounceDirection={'right'} />
      </div>

      {/* 抽奖控制 */}
      <div className="flex flex-col items-center gap-4 mt-8">
        {/* 方向说明（已固定：上行左→右，下行右→左） */}
        <div className="flex items-center gap-3 bg-gray-700/50 px-4 py-2 rounded-lg text-sm text-gray-300">
          <span>上行：从左往右回正</span>
          <span>下行：从右往左回正</span>
        </div>

        {/* 已固定高速时长为 0.62s（全局一致） */}

        {/* 快速模式开关 */}
        <button
          onClick={() => setIsFastMode(!isFastMode)}
          className={`px-6 py-2 rounded-lg font-bold text-sm transition-all duration-200 ${
            isFastMode
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : "bg-gray-700 hover:bg-gray-600 text-gray-300"
          }`}
        >
          {isFastMode ? "快速抽奖已开启" : "正常速度"}
        </button>

        {/* 开始抽奖按钮 */}
        <button
          onClick={handleOneButton}
          className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          开始抽奖 {isFastMode && "（快速）"}
        </button>
      </div>

    </div>
  );
}


