'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { products as packProducts } from '../lib/packs';

type Difficulty = 'easy' | 'medium' | 'hard';

const MULTIPLIERS = [
  { label: 'x1', glow: '#829DBB' },
  { label: 'x1.3', glow: '#4B69FF' },
  { label: 'x1.7', glow: '#4B69FF' },
  { label: 'x2.5', glow: '#8847FF' },
  { label: 'x4', glow: '#8847FF' },
  { label: 'x6.5', glow: '#D32CE6' },
  { label: 'x10', glow: '#D32CE6' },
  { label: 'x20', glow: '#EB4B4B' },
  { label: 'x50', glow: '#EB4B4B' },
  { label: 'x150', glow: '#E4AE33' },
];

// 抽牌轮次定义（生存率）
const DRAW_ROUNDS = [
  { label: 'x1', survival: 1.00 },
  { label: 'x1.3', survival: 0.731 },
  { label: 'x1.7', survival: 0.742 },
  { label: 'x2.5', survival: 0.660 },
  { label: 'x4', survival: 0.606 },
  { label: 'x6.5', survival: 0.597 },
  { label: 'x10', survival: 0.630 },
  { label: 'x20', survival: 0.485 },
  { label: 'x50', survival: 0.388 },
  { label: 'x150', survival: 0.323 },
];

// 与上方移动端表格保持一致的演示价格（用于悬停展示）
const ROUND_PRICES: number[] = [
  0.55, 0.72, 0.94, 1.38, 2.22, 3.61, 5.55, 11.11, 27.77, 83.33,
];

// 参考产品（名字/图片/价格），改为使用你在 app/lib/packs.ts 写的 products
const SOURCE_PRODUCTS = packProducts.map(p => ({ name: p.name, image: p.image, price: p.price }));

function getRoundProduct(roundIdx: number) {
  const p = SOURCE_PRODUCTS[roundIdx % SOURCE_PRODUCTS.length];
  return p;
}

