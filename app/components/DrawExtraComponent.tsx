'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ApiResponse } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { AnimatePresence, motion } from 'framer-motion';
import { LogoIcon } from './icons/Logo';
import LoadingSpinnerIcon from './icons/LoadingSpinner';
import { showGlobalToast } from './ToastProvider';
import { useI18n } from './I18nProvider';

const isSiteMuted = () => {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).__siteMuted);
};

type Difficulty = 'easy' | 'medium' | 'hard';

type MultiplierConfig = { label: string; glow: string };
type RoundConfig = { label: string; survival: number };
type DifficultyConfig = { multipliers: MultiplierConfig[]; rounds: RoundConfig[]; prices: number[] };

const COLOR_PALETTE = ['#829DBB', '#4B69FF', '#4B69FF', '#8847FF', '#8847FF', '#D32CE6', '#D32CE6', '#EB4B4B', '#EB4B4B', '#E4AE33'];
const DEFAULT_MULTIPLIER_VALUES = ['1', '1.3', '1.7', '2.5', '4', '6.5', '10', '20', '50', '150'];
const DEFAULT_SURVIVAL_VALUES = ['100', '73.1', '74.2', '66', '60.6', '59.7', '63', '48.5', '38.8', '32.3'];
const DEFAULT_ROUND_PRICES = [0.55, 0.72, 0.94, 1.38, 2.22, 3.61, 5.55, 11.11, 27.77, 83.33];

const buildDifficultyConfig = (multipliersRaw: string[], survivalRaw: string[]): DifficultyConfig => {
  const normalizedMultipliers = multipliersRaw.length ? multipliersRaw : DEFAULT_MULTIPLIER_VALUES;
  const normalizedSurvival = survivalRaw.length ? survivalRaw : DEFAULT_SURVIVAL_VALUES;

  const multipliers: MultiplierConfig[] = normalizedMultipliers.map((value, idx) => ({
    label: `x${value}`,
    glow: COLOR_PALETTE[idx] || COLOR_PALETTE[COLOR_PALETTE.length - 1],
  }));

  const rounds: RoundConfig[] = normalizedMultipliers.map((value, idx) => {
    const survivalValue = Number(normalizedSurvival[idx] ?? normalizedSurvival[normalizedSurvival.length - 1] ?? 0);
    const normalized = Number.isFinite(survivalValue) ? Math.max(0, Math.min(1, survivalValue / 100)) : 0;
    return { label: `x${value}`, survival: normalized };
  });

  const prices = normalizedMultipliers.map((_, idx) => {
    const price = DEFAULT_ROUND_PRICES[idx] ?? DEFAULT_ROUND_PRICES[DEFAULT_ROUND_PRICES.length - 1];
    return price;
  });

  return { multipliers, rounds, prices };
};

type CardServerPayload = {
  id: number | string;
  num: number;
  price: string | number;
  round: number;
  status: number;
  cover?: string;
  name?: string;
  awards?: {
    cover?: string;
    name?: string;
    bean?: string | number;
  };
};

type DisplayProduct = {
  id?: string | number;
  name: string;
  image: string;
  price: number;
  qualityId?: string;
};

const PLACEHOLDER_PRODUCT: DisplayProduct = {
  name: '占位',
  image: '',
  price: 0,
};

type DrawGoResponse = {
  id?: string | number;
  card?: CardServerPayload[];
};

// 统一从卡片服务端数据提取展示信息，优先使用 awards.cover / awards.name
const mapCardToDisplay = (card: CardServerPayload): DisplayProduct => {
  const award = (card as any)?.awards || {};
  const image = award.cover || card.cover || '';
  const name = award.name || card.name || '--';
  const price = Number(card.price ?? award.bean ?? 0) || 0;
  return {
    id: card.id,
    name,
    image,
    price,
  };
};

