'use client';

import React, { useRef, useState } from 'react';
import CanvasSlotMachine, { CanvasSlotMachineHandle, SlotSymbol } from '../components/SlotMachine/CanvasSlotMachine';

// 模拟数据
const mockSymbols: SlotSymbol[] = [
  {
    id: 'item_001',
    name: '传说宝箱',
    image: 'https://ik.imagekit.io/hr727kunx/packs/cmgmus9260000l80gpntkfktl_3232094__fSM1fwIYl1?tr=w-256,c-at_max',
    price: 999.99,
    qualityId: 'legendary'
  },
  {
    id: 'item_002',
    name: '史诗武器',
    image: 'https://ik.imagekit.io/hr727kunx/packs/cmgo6ok710000k10g5r0il5rk_7104681__d8no0nmco?tr=w-256,c-at_max',
    price: 499.99,
    qualityId: 'epic'
  },
  {
    id: 'item_003',
    name: '稀有道具',
    image: 'https://ik.imagekit.io/hr727kunx/packs/cmgo8hdp90000l40gxmfk970t_5020787__2hFmzl5eh?tr=w-256,c-at_max',
    price: 199.99,
    qualityId: 'rare'
  },
  {
    id: 'item_004',
    name: '普通装备',
    image: 'https://ik.imagekit.io/hr727kunx/packs/cmh2lqffk001al10paqslua2f_2229948__zIR8y5q-G?tr=w-256,c-at_max',
    price: 99.99,
    qualityId: 'uncommon'
  },
  {
    id: 'item_005',
    name: '基础物品',
    image: 'https://ik.imagekit.io/hr727kunx/packs/cmgmus9260000l80gpntkfktl_3232094__fSM1fwIYl1?tr=w-256,c-at_max',
    price: 49.99,
    qualityId: null
  },
  {
    id: 'item_006',
    name: '钻石礼包',
    image: 'https://ik.imagekit.io/hr727kunx/packs/cmgo6ok710000k10g5r0il5rk_7104681__d8no0nmco?tr=w-256,c-at_max',
    price: 299.99,
    qualityId: 'epic'
  },
  {
    id: 'item_007',
    name: '黄金箱子',
    image: 'https://ik.imagekit.io/hr727kunx/packs/cmgo8hdp90000l40gxmfk970t_5020787__2hFmzl5eh?tr=w-256,c-at_max',
    price: 149.99,
    qualityId: 'rare'
  },
  {
    id: 'item_008',
    name: '白银宝石',
    image: 'https://ik.imagekit.io/hr727kunx/packs/cmh2lqffk001al10paqslua2f_2229948__zIR8y5q-G?tr=w-256,c-at_max',
    price: 79.99,
    qualityId: 'uncommon'
  }
];

export default function TestSlotPage() {
  const slotRef = useRef<CanvasSlotMachineHandle>(null);
  const [selectedPrizeId, setSelectedPrizeId] = useState<string | null>(null);
  const [result, setResult] = useState<SlotSymbol | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const handleSpin = () => {
    // 随机选择一个奖品
    const randomIndex = Math.floor(Math.random() * mockSymbols.length);
    const randomPrize = mockSymbols[randomIndex];
    
    setSelectedPrizeId(randomPrize.id);
    setResult(null);
    setIsSpinning(true);
    
    // 延迟启动以确保 selectedPrizeId 已更新
    setTimeout(() => {
      slotRef.current?.startSpin();
    }, 100);
  };

  const handleSpinComplete = (symbol: SlotSymbol) => {
    setResult(symbol);
    setIsSpinning(false);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '30px'
    }}>
      <h1 style={{ 
        fontSize: '36px', 
        fontWeight: 'bold', 
        color: '#fff',
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        🎰 Canvas 老虎机测试（原生优化版）
      </h1>

      <div style={{
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* 老虎机 */}
        <CanvasSlotMachine
          ref={slotRef}
          symbols={mockSymbols}
          selectedPrizeId={selectedPrizeId}
          onSpinStart={() => console.log('🎰 开始旋转')}
          onSpinComplete={handleSpinComplete}
          height={540}
          spinDuration={4500}
        />

        {/* 控制按钮 */}
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          style={{
            padding: '16px 32px',
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#fff',
            background: isSpinning 
              ? 'linear-gradient(135deg, #666 0%, #888 100%)' 
              : 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            border: 'none',
            borderRadius: '12px',
            cursor: isSpinning ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: isSpinning 
              ? 'none' 
              : '0 4px 20px rgba(255, 215, 0, 0.4)',
            transform: isSpinning ? 'scale(0.95)' : 'scale(1)'
          }}
        >
          {isSpinning ? '🎰 旋转中...' : '🎲 开始抽奖'}
        </button>

        {/* 结果显示 */}
        {result && (
          <div style={{
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 215, 0, 0.3)',
            animation: 'slideIn 0.5s ease-out'
          }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#FFD700',
              marginBottom: '10px',
              textAlign: 'center'
            }}>
              🎉 恭喜获得
            </h2>
            <div style={{ 
              fontSize: '18px', 
              color: '#fff',
              textAlign: 'center',
              marginBottom: '8px'
            }}>
              {result.name}
            </div>
            <div style={{ 
              fontSize: '20px', 
              fontWeight: 'bold',
              color: '#FFD700',
              textAlign: 'center'
            }}>
              ${result.price.toFixed(2)}
            </div>
          </div>
        )}

        {/* 说明 */}
        <div style={{
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '14px',
          lineHeight: '1.6'
        }}>
          <h3 style={{ color: '#fff', marginBottom: '8px', fontWeight: 'bold' }}>✨ 特性：</h3>
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            <li>🎨 Canvas 渲染：极致性能，单个 canvas 元素</li>
            <li>⚡ 两阶段动画：高速旋转 + 精确回正</li>
            <li>🎯 easeOutQuint 缓动：和原版完全一致</li>
            <li>💎 选中效果：1.3x 缩放 + 品质光晕</li>
            <li>🚀 无缝换数据：无需卸载重新挂载</li>
            <li>📱 高 DPI 支持：Retina 屏幕完美显示</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