function formatCurrency(num: number) {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function DrawExtraComponent() {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [hoverCycleStep, setHoverCycleStep] = useState<number>(0); // 行索引
  const hoverTimerRef = useRef<number | null>(null);
  const [hoverCycleNoTransition, setHoverCycleNoTransition] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>('5.00');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [hoverGuide, setHoverGuide] = useState<boolean>(false);
  const [hoverFair, setHoverFair] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [showFair, setShowFair] = useState<boolean>(false);
  const [fairServerHash, setFairServerHash] = useState<string | null>(null);
  const [fairClientSeed, setFairClientSeed] = useState<string | null>(null);
  const [isSmall, setIsSmall] = useState<boolean>(false);
  const [showActions, setShowActions] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const setupPanelRef = useRef<HTMLDivElement>(null);
  const actionsPanelRef = useRef<HTMLDivElement>(null);
  const [containerH, setContainerH] = useState<number | null>(null);
  const [layerReady, setLayerReady] = useState<boolean>(false);
  const [setupH, setSetupH] = useState<number>(0);
  const [actionsH, setActionsH] = useState<number>(0);
  const [hasFlipped, setHasFlipped] = useState<boolean>(false);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [roundIndex, setRoundIndex] = useState<number>(0); // 当前轮次
  const [activeMultiplierIdx, setActiveMultiplierIdx] = useState<number | null>(null);
  // 每张卡片是否展示背面（奖品）以及达到的轮次（-1 表示初始样式）
  const [cardBack, setCardBack] = useState<boolean[]>(Array(9).fill(false));
  const [cardWonRound, setCardWonRound] = useState<number[]>(Array(9).fill(-1));
  const [frontRound, setFrontRound] = useState<(number | null)[]>(Array(9).fill(null));
  const [backRound, setBackRound] = useState<(number | null)[]>(Array(9).fill(null));
  // 每一面对应的高亮颜色索引（与倍数颜色绑定），仅在该面内容设置时记录，翻到该面时才生效
  const [faceGlowIdxFront, setFaceGlowIdxFront] = useState<(number | null)[]>(Array(9).fill(null));
  const [faceGlowIdxBack, setFaceGlowIdxBack] = useState<(number | null)[]>(Array(9).fill(null));
  // 复位到初始时关闭翻牌过渡，避免出现"多翻一次"的视觉
  const [suppressFlipTransition, setSuppressFlipTransition] = useState<boolean>(false);
  // 每张背面卡片的hover状态
  const [backCardHovered, setBackCardHovered] = useState<boolean[]>(Array(9).fill(false));

  function hexToRgba(hex: string, alpha: number) {
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  const activeGlowColor = useMemo(() => {
    return (activeMultiplierIdx !== null && MULTIPLIERS[activeMultiplierIdx]) ? MULTIPLIERS[activeMultiplierIdx].glow : null;
  }, [activeMultiplierIdx]);
  const cardGlowHigh = useMemo(() => activeGlowColor ? hexToRgba(activeGlowColor, 0.45) : 'rgba(71,74,77,0.22)', [activeGlowColor]);
  const cardGlowLow = useMemo(() => activeGlowColor ? hexToRgba(activeGlowColor, 0.16) : 'rgba(71,74,77,0.08)', [activeGlowColor]);
  const cardGlowStrong = useMemo(() => activeGlowColor ? hexToRgba(activeGlowColor, 0.9) : 'rgba(71,74,77,0.5)', [activeGlowColor]);
  const imageDropShadow = useMemo(() => activeGlowColor
    ? `drop-shadow(0 0 10px ${hexToRgba(activeGlowColor, 0.6)}) drop-shadow(0 0 4px ${hexToRgba(activeGlowColor, 0.35)})`
    : 'drop-shadow(0 0 10px rgba(71,74,77,0.4))'
  , [activeGlowColor]);

  useEffect(() => {
    const update = () => setIsSmall(!window.matchMedia('(min-width: 640px)').matches);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // 悬停时文本滚动：倍数 → 生存率 → 价格，每 1s 切换一次；移开后停止并复位
  useEffect(() => {
    if (hoverIdx !== null) {
      // 起始显示当前倍数，然后立刻滚到生存率
      setHoverCycleNoTransition(true);
      setHoverCycleStep(0);
      const t = window.setTimeout(() => {
        setHoverCycleNoTransition(false);
        setHoverCycleStep(1); // 立刻滚动到生存率
      }, 20);
      if (hoverTimerRef.current) window.clearInterval(hoverTimerRef.current);
      hoverTimerRef.current = window.setInterval(() => {
        setHoverCycleStep((s) => s + 1);
      }, 1000);
      return () => {
        if (hoverTimerRef.current) window.clearInterval(hoverTimerRef.current);
        hoverTimerRef.current = null;
        window.clearTimeout(t);
      };
    } else {
      if (hoverTimerRef.current) window.clearInterval(hoverTimerRef.current);
      hoverTimerRef.current = null;
      // 离开后立即恢复到倍数且不出现回滚动画
      setHoverCycleNoTransition(true);
      setHoverCycleStep(0);
      window.setTimeout(() => setHoverCycleNoTransition(false), 0);
    }
  }, [hoverIdx]);

  // 当滚动到最后一行（重复倍数）后，等待过渡完成，瞬间无过渡回到第 1 行（生存率），形成无缝循环
  useEffect(() => {
    const rowsLen = MULTIPLIERS.length * 3 + 1;
    if (hoverIdx !== null && hoverCycleStep >= rowsLen) {
      const t = window.setTimeout(() => {
        setHoverCycleNoTransition(true);
        setHoverCycleStep(1); // 回到生存率，衔接下一轮
        window.setTimeout(() => setHoverCycleNoTransition(false), 0);
      }, 400); // 对应过渡时间 400ms
      return () => window.clearTimeout(t);
    }
  }, [hoverCycleStep, hoverIdx]);

  // 独立观察两个面板高度，随时记录
  useEffect(() => {
    const measureSetup = () => {
      const el = setupPanelRef.current;
      if (el) setSetupH(el.scrollHeight || el.offsetHeight);
    };
    const measureActions = () => {
      const el = actionsPanelRef.current;
      if (el) setActionsH(el.scrollHeight || el.offsetHeight);
    };
    measureSetup();
    measureActions();
    let ro1: ResizeObserver | null = null;
    let ro2: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro1 = new ResizeObserver(() => measureSetup());
      ro2 = new ResizeObserver(() => measureActions());
      if (setupPanelRef.current) ro1.observe(setupPanelRef.current);
      if (actionsPanelRef.current) ro2.observe(actionsPanelRef.current);
    }
    window.addEventListener('resize', measureSetup);
    window.addEventListener('resize', measureActions);
    return () => {
      if (ro1) ro1.disconnect();
      if (ro2) ro2.disconnect();
      window.removeEventListener('resize', measureSetup);
      window.removeEventListener('resize', measureActions);
    };
  }, []);

  // 根据显示面板立即更新容器高度，避免裁切
  useEffect(() => {
    const target = showActions ? 128 : (setupH || 0);
    if (target && target > 0) {
      setContainerH(target);
      if (!layerReady) setLayerReady(true);
    }
  }, [showActions, setupH, actionsH]);

  useEffect(() => {
    if (showGuide || showFair) {
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setShowGuide(false); setShowFair(false); } };
      const onKey2 = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowFair(false); };
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onKey);
      window.addEventListener('keydown', onKey2);
      return () => {
        window.removeEventListener('keydown', onKey);
        window.removeEventListener('keydown', onKey2);
        document.body.style.overflow = '';
      };
    }
  }, [showGuide, showFair]);

  // 模拟获取公平性数据
  useEffect(() => {
    if (showFair) {
      setFairServerHash(null);
      setFairClientSeed(null);
      const t = window.setTimeout(() => {
        const hash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        const client = `client-${Math.random().toString(36).slice(2, 10)}`;
        setFairServerHash(hash);
        setFairClientSeed(client);
      }, 2000);
      return () => window.clearTimeout(t);
    }
  }, [showFair]);

  const parsedAmount = useMemo(() => {
    const n = Number((amount || '').toString().replace(/,/g, ''));
    if (!Number.isFinite(n)) return 0;
    return Math.min(50000, Math.max(5, n));
  }, [amount]);

  const onAmountChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setAmount(e.target.value);
  };
  const onAmountBlur: React.FocusEventHandler<HTMLInputElement> = () => {
    setAmount(formatCurrency(parsedAmount));
  };

  const setMin = () => setAmount(formatCurrency(5));
  const setMax = () => setAmount(formatCurrency(50000));

  // 计算中奖卡牌的总金额
  const calculateTotalPrize = () => {
    let total = 0;
    for (let i = 0; i < 9; i++) {
      if (cardWonRound[i] >= 0) {
        // 确定当前显示的是正面还是背面
        const currentRound = cardBack[i] ? backRound[i] : frontRound[i];
        if (currentRound !== null) {
          const product = getRoundProduct(currentRound);
          total += product.price;
        }
      }
    }
    return total;
  };

  // 处理卡片hover的通用函数
  const handleCardMouseEnter = (idx: number) => {
    if (cardWonRound[idx] >= 0) {
      const newHovered = [...backCardHovered];
      newHovered[idx] = true;
      setBackCardHovered(newHovered);
    }
  };

  const handleCardMouseLeave = (idx: number) => {
    if (cardWonRound[idx] >= 0) {
      const newHovered = [...backCardHovered];
      newHovered[idx] = false;
      setBackCardHovered(newHovered);
    }
  };

  const startGame = () => {
    // 先固定容器高度，立即切换按钮面板
    const h = setupPanelRef.current?.offsetHeight;
    if (h && h > 0) {
      setContainerH(h);
      setLayerReady(true);
    }
    setShowActions(true);
    // 切换到动作面板时立即设置目标高度，固定为 128
    setContainerH(128);
    // 若首次点击，同时触发同步翻牌（与面板替换并行）
    if (!hasFlipped && !isFlipping) {
      if (activeMultiplierIdx === null) setActiveMultiplierIdx(0);
      setIsFlipping(true);
      // 第一轮：生存率 100%，全部中奖
      setRoundIndex(0);
      setCardWonRound(Array(9).fill(0));
      setFrontRound(Array(9).fill(null));
      setBackRound(Array(9).fill(0));
      // 记录本轮（背面）对应的高亮颜色索引（x1 -> 0）
      setFaceGlowIdxBack(Array(9).fill(0));
      setTimeout(() => {
        setCardBack(Array(9).fill(true));
      }, 10);
      setTimeout(() => {
        setHasFlipped(true);
        setIsFlipping(false);
      }, 650);
    }
  };

  const flipRound = (glowIdxForRound: number) => {
    if (isFlipping) return;
    setIsFlipping(true);
    const nextRound = Math.min(roundIndex + 1, DRAW_ROUNDS.length - 1);
    const p = DRAW_ROUNDS[nextRound].survival;
    const newBack = cardBack.slice();
    const newWon = cardWonRound.slice();
    const newFrontRound = frontRound.slice();
    const newBackRound = backRound.slice();
    const newFaceGlowFront = faceGlowIdxFront.slice();
    const newFaceGlowBack = faceGlowIdxBack.slice();
    for (let i = 0; i < 9; i++) {
      // 仅上一轮中奖的卡片继续抽
      const eligible = newWon[i] === roundIndex;
      if (!eligible) continue;
      const win = Math.random() < p;
      if (win) {
        newWon[i] = nextRound;
        // 下一轮奖品放在将要显示的那一面
        const targetIsBack = !newBack[i];
        if (targetIsBack) { newBackRound[i] = nextRound; newFaceGlowBack[i] = glowIdxForRound; }
        else { newFrontRound[i] = nextRound; newFaceGlowFront[i] = glowIdxForRound; }
        newBack[i] = !newBack[i]; // 翻到另一面显示奖品
      } else {
        newWon[i] = -1; // 淘汰
        // 为了产生翻面动画，切换到“另一面”并在该面渲染初始样式
        const targetIsBack = !newBack[i];
        if (targetIsBack) {
          newBackRound[i] = null; // 背面显示初始样式
          newFaceGlowBack[i] = null; // 初始样式无高亮
        } else {
          newFrontRound[i] = null; // 正面显示初始样式
          newFaceGlowFront[i] = null; // 初始样式无高亮
        }
        newBack[i] = !newBack[i]; // 触发翻面动画
      }
    }
    setRoundIndex(nextRound);
    // 重置hover状态
    setBackCardHovered(Array(9).fill(false));
    // 触发动画
    setTimeout(() => {
      setCardWonRound(newWon);
      setFrontRound(newFrontRound);
      setBackRound(newBackRound);
      setCardBack(newBack);
      setFaceGlowIdxFront(newFaceGlowFront);
      setFaceGlowIdxBack(newFaceGlowBack);
    }, 10);
    setTimeout(() => {
      // 如果所有卡都淘汰，重置为初始状态，结束本轮
      const anyAlive = newWon.some((v) => v === nextRound);
      if (!anyAlive) {
        // 保持层叠面板，直接通过 transform 做自下而上的还原动画
        setShowActions(false);
        setHasFlipped(false);
        setActiveMultiplierIdx(null);
        setRoundIndex(0);
        // 关闭翻牌过渡，瞬间归位到正面，避免“多翻一次”
        setSuppressFlipTransition(true);
        setCardBack(Array(9).fill(false));
        setCardWonRound(Array(9).fill(-1));
        setFrontRound(Array(9).fill(null));
        setBackRound(Array(9).fill(null));
        setFaceGlowIdxFront(Array(9).fill(null));
        setFaceGlowIdxBack(Array(9).fill(null));
        // 复位后立刻和延迟再次测量容器高度，避免仍为 128px 导致按钮被裁切
        setTimeout(() => {
          const el = setupPanelRef.current;
          if (el) setContainerH(el.offsetHeight || setupH || 0);
        }, 0);
        setTimeout(() => {
          const el = setupPanelRef.current;
          if (el) setContainerH(el.offsetHeight || setupH || 0);
        }, 260);
        // 下一帧恢复过渡
        setTimeout(() => setSuppressFlipTransition(false), 30);
      }
      setIsFlipping(false);
    }, 650);
  };

  return (
    <div className="flex flex-col self-center  pb-20 px-4 max-w-full w-full md:max-w-2xl gap-[1px]" style={{ minHeight: '1021px', marginLeft: 'auto', marginRight: 'auto' }}>
      {/* 自定义滚动条（用于弹窗） */}
      <style>{`
        .custom-scroll { scrollbar-color: #9F9F9F #2C2C2C; }
        .custom-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scroll::-webkit-scrollbar-track { background: #2C2C2C; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #9F9F9F; border-radius: 4px; }
        .custom-scroll::-webkit-scrollbar-button { background: #9F9F9F; height: 0; width: 0; }
        @keyframes modalFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalZoomIn { from { transform: scale(0.95); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        /* 翻牌 */
        .flip-card { perspective: 1000px; -webkit-perspective: 1000px; }
        .flip-inner { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; -webkit-transform-style: preserve-3d; transition: transform 600ms ease; will-change: transform; }
        .flip-inner.flipped { transform: rotateY(180deg); -webkit-transform: rotateY(180deg); }
        .flip-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; transform: translateZ(0); -webkit-transform: translateZ(0); will-change: transform, opacity; }
        .flip-back { transform: rotateY(180deg); -webkit-transform: rotateY(180deg); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
      {/* 顶部倍数栏 */}
      <div className="flex relative w-full h-14 rounded-t-lg overflow-clip" style={{ backgroundColor: '#161A1D' }}>
        <div className="flex absolute inset-0 overflow-clip">
          <div className="flex">
            {MULTIPLIERS.map((m, i) => (
              <div
                key={m.label}
                className="flex relative h-14 w-16 min-w-16 cursor-pointer select-none"
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx((prev) => (prev === i ? null : prev))}
              >
                <div
                  className="flex absolute -bottom-7 left-1/2 -translate-x-1/2 rounded-t-lg"
                  style={{
                    width: '66%',
                    height: '66%',
                    backgroundColor: m.glow,
                    opacity: activeMultiplierIdx === i ? 0.6 : 0,
                    filter: 'blur(6px)',
                    transition: 'opacity 500ms ease',
                  }}
                />
                <div className="flex absolute inset-0 items-center justify-center">
                  {hoverIdx === i ? (
                    <div
                      className="relative overflow-hidden"
                      style={{
                        height: `18px`,
                        WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
                        maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
                      }}
                    >
                      <div
                        style={{
                          transform: `translateY(-${hoverCycleStep * 18}px)`,
                          transition: hoverCycleNoTransition ? 'none' : 'transform 400ms ease',
                          willChange: 'transform',
                        }}
                      >
                        {(() => {
                          const rows: { type: 'label' | 'survival' | 'price'; roundIdx: number }[] = [];
                          // 起始：当前倍数
                          rows.push({ type: 'label', roundIdx: i });
                          for (let k = 0; k < MULTIPLIERS.length; k++) {
                            const r = (i + k) % MULTIPLIERS.length;
                            rows.push({ type: 'survival', roundIdx: r });
                            rows.push({ type: 'price', roundIdx: r });
                            // 下一轮倍数
                            rows.push({ type: 'label', roundIdx: (r + 1) % MULTIPLIERS.length });
                          }
                          return rows.map((row, idx2) => {
                            if (row.type === 'label') {
                              const lbl = MULTIPLIERS[row.roundIdx].label;
                              const color = lbl === 'x150' ? '#D69E2E' : '#7A8084';
                              return (
                                <div key={idx2} className="flex items-center justify-center" style={{ height: `18px` }}>
                                  <p className="text-sm font-bold" style={{ color }}>{lbl}</p>
                                </div>
                              );
                            }
                            if (row.type === 'survival') {
                              return (
                                <div key={idx2} className="flex items-center justify-center" style={{ height: `18px` }}>
                                  <p className="text-sm font-bold" style={{ color: '#7A8084' }}>{(DRAW_ROUNDS[row.roundIdx].survival * 100).toFixed(1)}%</p>
                                </div>
                              );
                            }
                            // price
                            return (
                              <div key={idx2} className="flex items-center justify-center" style={{ height: `18px` }}>
                                <p className="text-sm font-bold" style={{ color: '#7A8084' }}>${formatCurrency(ROUND_PRICES[row.roundIdx])}</p>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-bold" style={{ color: (m.label === 'x150' ? '#D69E2E' : '#7A8084') }}>{m.label}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 顶部与内容分割线 */}

      {/* 内容区（组件内切换，不影响父级） */}
      <div className="flex flex-col items-center p-4 md:py-8 sm:px-10 md:px-16 rounded-b-lg" style={{ backgroundColor: '#161A1D', overflow: 'visible' }}>
        {/* 3列网格卡片（静态） */}
        <div className="grid grid-cols-3 gap-4 w-full" style={{ overflow: 'visible' }}>
          {Array.from({ length: 9 }).map((_, idx) => (
            <div key={idx} className="flex relative aspect-square w-full h-full" style={{ overflow: 'visible' }}>
              <div className="flex absolute w-full h-full" style={{ overflow: 'visible' }}>
                <div className="aspect-square w-full rounded-lg" style={{ overflow: 'visible' }}>
                  <div className="flip-card w-full h-full" style={{ overflow: 'visible' }}>
                    <div className={`flip-inner`} style={{ transform: `rotateY(${cardBack[idx] ? 180 : 0}deg)`, transition: suppressFlipTransition ? 'none' as any : undefined }}>
                      {/* 正面 */}
                      <div className="flip-face" style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', border: frontRound[idx] === null ? '2px solid #34383C' : '2px solid #7a8084', borderRadius: '0.5rem', overflow: 'hidden', backgroundColor: frontRound[idx] === null ? '#161a1d' : '#1d2125' }}>
                        <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
                          {(() => {
                            const fr = frontRound[idx];
                            if (fr === null) {
                              return (
                                <div className="absolute flex flex-col gap-2 items-center justify-center" style={{ zIndex: 1 }}>
                                  <div className="flex w-10 h-10 md:w-12 md:h-12">
                                    <svg viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: '#474A4D' }}>
                                      <path d="M3.21192 7.42225C1.15968 8.23994 0.158879 10.5665 0.976565 12.6187L12.821 42.346C13.6387 44.3982 15.9652 45.399 18.0174 44.5813L34.739 37.9188C36.7913 37.1012 37.7921 34.7746 36.9744 32.7224L25.13 2.99512C24.3123 0.942884 21.9857 -0.0579184 19.9335 0.759768L3.21192 7.42225Z" fill="currentColor" />
                                      <path d="M35.8047 22.5693L35.7383 6.50156C35.7292 4.29244 33.931 2.50898 31.7219 2.5181L27.822 2.5342L35.8047 22.5693Z" fill="currentColor" />
                                      <path d="M38.0241 27.9748L44.3787 13.2168C45.2524 11.1878 44.3158 8.83469 42.2868 7.96101L38.7048 6.41865L38.0241 27.9748Z" fill="currentColor" />
                                    </svg>
                                  </div>
                                  <p className="font-black text-xs sm:text-sm md:text-lg" style={{ color: '#474A4D', fontFamily: 'Urbanist, sans-serif' }}>PackDraw</p>
                                </div>
                              );
                            }
                            const prod = getRoundProduct(fr);
                            const glowIdx = faceGlowIdxFront[idx];
                            const glowHex = (glowIdx !== null && MULTIPLIERS[glowIdx]) ? MULTIPLIERS[glowIdx].glow : '#829DBB';
                            const isWon = cardWonRound[idx] >= 0;
                            const isHovered = isWon && backCardHovered[idx];
                            return (
                              <div 
                                data-component="ProductDisplayCard" 
                                className="relative group transition-colors duration-200 ease-in-out rounded-lg select-none overflow-hidden w-full h-full flex flex-col items-center justify-between gap-2 py-1.5 md:py-2 px-4"
                                style={{ backgroundColor: isHovered ? '#22272b' : '#1d2125' }}
                                onMouseEnter={() => handleCardMouseEnter(idx)}
                                onMouseLeave={() => handleCardMouseLeave(idx)}
                              >
                                <div className="relative flex-1 flex w-full justify-center mt-1" style={{ width: '124px', height: '96px' }}>
                                  <div style={{ 
                                    position: 'absolute', 
                                    top: '50%', 
                                    left: '50%', 
                                    transform: 'translate(-50%, -50%)', 
                                    aspectRatio: '1 / 1', 
                                    transition: 'opacity 200ms', 
                                    height: '50%', 
                                    width: '50%',
                                    borderRadius: '50%', 
                                    filter: 'blur(25px)', 
                                    backgroundColor: glowHex, 
                                    opacity: isHovered ? 0.9 :  0.4
                                  }}></div>
                                  <img 
                                    alt={prod.name} 
                                    loading="lazy" 
                                    decoding="async" 
                                    data-nimg="fill" 
                                    className="pointer-events-none" 
                                    sizes="(min-width: 0px) 100px" 
                                    srcSet={`${prod.image}?tr=w-16,c-at_max 16w, ${prod.image}?tr=w-32,c-at_max 32w, ${prod.image}?tr=w-48,c-at_max 48w, ${prod.image}?tr=w-64,c-at_max 64w, ${prod.image}?tr=w-96,c-at_max 96w, ${prod.image}?tr=w-128,c-at_max 128w, ${prod.image}?tr=w-256,c-at_max 256w, ${prod.image}?tr=w-384,c-at_max 384w, ${prod.image}?tr=w-640,c-at_max 640w, ${prod.image}?tr=w-750,c-at_max 750w, ${prod.image}?tr=w-828,c-at_max 828w, ${prod.image}?tr=w-1080,c-at_max 1080w, ${prod.image}?tr=w-1200,c-at_max 1200w, ${prod.image}?tr=w-1920,c-at_max 1920w, ${prod.image}?tr=w-2048,c-at_max 2048w, ${prod.image}?tr=w-3840,c-at_max 3840w`} 
                                    src={`${prod.image}?tr=w-3840,c-at_max`} 
                                    style={{ position: 'absolute', height: '100%', width: '100%', inset: '0px', objectFit: 'contain', color: 'transparent', zIndex: 1 }} 
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <p className="text-xxs sm:text-xs truncate max-w-[100px] xs:max-w-[100px] text-center" style={{ color: '#7a8084', fontWeight: 100, fontFamily: 'Urbanist, sans-serif' }}>{prod.name}</p>
                                  <p className="text-xxs sm:text-xs font-extrabold text-center" style={{ color: '#fafafa', fontFamily: 'Urbanist, sans-serif' }}>${prod.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      {/* 背面（结果样式，类似产品卡简化） */}
                      <div className="flip-face flip-back" style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', border: backRound[idx] === null ? '2px solid #34383C' : '2px solid #7a8084', borderRadius: '0.5rem', overflow: 'hidden', backgroundColor: backRound[idx] === null ? '#161a1d' : '#1d2125' }}>
                        <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
                          {(() => {
                            const br = backRound[idx];
                            if (br === null) {
                              return (
                                <div className="absolute flex flex-col gap-2 items-center justify-center" style={{ zIndex: 1 }}>
                                  <div className="flex w-10 h-10 md:w-12 md:h-12">
                                    <svg viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: '#474A4D' }}>
                                      <path d="M3.21192 7.42225C1.15968 8.23994 0.158879 10.5665 0.976565 12.6187L12.821 42.346C13.6387 44.3982 15.9652 45.399 18.0174 44.5813L34.739 37.9188C36.7913 37.1012 37.7921 34.7746 36.9744 32.7224L25.13 2.99512C24.3123 0.942884 21.9857 -0.0579184 19.9335 0.759768L3.21192 7.42225Z" fill="currentColor" />
                                      <path d="M35.8047 22.5693L35.7383 6.50156C35.7292 4.29244 33.931 2.50898 31.7219 2.5181L27.822 2.5342L35.8047 22.5693Z" fill="currentColor" />
                                      <path d="M38.0241 27.9748L44.3787 13.2168C45.2524 11.1878 44.3158 8.83469 42.2868 7.96101L38.7048 6.41865L38.0241 27.9748Z" fill="currentColor" />
                                    </svg>
                                  </div>
                                  <p className="font-black text-xs sm:text-sm md:text-lg" style={{ color: '#474A4D', fontFamily: 'Urbanist, sans-serif' }}>PackDraw</p>
                                </div>
                              );
                            }
                            const prod = getRoundProduct(br);
                            const glowIdx = faceGlowIdxBack[idx];
                            const glowHex = (glowIdx !== null && MULTIPLIERS[glowIdx]) ? MULTIPLIERS[glowIdx].glow : '#829DBB';
                            const isWon = cardWonRound[idx] >= 0;
                            const isHovered = isWon && backCardHovered[idx];
                            return (
                              <div 
                                data-component="ProductDisplayCard" 
                                className="relative group transition-colors duration-200 ease-in-out rounded-lg select-none overflow-hidden w-full h-full flex flex-col items-center justify-between gap-2 py-1.5 md:py-2 px-4"
                                style={{ backgroundColor: isHovered ? '#22272b' : '#1d2125' }}
                                onMouseEnter={() => handleCardMouseEnter(idx)}
                                onMouseLeave={() => handleCardMouseLeave(idx)}
                              >
                                <div className="relative flex-1 flex w-full justify-center mt-1" style={{ width: '124px', height: '96px' }}>
                                  <div style={{ 
                                    position: 'absolute', 
                                    top: '50%', 
                                    left: '50%', 
                                    transform: 'translate(-50%, -50%)', 
                                    aspectRatio: '1 / 1', 
                                    transition: 'opacity 200ms', 
                                    height: '70%', 
                                    width: '70%',
                                    borderRadius: '50%', 
                                    filter: 'blur(25px)', 
                                    backgroundColor: glowHex, 
                                    opacity: isHovered ? 0.9 : 0.4
                                  }}></div>
                                  <img 
                                    alt={prod.name} 
                                    loading="lazy" 
                                    decoding="async" 
                                    data-nimg="fill" 
                                    className="pointer-events-none" 
                                    sizes="(min-width: 0px) 100px" 
                                    srcSet={`${prod.image}?tr=w-16,c-at_max 16w, ${prod.image}?tr=w-32,c-at_max 32w, ${prod.image}?tr=w-48,c-at_max 48w, ${prod.image}?tr=w-64,c-at_max 64w, ${prod.image}?tr=w-96,c-at_max 96w, ${prod.image}?tr=w-128,c-at_max 128w, ${prod.image}?tr=w-256,c-at_max 256w, ${prod.image}?tr=w-384,c-at_max 384w, ${prod.image}?tr=w-640,c-at_max 640w, ${prod.image}?tr=w-750,c-at_max 750w, ${prod.image}?tr=w-828,c-at_max 828w, ${prod.image}?tr=w-1080,c-at_max 1080w, ${prod.image}?tr=w-1200,c-at_max 1200w, ${prod.image}?tr=w-1920,c-at_max 1920w, ${prod.image}?tr=w-2048,c-at_max 2048w, ${prod.image}?tr=w-3840,c-at_max 3840w`} 
                                    src={`${prod.image}?tr=w-3840,c-at_max`} 
                                    style={{ position: 'absolute', height: '100%', width: '100%', inset: '0px', objectFit: 'contain', color: 'transparent', zIndex: 1 }} 
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <p className="text-xxs sm:text-xs truncate max-w-[100px] xs:max-w-[100px] text-center" style={{ color: '#7a8084', fontWeight: 100, fontFamily: 'Urbanist, sans-serif' }}>{prod.name}</p>
                                  <p className="text-xxs sm:text-xs font-extrabold text-center" style={{ color: '#fafafa', fontFamily: 'Urbanist, sans-serif' }}>${prod.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 仅作用于 输入金额 - 难度 - 开始按钮 的切换容器 */}
        <div ref={containerRef} className="relative w-full mt-6" style={{ height: (containerH && containerH > 0) ? `${containerH}px` : undefined, overflow: 'hidden', transition: 'height 220ms ease' }}>
          {/* 容器高度动画，避免切换时突兀 */}
          <style>{`.height-transition { transition: height 220ms ease; }`}</style>
          {/* Setup 面板（表单与按钮） */}
          <div ref={setupPanelRef} className={layerReady ? 'absolute inset-0' : ''} style={layerReady ? { transition: 'transform 220ms ease, opacity 220ms ease', transform: showActions ? 'translateY(100%)' : 'translateY(0)', opacity: showActions ? 0 : 1, pointerEvents: showActions ? 'none' : 'auto' } : undefined}>
            <div className="flex flex-col w-full gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-extrabold" style={{ color: '#FFFFFF' }}>输入金额</label>
                <div className="flex gap-2">
                  <div className="flex relative flex-1">
                    <div className="rounded-tl rounded-bl px-4 text-sm font-bold flex items-center" style={{ backgroundColor: '#34383C', color: '#FFFFFF' }}>$</div>
                    <input
                      className="flex h-10 w-full rounded-md px-3 py-2 rounded-tl-none rounded-bl-none font-black text-lg border-0"
                      style={{ backgroundColor: '#22272B', color: '#FFFFFF' }}
                      inputMode="decimal"
                      placeholder="Min: 5 | Max: 50,000"
                      min={5}
                      max={50000}
                      step={0.01}
                      type="text"
                      value={amount}
                      onChange={onAmountChange}
                      onBlur={onAmountBlur}
                    />
                    <div className="flex absolute gap-2 right-2 top-1/2 -translate-y-1/2 h-6">
                      <button
                        className="inline-flex items-center justify-center rounded-md text-sm h-6 px-2 font-bold"
                        style={{ backgroundColor: '#34383C', color: '#FFFFFF', cursor: 'pointer' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3C4044'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
                        onClick={setMin}
                        type="button"
                      >最小</button>
                      <button
                        className="inline-flex items-center justify-center rounded-md text-sm h-6 px-2 font-bold"
                        style={{ backgroundColor: '#34383C', color: '#FFFFFF', cursor: 'pointer' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3C4044'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
                        onClick={setMax}
                        type="button"
                      >最大</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-between">
                <label className="text-sm font-medium" style={{ color: '#FFFFFF' }}>选择难度</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDifficulty('easy')}
                    className="h-7 px-4 text-sm font-bold rounded-md"
                    style={{ backgroundColor: difficulty === 'easy' ? '#34383C' : '#22272B', color: '#FFFFFF', cursor: 'pointer' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3C4044'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = (difficulty === 'easy') ? '#34383C' : '#22272B'; }}
                  >简单</button>
                  <button
                    type="button"
                    onClick={() => setDifficulty('medium')}
                    className="h-7 px-4 text-sm font-bold rounded-md"
                    style={{ backgroundColor: difficulty === 'medium' ? '#34383C' : '#22272B', color: '#FFFFFF', cursor: 'pointer' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3C4044'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = (difficulty === 'medium') ? '#34383C' : '#22272B'; }}
                  >中等</button>
                  <button
                    type="button"
                    onClick={() => setDifficulty('hard')}
                    className="h-7 px-4 text-sm font-bold rounded-md"
                    style={{ backgroundColor: difficulty === 'hard' ? '#34383C' : '#22272B', color: '#FFFFFF', cursor: 'pointer' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3C4044'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = (difficulty === 'hard') ? '#34383C' : '#22272B'; }}
                  >困难</button>
                </div>
              </div>

              <button
                type="button"
                className="h-14 px-8 text-base font-bold rounded-md"
                style={{ backgroundColor: '#48BB78', color: '#FFFFFF', cursor: isFlipping ? 'default' : 'pointer', opacity: isFlipping ? 0.9 : 1 }}
                onClick={startGame}
              >开始游戏 ${formatCurrency(parsedAmount)}</button>
            </div>
          </div>

          {/* Actions 面板（替换组件，仅两个按钮） */}
          <div ref={actionsPanelRef} className={layerReady ? 'absolute inset-0' : 'hidden'} style={layerReady ? { transition: 'transform 220ms ease, opacity 220ms ease', transform: showActions ? 'translateY(0)' : 'translateY(100%)', opacity: showActions ? 1 : 0, pointerEvents: showActions ? 'auto' : 'none' } : undefined}>
            <div className="flex flex-col w-full gap-4" style={{ height: '128px' }}>
              <button
                type="button"
                className="h-14 px-8 text-base font-bold rounded-md"
                style={{ backgroundColor: '#60A5FA', color: '#FFFFFF', cursor: isFlipping ? 'default' : 'pointer', opacity: isFlipping ? 0.9 : 1 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3B82F6'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#60A5FA'; }}
                onClick={() => {
                  // 依次切换选中倍数并翻牌
                  if (isFlipping) return;
                  const newIdx = (activeMultiplierIdx === null) ? 0 : ((activeMultiplierIdx + 1) % MULTIPLIERS.length);
                  setActiveMultiplierIdx(newIdx);
                  flipRound(newIdx);
                }}
                disabled={isFlipping}
              >
                {isFlipping ? (
                  <span className="flex items-center justify-center">
                    <svg className="spin" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                      <path d="M21 12a9 9 0 0 0-9-9" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </span>
                ) : (
                  '抽奖'
                )}
              </button>
              <button type="button" className="h-14 px-8 text-base font-bold rounded-md" style={{ backgroundColor: '#34383C', color: '#FFFFFF', cursor: 'pointer' }}>
                全部领取 ${formatCurrency(calculateTotalPrize())}
              </button>
            </div>
          </div>
        </div>

        {/* 玩法/公平性 - 与表单同一父容器内 */}
        <div className="flex items-center justify-center mt-4" style={{ width: '100%' }}>
          <button
            className="h-11 px-6 text-base font-bold rounded-md"
            style={{ backgroundColor: 'transparent', color: hoverGuide ? '#FFFFFF' : '#7A8084', cursor: 'pointer' }}
            onMouseEnter={() => setHoverGuide(true)}
            onMouseLeave={() => setHoverGuide(false)}
            onClick={() => { setShowGuide(true); }}
          >游戏玩法</button>
          <div className="flex" style={{ width: 1, height: 18, backgroundColor: '#4B5563' }} />
          <button
            className="h-11 px-6 text-base font-bold rounded-md"
            style={{ backgroundColor: 'transparent', color: hoverFair ? '#FFFFFF' : '#7A8084', cursor: 'pointer' }}
            onMouseEnter={() => setHoverFair(true)}
            onMouseLeave={() => setHoverFair(false)}
            onClick={() => { setShowFair(true); }}
          >公平性</button>
        </div>

        {/* 小屏：倍数/生存率/价格 表格 */}
        <div className="flex sm:hidden flex-col w-full gap-2 mt-3">
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'transparent' }}>
            {/* 表头（仅小屏）*/}
            <div className="grid grid-cols-3 gap-0 text-xs font-bold" style={{ color: '#CBD5E0', backgroundColor: '#22272B', fontFamily: 'Urbanist, sans-serif' }}>
              <div className="p-3 text-center" style={{ borderRight: '1px solid #4B5563', fontFamily: 'Urbanist, sans-serif' }}>倍数</div>
              <div className="p-3 text-center" style={{ borderRight: '1px solid #4B5563', fontFamily: 'Urbanist, sans-serif' }}>生存率</div>
              <div className="p-3 text-center" style={{ fontFamily: 'Urbanist, sans-serif' }}>产品价格</div>
            </div>
            {/* 数据行 */}
            <div className="flex flex-col">
              {[
                { m: 'x1', s: '100.0%', p: '$0.55', y: false },
                { m: 'x1.3', s: '73.1%', p: '$0.72', y: false },
                { m: 'x1.7', s: '74.2%', p: '$0.94', y: false },
                { m: 'x2.5', s: '66.0%', p: '$1.38', y: false },
                { m: 'x4', s: '60.6%', p: '$2.22', y: false },
                { m: 'x6.5', s: '59.7%', p: '$3.61', y: false },
                { m: 'x10', s: '63.0%', p: '$5.55', y: false },
                { m: 'x20', s: '48.5%', p: '$11.11', y: false },
                { m: 'x50', s: '38.8%', p: '$27.77', y: false },
                { m: 'x150', s: '32.3%', p: '$83.33', y: true },
              ].map((row, idx, arr) => (
                <div
                  key={row.m}
                  className="grid grid-cols-3 gap-0 text-sm"
                  style={{
                    borderBottom: idx === arr.length - 1 ? '0 none' : '1px solid #374151',
                    backgroundColor: row.y ? '#2A2521' : '#1D2125',
                  }}
                >
                  <div className="p-3 text-center font-bold" style={{ color: row.y ? '#D69E2E' : '#7A8084', borderRight: '1px solid #4B5563', fontFamily: 'Urbanist, sans-serif' }}>{row.m}</div>
                  <div className="p-3 text-center font-bold" style={{ color: row.y ? '#D69E2E' : '#7A8084', borderRight: '1px solid #4B5563', fontFamily: 'Urbanist, sans-serif' }}>{row.s}</div>
                  <div className="p-3 text-center font-bold" style={{ color: row.y ? '#D69E2E' : '#7A8084', fontFamily: 'Urbanist, sans-serif' }}>{row.p}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 游戏玩法弹窗（小屏不弹）*/}
        {showGuide && (
          <div
            className="fixed inset-0 z-50 px-4 flex justify-center items-start py-16 custom-scroll"
            style={{ backgroundColor: 'rgba(0,0,0,0.48)', animation: 'modalFadeIn 180ms ease' }}
            onClick={() => setShowGuide(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="grid w-full relative rounded-lg shadow-lg max-w-2xl"
              style={{ backgroundColor: '#161A1D', animation: 'modalZoomIn 180ms ease' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-1.5 text-center sm:text-left p-6" style={{ borderBottom: '1px solid #374151' }}>
                <h2 className="text-xl font-bold leading-none tracking-tight text-left" style={{ color: '#FFFFFF' }}>游戏玩法</h2>
              </div>
              <ul className="flex flex-col gap-6 px-8 py-10 font-bold" style={{ color: '#7A8084' }}>
                <li className="flex gap-2">
                  <div className="flex size-2 rounded-full" style={{ backgroundColor: '#FFFFFF', marginTop: '0.5rem' }} />
                  <span className="text-base">点击开始游戏，以 x1 倍数显示 9 张产品卡片（每张卡片 = 1/9）</span>
                </li>
                <li className="flex gap-2">
                  <div className="flex size-2 rounded-full" style={{ backgroundColor: '#FFFFFF', marginTop: '0.5rem' }} />
                  <span className="text-base">点击抽奖，尝试将所有卡片单独升级到下一个倍数（x2、x5 等）</span>
                </li>
                <li className="flex gap-2">
                  <div className="flex size-2 rounded-full" style={{ backgroundColor: '#FFFFFF', marginTop: '0.5rem' }} />
                  <span className="text-base">失败的卡片变成灰色</span>
                </li>
                <li className="flex gap-2">
                  <div className="flex size-2 rounded-full" style={{ backgroundColor: '#FFFFFF', marginTop: '0.5rem' }} />
                  <span className="text-base">成功的卡片显示新产品 — 点击任意卡片领取，或继续抽奖以获得更高倍数</span>
                </li>
                <li className="flex gap-2">
                  <div className="flex size-2 rounded-full" style={{ backgroundColor: '#FFFFFF', marginTop: '0.5rem' }} />
                  <span className="text-base">最大累积获胜金额限制为 ${formatCurrency(350000)}</span>
                </li>
              </ul>
              <button
                type="button"
                className="absolute w-8 h-8 flex items-center justify-center rounded-lg"
                style={{ right: '1.25rem', top: '18px', color: '#9CA3AF' }}
                onClick={() => setShowGuide(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
                <span className="sr-only">Close</span>
              </button>
            </div>
          </div>
        )}

        {/* 公平性弹窗（小屏不弹）*/}
        {showFair && (
          <div
            className="fixed inset-0 z-50 px-4 flex justify-center items-start py-16 custom-scroll"
            style={{ backgroundColor: 'rgba(0,0,0,0.48)', animation: 'modalFadeIn 180ms ease' }}
            onClick={() => setShowFair(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="grid w-full relative rounded-lg shadow-lg max-w-2xl"
              style={{ backgroundColor: '#161A1D', animation: 'modalZoomIn 180ms ease' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex text-center sm:text-left flex-row gap-2 p-6" style={{ borderBottom: '1px solid #2C2C2C' }}>
                <div className="size-5" style={{ color: '#FFFFFF' }}>
                  <svg viewBox="0 0 21 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.09 21.7011C9.67369 21.7026 9.26162 21.6175 8.88 21.4511C6.24748 20.2911 4.00763 18.3929 2.43161 15.9863C0.855588 13.5797 0.0109702 10.7678 0 7.89107V5.34107C0.00183285 4.70595 0.205185 4.0878 0.580773 3.57564C0.95636 3.06347 1.4848 2.68372 2.09 2.49107L9.18 0.15107C9.79048 -0.0503568 10.4495 -0.0503568 11.06 0.15107L18.09 2.49107C18.6896 2.68891 19.2115 3.07088 19.5814 3.58259C19.9512 4.09431 20.1502 4.70968 20.15 5.34107V7.89107C20.1487 10.7763 19.3086 13.599 17.732 16.0154C16.1554 18.4318 13.9103 20.3377 11.27 21.5011C10.8941 21.6463 10.4928 21.7143 10.09 21.7011ZM2.69 4.39107C2.48115 4.45888 2.30043 4.59354 2.17572 4.77427C2.05102 4.955 1.98927 5.17175 2 5.39107V7.89107C2.01123 10.3803 2.74352 12.8129 4.10828 14.8946C5.47304 16.9764 7.4118 18.6181 9.69 19.6211C9.81617 19.6761 9.95234 19.7046 10.09 19.7046C10.2277 19.7046 10.3638 19.6761 10.49 19.6211C12.7682 18.6181 14.707 16.9764 16.0717 14.8946C17.4365 12.8129 18.1688 10.3803 18.18 7.89107V5.34107C18.1907 5.12175 18.129 4.905 18.0043 4.72427C17.8796 4.54354 17.6988 4.40888 17.49 4.34107L10.4 2.05107C10.1993 1.98095 9.98072 1.98095 9.78 2.05107L2.69 4.39107Z" fill="currentColor"></path>
                    <path d="M17.81 3.44111L10.72 1.10111C10.3117 0.960924 9.8683 0.960924 9.46 1.10111L2.37 3.44111C1.97089 3.57358 1.62369 3.82847 1.37774 4.16956C1.13179 4.51066 0.999619 4.9206 1 5.34111V7.89111C1.00003 10.5829 1.78277 13.2166 3.25287 15.4715C4.72298 17.7263 6.81703 19.5051 9.28 20.5911C9.53616 20.7 9.81165 20.7562 10.09 20.7562C10.3684 20.7562 10.6438 20.7 10.9 20.5911C13.363 19.5051 15.457 17.7263 16.9271 15.4715C18.3972 13.2166 19.18 10.5829 19.18 7.89111V5.34111C19.1804 4.9206 19.0482 4.51066 18.8023 4.16956C18.5563 3.82847 18.2091 3.57358 17.81 3.44111ZM14.09 9.39111L11.26 12.2211C11.0743 12.4071 10.8537 12.5546 10.6109 12.6552C10.3681 12.7559 10.1078 12.8077 9.845 12.8077C9.58217 12.8077 9.32192 12.7559 9.07912 12.6552C8.83632 12.5546 8.61575 12.4071 8.43 12.2211L7.09 10.8011C6.90375 10.6138 6.79921 10.3603 6.79921 10.0961C6.79921 9.83193 6.90375 9.57848 7.09 9.39111C7.18296 9.29739 7.29356 9.22299 7.41542 9.17222C7.53728 9.12145 7.66799 9.09532 7.8 9.09532C7.93201 9.09532 8.06272 9.12145 8.18458 9.17222C8.30644 9.22299 8.41704 9.29739 8.51 9.39111L9.92 10.8011L12.75 7.98111C12.843 7.88739 12.9536 7.81299 13.0754 7.76222C13.1973 7.71146 13.328 7.68532 13.46 7.68532C13.592 7.68532 13.7227 7.71146 13.8446 7.76222C13.9664 7.81299 14.077 7.88739 14.17 7.98111C14.346 8.17886 14.4365 8.43834 14.4215 8.70265C14.4065 8.96697 14.2873 9.21455 14.09 9.39111Z" fill="currentColor"></path>
                  </svg>
                </div>
                <h2 className="text-xl font-bold leading-none tracking-tight text-left" style={{ color: '#FFFFFF' }}>游戏公平性</h2>
              </div>
              <div className="space-y-4 p-6">
                <div className="p-4 rounded-lg shadow-lg relative" style={{ backgroundColor: '#22272B' }}>
                 
                  <div className="w-full grid grid-cols-4 gap-4 overflow-x-scroll pb-4 custom-scroll">
                    <p className="text-sm col-span-1 font-medium" style={{ color: '#7A8084' }}>服务器种子哈希</p>
                    <div className="col-span-3">
                      {fairServerHash ? (
                        <div className="h-6 w-full flex items-center" style={{ backgroundColor: 'transparent', color: '#CBD5E0' }}>{fairServerHash}</div>
                      ) : (
                        <div className="rounded-md h-6 w-full" style={{ backgroundColor: '#374151' }}></div>
                      )}
                    </div>
                    <p className="text-sm col-span-1 font-medium" style={{ color: '#7A8084' }}>客户端种子</p>
                    <div className="col-span-3">
                      {fairClientSeed ? (
                        <div className="h-6 w-full flex items-center" style={{ backgroundColor: 'transparent', color: '#CBD5E0' }}>{fairClientSeed}</div>
                      ) : (
                        <div className="rounded-md h-6 w-full" style={{ backgroundColor: '#374151' }}></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="absolute w-8 h-8 flex items-center justify-center rounded-lg"
                style={{ right: '1.25rem', top: '18px', color: '#9CA3AF' }}
                onClick={() => setShowFair(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
                <span className="sr-only">Close</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


