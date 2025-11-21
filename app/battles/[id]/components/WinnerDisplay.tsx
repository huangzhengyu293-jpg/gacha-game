'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import FireworkArea, { FireworkAreaHandle } from '@/app/components/FireworkArea';

interface WinnerDisplayProps {
  winner: {
    id: string;
    name: string;
    avatar: string;
    totalValue: string;
  };
  battleCost?: string;
}

export default function WinnerDisplay({ winner, battleCost = '$0.00' }: WinnerDisplayProps) {
  const router = useRouter();
  const fireworkRef = useRef<FireworkAreaHandle>(null);

  // 🎆 组件初始化时触发烟花
  useEffect(() => {
    const timer = setTimeout(() => {
      fireworkRef.current?.triggerFirework();
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full">
      {/* 🎆 烟花效果 - 从父容器底部喷发 */}
      <FireworkArea ref={fireworkRef} />
      <div className="relative" style={{ opacity: 1 }}>
        {/* 头像 */}
        <div className="overflow-hidden border rounded-full border-gray-700" style={{ borderWidth: 1 }}>
          <div className="relative rounded-full overflow-hidden" style={{ width: '128px', height: '128px' }}>
            <img
              alt={winner.name}
              src={winner.avatar}
              className="w-full h-full object-cover"
              style={{ color: 'transparent' }}
            />
          </div>
        </div>
      </div>
      
      {/* 信息和按钮 */}
      <div className="flex flex-col items-center gap-8 mt-6">
        <div className="flex flex-col items-center">
          <p className="truncate font-bold text-xl text-white">{winner.name}</p>
          <p className="text-sm md:text-base text-white font-bold mt-2">{winner.totalValue}</p>
        </div>
        
        {/* 按钮组 */}
        <div className="flex flex-col gap-3">
          {/* 重新创建对战 */}
          <button 
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none relative bg-green-400 text-base text-white font-bold hover:bg-green-500 disabled:text-green-600 select-none h-10 px-6"
            onClick={() => {
              // TODO: 重新创建对战逻辑
            }}
          >
            <p className="text-base text-white font-bold">用 {battleCost} 重新创建此对战</p>
          </button>
          
          {/* 操作按钮行 */}
          <div className="flex gap-3">
            {/* 从头开始按钮 */}
            <button 
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none relative bg-gray-600 text-base text-white font-bold hover:bg-gray-500 disabled:text-gray-400 select-none size-10 min-h-10 min-w-10 max-h-10 max-w-10"
              onClick={() => {
                // 从头开始：通过添加时间戳强制刷新页面（清除所有状态）
                const url = new URL(window.location.href);
                url.searchParams.delete('simulateJoinTime');  // 移除中途加入参数
                window.location.href = url.toString();
              }}
              title="从头开始"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
              </svg>
            </button>
            
            {/* 创建新对战 */}
            <button 
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none relative bg-gray-600 text-base text-white font-bold hover:bg-gray-500 disabled:text-gray-400 select-none h-10 px-6 flex-1"
              onClick={() => {
                router.push('/battles/create');
              }}
            >
              <p className="text-base text-white font-bold">创建新对战</p>
            </button>
            
            {/* 编辑按钮 */}
            <button 
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none relative bg-gray-600 text-base text-white font-bold hover:bg-gray-500 disabled:text-gray-400 select-none size-10 min-h-10 min-w-10 max-h-10 max-w-10"
              onClick={() => {
                // TODO: 编辑对战逻辑
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