function formatCurrency(num: number) {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function DrawExtraComponent() {
  const { isAuthenticated, user, fetchUserBean } = useAuth();
  const isAuthed = isAuthenticated;
  const { t } = useI18n();
  const userAvatar = useMemo(() => {
    const raw = (user as any)?.userInfo?.avatar || (user as any)?.avatar;
    if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw.trim();
    }
    return null;
  }, [user]);
  const queryClient = useQueryClient();
  const { data: drawConfigResponse } = useQuery({
    queryKey: ['draw-config'],
    queryFn: api.getDrawConfig,
  });
  const { data: drawInfoResponse, refetch: refetchDrawInfo } = useQuery({
    queryKey: ['draw-info'],
    queryFn: api.drawInfo,
    enabled: isAuthed,
    staleTime: 0,
  });
  const difficultyConfig = useMemo(() => {
    const payload = drawConfigResponse?.data;
    const normalizeList = (value?: unknown): string[] | undefined => {
      if (Array.isArray(value)) return value.map(String);
      if (typeof value === 'string' && value.trim().length) {
        return value.split('|').map((item) => item.trim()).filter(Boolean);
      }
      return undefined;
    };

    const pickValues = (value?: unknown, fallback?: string[]): string[] => {
      return normalizeList(value) ?? fallback ?? DEFAULT_MULTIPLIER_VALUES;
    };

    if (!payload) {
      return {
        easy: buildDifficultyConfig(DEFAULT_MULTIPLIER_VALUES, DEFAULT_SURVIVAL_VALUES),
        medium: buildDifficultyConfig(DEFAULT_MULTIPLIER_VALUES, DEFAULT_SURVIVAL_VALUES),
        hard: buildDifficultyConfig(DEFAULT_MULTIPLIER_VALUES, DEFAULT_SURVIVAL_VALUES),
      };
    }

    const easyMultipliers = pickValues(payload.simple_multiple_list ?? payload.simple_multiple, DEFAULT_MULTIPLIER_VALUES);
    const easySurvival = pickValues(payload.simple_real_list ?? payload.simple_list, DEFAULT_SURVIVAL_VALUES);

    const mediumMultipliers = pickValues(payload.medium_multiple_list ?? payload.medium_multiple, DEFAULT_MULTIPLIER_VALUES);
    const mediumSurvival = pickValues(payload.medium_list, DEFAULT_SURVIVAL_VALUES);

    const hardMultipliers = pickValues(payload.difficulties_multiple_list ?? payload.difficulties_multiple, DEFAULT_MULTIPLIER_VALUES);
    const hardSurvival = pickValues(payload.difficulties_list, DEFAULT_SURVIVAL_VALUES);

    return {
      easy: buildDifficultyConfig(easyMultipliers, easySurvival),
      medium: buildDifficultyConfig(mediumMultipliers, mediumSurvival),
      hard: buildDifficultyConfig(hardMultipliers, hardSurvival),
    };
  }, [drawConfigResponse]);
 
  useEffect(() => {
    if (isAuthed) {
      refetchDrawInfo().catch(() => {});
    }
  }, [isAuthed, refetchDrawInfo]);
 

  // 🎵 音频初始化
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const initAudio = async () => {
      try {
        const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        if (!(window as any).__audioContext) {
          (window as any).__audioContext = new AudioContext();
        }
        const ctx = (window as any).__audioContext;

        // 加载 flip.mp3
        if (!(window as any).__flipAudioBuffer) {
          const flipRes = await fetch('/flip.mp3');
          const flipArrayBuffer = await flipRes.arrayBuffer();
          (window as any).__flipAudioBuffer = await ctx.decodeAudioData(flipArrayBuffer);
        }

        // 加载 claim.mp3
        if (!(window as any).__claimAudioBuffer) {
          const claimRes = await fetch('/claim.mp3');
          const claimArrayBuffer = await claimRes.arrayBuffer();
          (window as any).__claimAudioBuffer = await ctx.decodeAudioData(claimArrayBuffer);
        }
      } catch (err) {
        // 音频加载失败不影响游戏
      }
    };

    initAudio();
  }, []);

  // 🎵 播放翻牌音效
  const playFlipSound = () => {
    if (typeof window === 'undefined') return;
    if (isSiteMuted()) return;
    try {
      const ctx = (window as any).__audioContext;
      const buffer = (window as any).__flipAudioBuffer;
      if (ctx && buffer) {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }
    } catch (err) {
      // 忽略音频播放错误
    }
  };

  // 🎵 播放选择商品音效
  const playClaimSound = () => {
    if (typeof window === 'undefined') return;
    if (isSiteMuted()) return;
    try {
      const ctx = (window as any).__audioContext;
      const buffer = (window as any).__claimAudioBuffer;
      if (ctx && buffer) {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }
    } catch (err) {
      // 忽略音频播放错误
    }
  };
  type CollectOverlayItem = { name: string; image: string; price: number };
  type CollectMutationVariables = {
    id: string;
    cardId?: string | number;
    overlayItems?: CollectOverlayItem[];
    mode: 'single' | 'all';
  };
  const collectMutation = useMutation({
    mutationFn: async ({ id, cardId }: CollectMutationVariables) => {
      return api.drawReceive({ id, card_id: cardId });
    },
    onSuccess: async (_data: ApiResponse, variables: CollectMutationVariables) => {
      await queryClient.invalidateQueries({ queryKey: ['warehouse'] });
      // 每次领取后同步刷新购物车/仓库（Navbar 数量、CartModal 等依赖 useCart 的地方）
      await queryClient.invalidateQueries({ queryKey: ['userStorage'] });
      await queryClient.invalidateQueries({ queryKey: ['draw-info'] });
      if (variables.mode === 'all' && variables.overlayItems && variables.overlayItems.length) {
        openCollectOverlay(variables.overlayItems);
      }
    },
    onError: (error: unknown) => {
      showGlobalToast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('retryLater'),
        variant: 'error',
      });
    },
  });
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [hoverCycleStep, setHoverCycleStep] = useState<number>(0); // 行索引
  const hoverTimerRef = useRef<number | null>(null);
  const [hoverCycleNoTransition, setHoverCycleNoTransition] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>('5.00');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [activeBet, setActiveBet] = useState<{ type: string; money: string } | null>(null);
  const [drawSessionId, setDrawSessionId] = useState<string | null>(null);
  // 服务器同步的卡片状态：1=未领取/可翻牌，2=已领取，3=初始/未中奖
  const [cardServerStatus, setCardServerStatus] = useState<number[]>(Array(9).fill(0));
  const currentDifficultyData = difficultyConfig[difficulty] ?? difficultyConfig.easy;
  const currentMultipliers = currentDifficultyData.multipliers;
  const currentRounds = currentDifficultyData.rounds;
  const currentPrices = currentDifficultyData.prices;
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
  // 顶部倍数栏滚动
  const topBarRef = useRef<HTMLDivElement | null>(null);
  const multiplierItemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const assignMultiplierRef = (index: number) => (el: HTMLDivElement | null) => {
    multiplierItemRefs.current[index] = el;
  };
  // 每张卡片是否展示背面（奖品）以及达到的轮次（-1 表示初始样式）
  const [cardBack, setCardBack] = useState<boolean[]>(Array(9).fill(false));
  const [cardWonRound, setCardWonRound] = useState<number[]>(Array(9).fill(-1));
  const [frontRound, setFrontRound] = useState<(number | null)[]>(Array(9).fill(null));
  const [backRound, setBackRound] = useState<(number | null)[]>(Array(9).fill(null));
  // 每一面对应的高亮颜色索引（与倍数颜色绑定），仅在该面内容设置时记录，翻到该面时才生效
  const [faceGlowIdxFront, setFaceGlowIdxFront] = useState<(number | null)[]>(Array(9).fill(null));
  const [faceGlowIdxBack, setFaceGlowIdxBack] = useState<(number | null)[]>(Array(9).fill(null));
  // 选择的中奖卡（锁定，不再参与后续抽奖）；是否允许选择（首轮不允许选）
  const [selectedLocked, setSelectedLocked] = useState<boolean[]>(Array(9).fill(false));
  const [canSelect, setCanSelect] = useState<boolean>(false);
  // "全选自动弹出展示层"的一次性开关，避免关闭后立刻再次打开
  const [overlayArm, setOverlayArm] = useState<boolean>(false);

  // 复位到初始时关闭翻牌过渡，避免出现"多翻一次"的视觉
  const [suppressFlipTransition, setSuppressFlipTransition] = useState<boolean>(false);
  // 每张背面卡片的hover状态
  const [backCardHovered, setBackCardHovered] = useState<boolean[]>(Array(9).fill(false));
  const [serverCardMap, setServerCardMap] = useState<Record<number, DisplayProduct>>({});
  // 领取成功展示层（显示 3 秒自动关闭）
  const [collectOverlayOpen, setCollectOverlayOpen] = useState<boolean>(false);
  const [collectOverlayItems, setCollectOverlayItems] = useState<Array<{ name: string; image: string; price: number }>>([]);
  const collectOverlayTimerRef = useRef<number | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const openCollectOverlay = useCallback((items: Array<{ name: string; image: string; price: number }>) => {
    if (!items || !items.length) return;
    setCollectOverlayItems(items);
    setOverlayArm(false);
    setCollectOverlayOpen(true);
    setRevealedCount(0);
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
    const stepMs = 380;
    const startAfter = 180;
    let i = 0;
    const run = () => {
      i += 1;
      setRevealedCount(i);
      if (i < items.length) {
        revealTimerRef.current = window.setTimeout(run, stepMs);
      } else {
        revealTimerRef.current = null;
      }
    };
    revealTimerRef.current = window.setTimeout(run, startAfter);
    if (collectOverlayTimerRef.current) {
      window.clearTimeout(collectOverlayTimerRef.current);
      collectOverlayTimerRef.current = null;
    }
    const closeDelay = Math.max(3000, 1200 + items.length * stepMs + 600);
    collectOverlayTimerRef.current = window.setTimeout(() => {
      setCollectOverlayOpen(false);
      setOverlayArm(false);
      setShowActions(false);
      collectOverlayTimerRef.current = null;
    }, closeDelay);
    playClaimSound();
  }, [setCollectOverlayItems, setOverlayArm, setCollectOverlayOpen, setRevealedCount, setShowActions, playClaimSound]);
  const lockCardAtIndex = (idx: number, visibleRound: number, glowIdx: number | null) => {
    setSelectedLocked((prev) => {
      if (prev[idx]) return prev;
      const next = prev.slice();
      next[idx] = true;
      return next;
    });
    setFrontRound((prev) => {
      const next = prev.slice();
      next[idx] = visibleRound;
      return next;
    });
    setBackRound((prev) => {
      const next = prev.slice();
      next[idx] = visibleRound;
      return next;
    });
    setFaceGlowIdxFront((prev) => {
      const next = prev.slice();
      next[idx] = glowIdx ?? null;
      return next;
    });
    setFaceGlowIdxBack((prev) => {
      const next = prev.slice();
      next[idx] = glowIdx ?? null;
      return next;
    });
    setCardBack((prev) => {
      const next = prev.slice();
      next[idx] = !next[idx];
      return next;
    });
    setBackCardHovered((prev) => {
      if (!prev[idx]) return prev;
      const next = prev.slice();
      next[idx] = false;
      return next;
    });
  };
  // 每一面的锁定样式覆盖：true=强制选中样式，false=强制未选中样式，null=按 selectedLocked
  const [faceLockOverrideFront, setFaceLockOverrideFront] = useState<(boolean | null)[]>(Array(9).fill(null));
  const [faceLockOverrideBack, setFaceLockOverrideBack] = useState<(boolean | null)[]>(Array(9).fill(null));

  function hexToRgba(hex: string, alpha: number) {
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  const activeGlowColor = useMemo(() => {
    return (activeMultiplierIdx !== null && currentMultipliers[activeMultiplierIdx])
      ? currentMultipliers[activeMultiplierIdx].glow
      : null;
  }, [activeMultiplierIdx, currentMultipliers]);
  const cardGlowHigh = useMemo(() => activeGlowColor ? hexToRgba(activeGlowColor, 0.45) : 'rgba(71,74,77,0.22)', [activeGlowColor]);
  const cardGlowLow = useMemo(() => activeGlowColor ? hexToRgba(activeGlowColor, 0.16) : 'rgba(71,74,77,0.08)', [activeGlowColor]);
  const cardGlowStrong = useMemo(() => activeGlowColor ? hexToRgba(activeGlowColor, 0.9) : 'rgba(71,74,77,0.5)', [activeGlowColor]);
  const imageDropShadow = useMemo(() => activeGlowColor
    ? `drop-shadow(0 0 10px ${hexToRgba(activeGlowColor, 0.6)}) drop-shadow(0 0 4px ${hexToRgba(activeGlowColor, 0.35)})`
    : 'drop-shadow(0 0 10px rgba(71,74,77,0.4))'
  , [activeGlowColor]);

  // 当激活倍数改变时，将其滚动到倍数栏的左侧起始位置
  useEffect(() => {
    if (activeMultiplierIdx === null) return;
    const scroller = topBarRef.current;
    const el = multiplierItemRefs.current[activeMultiplierIdx];
    if (!scroller || !el) return;
    const left = el.offsetLeft;
    scroller.scrollTo({ left, behavior: 'smooth' });
  }, [activeMultiplierIdx]);

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
  }, [hoverIdx, currentMultipliers]);

  // 当滚动到最后一行（重复倍数）后，等待过渡完成，瞬间无过渡回到第 1 行（生存率），形成无缝循环
  useEffect(() => {
    const rowsLen = currentMultipliers.length * 3 + 1;
    if (hoverIdx !== null && hoverCycleStep >= rowsLen) {
      const t = window.setTimeout(() => {
        setHoverCycleNoTransition(true);
        setHoverCycleStep(1); // 回到生存率，衔接下一轮
        window.setTimeout(() => setHoverCycleNoTransition(false), 0);
      }, 400); // 对应过渡时间 400ms
      return () => window.clearTimeout(t);
    }
  }, [hoverCycleStep, hoverIdx, currentMultipliers]);

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

  useEffect(() => {
    return () => {
      if (collectOverlayTimerRef.current) {
        window.clearTimeout(collectOverlayTimerRef.current);
        collectOverlayTimerRef.current = null;
      }
    };
  }, []);

  // 展示层开启时锁定页面滚动
  useEffect(() => {
    if (collectOverlayOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [collectOverlayOpen]);

  // canSelect 打开时允许自动弹出；关闭时解除"武装"
  useEffect(() => {
    setOverlayArm(!!canSelect);
  }, [canSelect]);

  // 全选（所有存活中奖卡都锁定）后自动弹出展示层（仅当 overlayArm 为 true 时）
  useEffect(() => {
    if (!canSelect || collectOverlayOpen || !overlayArm) return;
    let hasAlive = false;
    for (let i = 0; i < 9; i++) {
      if (cardWonRound[i] >= 0) { hasAlive = true; break; }
    }
    if (!hasAlive) return;
    const allSelected = Array.from({ length: 9 }).every((_, i) => {
      if (cardWonRound[i] >= 0) return selectedLocked[i] === true;
      return true;
    });
    if (allSelected) {
      const items: Array<{ name: string; image: string; price: number }> = [];
      for (let i = 0; i < 9; i++) {
        if (cardWonRound[i] >= 0) {
          const currentRound = cardBack[i] ? backRound[i] : frontRound[i];
          if (currentRound !== null) {
                    const prod = getDisplayProduct(currentRound, i) as any;
            items.push({ name: String(prod?.name ?? ''), image: String(prod?.image ?? ''), price: Number(prod?.price ?? 0) });
          }
        }
      }
      setCollectOverlayItems(items);
      setOverlayArm(false);
      setCollectOverlayOpen(true);
    }
  }, [canSelect, selectedLocked, cardWonRound, cardBack, frontRound, backRound, collectOverlayOpen, overlayArm]);

  // 展示层动画 variants（Framer Motion）
  const overlayContainerVariants = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.05 },
    },
    exit: { opacity: 1 },
  };
  const crownVariants = {
    hidden: { y: -24, scale: 0.85, opacity: 0 },
    show: { y: 0, scale: 1, opacity: 1, transition: { stiffness: 320, damping: 22 } },
    exit: { y: -12, opacity: 0, transition: { duration: 0.2 } },
  };
  const titleVariants = {
    hidden: { y: -10, scale: 0.96, opacity: 0 },
    show: { y: 0, scale: 1, opacity: 1, transition: { stiffness: 300, damping: 24 } },
    exit: { y: -6, opacity: 0, transition: { duration: 0.2 } },
  };
  const listWrapperVariants = {
    hidden: { opacity: 0, y: -6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.18 } },
    exit: { opacity: 0, y: -4, transition: { duration: 0.18 } },
  };
  const listVariants = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: { when: 'beforeChildren', staggerChildren: 0.08, delayChildren: 0.08 },
    },
    exit: { opacity: 1 },
  };
  const cardVariants = {
    hidden: { y: -14, scale: 0.9, opacity: 0 },
    show: { y: 0, scale: 1, opacity: 1, transition: { stiffness: 420, damping: 26 } },
    exit: { y: -8, scale: 0.98, opacity: 0, transition: { duration: 0.18 } },
  };
  const xpVariants = {
    hidden: { y: -8, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { stiffness: 280, damping: 24 } },
    exit: { y: -6, opacity: 0, transition: { duration: 0.18 } },
  };
  const buttonVariants = {
    hidden: { y: -6, scale: 0.96, opacity: 0 },
    show: { y: 0, scale: 1, opacity: 1, transition: { stiffness: 280, damping: 22 } },
    exit: { y: -4, opacity: 0, transition: { duration: 0.18 } },
  };

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
          const product = getDisplayProduct(currentRound, i);
          total += product.price;
        }
      }
    }
    return total;
  };

  // 处理卡片hover的通用函数
  const handleCardMouseEnter = (idx: number) => {
    if (cardWonRound[idx] >= 0 && !selectedLocked[idx]) {
      const newHovered = [...backCardHovered];
      newHovered[idx] = true;
      setBackCardHovered(newHovered);
    }
  };

  const handleCardMouseLeave = (idx: number) => {
    // 无条件清理 hover，避免翻面/锁定等状态切换时残留高亮
    const newHovered = [...backCardHovered];
    newHovered[idx] = false;
    setBackCardHovered(newHovered);
  };

  // 点击锁定当前显示为商品的一张卡：再翻一次（来回翻），并移除高亮与 hover 行为
  const handleLockWinningCard = (idx: number) => {
    if (!canSelect || selectedLocked[idx] || collectMutation.isPending) return;
    const visibleRound = cardBack[idx] ? backRound[idx] : frontRound[idx];
    if (visibleRound === null) return;
    if (!drawSessionId) {
      showGlobalToast({
        title: t('error'),
        description: t('drawSessionMissing'),
        variant: 'error',
      });
      return;
    }
    const cardData = serverCardMap[idx];
    if (!cardData || cardData.id === undefined || cardData.id === null) {
      showGlobalToast({
        title: t('error'),
        description: t('retryLater'),
        variant: 'error',
      });
      return;
    }
    const visibleGlowIdx = cardBack[idx] ? faceGlowIdxBack[idx] : faceGlowIdxFront[idx];
    const overlayItems: CollectOverlayItem[] = [
      {
        name: String(cardData.name ?? ''),
        image: String(cardData.image ?? ''),
        price: Number(cardData.price ?? 0),
      },
    ];
    const finalize = () => {
      lockCardAtIndex(idx, visibleRound, visibleGlowIdx ?? null);
      playClaimSound();
    };
    collectMutation.mutate(
      { id: drawSessionId, cardId: cardData.id, overlayItems, mode: 'single' },
      {
        onSuccess: () => {
          finalize();
          setCardServerStatus((prev) => {
            const next = prev.slice();
            next[idx] = 2;
            return next;
          });
        },
      },
    );
  };

  const difficultyTypeMap: Record<Difficulty, string> = {
    easy: '1',
    medium: '2',
    hard: '3',
  };
  const getDisplayProduct = (_roundIdx: number | null, cardIdx: number): DisplayProduct => {
    if (cardServerStatus[cardIdx] === 3) {
      return PLACEHOLDER_PRODUCT;
    }
    if (serverCardMap[cardIdx]) {
      return serverCardMap[cardIdx];
    }
    return PLACEHOLDER_PRODUCT;
  };

  const resetGameState = React.useCallback(() => {
    setShowActions(false);
    setHasFlipped(false);
    setIsFlipping(false);
    setRoundIndex(0);
    setActiveMultiplierIdx(null);
    setCardBack(Array(9).fill(false));
    setCardWonRound(Array(9).fill(-1));
    setFrontRound(Array(9).fill(null));
    setBackRound(Array(9).fill(null));
    setFaceGlowIdxFront(Array(9).fill(null));
    setFaceGlowIdxBack(Array(9).fill(null));
    setSelectedLocked(Array(9).fill(false));
    setFaceLockOverrideFront(Array(9).fill(null));
    setFaceLockOverrideBack(Array(9).fill(null));
    setCanSelect(false);
    setOverlayArm(false);
    setBackCardHovered(Array(9).fill(false));
    setServerCardMap({});
    setActiveBet(null);
    setDrawSessionId(null);
    setCardServerStatus(Array(9).fill(0));
  }, []);

  const hasRefreshedBalanceRef = useRef(false);
  const drawStartMutation = useMutation({
    mutationFn: async (payload: { type: string; money: string }) => {
      return api.drawGo(payload);
    },
    onSuccess: async (response: ApiResponse<DrawGoResponse>) => {
      if (response?.code === 100000 && Array.isArray(response.data?.card)) {
        if (!hasRefreshedBalanceRef.current) {
          hasRefreshedBalanceRef.current = true;
          fetchUserBean?.().catch(() => {});
        }
        if (response.data?.id !== undefined && response.data.id !== null) {
          setDrawSessionId(String(response.data.id));
        }
        const map: Record<number, DisplayProduct> = {};
        const statusArr = Array(9).fill(0);
        response.data.card.forEach((card: CardServerPayload) => {
          const idx = Math.min(8, Math.max(0, Number(card.num ?? 0) - 1));
          map[idx] = mapCardToDisplay(card);
          statusArr[idx] = Number(card.status) || 1;
        });
        setServerCardMap(map);
        setCardServerStatus(statusArr);
        runGameSequence();
      } else {
        throw new Error(response?.message || t('drawFailed'));
      }
    },
  });
  const drawRoundMutation = useMutation({
    mutationFn: async (variables: { payload: { type: string; money: string }; multiplierIdx: number }) => {
      const response = await api.drawGo(variables.payload);
      if (!response || response.code !== 100000) {
        throw new Error(response?.message || t('drawFailed'));
      }
      return { response, multiplierIdx: variables.multiplierIdx };
    },
    onSuccess: ({ response, multiplierIdx }: { response: ApiResponse<DrawGoResponse>; multiplierIdx: number }) => {
      if (response.data?.id !== undefined && response.data.id !== null) {
        setDrawSessionId(String(response.data.id));
      }
      if (Array.isArray(response.data?.card)) {
        const map: Record<number, DisplayProduct> = {};
        const statusArr = Array.from(cardServerStatus);
        response.data.card.forEach((card: CardServerPayload) => {
          const idx = Math.min(8, Math.max(0, Number(card.num ?? 0) - 1));
          map[idx] = mapCardToDisplay(card);
          statusArr[idx] = Number(card.status) || 1;
        });
        setServerCardMap(map);
        setCardServerStatus(statusArr);
      }
      setActiveMultiplierIdx(multiplierIdx);
      flipRound(multiplierIdx, response.data?.card);
    },
  });
  useEffect(() => {
    if (!drawInfoResponse || drawInfoResponse.code !== 100000) return;
    const infoData: any = drawInfoResponse.data;
    const isEmptyObject = infoData && typeof infoData === 'object' && !Array.isArray(infoData) && Object.keys(infoData).length === 0;
    const isEmptyArray = Array.isArray(infoData) && infoData.length === 0;
    if (!infoData || isEmptyObject || isEmptyArray) {
      resetGameState();
      return;
    }
    setDrawSessionId(infoData.id != null ? String(infoData.id) : null);
    if (infoData.type != null && infoData.money != null) {
      setActiveBet({
        type: String(infoData.type),
        money: String(infoData.money),
      });
    }

    const cardSource: CardServerPayload[] = infoData.draw_card_log || infoData.card || [];
    const map: Record<number, DisplayProduct> = {};
    const statusArr = Array(9).fill(0);
    cardSource.forEach((card: CardServerPayload) => {
      const idx = Math.min(8, Math.max(0, Number(card.num ?? 0) - 1));
      map[idx] = mapCardToDisplay(card);
      statusArr[idx] = Number(card.status) || 1;
    });
    setServerCardMap(map);
    setCardServerStatus(statusArr);

    // 若与当前会话一致且已在进行中，避免重置所有卡片的翻面状态，只同步状态/卡片内容
    const isSameSession = infoData.id != null && drawSessionId && String(infoData.id) === drawSessionId;
    if (isSameSession && hasFlipped) {
      return;
    }

    const resumedRound = Math.max(0, Math.min((Number(infoData.round) || 1) - 1, currentRounds.length - 1));
    setRoundIndex(resumedRound);
    setActiveMultiplierIdx(resumedRound);
    setShowActions(true);
    setHasFlipped(true);
    const canSelectFromInfo = resumedRound > 0;
    setCanSelect(canSelectFromInfo);
    setOverlayArm(canSelectFromInfo);

    const nextCardBack = Array(9).fill(resumedRound % 2 === 1);
    const nextFrontRound = Array(9).fill(null);
    const nextBackRound = Array(9).fill(null);
    const nextFaceGlowFront = Array(9).fill(null);
    const nextFaceGlowBack = Array(9).fill(null);
    const nextCardWonRound = Array(9).fill(-1);
    const nextSelectedLocked = Array(9).fill(false);

    cardSource.forEach((card: CardServerPayload) => {
      const idx = Math.min(8, Math.max(0, Number(card.num ?? 0) - 1));
      const statusVal = Number(card.status);
      const survived = statusVal === 1;
      const claimed = statusVal === 2;
      const initial = statusVal === 3;
      const roundValue = Math.max(0, (Number(card.round) || 1) - 1);
      if (initial) {
        nextCardWonRound[idx] = -1;
        nextFrontRound[idx] = null;
        nextBackRound[idx] = null;
        nextFaceGlowFront[idx] = null;
        nextFaceGlowBack[idx] = null;
        nextSelectedLocked[idx] = false;
        return;
      }
      if (survived || claimed) {
        nextCardWonRound[idx] = roundValue;
        if (nextCardBack[idx]) {
          nextBackRound[idx] = roundValue;
          nextFaceGlowBack[idx] = roundValue;
        } else {
          nextFrontRound[idx] = roundValue;
          nextFaceGlowFront[idx] = roundValue;
        }
        if (claimed) {
          nextSelectedLocked[idx] = true;
        }
      } else {
        nextCardWonRound[idx] = -1;
      }
    });

    setCardBack(nextCardBack);
    setFrontRound(nextFrontRound);
    setBackRound(nextBackRound);
    setFaceGlowIdxFront(nextFaceGlowFront);
    setFaceGlowIdxBack(nextFaceGlowBack);
    setCardWonRound(nextCardWonRound);
    setSelectedLocked(nextSelectedLocked);
    setFaceLockOverrideFront(Array(9).fill(null));
    setFaceLockOverrideBack(Array(9).fill(null));
    setBackCardHovered(Array(9).fill(false));
  }, [drawInfoResponse, currentRounds.length, resetGameState]);

  const runGameSequence = () => {
    if (isFlipping) return;
    // 若还有未清理的展示层关闭定时器，先清掉，避免面板被回切
    if (collectOverlayTimerRef.current) {
      window.clearTimeout(collectOverlayTimerRef.current);
      collectOverlayTimerRef.current = null;
    }
    // 先固定容器高度，立即切换按钮面板
    const h = setupPanelRef.current?.offsetHeight;
    if (h && h > 0) {
      setContainerH(h);
      setLayerReady(true);
    }
    setShowActions(true);
    // 切换到动作面板时立即设置目标高度，固定为 128
    setContainerH(128);

    // 每次点击"开始游戏"，都视为第一次：重置倍数到 x1，直接翻到第 1 轮商品
      setIsFlipping(true);
    // 新一轮开始即清除选中样式，避免等翻完才变化
    setSelectedLocked(Array(9).fill(false));
    setCanSelect(false);
    setActiveMultiplierIdx(0);
    setHasFlipped(false);
    // 第一轮：生存率 100%，全部中奖，商品放在背面
      setRoundIndex(0);
      setCardWonRound(Array(9).fill(0));
    // 直接基于当前朝向，准备目标面为第1轮商品，然后执行一次翻牌（不复位初始面）
    const toggled = cardBack.map((v) => !v);
    // 克隆当前两面的内容与背光索引，避免在翻转前改变"当前可见面"的内容
    const nextFrontRound = frontRound.slice();
    const nextBackRound = backRound.slice();
    const nextFaceGlowFront = faceGlowIdxFront.slice();
    const nextFaceGlowBack = faceGlowIdxBack.slice();
    for (let i = 0; i < 9; i++) {
      if (toggled[i]) {
        // 翻转后显示背面：把第1轮商品放到背面（不改当前可见面）
        nextBackRound[i] = 0;
        nextFaceGlowBack[i] = 0;
      } else {
        // 翻转后显示正面：把第1轮商品放到正面（不改当前可见面）
        nextFrontRound[i] = 0;
        nextFaceGlowFront[i] = 0;
      }
    }
    setFrontRound(nextFrontRound);
    setBackRound(nextBackRound);
    setFaceGlowIdxFront(nextFaceGlowFront);
    setFaceGlowIdxBack(nextFaceGlowBack);
    // 🎵 播放翻牌音效
    playFlipSound();
    setTimeout(() => {
      setCardBack(toggled);
    }, 10);
    // 在翻牌期间：当前可见面保持选中样式，目标面强制未选中样式，避免样式跳变
    const nextFrontLockOverride = Array(9).fill(null) as (boolean | null)[];
    const nextBackLockOverride = Array(9).fill(null) as (boolean | null)[];
    for (let i = 0; i < 9; i++) {
      if (selectedLocked[i]) {
        if (cardBack[i]) {
          // 当前在背面显示 → 背面保持选中，正面强制未选中
          nextBackLockOverride[i] = true;
          nextFrontLockOverride[i] = false;
        } else {
          // 当前在正面显示 → 正面保持选中，背面强制未选中
          nextFrontLockOverride[i] = true;
          nextBackLockOverride[i] = false;
        }
      }
    }
    setFaceLockOverrideFront(nextFrontLockOverride);
    setFaceLockOverrideBack(nextBackLockOverride);
    setTimeout(() => {
      setCardBack(toggled);
    }, 10);
    setTimeout(() => {
      // 翻转结束：进入新一轮，清空全局选中与覆盖
      setSelectedLocked(Array(9).fill(false));
      setFaceLockOverrideFront(Array(9).fill(null));
      setFaceLockOverrideBack(Array(9).fill(null));
      setHasFlipped(true);
      setIsFlipping(false);
      // 首轮后仍保持不可选，需点击"抽奖"进入下一轮后可选择
    }, 650);
  };

  const flipRound = (glowIdxForRound: number, serverCards?: CardServerPayload[]) => {
    if (isFlipping) return;
    setIsFlipping(true);
    const nextRound = Math.min(roundIndex + 1, currentRounds.length - 1);
    const p = currentRounds[nextRound]?.survival ?? 0;
    const serverStatusMap = new Map<number, { win: boolean; round: number; status: number }>();
    if (Array.isArray(serverCards)) {
      serverCards.forEach((card) => {
        const idx = Math.min(8, Math.max(0, Number(card.num ?? 0) - 1));
        const roundValue = Math.max(0, (Number(card.round) || nextRound + 1) - 1);
        serverStatusMap.set(idx, {
          win: Number(card.status) === 1,
          round: roundValue,
          status: Number(card.status) || 0,
        });
      });
    }
    const newBack = cardBack.slice();
    const newWon = cardWonRound.slice();
    const newFrontRound = frontRound.slice();
    const newBackRound = backRound.slice();
    const newFaceGlowFront = faceGlowIdxFront.slice();
    const newFaceGlowBack = faceGlowIdxBack.slice();
    const newServerStatus = Array.from(cardServerStatus);
    const newSelectedLocked = selectedLocked.slice();
    for (let i = 0; i < 9; i++) {
      // 仅上一轮中奖的卡片继续抽
    const eligible = newWon[i] === roundIndex && !selectedLocked[i];
      if (!eligible) continue;
      const serverState = serverStatusMap.get(i);
      const resolvedRound = serverState ? serverState.round : nextRound;
      const win = serverState ? serverState.win : Math.random() < p;
      if (serverState) {
        newServerStatus[i] = serverState.status;
        if (serverState.status === 2) {
          newSelectedLocked[i] = true;
        }
        if (serverState.status === 3) {
          newWon[i] = -1;
          newFrontRound[i] = null;
          newBackRound[i] = null;
          newFaceGlowFront[i] = null;
          newFaceGlowBack[i] = null;
          continue;
        }
      }
      if (serverState && serverState.status === 2) {
        newWon[i] = resolvedRound;
        const targetIsBack = !newBack[i];
        if (targetIsBack) { newBackRound[i] = resolvedRound; newFaceGlowBack[i] = glowIdxForRound; }
        else { newFrontRound[i] = resolvedRound; newFaceGlowFront[i] = glowIdxForRound; }
        newSelectedLocked[i] = true;
        continue;
      }
      if (win) {
        newWon[i] = resolvedRound;
        // 下一轮奖品放在将要显示的那一面
        const targetIsBack = !newBack[i];
        if (targetIsBack) { newBackRound[i] = resolvedRound; newFaceGlowBack[i] = glowIdxForRound; }
        else { newFrontRound[i] = resolvedRound; newFaceGlowFront[i] = glowIdxForRound; }
        newBack[i] = !newBack[i]; // 翻到另一面显示奖品
      } else {
        newWon[i] = -1; // 淘汰
        // 为了产生翻面动画，切换到"另一面"并在该面渲染初始样式
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
    // 🎵 播放翻牌音效
    playFlipSound();
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
        // 关闭翻牌过渡，瞬间归位到正面，避免"多翻一次"
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
      // 首轮之后允许选择
      setCanSelect(true);
      setCardServerStatus(newServerStatus);
      setSelectedLocked(newSelectedLocked);
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
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes modalFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalZoomIn { from { transform: scale(0.95); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        /* 翻牌 */
        .flip-card { perspective: 1000px; -webkit-perspective: 1000px; }
        .flip-inner { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; -webkit-transform-style: preserve-3d; transition: transform 600ms ease; will-change: transform; }
        .flip-inner.flipped { transform: rotateY(180deg); -webkit-transform: rotateY(180deg); }
        .flip-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; transform: translateZ(0); -webkit-transform: translateZ(0); will-change: transform, opacity; }
        .flip-back { transform: rotateY(180deg); -webkit-transform: rotateY(180deg); }
      `}</style>
      {/* 顶部倍数栏 */}
      <div className="flex relative w-full h-14 rounded-t-lg overflow-clip" style={{ backgroundColor: '#161A1D' }}>
        <div ref={topBarRef} className="flex absolute inset-0 overflow-x-auto overflow-y-hidden no-scrollbar">
          <div className="flex h-full">
            {currentMultipliers.map((m, i) => {
              const isCurrentRound = activeMultiplierIdx === i;
              return (
                <div
                  key={m.label}
                  ref={assignMultiplierRef(i)}
                  className="flex relative h-14 w-16 min-w-16 cursor-pointer select-none"
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx((prev) => (prev === i ? null : prev))}
                >
                  <div
                    className="flex absolute -bottom-7 left-1/2 -translate-x-1/2 rounded-t-lg"
                    style={{
                      width: '66%',
                      height: '66%',
                      backgroundColor: isCurrentRound ? m.glow : 'transparent',
                      opacity: isCurrentRound ? 0.8 : 0,
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
                          for (let k = 0; k < currentMultipliers.length; k++) {
                            const r = (i + k) % currentMultipliers.length;
                            rows.push({ type: 'survival', roundIdx: r });
                            rows.push({ type: 'price', roundIdx: r });
                            // 下一轮倍数
                            rows.push({ type: 'label', roundIdx: (r + 1) % currentMultipliers.length });
                          }
                          return rows.map((row, idx2) => {
                            if (row.type === 'label') {
                              const lbl = currentMultipliers[row.roundIdx]?.label ?? '';
                              const color = row.roundIdx === currentMultipliers.length - 1 ? '#D69E2E' : '#7A8084';
                              return (
                                <div key={idx2} className="flex items-center justify-center" style={{ height: `18px` }}>
                                  <p className="text-sm font-bold" style={{ color }}>{lbl}</p>
                                </div>
                              );
                            }
                            if (row.type === 'survival') {
                              return (
                                <div key={idx2} className="flex items-center justify-center" style={{ height: `18px` }}>
                                  <p className="text-sm font-bold" style={{ color: '#7A8084' }}>{((currentRounds[row.roundIdx]?.survival ?? 0) * 100).toFixed(1)}%</p>
                                </div>
                              );
                            }
                            // price
                            return (
                              <div key={idx2} className="flex items-center justify-center" style={{ height: `18px` }}>
                                <p className="text-sm font-bold" style={{ color: '#7A8084' }}>${formatCurrency(currentPrices[row.roundIdx] ?? 0)}</p>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-bold" style={{ color: i === currentMultipliers.length - 1 ? '#D69E2E' : '#7A8084' }}>{m.label}</p>
                  )}
                </div>
              </div>
            );
            })}
          </div>
        </div>
      </div>

      {/* 顶部与内容分割线 */}

      {/* 内容区（组件内切换，不影响父级） */}
      <div className="flex flex-col items-center p-4 md:py-8 sm:px-10 md:px-16 rounded-b-lg relative" style={{ backgroundColor: '#161A1D', overflow: 'visible' }}>
        {/* 领取成功展示层（覆盖内容，Framer Motion 动画 + 3 秒后自动关闭） */}
        <AnimatePresence>
          {collectOverlayOpen && (
            <motion.div
              className="fixed inset-0 flex flex-col items-center justify-start rounded-2xl p-4 sm:p-8 shadow-2xl z-10 overflow-y-auto"
              style={{ backgroundColor: '#191d20', paddingTop: 'calc(80px + 1rem)', paddingBottom: '2rem' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <motion.div variants={overlayContainerVariants} initial="hidden" animate="show" exit="exit" className="flex flex-col items-center w-full min-h-full">
                {/* 顶部图标 */}
                <motion.div variants={crownVariants} className="mb-6 sm:mb-8 relative">
                  <div className="relative">
                    <div className="overflow-hidden border border-gray-700 rounded-full relative" style={{ borderWidth: 1 }}>
                      <div className="overflow-hidden border rounded-full border-gray-700" style={{ borderWidth: 1 }}>
                        <div className="relative rounded-full overflow-hidden" style={{ width: 96, height: 96 }}>
                          {userAvatar ? (
                            <img
                              alt="avatar"
                              src={userAvatar}
                              loading="lazy"
                              decoding="async"
                              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', color: 'transparent' }}
                            />
                          ) : (
                            <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="96" height="96">
                              <mask id="collect-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36"><rect width="36" height="36" rx="72" fill="#FFFFFF"></rect></mask>
                              <g mask="url(#collect-mask)">
                                <rect width="36" height="36" fill="#333333"></rect>
                                <rect x="0" y="0" width="36" height="36" transform="translate(-1 5) rotate(305 18 18) scale(1.2)" fill="#0C8F8F" rx="36"></rect>
                                <g transform="translate(-1 1) rotate(5 18 18)">
                                  <path d="M13,21 a1,0.75 0 0,0 10,0" fill="#FFFFFF"></path>
                                  <rect x="14" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
                                  <rect x="20" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
                                </g>
                              </g>
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                {/* 标题 */}
                <motion.p variants={titleVariants} className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">
                  {`Total Value $${collectOverlayItems.reduce((s, it) => s + (Number(it.price) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </motion.p>
                {/* 奖励卡片（逐个弹出） */}
                <motion.div variants={listWrapperVariants} className="flex justify-center w-full mb-4">
                  <motion.div variants={listVariants} className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-2xl">
                    {collectOverlayItems.map((it, idx) => (
                      <motion.div key={idx} variants={cardVariants} className="w-[132px] h-[132px]">
                        <div 
                          data-component="ProductDisplayCard" 
                          className="relative transition-colors duration-200 ease-in-out rounded-lg select-none overflow-hidden w-full h-full flex flex-col items-center justify-between gap-2 py-1.5 md:py-2 px-4 "
                          style={{ backgroundColor: '#22272b' }}
                        >
                          <div className="relative flex-1 flex w-full justify-center mt-1">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square transition-opacity duration-200 h-5/6 rounded-full filter blur-[25px] bg-pack-#4B69FF opacity-40"></div>
                            <img
                              alt={it.name}
                              loading="lazy"
                              decoding="async"
                              className="pointer-events-none"
                              src={it.image}
                              style={{ position: 'absolute', height: '100%', width: '100%', inset: '0px', objectFit: 'contain', color: 'transparent', zIndex: 1 }}
                            />
                          </div>
                          <div className="flex flex-col leading-tight">
                            <p className="text-xxs sm:text-xs font-semibold truncate max-w-[50px] xs:max-w-[100px] text-center" style={{ color: '#7a8084' }}>{it.name}</p>
                            <p className="text-xxs sm:text-xs font-extrabold text-center" style={{ color: '#fafafa' }}>${(Number(it.price) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
                {/* 关闭按钮 */}
                <motion.div variants={buttonVariants}>
                  <button
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base text-white font-bold disabled:text-gray-400 select-none h-14 px-8 mb-10"
                    style={{ backgroundColor: '#34383C', cursor: 'pointer' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3C4044'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
                    onClick={() => {
                      setCollectOverlayOpen(false);
                      setOverlayArm(false);
                      setShowActions(false);
                    }}
                  >
                    Play Again
                  </button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* 3列网格卡片（静态） */}
        <div className="grid grid-cols-3 gap-4 w-full" style={{ overflow: 'visible' }}>
          {Array.from({ length: 9 }).map((_, idx) => (
            <div key={idx} className="flex relative aspect-square w-full h-full" style={{ overflow: 'visible' }}>
              <div className="flex absolute w-full h-full" style={{ overflow: 'visible' }}>
                <div className="aspect-square w-full rounded-lg" style={{ overflow: 'visible' }}>
                  <div className="flip-card w-full h-full" style={{ overflow: 'visible' }}>
                    <div className={`flip-inner`} style={{ transform: `rotateY(${cardBack[idx] ? 180 : 0}deg)`, transition: suppressFlipTransition ? 'none' as any : undefined }}>
                      {/* 正面 */}
                      <div className="flip-face" style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', border: ((faceLockOverrideFront[idx] ?? selectedLocked[idx]) ? '2px solid #34383C' : (frontRound[idx] === null ? '2px solid #34383C' : '2px solid #7a8084')), borderRadius: '0.5rem', overflow: 'hidden', background: ((faceLockOverrideFront[idx] ?? selectedLocked[idx]) ? '#161A1D' : (frontRound[idx] === null ? '#161a1d' : 'var(--deposit-gradient-bg)' )) }}>
                        <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
                          {(() => {
                            const fr = frontRound[idx];
                            if (fr === null) {
                              return (
                                <div className="absolute flex flex-col gap-2 items-center justify-center" style={{ zIndex: 1 }}>
                                  <div className="flex w-10 h-10 md:w-12 md:h-12">
                                    <LogoIcon width={45} height={45} color="#474A4D" className="w-full h-full" aria-hidden />
                                  </div>
                                  <p className="font-black text-xs sm:text-sm md:text-lg" style={{ color: '#474A4D', fontFamily: 'Urbanist, sans-serif' }}>KawaguchiDraw</p>
                                </div>
                              );
                            }
                            const prod = getDisplayProduct(fr, idx);
                            const glowIdx = faceGlowIdxFront[idx];
                            const glowHex = (glowIdx !== null && currentMultipliers[glowIdx]) ? currentMultipliers[glowIdx].glow : '#829DBB';
                            const isWon = cardWonRound[idx] >= 0;
                            const isLocked = (faceLockOverrideFront[idx] ?? selectedLocked[idx]) as boolean;
                            const isHovered = !isLocked && isWon && backCardHovered[idx];
                            return (
                              <div 
                                data-component="ProductDisplayCard" 
                                className="relative group transition-colors duration-200 ease-in-out rounded-lg overflow-hidden w-full h-full flex flex-col items-center justify-between gap-1.5 py-1 px-2 sm:gap-2 sm:py-1.5 md:py-2 sm:px-4"
                                style={{ background: isLocked ? '#161A1D' : (isHovered ? '#22272b' : 'var(--deposit-gradient-bg)'), cursor: (isLocked || !canSelect) ? 'default' : (isWon ? 'pointer' : 'default') }}
                                onMouseEnter={() => { if (!isLocked) handleCardMouseEnter(idx); }}
                                onMouseLeave={() => { handleCardMouseLeave(idx); }}
                                onClick={() => { if (canSelect && !isLocked && isWon) handleLockWinningCard(idx); }}
                              >
                                {isLocked && isWon && fr !== null ? (
                                  <div className="flex absolute left-0 top-0 px-2 py-1" style={{ zIndex: 2 }}>
                                    <p className="text-sm text-white font-bold">{currentMultipliers[fr]?.label}</p>
                                  </div>
                                ) : null}
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
                                      filter: 'blur(16px)',
                                    backgroundColor: glowHex, 
                                    opacity: isLocked ? 0.4 : (isHovered ? 0.9 :  0.4)
                                  }}></div>
                                  <img 
                                    alt={prod.name} 
                                    loading="lazy"
                                    decoding="async"
                                    className="pointer-events-none" 
                                    src={prod.image || undefined}
                                    style={{ position: 'absolute', height: '100%', width: '100%', inset: '0px', objectFit: 'contain', color: 'transparent', zIndex: 1 }} 
                                  />
                                </div>
                                <div className="flex flex-col leading-tight">
                                  <p className="text-[10px] sm:text-xs truncate max-w-[60px] sm:max-w-[100px] text-center" style={{ color: '#7a8084', fontWeight: 100, fontFamily: 'Urbanist, sans-serif' }}>{prod.name}</p>
                                  <p className="text-[10px] sm:text-xs font-extrabold text-center" style={{ color: '#fafafa', fontFamily: 'Urbanist, sans-serif' }}>${prod.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      {/* 背面（结果样式，类似产品卡简化） */}
                      <div className="flip-face flip-back" style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', border: ((faceLockOverrideBack[idx] ?? selectedLocked[idx]) ? '2px solid #34383C' : (backRound[idx] === null ? '2px solid #34383C' : '2px solid #7a8084')), borderRadius: '0.5rem', overflow: 'hidden', background: ((faceLockOverrideBack[idx] ?? selectedLocked[idx]) ? '#161A1D' : (backRound[idx] === null ? '#161a1d' : 'var(--deposit-gradient-bg)')) }}>
                        <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
                          {(() => {
                            const br = backRound[idx];
                            if (br === null) {
                              return (
                                <div className="absolute flex flex-col gap-2 items-center justify-center" style={{ zIndex: 1 }}>
                                  <div className="flex w-10 h-10 md:w-12 md:h-12">
                                    <LogoIcon width={45} height={45} color="#474A4D" className="w-full h-full" aria-hidden />
                                  </div>
                                  <p className="font-black text-xs sm:text-sm md:text-lg" style={{ color: '#474A4D', fontFamily: 'Urbanist, sans-serif' }}>KawaguchiDraw</p>
                                </div>
                              );
                            }
                            const prod = getDisplayProduct(br, idx);
                            const glowIdx = faceGlowIdxBack[idx];
                            const glowHex = (glowIdx !== null && currentMultipliers[glowIdx]) ? currentMultipliers[glowIdx].glow : '#829DBB';
                            const isWon = cardWonRound[idx] >= 0;
                            const isLocked = (faceLockOverrideBack[idx] ?? selectedLocked[idx]) as boolean;
                            const isHovered = !isLocked && isWon && backCardHovered[idx];
                            return (
                              <div 
                                data-component="ProductDisplayCard" 
                                className="relative group transition-colors duration-200 ease-in-out rounded-lg overflow-hidden w-full h-full flex flex-col items-center justify-between gap-1.5 py-1 px-2 sm:gap-2 sm:py-1.5 md:py-2 sm:px-4"
                                style={{ background: isLocked ? '#161A1D' : (isHovered ? '#22272b' : 'var(--deposit-gradient-bg)'), cursor: (isLocked || !canSelect) ? 'default' : (isWon ? 'pointer' : 'default') }}
                                onMouseEnter={() => { if (!isLocked) handleCardMouseEnter(idx); }}
                                onMouseLeave={() => { handleCardMouseLeave(idx); }}
                                onClick={() => { if (canSelect && !isLocked && isWon) handleLockWinningCard(idx); }}
                              >
                                {isLocked && isWon && br !== null ? (
                                  <div className="flex absolute left-0 top-0 px-2 py-1" style={{ zIndex: 2 }}>
                                    <p className="text-sm text-white font-bold">{currentMultipliers[br]?.label}</p>
                                  </div>
                                ) : null}
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
                                      filter: 'blur(16px)',
                                    backgroundColor: glowHex, 
                                    opacity: isLocked ? 0.4 : (isHovered ? 0.9 : 0.4)
                                  }}></div>
                                  {prod.image ? (
                                    <img 
                                      alt={prod.name} 
                                      loading="lazy"
                                      decoding="async"
                                      className="pointer-events-none" 
                                      src={prod.image}
                                      style={{ position: 'absolute', height: '100%', width: '100%', inset: '0px', objectFit: 'contain', color: 'transparent', zIndex: 1 }} 
                                    />
                                  ) : null}
                                </div>
                                <div className="flex flex-col leading-tight">
                                  <p className="text-[10px] sm:text-xs truncate max-w-[60px] sm:max-w-[100px] text-center" style={{ color: '#7a8084', fontWeight: 100, fontFamily: 'Urbanist, sans-serif' }}>{prod.name}</p>
                                  <p className="text-[10px] sm:text-xs font-extrabold text-center" style={{ color: '#fafafa', fontFamily: 'Urbanist, sans-serif' }}>${prod.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
                <label className="text-sm font-extrabold" style={{ color: '#FFFFFF' }}>{t('drawInputAmount')}</label>
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
                    >{t('drawMin')}</button>
                      <button
                        className="inline-flex items-center justify-center rounded-md text-sm h-6 px-2 font-bold"
                        style={{ backgroundColor: '#34383C', color: '#FFFFFF', cursor: 'pointer' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3C4044'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
                        onClick={setMax}
                        type="button"
                    >{t('drawMax')}</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-between">
                <label className="text-sm font-medium" style={{ color: '#FFFFFF' }}>{t('drawSelectDifficulty')}</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDifficulty('easy')}
                    className="h-7 px-4 text-sm font-bold rounded-md"
                    style={{ backgroundColor: difficulty === 'easy' ? '#34383C' : '#22272B', color: '#FFFFFF', cursor: 'pointer' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3C4044'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = (difficulty === 'easy') ? '#34383C' : '#22272B'; }}
                  >{t('drawEasy')}</button>
                  <button
                    type="button"
                    onClick={() => setDifficulty('medium')}
                    className="h-7 px-4 text-sm font-bold rounded-md"
                    style={{ backgroundColor: difficulty === 'medium' ? '#34383C' : '#22272B', color: '#FFFFFF', cursor: 'pointer' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3C4044'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = (difficulty === 'medium') ? '#34383C' : '#22272B'; }}
                  >{t('drawMedium')}</button>
                  <button
                    type="button"
                    onClick={() => setDifficulty('hard')}
                    className="h-7 px-4 text-sm font-bold rounded-md"
                    style={{ backgroundColor: difficulty === 'hard' ? '#34383C' : '#22272B', color: '#FFFFFF', cursor: 'pointer' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3C4044'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = (difficulty === 'hard') ? '#34383C' : '#22272B'; }}
                  >{t('drawHard')}</button>
                </div>
              </div>

              <button
                type="button"
                className="h-14 px-8 text-base font-bold rounded-md"
                style={{ backgroundColor: '#48BB78', color: (!isAuthed || drawStartMutation.isPending) ? '#7A8084' : '#FFFFFF', cursor: (!isAuthed || drawStartMutation.isPending) ? 'default' : 'pointer', opacity: drawStartMutation.isPending ? 0.9 : 1 }}
                onClick={() => {
                  if (!isAuthed || drawStartMutation.isPending) return;
                  const payload = {
                    type: difficultyTypeMap[difficulty],
                    money: String(parsedAmount),
                  };
                  setActiveBet(payload);
                  setServerCardMap({});
                  setCardServerStatus(Array(9).fill(0));
                  setCardBack(Array(9).fill(false));
                  setFrontRound(Array(9).fill(null));
                  setBackRound(Array(9).fill(null));
                  setFaceGlowIdxFront(Array(9).fill(null));
                  setFaceGlowIdxBack(Array(9).fill(null));
                  setCardWonRound(Array(9).fill(-1));
                  setSelectedLocked(Array(9).fill(false));
                  setFaceLockOverrideFront(Array(9).fill(null));
                  setFaceLockOverrideBack(Array(9).fill(null));
                  setBackCardHovered(Array(9).fill(false));
                  setDrawSessionId(null);
                  drawStartMutation.mutate(payload);
                }}
                disabled={!isAuthed || drawStartMutation.isPending}
              >
                {drawStartMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinnerIcon size={22} />
                    {t('drawLaunching')}
                  </span>
                ) : (
                  t('drawStartGameFor').replace('{price}', `$${formatCurrency(parsedAmount)}`)
                )}
              </button>
            </div>
          </div>

          {/* Actions 面板（替换组件，仅两个按钮） */}
          <div ref={actionsPanelRef} className={layerReady ? 'absolute inset-0' : 'hidden'} style={layerReady ? { transition: 'transform 220ms ease, opacity 220ms ease', transform: showActions ? 'translateY(0)' : 'translateY(100%)', opacity: showActions ? 1 : 0, pointerEvents: showActions ? 'auto' : 'none' } : undefined}>
            <div className="flex flex-col w-full gap-4" style={{ height: '128px' }}>
              <button
                type="button"
                className="h-14 px-8 text-base font-bold rounded-md"
                style={{ background: 'var(--deposit-btn-bg)', color: '#FFFFFF', cursor: (isFlipping || drawRoundMutation.isPending) ? 'default' : 'pointer', opacity: (isFlipping || drawRoundMutation.isPending) ? 0.9 : 1 }}
                onMouseEnter={(e) => { if (!isFlipping && !drawRoundMutation.isPending) (e.currentTarget as HTMLButtonElement).style.background = 'var(--deposit-btn-bg-hover)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--deposit-btn-bg)'; }}
                onClick={() => {
                  if (isFlipping || drawRoundMutation.isPending) return;
                  const infoData: any = drawInfoResponse?.data;
                  const infoPayload = (infoData && infoData.type != null && infoData.money != null)
                    ? { type: String(infoData.type), money: String(infoData.money) }
                    : null;
                  const payload = (activeBet && activeBet.type && activeBet.money)
                    ? activeBet
                    : (infoPayload ?? { type: difficultyTypeMap[difficulty], money: String(parsedAmount) });
                  if (!payload.type || !payload.money) return;
                  if (!activeBet || activeBet.type !== payload.type || activeBet.money !== payload.money) {
                    setActiveBet(payload);
                  }
                  const length = currentMultipliers.length || 1;
                  const newIdx = (activeMultiplierIdx === null) ? 0 : ((activeMultiplierIdx + 1) % length);
                  drawRoundMutation.mutate({ payload, multiplierIdx: newIdx });
                }}
                disabled={isFlipping || drawRoundMutation.isPending}
              >
                {(isFlipping || drawRoundMutation.isPending) ? (
                  <span className="flex items-center justify-center">
                    <LoadingSpinnerIcon size={22} />
                  </span>
                ) : (
                  t('drawAction')
                )}
              </button>
              <button
                type="button"
                className="h-14 px-8 text-base font-bold rounded-md"
                style={{ backgroundColor: '#34383C', color: '#FFFFFF', cursor: (collectMutation.isPending || !canSelect || !drawSessionId) ? 'default' : 'pointer', opacity: (collectMutation.isPending || !canSelect || !drawSessionId) ? 0.9 : 1 }}
                disabled={collectMutation.isPending || !canSelect || !drawSessionId}
                onClick={() => {
                  if (collectMutation.isPending || !canSelect || !drawSessionId) return;
                  const newLockedAll = selectedLocked.map((v, i) => (cardWonRound[i] >= 0 ? true : v));
                  const overlayItems: CollectOverlayItem[] = [];
                  for (let i = 0; i < 9; i++) {
                    if (cardWonRound[i] >= 0) {
                      const currentRound = cardBack[i] ? backRound[i] : frontRound[i];
                      if (currentRound !== null && Number.isFinite(currentRound as any)) {
                        const prod = getDisplayProduct(currentRound, i);
                        overlayItems.push({
                          name: String(prod.name ?? ''),
                          image: String(prod.image ?? ''),
                          price: Number(prod.price ?? 0),
                        });
                      }
                    }
                  }
                  if (!overlayItems.length) {
                    showGlobalToast({
                      title: t('drawNoPrize'),
                      description: t('retryLater'),
                      variant: 'error',
                    });
                    return;
                  }
                  setOverlayArm(false);
                  collectMutation.mutate(
                    { id: drawSessionId, overlayItems, mode: 'all' },
                    {
                      onSuccess: () => {
                        setSelectedLocked(newLockedAll);
                        setCardServerStatus((prev) => {
                          const next = prev.slice();
                          for (let i = 0; i < 9; i++) {
                            if (cardWonRound[i] >= 0) {
                              next[i] = 2;
                            }
                          }
                          return next;
                        });
                      },
                    },
                  );
                }}
              >
                {collectMutation.isPending ? '领取中…' : `全部领取 $${formatCurrency(calculateTotalPrize())}`}
              </button>
              <div className="hidden">
                {/* 逻辑挂载位置保持简洁：点击上方按钮时收集中奖卡片并写入仓库 */}
              </div>
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
          >{t('howTo')}</button>
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
              {currentMultipliers.map((multiplier, idx, arr) => {
                const survival = (currentRounds[idx]?.survival ?? 0) * 100;
                const price = currentPrices[idx] ?? 0;
                return {
                  m: multiplier.label,
                  s: `${survival.toFixed(1)}%`,
                  p: `$${formatCurrency(price)}`,
                  y: idx === arr.length - 1,
                };
              }).map((row, idx, arr) => (
                <div
                  key={row.m}
                  className="grid grid-cols-3 gap-0 text-sm"
                  style={{
                    borderBottom: idx === arr.length - 1 ? '0 none' : '1px solid #374151',
                    background: row.y ? '#2A2521' : 'var(--deposit-gradient-bg)',
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
                <h2 className="text-xl font-bold leading-none tracking-tight text-left" style={{ color: '#FFFFFF' }}>{t('howTo')}</h2>
              </div>
              <ul className="flex flex-col gap-6 px-8 py-10 font-bold" style={{ color: '#7A8084' }}>
                <li className="flex gap-2">
                  <div className="flex size-2 rounded-full" style={{ backgroundColor: '#FFFFFF', marginTop: '0.5rem' }} />
                  <span className="text-base">{t('drawHowToIntro')}</span>
                </li>
                <li className="flex gap-2">
                  <div className="flex size-2 rounded-full" style={{ backgroundColor: '#FFFFFF', marginTop: '0.5rem' }} />
                  <span className="text-base">{t('drawHowTo1')}</span>
                </li>
                <li className="flex gap-2">
                  <div className="flex size-2 rounded-full" style={{ backgroundColor: '#FFFFFF', marginTop: '0.5rem' }} />
                  <span className="text-base">{t('drawHowToFail')}</span>
                </li>
                <li className="flex gap-2">
                  <div className="flex size-2 rounded-full" style={{ backgroundColor: '#FFFFFF', marginTop: '0.5rem' }} />
                  <span className="text-base">{t('drawHowTo2')}</span>
                </li>
                <li className="flex gap-2">
                  <div className="flex size-2 rounded-full" style={{ backgroundColor: '#FFFFFF', marginTop: '0.5rem' }} />
                  <span className="text-base">{t('drawHowToCap').replace('{amount}', formatCurrency(350000))}</span>
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
                <span className="sr-only">{t('close')}</span>
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
                <h2 className="text-xl font-bold leading-none tracking-tight text-left" style={{ color: '#FFFFFF' }}>{t('fairness')}</h2>
              </div>
              <div className="space-y-4 p-6">
                <div className="p-4 rounded-lg shadow-lg relative space-y-4" style={{ backgroundColor: '#22272B' }}>
                 
                  <div className="w-full grid grid-cols-4 gap-4 overflow-x-scroll pb-4 custom-scroll">
                    <p className="text-sm col-span-1 font-medium" style={{ color: '#7A8084' }}>{t('serverSeedHash')}</p>
                    <div className="col-span-3">
                      {fairServerHash ? (
                        <div className="h-6 w-full flex items-center" style={{ backgroundColor: 'transparent', color: '#CBD5E0' }}>{fairServerHash}</div>
                      ) : (
                        <div className="rounded-md h-6 w-full" style={{ backgroundColor: '#374151' }}></div>
                      )}
                    </div>
                    <p className="text-sm col-span-1 font-medium" style={{ color: '#7A8084' }}>{t('clientSeed')}</p>
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


