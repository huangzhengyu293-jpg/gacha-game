"use client";
export const dynamic = "force-dynamic";
import React, { useState, useMemo, useEffect, Suspense } from "react";
import InlineSelect from "../components/InlineSelect";
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { CatalogPack } from '../lib/api';
import SelectPackModal from '../packs/[id]/SelectPackModal';
import Image from 'next/image';
import InfoTooltip from '../components/InfoTooltip';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


interface SortablePackItemProps {
  pack: CatalogPack;
  onRemove: () => void;
  uniqueId: string; // 添加唯一 ID
}

function SortablePackItem({ pack, onRemove, uniqueId }: SortablePackItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: uniqueId });
  const [isHovered, setIsHovered] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col gap-2 items-stretch"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex relative cursor-move"
        style={{ touchAction: 'none' }}
      >
        <Image
          alt={pack.title}
          src={pack.image}
          width={200}
          height={304}
          className="w-full h-auto"
          style={{ color: 'transparent', pointerEvents: 'none' }}
          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
          unoptimized
        />
      </div>
      <button
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative font-bold select-none h-10 px-6 text-white text-sm cursor-pointer"
        style={{
          backgroundColor: isHovered ? '#22272B' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (isHovered) {
            e.currentTarget.style.backgroundColor = '#2D3236';
          }
        }}
        onMouseLeave={(e) => {
          if (isHovered) {
            e.currentTarget.style.backgroundColor = '#22272B';
          }
        }}
        onClick={onRemove}
      >
        {isHovered ? 'Remove' : `$${pack.price.toFixed(2)}`}
      </button>
    </div>
  );
}

function CreateBattleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 从URL读取初始值，确保单人模式默认为2
  const getInitialType = () => {
    const typeParam = searchParams?.get("type");
    return typeParam === "team" ? "team" : "solo";
  };
  
  const getInitialPlayersCount = () => {
    const typeParam = searchParams?.get("type");
    const isSoloMode = !typeParam || typeParam === "solo";
    
    if (!isSoloMode) return "2"; // 团队模式不用这个值
    
    const playersParam = searchParams?.get("playersInSolo");
    if (playersParam) {
      const n = Number(playersParam);
      if (Number.isFinite(n) && n >= 1 && n <= 6) {
        return String(n);
      }
    }
    // 默认返回2
    return "2";
  };
  
  const [typeState, setTypeState] = useState<"solo" | "team">(getInitialType);
  const [playersCount, setPlayersCount] = useState<string>(getInitialPlayersCount);
  const [teamStructure, setTeamStructure] = useState<"2v2" | "3v3" | "2v2v2">("2v2");
  
  // 计算实际的玩家数量
  const actualPlayersCount = useMemo(() => {
    if (typeState === "team") {
      // 团队模式下根据teamStructure计算实际人数
      switch (teamStructure) {
        case "2v2":
          return 4; // 2队，每队2人
        case "3v3":
          return 6; // 2队，每队3人
        case "2v2v2":
          return 6; // 3队，每队2人
        default:
          return 4;
      }
    }
    // Solo模式下直接使用playersCount
    return Number(playersCount);
  }, [typeState, teamStructure, playersCount]);
  
  // 初始化时确保URL参数正确
  useEffect(() => {
    const typeParam = searchParams?.get("type");
    const isSoloMode = !typeParam || typeParam === "solo";
    
    console.log('🔍 [CreateBattle初始化]', {
      typeParam,
      isSoloMode,
      playersCount,
      urlPlayersInSolo: searchParams?.get("playersInSolo")
    });
    
    if (isSoloMode) {
      const playersParam = searchParams?.get("playersInSolo");
      // 如果没有参数，或者参数无效，设置默认值2
      if (!playersParam || Number(playersParam) < 1 || Number(playersParam) > 6) {
        console.log('✅ [CreateBattle] 设置默认玩家数: 2');
        replaceUrl({ playersInSolo: "2" });
        setPlayersCount("2");
      }
    }
    
    const teamStructureParam = searchParams?.get("teamStructure");
    if (teamStructureParam === "3v3" || teamStructureParam === "2v2v2") {
      setTeamStructure(teamStructureParam);
    } else if (teamStructureParam === "2v2") {
      setTeamStructure("2v2");
    }
  }, [searchParams]);
  
  const [selectedMode, setSelectedMode] = useState<"classic" | "share" | "sprint" | "jackpot" | "elimination">("classic");
  const [optFastBattle, setOptFastBattle] = useState<boolean>(true);
  const [optLastChance, setOptLastChance] = useState<boolean>(false);
  const [optInverted, setOptInverted] = useState<boolean>(false);
  
  // 初始化游戏模式和选项
  useEffect(() => {
    const gameModeParam = searchParams?.get("gameMode");
    if (gameModeParam === "share" || gameModeParam === "sprint" || gameModeParam === "jackpot" || gameModeParam === "elimination") {
      setSelectedMode(gameModeParam);
    } else if (gameModeParam === "classic") {
      setSelectedMode("classic");
    }
    
    const fastBattleParam = searchParams?.get("fastBattle");
    if (fastBattleParam === "true") {
      setOptFastBattle(true);
    } else if (fastBattleParam === "false") {
      setOptFastBattle(false);
    }
    
    const lastChanceParam = searchParams?.get("lastChance");
    if (lastChanceParam === "true") {
      setOptLastChance(true);
    }
    
    const upsideDownParam = searchParams?.get("upsideDown");
    if (upsideDownParam === "true") {
      setOptInverted(true);
    }
  }, [searchParams]);

  // "最后的机会"只有在经典和大奖模式才能开启
  const canEnableLastChance = selectedMode === "classic" || selectedMode === "jackpot";
  
  // "倒置模式"除了分享模式都可以开启
  const canEnableInverted = selectedMode !== "share";

  const replaceUrl = (updates: Record<string, string | undefined>) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") params.delete(k);
      else params.set(k, String(v));
    });
    const qs = params.toString();
    const pathname = window.location.pathname || "/create-battle";
    const url = qs ? `${pathname}?${qs}` : pathname;
    window.history.replaceState(null, "", url);
  };

  // 当模式改变时，自动关闭不符合条件的选项
  useEffect(() => {
    if (!canEnableLastChance && optLastChance) {
      setOptLastChance(false);
      replaceUrl({ lastChance: undefined });
    }
  }, [selectedMode, canEnableLastChance, optLastChance]);

  useEffect(() => {
    if (!canEnableInverted && optInverted) {
      setOptInverted(false);
      replaceUrl({ upsideDown: undefined });
    }
  }, [selectedMode, canEnableInverted, optInverted]);
  const [selectedPackIds, setSelectedPackIds] = useState<string[]>(() => {
    // 从URL读取初始卡包IDs
    const packIdsParam = searchParams?.get('packIds');
    if (packIdsParam) {
      return packIdsParam.split(',').filter(id => id.trim());
    }
    return [];
  });
  const [isSelectPackModalOpen, setIsSelectPackModalOpen] = useState(false);
  const { data: packs = [] as CatalogPack[] } = useQuery({ queryKey: ['packs'], queryFn: api.getPacks, staleTime: 30_000 });
  
  const selectedPacks = useMemo(() => {
    return selectedPackIds.map(id => packs.find((p: CatalogPack) => p.id === id)).filter(Boolean) as CatalogPack[];
  }, [selectedPackIds, packs]);
  
  // 生成唯一 ID 数组用于 SortableContext
  const uniqueIds = useMemo(() => {
    return selectedPacks.map((pack, index) => `${pack.id}-${index}`);
  }, [selectedPacks]);
  
  const totalCost = useMemo(() => {
    return selectedPacks.reduce((sum, pack) => sum + pack.price, 0);
  }, [selectedPacks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // 从唯一 ID 中提取索引（格式：packId-index）
    const extractIndex = (uniqueId: string): number => {
      const match = uniqueId.match(/-(\d+)$/);
      return match ? parseInt(match[1], 10) : -1;
    };

    const oldIndex = extractIndex(active.id as string);
    const newIndex = extractIndex(over.id as string);
    
    // 只有当两个索引都有效时才执行移动
    if (oldIndex !== -1 && newIndex !== -1) {
      setSelectedPackIds((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <div className="flex flex-col flex-1 items-stretch relative">
      <div className="w-full max-w-[1280px] mx-auto px-4 pt-6 space-y-10 md:space-y-12">
        <div className="w-full space-y-12 pb-8 flex flex-col items-center">
          {/* 顶部：模式下拉与玩家数量 */}
          <div className="flex flex-col items-stretch gap-12">
            <div className="flex justify-center w-full">
              <div className="w-full sm:w-auto">
                <InlineSelect
                  value={typeState}
                  onChange={(v) => {
                    const newType = v as "solo" | "team";
                    setTypeState(newType);
                    
                    // 切换模式时清除对应的URL参数
                    if (newType === "team") {
                      // 切换到团队模式：清除playersInSolo，添加teamStructure
                      const params = new URLSearchParams(window.location.search);
                      params.delete("playersInSolo");
                      params.set("type", "team");
                      params.set("teamStructure", teamStructure);
                      router.replace(`?${params.toString()}`);
                    } else {
                      // 切换到单人模式：清除teamStructure，添加playersInSolo
                      const params = new URLSearchParams(window.location.search);
                      params.delete("teamStructure");
                      params.set("type", "solo");
                      // 确保使用默认值 2
                      const finalPlayersCount = playersCount || "2";
                      params.set("playersInSolo", finalPlayersCount);
                      router.replace(`?${params.toString()}`);
                    }
                  }}
                  options={[
                    { label: "单人对战", value: "solo" },
                    { label: "团队对战", value: "team" },
                  ]}
                  centerLabel
                />
              </div>
            </div>

            <div className="text-center w-full">
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: "#7A8084" }}
              >
                {typeState === "solo" ? "玩家" : "队伍结构"}
              </h2>
              <div className="flex justify-center gap-3 flex-wrap w-full">
                {typeState === "solo" ? (
                  // Solo模式：显示2, 3, 4, 6玩家数量
                  [2, 3, 4, 6].map((n) => (
                    <button
                      key={n}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none interactive-focus relative text-base font-semibold select-none px-6 size-16 rounded-full border cursor-pointer"
                      onClick={() => {
                        setPlayersCount(String(n));
                        replaceUrl({ playersInSolo: String(n) });
                      }}
                      style={{
                        backgroundColor:
                          Number(playersCount) === n ? "#60A5FA" : "#22272B",
                        color: "#FFFFFF",
                        borderColor:
                          Number(playersCount) === n ? "#60A5FA" : "#34383C",
                      }}
                    >
                      {n}
                    </button>
                  ))
                ) : (
                  // Team模式：显示2v2, 3v3, 2v2v2
                  (["2v2", "3v3", "2v2v2"] as const).map((ts) => (
                    <button
                      key={ts}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none interactive-focus relative text-base font-semibold select-none px-6 h-16 rounded-full border cursor-pointer"
                      onClick={() => {
                        setTeamStructure(ts);
                        replaceUrl({ teamStructure: ts });
                      }}
                      style={{
                        backgroundColor:
                          teamStructure === ts ? "#60A5FA" : "#22272B",
                        color: "#FFFFFF",
                        borderColor:
                          teamStructure === ts ? "#60A5FA" : "#34383C",
                        minWidth: "4rem",
                      }}
                    >
                      {ts}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 游戏模式 */}
          <div className="w-full">
            <h2
              className="text-xl font-semibold mb-4 text-center"
              style={{ color: "#7A8084" }}
            >
              游戏模式
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-6 w-full sm:grid-cols-5">
              {/* 经典 - 选中态 border-blue-400 */}
              <div
                className="rounded-xl border bg-gray-700 text-card-foreground shadow-sm cursor-pointer overflow-hidden"
                style={{
                  borderColor:
                    selectedMode === "classic" ? "#4299E1" : "#34383C",
                  backgroundColor: "#22272B",
                }}
                role="button"
                aria-pressed={selectedMode === "classic"}
                onClick={() => {
                  setSelectedMode("classic");
                  replaceUrl({ gameMode: "classic" });
                }}
              >
                <div className="p-6 md:p-0 gap-1 md:gap-0 flex flex-col">
                  <div className="md:hidden h-full w-full flex items-center justify-center">
                    <div className="size-8 text-blue-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-swords"
                      >
                        <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"></polyline>
                        <line x1="13" x2="19" y1="19" y2="13"></line>
                        <line x1="16" x2="20" y1="16" y2="20"></line>
                        <line x1="19" x2="21" y1="21" y2="19"></line>
                        <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"></polyline>
                        <line x1="5" x2="9" y1="14" y2="18"></line>
                        <line x1="7" x2="4" y1="17" y2="20"></line>
                        <line x1="3" x2="5" y1="19" y2="21"></line>
                      </svg>
                    </div>
                  </div>
                  <div className="hidden md:block h-40 w-full rounded-xl rounded-b-none overflow-hidden">
                    <div
                      className="flex relative w-full h-full"
                      style={{ backgroundColor: "#1D2125" }}
                    >
                      <div
                        className="flex absolute justify-center items-center w-full h-full"
                        style={{ transform: "scale(0.6)" }}
                      >
                        <div
                          className="absolute"
                          style={{
                            width: 129,
                            height: 188,
                            transform: "translateX(0px) translateY(0px)",
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 69 100"
                            fill="none"
                          >
                            <path
                              d="M61.1719 0L9.2807 61.3812H32.1919L0 100L69 48.0028L37.0986 47.9161L61.1719 0Z"
                              fill="#CBD5E0"
                            ></path>
                            <path
                              d="M38.4962 24.4265L34.4244 55.231H22.2663L17.6428 24.4265H26.0907C27.0674 32.9125 27.765 40.0856 28.1836 45.9459C28.6022 40.0222 29.0398 34.7581 29.4965 30.1536L30.0483 24.4265H38.4962Z"
                              fill="white"
                            ></path>
                            <path
                              d="M38.4962 24.4265L38.9919 24.4921L39.0666 23.9265H38.4962V24.4265ZM34.4244 55.231V55.731H34.8627L34.9201 55.2965L34.4244 55.231ZM22.2663 55.231L21.7718 55.3052L21.8357 55.731H22.2663V55.231ZM17.6428 24.4265V23.9265H17.0621L17.1483 24.5008L17.6428 24.4265ZM26.0907 24.4265L26.5874 24.3694L26.5364 23.9265H26.0907V24.4265ZM28.1836 45.9459L27.6849 45.9815L28.6824 45.9811L28.1836 45.9459ZM29.4965 30.1536L29.994 30.203L29.9942 30.2016L29.4965 30.1536ZM30.0483 24.4265V23.9265H29.5941L29.5506 24.3786L30.0483 24.4265ZM38.4962 24.4265L38.0005 24.361L33.9287 55.1654L34.4244 55.231L34.9201 55.2965L38.9919 24.4921L38.4962 24.4265ZM34.4244 55.231V54.731H22.2663V55.231V55.731H34.4244V55.231ZM22.2663 55.231L22.7608 55.1567L18.1372 24.3523L17.6428 24.4265L17.1483 24.5008L21.7718 55.3052L22.2663 55.231ZM17.6428 24.4265V24.9265H26.0907V24.4265V23.9265H17.6428V24.4265ZM26.0907 24.4265L25.594 24.4837C26.5702 32.9654 27.267 40.1308 27.6849 45.9815L28.1836 45.9459L28.6824 45.9102C28.2631 40.0404 27.5646 32.8596 26.5874 24.3694L26.0907 24.4265ZM28.1836 45.9459L28.6824 45.9811C29.1007 40.0609 29.538 34.8017 29.994 30.203L29.4965 30.1536L28.9989 30.1043C28.5417 34.7145 28.1037 39.9835 27.6849 45.9106L28.1836 45.9459ZM29.4965 30.1536L29.9942 30.2016L30.546 24.4745L30.0483 24.4265L29.5506 24.3786L28.9988 30.1057L29.4965 30.1536ZM30.0483 24.4265V24.9265H38.4962V24.4265V23.9265H30.0483V24.4265Z"
                              fill="#1D2125"
                            ></path>
                            <path
                              d="M50.9178 53.1393H43.4783V50.8561C43.4783 49.7906 43.3832 49.112 43.1929 48.8202C43.0027 48.5285 42.6856 48.3826 42.2416 48.3826C41.7596 48.3826 41.3917 48.5792 41.138 48.9725C40.897 49.3657 40.7765 49.9618 40.7765 50.761C40.7765 51.7884 40.9161 52.5622 41.1951 53.0822C41.4615 53.6023 42.2162 54.2302 43.4593 54.9659C47.0237 57.0842 49.2688 58.822 50.1948 60.1793C51.1208 61.5365 51.5838 63.7246 51.5838 66.7435C51.5838 68.9379 51.3237 70.5552 50.8037 71.5953C50.2963 72.6355 49.3069 73.5107 47.8355 74.221C46.3641 74.9187 44.6517 75.2675 42.6982 75.2675C40.5546 75.2675 38.7216 74.8616 37.1995 74.0498C35.69 73.238 34.7006 72.2042 34.2313 70.9484C33.762 69.6927 33.5273 67.9105 33.5273 65.6019V63.5851H40.9668V67.3333C40.9668 68.4876 41.0683 69.2297 41.2712 69.5595C41.4869 69.8893 41.8611 70.0542 42.3938 70.0542C42.9266 70.0542 43.3198 69.8449 43.5735 69.4263C43.8399 69.0077 43.973 68.3862 43.973 67.5617C43.973 65.7478 43.7257 64.5618 43.231 64.0036C42.7236 63.4455 41.4742 62.5132 39.4827 61.2067C37.4912 59.8875 36.172 58.9298 35.5251 58.3336C34.8782 57.7375 34.3391 56.913 33.9079 55.8602C33.4893 54.8073 33.28 53.4628 33.28 51.8265C33.28 49.4672 33.5781 47.7421 34.1742 46.6512C34.7831 45.5603 35.7598 44.7104 37.1044 44.1016C38.4489 43.48 40.0725 43.1693 41.9752 43.1693C44.0555 43.1693 45.825 43.5054 47.2837 44.1777C48.7551 44.85 49.7255 45.6998 50.1948 46.7273C50.6768 47.7421 50.9178 49.4735 50.9178 51.9216V53.1393Z"
                              fill="#1D2125"
                            ></path>
                          </svg>
                        </div>
                        <div
                          className="absolute"
                          style={{
                            width: 169,
                            height: 384,
                            transform: "translateX(-150px) translateY(50px)",
                            transition: "none",
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 96 156"
                            fill="none"
                          >
                            <rect
                              x="63.041"
                              y="-23"
                              width="18"
                              height="25"
                              transform="rotate(11.6336 63.041 -23)"
                              fill="#CEE6FA"
                            ></rect>
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M40.5016 28.1569C40.7716 26.9657 41.9801 26 43.2008 26H78.5722C79.7929 26 80.5635 26.9657 80.2935 28.1569L79.3595 32.2768C79.3108 32.4918 79.0935 32.6539 78.866 32.6857C78.616 32.7209 78.4323 32.8302 78.358 33.1579C78.2837 33.4857 78.4215 33.5949 78.6519 33.6302C78.865 33.6619 79.0088 33.824 78.9601 34.039L67.8459 83.066C67.5758 84.2572 66.3673 85.2229 65.1466 85.2229H29.7752C28.5545 85.2229 27.7839 84.2572 28.0539 83.066L39.1681 34.039C39.2169 33.824 39.4342 33.6619 39.6617 33.6302C39.9116 33.5949 40.0953 33.4857 40.1696 33.1579C40.2439 32.8302 40.1062 32.7209 39.8758 32.6857C39.6627 32.6539 39.5189 32.4918 39.5676 32.2768L40.5016 28.1569Z"
                              fill="#5BACEE"
                            ></path>
                            <path
                              d="M50.3189 50.8416C49.716 51.0584 49.3198 51.6751 49.4339 52.219L51.0872 60.0989C51.2014 60.6428 51.7826 60.9081 52.3854 60.6914L57.2976 58.9253C57.9005 58.7086 58.2967 58.0919 58.1825 57.5479L56.5293 49.6681C56.4151 49.1241 55.8339 48.8588 55.231 49.0756L50.3189 50.8416Z"
                              fill="#CEE6FA"
                            ></path>
                            <path
                              d="M58.4019 54.8566L59.2356 50.5976C59.3502 50.012 58.9545 49.5393 58.3518 49.5417L57.2876 49.5459L58.4019 54.8566Z"
                              fill="#CEE6FA"
                            ></path>
                            <path
                              d="M58.7204 56.2895L61.2353 52.3776C61.5811 51.8398 61.4505 51.216 60.9436 50.9844L60.0488 50.5756L58.7204 56.2895Z"
                              fill="#CEE6FA"
                            ></path>
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M55.5016 -33.8431C55.7716 -35.0343 56.9801 -36 58.2008 -36H93.5722C94.7929 -36 95.5635 -35.0343 95.2935 -33.8431L94.3595 -29.7232C94.3108 -29.5082 94.0935 -29.3461 93.866 -29.3143C93.616 -29.2791 93.4323 -29.1698 93.358 -28.8421C93.2837 -28.5143 93.4215 -28.4051 93.6519 -28.3698C93.865 -28.3381 94.0088 -28.176 93.9601 -27.961L82.8459 21.066C82.5758 22.2572 81.3673 23.2229 80.1466 23.2229H44.7752C43.5545 23.2229 42.7839 22.2572 43.0539 21.066L54.1681 -27.961C54.2169 -28.176 54.4342 -28.3381 54.6617 -28.3698C54.9116 -28.4051 55.0953 -28.5143 55.1696 -28.8421C55.2439 -29.1698 55.1062 -29.2791 54.8758 -29.3143C54.6627 -29.3461 54.5189 -29.5082 54.5676 -29.7232L55.5016 -33.8431Z"
                              fill="#5BACEE"
                            ></path>
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M26.5016 90.1569C26.7716 88.9657 27.9801 88 29.2008 88H64.5722C65.7929 88 66.5635 88.9657 66.2935 90.1569L65.3595 94.2768C65.3108 94.4918 65.0935 94.6539 64.866 94.6857C64.616 94.7209 64.4323 94.8302 64.358 95.1579C64.2837 95.4857 64.4215 95.5949 64.6519 95.6302C64.865 95.6619 65.0088 95.824 64.9601 96.039L53.8459 145.066C53.5758 146.257 52.3673 147.223 51.1466 147.223H15.7752C14.5545 147.223 13.7839 146.257 14.0539 145.066L25.1681 96.039C25.2169 95.824 25.4342 95.6619 25.6617 95.6302C25.9116 95.5949 26.0953 95.4857 26.1696 95.1579C26.2439 94.8302 26.1062 94.7209 25.8758 94.6857C25.6627 94.6539 25.5189 94.4918 25.5676 94.2768L26.5016 90.1569Z"
                              fill="#5BACEE"
                            ></path>
                            <path
                              d="M36.3189 112.842C35.716 113.058 35.3198 113.675 35.4339 114.219L37.0872 122.099C37.2014 122.643 37.7826 122.908 38.3854 122.691L43.2976 120.925C43.9005 120.709 44.2967 120.092 44.1825 119.548L42.5293 111.668C42.4151 111.124 41.8339 110.859 41.231 111.076L36.3189 112.842Z"
                              fill="#CEE6FA"
                            ></path>
                            <path
                              d="M44.4019 116.857L45.2356 112.598C45.3502 112.012 44.9545 111.539 44.3518 111.542L43.2876 111.546L44.4019 116.857Z"
                              fill="#CEE6FA"
                            ></path>
                            <path
                              d="M44.7204 118.289L47.2353 114.378C47.5811 113.84 47.4505 113.216 46.9436 112.984L46.0488 112.576L44.7204 118.289Z"
                              fill="#CEE6FA"
                            ></path>
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M12.5016 152.157C12.7716 150.966 13.9801 150 15.2008 150H50.5722C51.7929 150 52.5635 150.966 52.2935 152.157L51.3595 156.277C51.3108 156.492 51.0935 156.654 50.866 156.686C50.616 156.721 50.4323 156.83 50.358 157.158C50.2837 157.486 50.4215 157.595 50.6519 157.63C50.865 157.662 51.0088 157.824 50.9601 158.039L39.8459 207.066C39.5758 208.257 38.3673 209.223 37.1466 209.223H1.77523C0.554527 209.223 -0.216124 208.257 0.0539216 207.066L11.1681 158.039C11.2169 157.824 11.4342 157.662 11.6617 157.63C11.9116 157.595 12.0953 157.486 12.1696 157.158C12.2439 156.83 12.1062 156.721 11.8758 156.686C11.6627 156.654 11.5189 156.492 11.5676 156.277L12.5016 152.157Z"
                              fill="#5BACEE"
                            ></path>
                          </svg>
                        </div>
                        <div
                          className="absolute"
                          style={{
                            width: 169,
                            height: 384,
                            transform: "translateX(150px) translateY(60px)",
                            transition: "none",
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 96 156"
                            fill="none"
                          >
                            <rect
                              x="63.041"
                              y="-5"
                              width="18"
                              height="25"
                              transform="rotate(11.6336 63.041 -5)"
                              fill="#CEE6FA"
                            ></rect>
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M40.5016 46.1569C40.7716 44.9657 41.9801 44 43.2008 44H78.5722C79.7929 44 80.5635 44.9657 80.2935 46.1569L79.3595 50.2768C79.3108 50.4918 79.0935 50.6539 78.866 50.6857C78.616 50.7209 78.4323 50.8302 78.358 51.1579C78.2837 51.4857 78.4215 51.5949 78.6519 51.6302C78.865 51.6619 79.0088 51.824 78.9601 52.039L67.8459 101.066C67.5758 102.257 66.3673 103.223 65.1466 103.223H29.7752C28.5545 103.223 27.7839 102.257 28.0539 101.066L39.1681 52.039C39.2169 51.824 39.4342 51.6619 39.6617 51.6302C39.9116 51.5949 40.0953 51.4857 40.1696 51.1579C40.2439 50.8302 40.1062 50.7209 39.8758 50.6857C39.6627 50.6539 39.5189 50.4918 39.5676 50.2768L40.5016 46.1569Z"
                              fill="#5BACEE"
                            ></path>
                            <path
                              d="M50.3189 68.8416C49.716 69.0584 49.3198 69.6751 49.4339 70.219L51.0872 78.0989C51.2014 78.6428 51.7826 78.9081 52.3854 78.6914L57.2976 76.9253C57.9005 76.7086 58.2967 76.0919 58.1825 75.5479L56.5293 67.6681C56.4151 67.1241 55.8339 66.8588 55.231 67.0756L50.3189 68.8416Z"
                              fill="#CEE6FA"
                            ></path>
                            <path
                              d="M58.4019 72.8566L59.2356 68.5976C59.3502 68.012 58.9545 67.5393 58.3518 67.5417L57.2876 67.5459L58.4019 72.8566Z"
                              fill="#CEE6FA"
                            ></path>
                            <path
                              d="M58.7204 74.2895L61.2353 70.3776C61.5811 69.8398 61.4505 69.216 60.9436 68.9844L60.0488 68.5756L58.7204 74.2895Z"
                              fill="#CEE6FA"
                            ></path>
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M55.5016 -15.8431C55.7716 -17.0343 56.9801 -18 58.2008 -18H93.5722C94.7929 -18 95.5635 -17.0343 95.2935 -15.8431L94.3595 -11.7232C94.3108 -11.5082 94.0935 -11.3461 93.866 -11.3143C93.616 -11.2791 93.4323 -11.1698 93.358 -10.8421C93.2837 -10.5143 93.4215 -10.4051 93.6519 -10.3698C93.865 -10.3381 94.0088 -10.176 93.9601 -9.961L82.8459 39.066C82.5758 40.2572 81.3673 41.2229 80.1466 41.2229H44.7752C43.5545 41.2229 42.7839 40.2572 43.0539 39.066L54.1681 -9.961C54.2169 -10.176 54.4342 -10.3381 54.6617 -10.3698C54.9116 -10.4051 55.0953 -10.5143 55.1696 -10.8421C55.2439 -11.1698 55.1062 -11.2791 54.8758 -11.3143C54.6627 -11.3461 54.5189 -11.5082 54.5676 -11.7232L55.5016 -15.8431Z"
                              fill="#5BACEE"
                            ></path>
                            <path
                              d="M65.3189 6.84161C64.716 7.05836 64.3198 7.67506 64.4339 8.21904L66.0872 16.0989C66.2014 16.6428 66.7826 16.9081 67.3854 16.6914L72.2976 14.9253C72.9005 14.7086 73.2967 14.0919 73.1825 13.5479L71.5293 5.66811C71.4151 5.12413 70.8339 4.85884 70.231 5.07559L65.3189 6.84161Z"
                              fill="#CEE6FA"
                            ></path>
                            <path
                              d="M73.4019 10.8566L74.2356 6.59757C74.3502 6.01199 73.9545 5.53925 73.3518 5.54167L72.2876 5.54594L73.4019 10.8566Z"
                              fill="#CEE6FA"
                            ></path>
                            <path
                              d="M73.7204 12.2895L61.2353 8.37758C61.5811 7.83975 61.4505 7.21601 60.9436 6.98442L60.0488 6.57559L73.7204 12.2895Z"
                              fill="#CEE6FA"
                            ></path>
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M26.5016 108.157C26.7716 106.966 27.9801 106 29.2008 106H64.5722C65.7929 106 66.5635 106.966 66.2935 108.157L65.3595 112.277C65.3108 112.492 65.0935 112.654 64.866 112.686C64.616 112.721 64.4323 112.83 64.358 113.158C64.2837 113.486 64.4215 113.595 64.6519 113.63C64.865 113.662 65.0088 113.824 64.9601 114.039L53.8459 163.066C53.5758 164.257 52.3673 165.223 51.1466 165.223H15.7752C14.5545 165.223 13.7839 164.257 14.0539 163.066L25.1681 114.039C25.2169 113.824 25.4342 113.662 25.6617 113.63C25.9116 113.595 26.0953 113.486 26.1696 113.158C26.2439 112.83 26.1062 112.721 25.8758 112.686C25.6627 112.654 25.5189 112.492 25.5676 112.277L26.5016 108.157Z"
                              fill="#5BACEE"
                            ></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="md:p-4"
                    style={{ backgroundColor: "#22272B", color: "#FFFFFF" }}
                  >
                    <h3 className="font-semibold mb-1 text-center">经典</h3>
                  </div>
                </div>
              </div>

              {/* 分享模式 */}
              <div
                className="rounded-xl border bg-gray-700 border-gray-600 text-card-foreground shadow-sm cursor-pointer overflow-hidden"
                style={{
                  borderColor: selectedMode === "share" ? "#4299E1" : "#34383C",
                  backgroundColor: "#22272B",
                }}
                role="button"
                aria-pressed={selectedMode === "share"}
                onClick={() => {
                  setSelectedMode("share");
                  replaceUrl({ gameMode: "share" });
                }}
              >
                <div className="p-6 md:p-0 gap-1 md:gap-0 flex flex-col">
                  <div className="md:hidden h-full w-full flex items-center justify-center">
                    <div className="size-8 text-blue-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-handshake"
                      >
                        <path d="m11 17 2 2a1 1 0 1 0 3-3"></path>
                        <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"></path>
                        <path d="m21 3 1 11h-2"></path>
                        <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"></path>
                        <path d="M3 4h8"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="hidden md:block h-40 w-full rounded-xl rounded-b-none overflow-hidden">
                    <div
                      className="flex relative w-full h-full"
                      style={{ backgroundColor: "#1D2125" }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 298 156"
                        fill="none"
                        className="w-full h-full"
                        preserveAspectRatio="xMidYMid slice"
                      >
                        <path
                          d="M-41.8648 -14.5058L60.494 91.0306L-47.334 -0.0466499V14.9498L28.8814 76.2507L-47.334 20.9243V49.9789L21.4846 93.1798L-47.334 59.5461V76.0582L55.8286 124.496L-47.334 82.0407V111.881L27.5811 131.593L-47.334 115.835V129.139L46.5957 143.807L-47.334 133.959V160.271L11.5461 162.123L-47.334 163.238V177.328L34.4224 171.979L-47.334 181.474V189.478L33.7494 179.101L-39.6889 197H-5.84156L-1.51589 195.845L-5.1032 197H347.511L251.222 183.006L352.666 192.549V169.862L295.276 169.541L352.666 166.967V151.554L226.509 155.275L352.666 145.178V135.13L271.164 140.463L352.666 130.992V110.823L267.329 127.022L352.666 99.0741V85.1603L246.132 121.938L349.19 80.477L352.666 82.5299V69.0412L218.897 126.95L352.666 60.8773V36.1212L236.154 104.022L352.666 28.2541V13.2657L295.099 52.922L352.666 8.61438V-0.832561L209.514 110.061L352.666 -12.0759V-41.8281L209.037 93.4364L340.682 -50H260.631L184.867 83.8852L253.039 -50H235.278L236.834 -46.8804L190.558 56.6832L232.214 -50H203.019L166.257 68.8808L184.527 -50H165.846L154.411 52.7937L160.853 -50H138.539L141.375 -47.4658L139.467 86.3472L134.899 -50H114.186L117.172 -47.9631L127.646 64.9272L111.389 -50H104.071L119.779 51.6389L99.0003 -50H71.2494L112.396 83.9333L69.2695 -35.1399L97.5105 50.6926L58.7494 -50H36.6898L94.9622 73.0269L29.1166 -50H-11.8139L84.9125 86.8765L-18.995 -45.7417L-18.0345 -50H-47.334V-12.958L-41.8648 -14.5058ZM309.997 -48.1315L213.533 75.1761L302.738 -48.0513L309.997 -48.1315ZM263.487 -31.1141L265.656 -24.057L192.388 83.797L263.487 -31.1141ZM-28.4304 -38.484L66.9499 75.5129L-38.088 -38.075L-28.4304 -38.484Z"
                          fill="#1D2125"
                        ></path>
                      </svg>
                      <div
                        className="flex absolute justify-center items-center w-full h-full"
                        style={{ transform: "scale(0.6) translateY(10px)" }}
                      >
                        <div
                          className="absolute"
                          style={{
                            width: 110,
                            height: 90,
                            transform: "translateX(-180px) translateY(150px)",
                            transition: "transform 0.3s",
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 54 56"
                            fill="none"
                          >
                            <path
                              d="M52.6728 60L53.3394 1.33521L0.666016 0.430176L2.23907 60H52.6728Z"
                              fill="#5BACEE"
                            ></path>
                            <path
                              d="M53.3394 2.53714V1.33521L0.666016 0.430176L0.8003 3.016L53.3394 2.53714Z"
                              fill="#AFCBF4"
                            ></path>
                            <path
                              d="M40.5816 23.1039L38.0877 16.228L39.8417 15.5918L42.3357 22.4677L40.5816 23.1039ZM42.6007 25.9125C42.306 26.0194 42.0184 26.0072 41.7379 25.8761C41.4622 25.7432 41.27 25.5271 41.1614 25.2277C41.0562 24.9377 41.0677 24.6557 41.1959 24.3816C41.3288 24.1058 41.5425 23.9145 41.8372 23.8076C42.1272 23.7024 42.4093 23.7139 42.6833 23.8421C42.9574 23.9703 43.1471 24.1794 43.2522 24.4694C43.3608 24.7687 43.3519 25.0578 43.2254 25.3366C43.0989 25.6153 42.8907 25.8073 42.6007 25.9125Z"
                              fill="white"
                              fillOpacity="0.7"
                            ></path>
                            <path
                              d="M31.5404 29.7177L27.9776 19.895L30.2509 19.0705L36.0267 23.7874L33.8432 17.7675L35.9481 17.0041L39.5108 26.8268L37.2376 27.6513L31.4618 22.9343L33.6453 28.9542L31.5404 29.7177Z"
                              fill="white"
                              fillOpacity="0.7"
                            ></path>
                            <path
                              d="M26.9826 31.3708L23.4198 21.5481L25.5247 20.7847L29.0875 30.6074L26.9826 31.3708Z"
                              fill="white"
                              fillOpacity="0.7"
                            ></path>
                          </svg>
                        </div>
                        <div
                          className="absolute"
                          style={{
                            width: 111,
                            height: 90,
                            transform: "translateX(-60px) translateY(150px)",
                            transition: "transform 0.3s",
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 54 56"
                            fill="none"
                          >
                            <path
                              d="M53.2294 60L53.896 1.33521L1.22266 0.430176L2.79571 60H53.2294Z"
                              fill="#5BACEE"
                            ></path>
                            <path
                              d="M40.5816 23.1039L38.0877 16.228L39.8417 15.5918L42.3357 22.4677L40.5816 23.1039ZM42.6007 25.9125C42.306 26.0194 42.0184 26.0072 41.7379 25.8761C41.4622 25.7432 41.27 25.5271 41.1614 25.2277C41.0562 24.9377 41.0677 24.6557 41.1959 24.3816C41.3288 24.1058 41.5425 23.9145 41.8372 23.8076C42.1272 23.7024 42.4093 23.7139 42.6833 23.8421C42.9574 23.9703 43.1471 24.1794 43.2522 24.4694C43.3608 24.7687 43.3519 25.0578 43.2254 25.3366C43.0989 25.6153 42.8907 25.8073 42.6007 25.9125Z"
                              fill="white"
                              fillOpacity="0.7"
                            ></path>
                            <path
                              d="M31.5404 29.7177L27.9776 19.895L30.2509 19.0705L36.0267 23.7874L33.8432 17.7675L35.9481 17.0041L39.5108 26.8268L37.2376 27.6513L31.4618 22.9343L33.6453 28.9542L31.5404 29.7177Z"
                              fill="white"
                              fillOpacity="0.7"
                            ></path>
                            <path
                              d="M26.9826 31.3708L23.4198 21.5481L25.5247 20.7847L29.0875 30.6074L26.9826 31.3708Z"
                              fill="white"
                              fillOpacity="0.7"
                            ></path>
                            <path
                              d="M53.7334 3.78217V1.46156L0.978516 0.430176L1.11218 3.21491L53.7334 3.78217Z"
                              fill="#AFCBF4"
                            ></path>
                          </svg>
                        </div>
                        <div
                          className="absolute"
                          style={{
                            width: 110,
                            height: 90,
                            transform: "translateX(60px) translateY(150px)",
                            transition: "transform 0.3s",
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 54 56"
                            fill="none"
                          >
                            <path
                              d="M52.6728 60L53.3394 1.33521L0.666016 0.430176L2.23907 60H52.6728Z"
                              fill="#5BACEE"
                            ></path>
                            <path
                              d="M53.3394 2.53714V1.33521L0.666016 0.430176L0.8003 3.016L53.3394 2.53714Z"
                              fill="#AFCBF4"
                            ></path>
                            <path
                              d="M40.5816 23.1039L38.0877 16.228L39.8417 15.5918L42.3357 22.4677L40.5816 23.1039ZM42.6007 25.9125C42.306 26.0194 42.0184 26.0072 41.7379 25.8761C41.4622 25.7432 41.27 25.5271 41.1614 25.2277C41.0562 24.9377 41.0677 24.6557 41.1959 24.3816C41.3288 24.1058 41.5425 23.9145 41.8372 23.8076C42.1272 23.7024 42.4093 23.7139 42.6833 23.8421C42.9574 23.9703 43.1471 24.1794 43.2522 24.4694C43.3608 24.7687 43.3519 25.0578 43.2254 25.3366C43.0989 25.6153 42.8907 25.8073 42.6007 25.9125Z"
                              fill="white"
                              fillOpacity="0.7"
                            ></path>
                            <path
                              d="M31.5404 29.7177L27.9776 19.895L30.2509 19.0705L36.0267 23.7874L33.8432 17.7675L35.9481 17.0041L39.5108 26.8268L37.2376 27.6513L31.4618 22.9343L33.6453 28.9542L31.5404 29.7177Z"
                              fill="white"
                              fillOpacity="0.7"
                            ></path>
                            <path
                              d="M26.9826 31.3708L23.4198 21.5481L25.5247 20.7847L29.0875 30.6074L26.9826 31.3708Z"
                              fill="white"
                              fillOpacity="0.7"
                            ></path>
                          </svg>
                        </div>
                        <div
                          className="absolute"
                          style={{
                            width: 111,
                            height: 90,
                            transform: "translateX(180px) translateY(150px)",
                            transition: "transform 0.3s",
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 54 56"
                            fill="none"
                          >
                            <path
                              d="M53.2294 60L53.896 1.33521L1.22266 0.430176L2.79571 60H53.2294Z"
                              fill="#5BACEE"
                            ></path>
                            <path
                              d="M40.5816 23.1039L38.0877 16.228L39.8417 15.5918L42.3357 22.4677L40.5816 23.1039ZM42.6007 25.9125C42.306 26.0194 42.0184 26.0072 41.7379 25.8761C41.4622 25.7432 41.27 25.5271 41.1614 25.2277C41.0562 24.9377 41.0677 24.6557 41.1959 24.3816C41.3288 24.1058 41.5425 23.9145 41.8372 23.8076C42.1272 23.7024 42.4093 23.7139 42.6833 23.8421C42.9574 23.9703 43.1471 24.1794 43.2522 24.4694C43.3608 24.7687 43.3519 25.0578 43.2254 25.3366C43.0989 25.6153 42.8907 25.8073 42.6007 25.9125Z"
                              fill="white"
                              fillOpacity="0.7"
                            ></path>
                            <path
                              d="M31.5404 29.7177L27.9776 19.895L30.2509 19.0705L36.0267 23.7874L33.8432 17.7675L35.9481 17.0041L39.5108 26.8268L37.2376 27.6513L31.4618 22.9343L33.6453 28.9542L31.5404 29.7177Z"
                              fill="white"
                              fillOpacity="0.7"
                            ></path>
                            <path
                              d="M53.7334 3.78217V1.46156L0.978516 0.430176L1.11218 3.21491L53.7334 3.78217Z"
                              fill="#AFCBF4"
                            ></path>
                          </svg>
                        </div>
                        <div
                          className="absolute"
                          style={{
                            width: 93,
                            height: 92,
                            transform: "translateX(-180px) translateY(-40px)",
                          }}
                        >
                          <svg
                            viewBox="0 0 93 92"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M50.9102 88.4902C72.6813 88.4902 90.3302 70.8412 90.3302 49.0701C90.3302 27.2991 72.6813 9.65015 50.9102 9.65015C29.1392 9.65015 11.4902 27.2991 11.4902 49.0701C11.4902 70.8412 29.1392 88.4902 50.9102 88.4902Z"
                              fill="white"
                            ></path>
                            <path
                              d="M51.7307 86.6901C72.0547 86.6901 88.5307 70.2142 88.5307 49.8901C88.5307 29.566 72.0547 13.0901 51.7307 13.0901C31.4066 13.0901 14.9307 29.566 14.9307 49.8901C14.9307 70.2142 31.4066 86.6901 51.7307 86.6901Z"
                              fill="#D6ECFF"
                            ></path>
                            <path
                              d="M27.073 66.7336C19.2875 47.96 28.1963 26.4368 46.9699 18.6512C53.435 15.9691 60.2205 15.275 66.6686 16.2704C57.8406 12.4456 47.5373 12.0585 37.9437 16.0242C19.17 23.8097 10.2612 45.3329 18.0468 64.1065C23.1501 76.4151 34.1615 84.4863 46.4304 86.3843C37.9802 82.7383 30.8857 75.9205 27.073 66.7336Z"
                              fill="#B2DCFF"
                            ></path>
                            <path
                              d="M55.1407 49.2302C56.179 49.2302 57.0207 48.3885 57.0207 47.3502C57.0207 46.3119 56.179 45.4702 55.1407 45.4702C54.1024 45.4702 53.2607 46.3119 53.2607 47.3502C53.2607 48.3885 54.1024 49.2302 55.1407 49.2302Z"
                              fill="#1D2630"
                            ></path>
                            <path
                              d="M68.7911 47.0602C69.8294 47.0602 70.6711 46.2185 70.6711 45.1802C70.6711 44.1419 69.8294 43.3002 68.7911 43.3002C67.7528 43.3002 66.9111 44.1419 66.9111 45.1802C66.9111 46.2185 67.7528 47.0602 68.7911 47.0602Z"
                              fill="#1D2630"
                            ></path>
                            <path
                              d="M64.1811 62.7101C66.7216 62.7101 68.7811 60.6506 68.7811 58.1101C68.7811 55.5696 66.7216 53.5101 64.1811 53.5101C61.6405 53.5101 59.5811 55.5696 59.5811 58.1101C59.5811 60.6506 61.6405 62.7101 64.1811 62.7101Z"
                              fill="#1D2630"
                            ></path>
                          </svg>
                        </div>
                        <div
                          className="absolute"
                          style={{
                            width: 79,
                            height: 78,
                            transform: "translateX(-60px) translateY(-10px)",
                          }}
                        >
                          <svg
                            viewBox="0 0 79 78"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M39.2903 77.4899C60.6527 77.4899 77.9704 60.1723 77.9704 38.8099C77.9704 17.4475 60.6527 0.129883 39.2903 0.129883C17.928 0.129883 0.610352 17.4475 0.610352 38.8099C0.610352 60.1723 17.928 77.4899 39.2903 77.4899Z"
                              fill="white"
                            ></path>
                            <path
                              d="M41.3406 75.1998C61.7696 75.1998 78.3306 58.6389 78.3306 38.2098C78.3306 17.7808 61.7696 1.21985 41.3406 1.21985C20.9116 1.21985 4.35059 17.7808 4.35059 38.2098C4.35059 58.6389 20.9116 75.1998 41.3406 75.1998Z"
                              fill="#D6ECFF"
                            ></path>
                            <path
                              d="M33.1054 66.6411C14.7436 57.2807 7.52069 35.0694 16.9656 17.0249C20.2174 10.8101 25.0228 5.911 30.6759 2.52242C21.3201 5.27689 13.0772 11.6127 8.24225 20.8239C-1.20262 38.8684 6.02029 61.0797 24.3821 70.4401C36.4198 76.5778 50.2564 75.6686 61.0153 69.2243C52.0596 71.8714 42.0828 71.2187 33.1054 66.6411Z"
                              fill="#B2DCFF"
                            ></path>
                            <path
                              d="M37 42.2399C38.99 46.0999 43.25 48.4999 47.81 47.9099C52.3 47.3299 55.76 44.0299 56.77 39.8799L37 42.2399Z"
                              fill="#1D2630"
                            ></path>
                            <path
                              d="M53.0904 31.1799C54.1398 31.1799 54.9904 30.3292 54.9904 29.2799C54.9904 28.2305 54.1398 27.3799 53.0904 27.3799C52.0411 27.3799 51.1904 28.2305 51.1904 29.2799C51.1904 30.3292 52.0411 31.1799 53.0904 31.1799Z"
                              fill="#1D2630"
                            ></path>
                            <path
                              d="M39.2399 32.9699C40.2892 32.9699 41.1398 32.1193 41.1398 31.0699C41.1398 30.0206 40.2892 29.1699 39.2399 29.1699C38.1905 29.1699 37.3398 30.0206 37.3398 31.0699C37.3398 32.1193 38.1905 32.9699 39.2399 32.9699Z"
                              fill="#1D2630"
                            ></path>
                          </svg>
                        </div>
                        <div
                          className="absolute"
                          style={{
                            width: 88,
                            height: 90,
                            transform: "translateX(60px) translateY(-40px)",
                          }}
                        >
                          <svg
                            viewBox="0 0 88 90"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M39.7404 87.911C61.5612 87.911 79.2505 70.2218 79.2505 48.401C79.2505 26.5802 61.5612 8.89099 39.7404 8.89099C17.9197 8.89099 0.230469 26.5802 0.230469 48.401C0.230469 70.2218 17.9197 87.911 39.7404 87.911Z"
                              fill="white"
                            ></path>
                            <path
                              d="M38.0603 83.7111C58.4893 83.7111 75.0503 67.1501 75.0503 46.7211C75.0503 26.2921 58.4893 9.73108 38.0603 9.73108C17.6313 9.73108 1.07031 26.2921 1.07031 46.7211C1.07031 67.1501 17.6313 83.7111 38.0603 83.7111Z"
                              fill="#D6ECFF"
                            ></path>
                            <path
                              d="M55.0602 71.4811C69.4368 56.8136 69.2062 33.4233 54.55 19.2295C49.5032 14.3406 43.4063 11.1908 36.9884 9.74357C46.7036 9.42499 56.5048 12.8617 63.9993 20.1029C78.6556 34.2966 78.8861 57.687 64.5095 72.3545C55.0848 81.9714 41.7219 85.4519 29.5088 82.7021C38.8119 82.407 48.0315 78.6534 55.0602 71.4811Z"
                              fill="#B2DCFF"
                            ></path>
                            <path
                              d="M37.2004 48.4401C36.6204 53.4101 33.0004 57.7201 27.8504 58.9301C22.7804 60.1201 17.7004 57.9701 14.9404 53.9101L37.2004 48.4401Z"
                              fill="#1D2630"
                            ></path>
                            <path
                              d="M14.1194 42.3329C14.8721 42.1559 15.2578 41.0579 14.981 39.8804C14.7041 38.703 13.8695 37.892 13.1168 38.0689C12.3641 38.2459 11.9783 39.3439 12.2552 40.5214C12.5321 41.6988 13.3667 42.5099 14.1194 42.3329Z"
                              fill="#1D2630"
                            ></path>
                            <path
                              d="M28.3303 38.913C29.083 38.736 29.4688 37.638 29.1919 36.4605C28.9151 35.2831 28.0804 34.472 27.3277 34.649C26.575 34.826 26.1893 35.924 26.4661 37.1014C26.743 38.2789 27.5776 39.0899 28.3303 38.913Z"
                              fill="#1D2630"
                            ></path>
                          </svg>
                        </div>
                        <div
                          className="absolute"
                          style={{
                            width: 88,
                            height: 90,
                            transform: "translateX(180px) translateY(-30px)",
                          }}
                        >
                          <svg
                            viewBox="0 0 88 90"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M40.4697 85.9198C62.169 85.9198 79.7597 68.3291 79.7597 46.6298C79.7597 24.9306 62.169 7.33984 40.4697 7.33984C18.7704 7.33984 1.17969 24.9306 1.17969 46.6298C1.17969 68.3291 18.7704 85.9198 40.4697 85.9198Z"
                              fill="white"
                            ></path>
                            <path
                              d="M37.6296 85.0598C58.0587 85.0598 74.6196 68.4988 74.6196 48.0698C74.6196 27.6408 58.0587 11.0798 37.6296 11.0798C17.2006 11.0798 0.639648 27.6408 0.639648 48.0698C0.639648 68.4988 17.2006 85.0598 37.6296 85.0598Z"
                              fill="#D6ECFF"
                            ></path>
                            <path
                              d="M42.5394 51.3899C41.1594 55.5099 37.3094 58.5199 32.7194 58.6299C28.1994 58.7399 24.2694 55.9999 22.6494 52.0499L42.5394 51.3899Z"
                              fill="#1D2630"
                            ></path>
                            <path
                              d="M24.6696 42.9199C25.7189 42.9199 26.5695 42.0692 26.5695 41.0199C26.5695 39.9705 25.7189 39.1199 24.6696 39.1199C23.6202 39.1199 22.7695 39.9705 22.7695 41.0199C22.7695 42.0692 23.6202 42.9199 24.6696 42.9199Z"
                              fill="#1D2630"
                            ></path>
                            <path
                              d="M38.6295 42.5899C39.6788 42.5899 40.5295 41.7393 40.5295 40.6899C40.5295 39.6406 39.6788 38.7899 38.6295 38.7899C37.5801 38.7899 36.7295 39.6406 36.7295 40.6899C36.7295 41.7393 37.5801 42.5899 38.6295 42.5899Z"
                              fill="#1D2630"
                            ></path>
                            <path
                              d="M56.1304 24.3016C69.5715 39.7032 68.0653 63.0011 52.7801 76.3395C47.5149 80.93 41.2994 83.7482 34.8715 84.84C44.4766 85.6844 54.3772 82.7948 62.1899 75.985C77.4841 62.6422 78.9769 39.3398 65.5403 23.9471C56.7299 13.8465 43.6812 9.65694 31.4293 11.7295C40.6319 12.5286 49.5617 16.7709 56.1304 24.3016Z"
                              fill="#B2DCFF"
                            ></path>
                          </svg>
                        </div>
                        <div
                          className="absolute"
                          style={{
                            width: 55,
                            height: 34,
                            transform: "translateX(-170px) translateY(-210px)",
                            transition: "transform 0.3s",
                          }}
                        >
                          <svg
                            viewBox="0 0 55 34"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M52.6903 7.35986L49.9103 31.4099L0.280273 24.8699L3.52027 0.799864L16.9103 13.2399L27.5303 0.109863L35.5603 15.5099L52.6903 7.35986Z"
                              fill="#1D2630"
                            ></path>
                            <path
                              d="M54.2206 9.68994L51.4406 33.7399L1.81055 27.1999L5.05055 3.12994L18.4406 15.5599L29.0605 2.43994L37.0905 17.8399L54.2206 9.68994Z"
                              fill="white"
                            ></path>
                          </svg>
                        </div>
                        <div
                          className="absolute"
                          style={{
                            width: 52,
                            height: 32,
                            transform: "translateX(-65px) translateY(-220px)",
                            transition: "transform 0.3s",
                          }}
                        >
                          <svg
                            viewBox="0 0 52 32"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M49.9001 3.08994L51.2301 27.2699L1.21008 29.2099L0.330078 4.92994L15.6301 14.9299L23.8801 0.189941L34.3901 14.0199L49.9001 3.08994Z"
                              fill="#1D2630"
                            ></path>
                            <path
                              d="M49.9303 5.85996L51.2604 30.04L1.24036 31.98L0.360352 7.69996L15.6604 17.7L23.9104 2.95996L34.4203 16.79L49.9303 5.85996Z"
                              fill="white"
                            ></path>
                          </svg>
                        </div>
                        <div
                          className="absolute"
                          style={{
                            width: 58,
                            height: 46,
                            transform: "translateX(30px) translateY(-200px)",
                            transition: "transform 0.3s",
                          }}
                        >
                          <svg
                            viewBox="0 0 58 46"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M47.2404 0L57.9704 21.7L12.7604 43.17L2.40039 21.21L20.3904 24.37L22.1704 7.58L37.2804 16.15L47.2404 0Z"
                              fill="#1D2630"
                            ></path>
                            <path
                              d="M45.7502 2.83984L56.4802 24.5298L11.2701 46.0098L0.910156 24.0398L18.9001 27.2098L20.6902 10.4198L35.7902 18.9898L45.7502 2.83984Z"
                              fill="white"
                            ></path>
                          </svg>
                        </div>
                        <div
                          className="absolute"
                          style={{
                            width: 55,
                            height: 31,
                            transform: "translateX(180px) translateY(-215px)",
                            transition: "transform 0.3s",
                          }}
                        >
                          <svg
                            viewBox="0 0 55 31"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M54.1704 5.38986L53.5005 29.5899L3.48047 27.3999L4.62045 3.13986L19.0405 14.3599L28.4705 0.359863L37.8105 15.0099L54.1704 5.38986Z"
                              fill="#1D2630"
                            ></path>
                            <path
                              d="M50.68 6.63987L50.01 30.8399L0 28.6499L1.13 4.38987L15.55 15.6099L24.99 1.60986L34.32 16.2599L50.68 6.63987Z"
                              fill="white"
                            ></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="md:p-4"
                    style={{ backgroundColor: "#22272B", color: "#FFFFFF" }}
                  >
                    <h3 className="font-semibold mb-1 text-center">分享模式</h3>
                  </div>
                </div>
              </div>

              {/* 积分冲刺 */}
              <div
                className="rounded-xl border bg-gray-700 border-gray-600 text-card-foreground shadow-sm cursor-pointer overflow-hidden"
                style={{
                  borderColor:
                    selectedMode === "sprint" ? "#4299E1" : "#34383C",
                  backgroundColor: "#22272B",
                }}
                role="button"
                aria-pressed={selectedMode === "sprint"}
                onClick={() => {
                  setSelectedMode("sprint");
                  replaceUrl({ gameMode: "sprint" });
                }}
              >
                <div className="p-6 md:p-0 gap-1 md:gap-0 flex flex-col">
                  <div className="md:hidden h-full w-full flex items-center justify-center">
                    <div className="size-8 text-blue-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-target"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="6"></circle>
                        <circle cx="12" cy="12" r="2"></circle>
                      </svg>
                    </div>
                  </div>
                  <div className="hidden md:block h-40 w-full rounded-xl rounded-b-none overflow-hidden">
                    <div
                      className="flex relative w-full h-full"
                      style={{ backgroundColor: "#1D2125" }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 256 152"
                        fill="none"
                        className="w-full h-full"
                        preserveAspectRatio="xMidYMid slice"
                      >
                        <path
                          d="M17.3266 176.898C17.3266 176.898 33.1491 155.467 14.334 133.351C14.334 133.351 43.6603 121.018 22.8714 89.6372C22.8714 89.6372 52.0332 97.7877 61.3081 78.0167C67.6965 61.764 61.3081 39.6583 61.3081 39.6583C61.3081 39.6583 72.2597 61.6783 88.3847 61.8765C109.343 61.8765 115.254 37.3556 115.254 37.3556C115.254 37.3556 118.502 56.8534 140.405 57.1587C162.308 57.4639 179.648 24 179.648 24C179.648 24 172.957 59.0008 189.385 72.5063C205.812 86.0172 226.447 75.8854 226.447 75.8854C226.447 75.8854 216.764 98.4356 223.152 110.645C229.54 122.855 242.869 121.934 242.869 121.934C242.869 121.934 231.191 146.396 246.334 161.701C246.334 161.701 236.534 166.675 237.446 177L17.3266 176.898Z"
                          fill="#22272B"
                        ></path>
                        <path
                          d="M190.329 58.9065L216.109 23.7717L210.907 21.0922L190.329 58.9065Z"
                          fill="#22272B"
                        ></path>
                        <path
                          d="M144.848 49.2145L147.958 7L141.985 7.06231L144.848 49.2145Z"
                          fill="#22272B"
                        ></path>
                        <path
                          d="M54.4934 84.8718L24.0361 53.0156L19.8566 56.9173L54.4934 84.8718Z"
                          fill="#22272B"
                        ></path>
                        <path
                          d="M198.478 73.2864L218.044 51.8076L214.829 49.7226L198.478 73.2864Z"
                          fill="#22272B"
                        ></path>
                        <path
                          d="M227.882 104.011L255.334 91.6926L253.32 88.5866L227.882 104.011Z"
                          fill="#22272B"
                        ></path>
                        <path
                          d="M30.5283 111L8.97536 97.7849L7.33398 100.455L30.5283 111Z"
                          fill="#22272B"
                        ></path>
                        <path
                          d="M58.0017 70.7796L43.5859 51.0552L40.9534 52.9486L58.0017 70.7796Z"
                          fill="#22272B"
                        ></path>
                        <path
                          d="M82.5174 40.5818L72.2654 18.7915L69.3025 20.2152L82.5174 40.5818Z"
                          fill="#22272B"
                        ></path>
                        <path
                          d="M99.6024 54.3865L91.2382 27.5009L87.5412 28.7568L99.6024 54.3865Z"
                          fill="#22272B"
                        ></path>
                        <path
                          d="M200.999 0L205.077 4.18222L210.842 3.19422L208.123 8.35965L210.842 13.5299L205.077 12.5419L200.994 16.7241L200.153 10.9448L194.912 8.35965L200.158 5.77454L200.999 0Z"
                          fill="#22272B"
                        ></path>
                        <path
                          d="M9.85536 41.4819L11.2101 47.1605L16.6673 49.2612L11.676 52.3068L11.359 58.1341L6.92016 54.3403L1.26594 55.8367L3.50938 50.4459L0.333984 45.5442L6.16595 46.0095L9.85536 41.4819Z"
                          fill="#22272B"
                        ></path>
                        <path
                          d="M242.994 71.5343L244.613 75.3568L248.687 76.1913L245.55 78.9107L246.016 83.0354L242.452 80.8963L238.666 82.6133L239.603 78.5654L236.797 75.5007L240.943 75.1458L242.994 71.5343Z"
                          fill="#22272B"
                        ></path>
                      </svg>
                      <div
                        className="flex absolute justify-center items-center w-full h-full"
                        style={{ transform: "scale(0.6)" }}
                      >
                        <div
                          className="absolute"
                          style={{
                            width: 91,
                            height: 90,
                            transform: "translateX(-150px) translateY(80px)",
                          }}
                        >
                          <svg
                            viewBox="0 0 91 90"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M46.9235 87.7684C70.7344 86.9343 89.3608 66.9554 88.5266 43.1445C87.6924 19.3335 67.7136 0.707149 43.9026 1.54133C20.0917 2.37552 1.4653 22.3544 2.29949 46.1653C3.13367 69.9763 23.1125 88.6026 46.9235 87.7684Z"
                              fill="white"
                            ></path>
                            <path
                              d="M49.0542 84.6219C71.3032 83.8424 88.7077 65.1742 87.9282 42.9252C87.1488 20.6763 68.4805 3.27185 46.2316 4.05131C23.9826 4.83077 6.57817 23.499 7.35763 45.7479C8.13709 67.9969 26.8053 85.4014 49.0542 84.6219Z"
                              fill="#D6ECFF"
                            ></path>
                            <path
                              d="M61.754 74.5621C40.2759 80.4177 18.1186 67.7457 12.263 46.2676C10.2529 38.8734 10.4311 31.3926 12.412 24.529C7.02604 33.5932 5.175 44.7348 8.16099 55.707C14.0166 77.1851 36.1738 89.8571 57.652 84.0015C71.7363 80.1661 82.0329 69.3189 85.8076 56.2487C80.6482 64.9247 72.26 71.6925 61.754 74.5621Z"
                              fill="#B2DCFF"
                            ></path>
                            <path
                              d="M63.0147 37.2441C62.4292 39.0957 60.043 40.9604 56.8912 41.8213C53.7791 42.6708 50.8344 42.3036 49.3594 41.0445"
                              stroke="#000002"
                              strokeMiterlimit="10"
                            ></path>
                            <path
                              d="M45.9826 33.6233C46.686 33.4316 47.0138 32.3864 46.7148 31.2886C46.4157 30.1909 45.6031 29.4563 44.8996 29.6479C44.1962 29.8395 43.8684 30.8848 44.1674 31.9825C44.4665 33.0803 45.2791 33.8149 45.9826 33.6233Z"
                              fill="#1D2630"
                            ></path>
                            <path
                              d="M64.7052 28.4521C65.4086 28.2605 65.7364 27.2153 65.4374 26.1175C65.1383 25.0197 64.3257 24.2852 63.6223 24.4768C62.9189 24.6684 62.5911 25.7136 62.8901 26.8114C63.1891 27.9092 64.0018 28.6437 64.7052 28.4521Z"
                              fill="#1D2630"
                            ></path>
                          </svg>
                        </div>
                        <div
                          className="absolute"
                          style={{
                            width: 91,
                            height: 90,
                            transform: "translateX(-40px) translateY(50px)",
                          }}
                        >
                          <svg
                            viewBox="0 0 91 90"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M47.1528 88.2415C70.9858 87.4066 89.6294 67.4092 88.7945 43.5762C87.9595 19.7431 67.9622 1.09951 44.1291 1.93446C20.2961 2.76942 1.65245 22.7668 2.48741 46.5998C3.32237 70.4329 23.3198 89.0765 47.1528 88.2415Z"
                              fill="white"
                            ></path>
                            <path
                              d="M47.0318 84.7935C69.2807 84.014 86.6852 65.3458 85.9057 43.0969C85.1263 20.8479 66.4581 3.44348 44.2091 4.22294C21.9602 5.0024 4.55571 23.6706 5.33517 45.9196C6.11463 68.1685 24.7828 85.573 47.0318 84.7935Z"
                              fill="#D6ECFF"
                            ></path>
                            <path
                              d="M60.3204 73.9515C38.8423 79.8071 16.685 67.1351 10.8294 45.657C8.81933 38.2628 8.99749 30.782 10.9784 23.9184C5.59245 32.9826 3.74141 44.1242 6.7274 55.0964C12.583 76.5745 34.7402 89.2465 56.2184 83.3909C70.3027 79.5555 80.5993 68.7083 84.374 55.6381C79.2146 64.3141 70.8264 71.0819 60.3204 73.9515Z"
                              fill="#B2DCFF"
                            ></path>
                            <path
                              d="M55.5743 39.8671C55.1885 44.5635 51.9328 48.74 47.1157 50.0495C42.3878 51.3358 37.54 49.4844 34.7975 45.7482L55.5743 39.8671Z"
                              fill="#1D2630"
                            ></path>
                            <path
                              d="M34.1239 35.6655C35.2609 35.6256 36.1504 34.6716 36.1105 33.5346C36.0707 32.3976 35.1166 31.5082 33.9796 31.548C32.8426 31.5878 31.9532 32.5418 31.993 33.6789C32.0329 34.8159 32.9869 35.7053 34.1239 35.6655Z"
                              fill="#1D2630"
                            ></path>
                            <path
                              d="M48.7342 31.6816C49.8712 31.6417 50.7607 30.6877 50.7208 29.5507C50.681 28.4137 49.727 27.5243 48.59 27.5641C47.453 27.6039 46.5635 28.558 46.6034 29.695C46.6432 30.832 47.5972 31.7214 48.7342 31.6816Z"
                              fill="#1D2630"
                            ></path>
                          </svg>
                        </div>
                        <div
                          className="absolute"
                          style={{
                            width: 120,
                            height: 118,
                            transform: "translateX(70px) translateY(20px)",
                          }}
                        >
                          <svg
                            viewBox="0 0 120 118"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M66.8756 105.86C95.5051 104.857 117.901 80.835 116.898 52.2055C115.895 23.5761 91.8729 1.18044 63.2435 2.18343C34.614 3.18642 12.2184 27.2083 13.2214 55.8377C14.2243 84.4672 38.2462 106.863 66.8756 105.86Z"
                              fill="white"
                            ></path>
                            <path
                              d="M66.5776 100.507C93.2035 99.574 114.032 77.2332 113.099 50.6073C112.166 23.9815 89.8256 3.15311 63.1997 4.08592C36.5738 5.01872 15.7454 27.3594 16.6782 53.9853C17.611 80.6112 39.9518 101.44 66.5776 100.507Z"
                              fill="#D6ECFF"
                            ></path>
                            <path
                              d="M38.7942 71.301C24.641 51.2981 27.8838 24.2297 45.4232 8.04476C42.5349 9.32716 39.7255 10.9033 37.052 12.8021C15.3037 28.1898 10.1339 58.2894 25.5258 80.0468C40.9176 101.804 71.013 106.965 92.7704 91.5731C94.5158 90.3387 96.1395 89.0059 97.672 87.5937C77.0877 96.6825 52.2831 90.3759 38.7942 71.301Z"
                              fill="#B2DCFF"
                            ></path>
                            <path
                              d="M64.5722 76.3823C68.4966 76.2448 71.5664 72.952 71.4289 69.0277C71.2915 65.1034 67.9987 62.0335 64.0744 62.171C60.15 62.3085 57.0802 65.6012 57.2177 69.5256C57.3552 73.4499 60.6479 76.5198 64.5722 76.3823Z"
                              fill="#1D2630"
                            ></path>
                            <path
                              d="M45.8557 49.9715C47.2797 49.9216 48.3937 48.7268 48.3438 47.3028C48.2939 45.8788 47.0991 44.7648 45.6751 44.8147C44.251 44.8646 43.1371 46.0594 43.187 47.4834C43.2369 48.9075 44.4317 50.0214 45.8557 49.9715Z"
                              fill="#1D2630"
                            ></path>
                            <path
                              d="M68.0472 43.9208C69.4712 43.8709 70.5852 42.676 70.5353 41.252C70.4854 39.828 69.2905 38.714 67.8665 38.7639C66.4425 38.8138 65.3285 40.0086 65.3784 41.4327C65.4283 42.8567 66.6232 43.9706 68.0472 43.9208Z"
                              fill="#1D2630"
                            ></path>
                          </svg>
                        </div>
                        <div
                          className="absolute"
                          style={{
                            width: 99,
                            height: 93,
                            transform: "translateX(82px) translateY(-22px)",
                            opacity: 1,
                            transition: "transform 0.3s",
                          }}
                        >
                          <svg
                            viewBox="0 0 99 99"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M55.2 86.9041C79.0587 86.9041 98.4 67.621 98.4 43.8341C98.4 20.0472 79.0587 0.76416 55.2 0.76416C31.3413 0.76416 12 20.0472 12 43.8341C12 67.621 31.3413 86.9041 55.2 86.9041Z"
                              fill="white"
                            ></path>
                            <path
                              d="M55.7399 82.0286C77.776 82.0286 95.6398 64.2185 95.6398 42.2487C95.6398 20.2788 77.776 2.46875 55.7399 2.46875C33.7037 2.46875 15.8398 20.2788 15.8398 42.2487C15.8398 64.2185 33.7037 82.0286 55.7399 82.0286Z"
                              fill="#D6ECFF"
                            ></path>
                            <path
                              d="M57.5413 74.6019C35.7734 71.2067 20.8827 50.8574 24.2881 29.1549C25.4577 21.6862 28.6434 15.0247 33.2084 9.64166C24.6742 15.6349 18.4933 24.9245 16.7525 36.0095C13.3471 57.7119 28.2377 78.0613 50.0057 81.4564C64.2823 83.6855 77.9665 78.0677 86.6619 67.8102C78.5082 73.5478 68.1908 76.2615 57.5413 74.6019Z"
                              fill="#B2DCFF"
                            ></path>
                            <path
                              d="M46.7402 45.888C47.8669 45.888 48.7802 44.9775 48.7802 43.8542C48.7802 42.7309 47.8669 41.8203 46.7402 41.8203C45.6135 41.8203 44.7002 42.7309 44.7002 43.8542C44.7002 44.9775 45.6135 45.888 46.7402 45.888Z"
                              fill="#1D2630"
                            ></path>
                            <path
                              d="M61.7304 45.888C62.8571 45.888 63.7704 44.9775 63.7704 43.8542C63.7704 42.7309 62.8571 41.8203 61.7304 41.8203C60.6038 41.8203 59.6904 42.7309 59.6904 43.8542C59.6904 44.9775 60.6038 45.888 61.7304 45.888Z"
                              fill="#1D2630"
                            ></path>
                            <path
                              d="M54.5896 61.8496C57.3455 61.8496 59.5796 59.6223 59.5796 56.8746C59.5796 54.127 57.3455 51.8997 54.5896 51.8997C51.8337 51.8997 49.5996 54.127 49.5996 56.8746C49.5996 59.6223 51.8337 61.8496 54.5896 61.8496Z"
                              fill="#1D2630"
                            ></path>
                          </svg>
                        </div>
                        <div
                          className="absolute"
                          style={{
                            width: 58,
                            height: 46,
                            transform: "translateX(65px) translateY(-200px)",
                            transition: "transform 0.3s",
                          }}
                        >
                          <svg
                            viewBox="0 0 58 46"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M47.2404 0L57.9704 21.7L12.7604 43.17L2.40039 21.21L20.3904 24.37L22.1704 7.58L37.2804 16.15L47.2404 0Z"
                              fill="#1D2630"
                            ></path>
                            <path
                              d="M45.7502 2.83984L56.4802 24.5298L11.2701 46.0098L0.910156 24.0398L18.9001 27.2098L20.6902 10.4198L35.7902 18.9898L45.7502 2.83984Z"
                              fill="white"
                            ></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="md:p-4"
                    style={{ backgroundColor: "#22272B", color: "#FFFFFF" }}
                  >
                    <h3 className="font-semibold mb-1 text-center">积分冲刺</h3>
                  </div>
                </div>
              </div>

              {/* 大奖 */}
              <div
                className="rounded-xl border bg-gray-700 border-gray-600 text-card-foreground shadow-sm cursor-pointer overflow-hidden"
                style={{
                  borderColor:
                    selectedMode === "jackpot" ? "#4299E1" : "#34383C",
                  backgroundColor: "#22272B",
                }}
                role="button"
                aria-pressed={selectedMode === "jackpot"}
                onClick={() => {
                  setSelectedMode("jackpot");
                  replaceUrl({ gameMode: "jackpot" });
                }}
              >
                <div className="p-6 md:p-0 gap-1 md:gap-0 flex flex-col">
                  <div className="md:hidden h-full w-full flex items-center justify-center">
                    <div className="size-8 text-blue-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-crown"
                      >
                        <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1- .957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"></path>
                        <path d="M5 21h14"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="hidden md:block h-40 w-full rounded-xl rounded-b-none overflow-hidden">
                    <div
                      className="flex relative w-full h-full"
                      style={{ backgroundColor: "#1D2125" }}
                    >
                      <svg
                        viewBox="0 0 236 156"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full"
                        preserveAspectRatio="xMidYMid slice"
                      >
                        <path
                          d="M224 0H12C5.37258 0 0 5.37258 0 12V144C0 150.627 5.37259 156 12 156H224C230.627 156 236 150.627 236 144V12C236 5.37258 230.627 0 224 0Z"
                          fill="#1D2125"
                        ></path>
                        <mask
                          id="mask0_2190_9085"
                          maskUnits="userSpaceOnUse"
                          x="0"
                          y="0"
                          width="236"
                          height="157"
                          style={{ maskType: "alpha" }}
                        >
                          <path
                            d="M224 0.000244141H12C5.37258 0.000244141 0 5.37283 0 12.0002V144C0 150.628 5.37259 156 12 156H224C230.627 156 236 150.628 236 144V12.0002C236 5.37283 230.627 0.000244141 224 0.000244141Z"
                            fill="#1D2630"
                          ></path>
                        </mask>
                        <g mask="url(#mask0_2190_9085)">
                          <path
                            d="M47.0794 132.756L83 145L38.4474 120.307L39.8676 129.101L-10.9131 101L-9.09805 110.117L-21 103.625V127.59L12.2742 141.523L9.30909 127.686L49.5526 143.75L47.0794 132.756Z"
                            fill="#22272B"
                          ></path>
                          <path
                            d="M262 119.253V89L227.325 101.458L239.687 110.001L196.822 126.215L206.728 132.917L170 149L222.471 136.376L214.984 130.613L262 119.253Z"
                            fill="#22272B"
                          ></path>
                          <path
                            d="M13.7235 -16L-2.78863 -11.7636L-3 -4.28406L20.8171 31.1015L25.4757 18.9441L48.126 51.3836L51.7447 41.6713L73 69L51.3896 27.7565L48.0669 35.253L23.4043 -11.7211L20.2337 -3.78316L13.7235 -16Z"
                            fill="#22272B"
                          ></path>
                          <path
                            d="M224.524 5.98155L234 -2H206.485L191.325 13.6921L203.912 15.6218L177.65 43.779L187.674 45.2078L166 71L200.884 42.0217L193.042 40.404L232.772 7.36108L224.524 5.98155Z"
                            fill="#22272B"
                          ></path>
                          <path
                            opacity="0.45"
                            d="M20.3836 78.5886L37.4883 87.7212L17.0378 71.5366V76.1418L-6.27276 57.7212L-6.09056 62.5205L-12.2025 57.7489L-12.5117 57.9931V71.0983L2.14155 80.2642L1.76059 72.9681L20.7425 84.3977L20.3836 78.5886Z"
                            fill="#C7C6C6"
                          ></path>
                          <path
                            opacity="0.45"
                            d="M240.488 68.2292V53.7212L223.299 63.0537L229.268 65.9892L211.653 75.9406L216.434 78.2299L201.488 87.7212L223.536 78.7064L219.877 76.669L240.488 68.2292Z"
                            fill="#C7C6C6"
                          ></path>
                        </g>
                      </svg>
                      <div className="flex absolute justify-center items-center w-full h-full">
                        <div
                          className="absolute"
                          style={{
                            width: 55,
                            height: 53,
                            transform: "translateX(-70px) translateY(10px)",
                          }}
                        >
                          <svg
                            viewBox="0 0 55 53"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M29.4573 48.0547C42.7965 48.0628 53.7173 37.4264 53.8495 24.2978C53.9817 11.1692 43.2752 0.519901 29.936 0.511865C16.5968 0.503829 5.67604 11.1401 5.54384 24.2687C5.41165 37.3973 16.1181 48.0467 29.4573 48.0547Z"
                              fill="white"
                            ></path>
                            <path
                              d="M29.3744 45.4182C41.8142 45.3308 52.0197 35.4408 52.1689 23.3284C52.3182 11.2159 42.3547 1.46765 29.9149 1.55508C17.4751 1.64251 7.26963 11.5325 7.12038 23.645C6.97113 35.7574 16.9346 45.5057 29.3744 45.4182Z"
                              fill="#D6ECFF"
                            ></path>
                            <path
                              d="M17.1465 31.8055C11.001 22.4453 13.1051 10.053 21.6219 2.83438C20.2499 3.388 18.908 4.07749 17.6223 4.91684C7.16463 11.7178 4.09725 25.4786 10.7805 35.6598C17.4637 45.841 31.3534 48.5797 41.8154 41.777C42.6546 41.2314 43.4394 40.6392 44.1835 40.0093C34.406 43.9316 23.0033 40.7314 17.1465 31.8055Z"
                              fill="#B2DCFF"
                            ></path>
                            <path
                              d="M34.3683 31.8437C36.5594 31.8283 38.3569 30.0884 38.3831 27.9576C38.4094 25.8267 36.6545 24.1118 34.4634 24.1272C32.2723 24.1426 30.4748 25.8824 30.4486 28.0133C30.4223 30.1441 32.1772 31.8591 34.3683 31.8437Z"
                              fill="#1D2630"
                            ></path>
                            <path
                              d="M27.2217 18.3446C28.018 18.339 28.6712 17.7066 28.6808 16.932C28.6903 16.1575 28.0525 15.5341 27.2562 15.5397C26.4599 15.5453 25.8067 16.1777 25.7972 16.9523C25.7876 17.7269 26.4254 18.3502 27.2217 18.3446Z"
                              fill="#1D2630"
                            ></path>
                            <path
                              d="M34.7785 16.6223C35.5747 16.6167 36.228 15.9843 36.2375 15.2097C36.247 14.4352 35.6092 13.8118 34.8129 13.8173C34.0166 13.8229 33.3634 14.4553 33.3539 15.2299C33.3444 16.0044 33.9822 16.6278 34.7785 16.6223Z"
                              fill="#1D2630"
                            ></path>
                          </svg>
                        </div>
                        <div
                          className="absolute"
                          style={{
                            width: 75,
                            height: 74,
                            transform: "translateX(0px) translateY(0px)",
                          }}
                        >
                          <svg
                            viewBox="0 0 75 74"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M30.7678 66.4249C47.4592 70.1909 64.1211 59.9548 67.9832 43.562C71.8453 27.1692 61.4451 10.8272 44.7537 7.06118C28.0623 3.29516 11.4004 13.5312 7.53831 29.924C3.67621 46.3169 14.0764 62.6588 30.7678 66.4249Z"
                              fill="white"
                            ></path>
                            <path
                              d="M31.3182 63.8157C46.9698 67.2218 62.5853 57.6825 66.1962 42.509C69.8072 27.3355 60.0463 12.2738 44.3946 8.86772C28.7429 5.46162 13.1274 15.001 9.51648 30.1745C5.90553 45.3479 15.6665 60.4097 31.3182 63.8157Z"
                              fill="#D6ECFF"
                            ></path>
                            <path
                              d="M42.6342 58.8795C26.5978 59.0311 13.5377 46.5827 13.461 31.0811C13.4386 25.7454 14.9551 20.7378 17.6113 16.4643C12.176 21.6188 8.81383 28.797 8.84927 36.7151C8.92595 52.2167 21.986 64.6651 38.0225 64.5135C48.5376 64.417 57.722 58.9286 62.7818 50.7911C57.5764 55.7241 50.4793 58.8017 42.6342 58.8795Z"
                              fill="#B2DCFF"
                            ></path>
                            <path
                              d="M35.8771 43.0326C36.3974 41.79 38.9313 40.9073 42.4254 40.9203C45.8547 40.9327 49.2051 41.8041 50.9596 43.0254"
                              stroke="#1D2125"
                            ></path>
                            <path
                              d="M30.9609 26.4092C31.914 26.6166 32.4988 27.5299 32.2826 28.4385C32.0662 29.347 31.126 29.9275 30.173 29.7201C29.2202 29.5125 28.636 28.6003 28.852 27.6919C29.0682 26.7833 30.0079 26.202 30.9609 26.4092Z"
                              fill="#1D2125"
                              stroke="#1D2125"
                              strokeWidth="0.46092"
                            ></path>
                            <path
                              d="M45.4335 26.3643C46.3867 26.5718 46.9715 27.4851 46.7553 28.3938C46.539 29.3023 45.5988 29.8827 44.6458 29.6753C43.693 29.4676 43.1088 28.5554 43.3247 27.647C43.5409 26.7384 44.4806 26.1571 45.4335 26.3643Z"
                              fill="#1D2125"
                              stroke="#1D2125"
                              strokeWidth="0.46092"
                            ></path>
                          </svg>
                        </div>
                        <div
                          className="absolute"
                          style={{
                            width: 50,
                            height: 48,
                            transform: "translateX(70px) translateY(0px)",
                          }}
                        >
                          <svg
                            viewBox="0 0 50 48"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M24.3773 47.9853C37.8366 47.9934 48.8556 37.2614 48.989 24.0147C49.1224 10.768 38.3196 0.0227893 24.8604 0.0146811C11.4011 0.00657296 0.382106 10.7386 0.248722 23.9853C0.115339 37.2321 10.9181 47.9772 24.3773 47.9853Z"
                              fill="white"
                            ></path>
                            <path
                              d="M24.434 46.229C36.9292 46.2365 47.159 36.2732 47.2828 23.9753C47.4066 11.6774 37.3776 1.70182 24.8824 1.69429C12.3872 1.68677 2.15743 11.6501 2.0336 23.948C1.90977 36.2459 11.9388 46.2215 24.434 46.229Z"
                              fill="#D6ECFF"
                            ></path>
                            <path
                              d="M31.9361 40.84C19.7574 43.6459 7.66479 36.2238 4.92556 24.2674C3.98576 20.1513 4.27394 16.0305 5.55641 12.2855C2.31114 17.1767 0.993691 23.2829 2.39004 29.3908C5.12927 41.3472 17.2219 48.7693 29.4006 45.9634C37.3868 44.1259 43.4277 38.3482 45.8712 31.2166C42.7627 35.8983 37.8935 39.4646 31.9361 40.84Z"
                              fill="#B2DCFF"
                            ></path>
                            <path
                              d="M28.3528 29.6371C27.7171 32.1171 25.5351 34.0937 22.757 34.4229C20.0237 34.7465 17.5074 33.3803 16.3296 31.1753L28.3528 29.6371Z"
                              fill="#1D2125"
                            ></path>
                            <path
                              d="M15.3896 23.8054C15.374 24.2168 15.8686 24.5767 16.4942 24.6094C17.1199 24.6422 17.6397 24.3353 17.6553 23.924C17.6709 23.5126 17.1764 23.1527 16.5507 23.1199C15.9251 23.0872 15.4052 23.3941 15.3896 23.8054Z"
                              fill="#1D2125"
                            ></path>
                            <path
                              d="M23.1008 23.3736C23.2489 23.7577 23.8453 23.893 24.433 23.6759C25.0207 23.4587 25.3771 22.9713 25.229 22.5873C25.081 22.2032 24.4845 22.0679 23.8968 22.285C23.3092 22.5022 22.9528 22.9895 23.1008 23.3736Z"
                              fill="#1D2125"
                            ></path>
                          </svg>
                        </div>
                        <div
                          className="absolute"
                          style={{
                            width: 34,
                            height: 78,
                            transform: "translateX(0px) translateY(-50px)",
                            opacity: 0,
                          }}
                        >
                          <svg
                            viewBox="0 0 34 78"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M0 -5L3.90164 24.6618L12.919 18.5L4.79192 52.8038L12.919 50.1818L6.15597 78L21.7177 42.8329L15.1837 44.5095L34 -5H0Z"
                              fill="white"
                            ></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="md:p-4"
                    style={{ backgroundColor: "#22272B", color: "#FFFFFF" }}
                  >
                    <h3 className="font-semibold mb-1 text-center">大奖</h3>
                  </div>
                </div>
              </div>

              {/* 淘汰 */}
              <div
                className="rounded-xl border bg-gray-700 border-gray-600 text-card-foreground shadow-sm cursor-pointer overflow-hidden"
                style={{
                  borderColor:
                    selectedMode === "elimination" ? "#4299E1" : "#34383C",
                  backgroundColor: "#22272B",
                }}
                role="button"
                aria-pressed={selectedMode === "elimination"}
                onClick={() => {
                  setSelectedMode("elimination");
                  replaceUrl({ gameMode: "elimination" });
                }}
              >
                <div className="p-6 md:p-0 gap-1 md:gap-0 flex flex-col">
                  <div className="md:hidden h-full w-full flex items-center justify-center">
                    <div className="size-8 text-blue-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-traffic-cone"
                      >
                        <path d="M9.3 6.2a4.55 4.55 0 0 0 5.4 0"></path>
                        <path d="M7.9 10.7c.9.8 2.4 1.3 4.1 1.3s3.2-.5 4.1-1.3"></path>
                        <path d="M13.9 3.5a1.93 1.93 0 0 0-3.8-.1l-3 10c-.1.2-.1.4-.1.6 0 1.7 2.2 3 5 3s5-1.3 5-3c0-.2 0-.4-.1-.5Z"></path>
                        <path d="m7.5 12.2-4.7 2.7c-.5.3-.8.7-.8 1.1s.3.8.8 1.1l7.6 4.5c.9.5 2.1.5 3 0l7.6-4.5c.7-.3 1-.7 1-1.1s-.3-.8-.8-1.1l-4.7-2.8"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="hidden md:block h-40 w-full rounded-xl rounded-b-none overflow-hidden">
                    <div
                      className="flex relative w-full h-full"
                      style={{ backgroundColor: "#1D2125" }}
                    >
                      {/* 简单图形占位，避免空白 */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 120 60"
                          width="120"
                          height="60"
                        >
                          <rect
                            x="5"
                            y="10"
                            width="110"
                            height="40"
                            fill="#2A2F33"
                            stroke="#34383C"
                          />
                          <circle cx="30" cy="30" r="10" fill="#60A5FA" />
                          <circle cx="60" cy="30" r="10" fill="#F59E0B" />
                          <circle cx="90" cy="30" r="10" fill="#10B981" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div
                    className="md:p-4"
                    style={{ backgroundColor: "#22272B", color: "#FFFFFF" }}
                  >
                    <h3 className="font-semibold mb-1 text-center">淘汰</h3>
                  </div>
                </div>
              </div>
            </div>
            {/* 模式说明 */}
            <p
              className="text-gray-400 font-semibold max-w-2xl text-center mx-auto mt-4"
              style={{ color: "#7A8084" }}
            >
              {selectedMode === "classic" && "在经典模式下，在最后一轮之后，总价值最高的玩家赢得对战并获得所有物品。"}
              {selectedMode === "share" && "在分享模式下，在最后一轮之后，累积的总价值在所有玩家之间平均分配。"}
              {selectedMode === "sprint" && "在积分冲刺模式下，每轮最高价值的抽取获得1分。积分最多的玩家赢得对战并获得所有物品。"}
              {selectedMode === "jackpot" && "在大奖模式下，在最后一轮之后，为总'大奖'价值转动轮盘。每个玩家的获胜机会等于他们在总抽取价值中的份额。"}
              {selectedMode === "elimination" && `在淘汰模式下，从倒数第${actualPlayersCount - 1}轮开始，每轮价值${optInverted ? '最高' : '最低'}的玩家被淘汰，直到只剩下一名玩家。淘汰模式需要至少${actualPlayersCount - 1}个卡包（${actualPlayersCount}名玩家）。`}
            </p>
          </div>

          {/* 选项 */}
          <div className="w-full">
            <h2
              className="text-xl font-semibold mb-4 text-center"
              style={{ color: "#7A8084" }}
            >
              选项
            </h2>
            <div className="flex flex-col gap-3 md:gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 w-full">
                {/* 快速对战 */}
                <div
                  className="rounded-xl border text-card-foreground shadow-sm group"
                  style={{ backgroundColor: "#22272B", borderColor: "#34383C" }}
                >
                  <div className="p-6 px-4 py-4 md:py-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-zap size-6"
                            style={{ color: "#7A8084" }}
                          >
                            <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
                          </svg>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="font-semibold whitespace-nowrap"
                            style={{ color: "#FFFFFF" }}
                          >
                            快速对战
                          </span>
                          <InfoTooltip content="启用时，对战进行得更快，动画延迟减少。" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={optFastBattle}
                          onClick={() => {
                            setOptFastBattle((v) => {
                              const nv = !v;
                              replaceUrl({
                                fastBattle: nv ? "true" : undefined,
                              });
                              return nv;
                            });
                          }}
                          className="inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 cursor-pointer"
                          style={{
                            backgroundColor: optFastBattle
                              ? "#4299E1"
                              : "#292F34",
                            border: `1px solid ${
                              optFastBattle ? "#4299E1" : "#303539"
                            }`,
                          }}
                        >
                          <span
                            className="pointer-events-none block h-full aspect-square rounded-full shadow-lg ring-0 transition-transform"
                            style={{
                              transform: optFastBattle
                                ? "translateX(20px)"
                                : "translateX(0px)",
                              backgroundColor: optFastBattle
                                ? "#FFFFFF"
                                : "#7A8084",
                            }}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 最后机会 */}
                <div
                  className="rounded-xl border text-card-foreground shadow-sm group"
                  style={{ backgroundColor: "#22272B", borderColor: "#34383C" }}
                >
                  <div className="p-6 px-4 py-4 md:py-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-skull size-6"
                            style={{ color: "#7A8084" }}
                          >
                            <path d="m12.5 17-.5-1-.5 1h1z"></path>
                            <path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"></path>
                            <circle cx="15" cy="12" r="1"></circle>
                            <circle cx="9" cy="12" r="1"></circle>
                          </svg>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="font-semibold whitespace-nowrap"
                            style={{ color: "#FFFFFF" }}
                          >
                            最后机会
                          </span>
                          <InfoTooltip content="启用时，只有最后一轮重要。在最后一轮抽取最有价值物品的玩家获得一切。" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={optLastChance}
                          disabled={!canEnableLastChance}
                          onClick={() =>
                            setOptLastChance((v) => {
                              if (!canEnableLastChance) return v;
                              const nv = !v;
                              replaceUrl({
                                lastChance: nv ? "true" : undefined,
                              });
                              return nv;
                            })
                          }
                          className="inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: optLastChance
                              ? "#4299E1"
                              : "#292F34",
                            border: `1px solid ${
                              optLastChance ? "#4299E1" : "#303539"
                            }`,
                          }}
                        >
                          <span
                            className="pointer-events-none block h-full aspect-square rounded-full shadow-lg ring-0 transition-transform"
                            style={{
                              transform: optLastChance
                                ? "translateX(20px)"
                                : "translateX(0px)",
                              backgroundColor: optLastChance
                                ? "#FFFFFF"
                                : "#7A8084",
                            }}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 倒置 */}
                <div
                  className="rounded-xl border text-card-foreground shadow-sm group"
                  style={{ backgroundColor: "#22272B", borderColor: "#34383C" }}
                >
                  <div className="p-6 px-4 py-4 md:py-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-crown size-6 rotate-180"
                            style={{ color: "#7A8084" }}
                          >
                            <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"></path>
                            <path d="M5 21h14"></path>
                          </svg>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="font-semibold whitespace-nowrap"
                            style={{ color: "#FFFFFF" }}
                          >
                            倒置
                          </span>
                          <InfoTooltip content="启用时，总物品价值最低的玩家获胜并获得所有物品。" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={optInverted}
                          disabled={!canEnableInverted}
                          onClick={() =>
                            setOptInverted((v) => {
                              if (!canEnableInverted) return v;
                              const nv = !v;
                              replaceUrl({
                                upsideDown: nv ? "true" : undefined,
                              });
                              return nv;
                            })
                          }
                          className="inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: optInverted
                              ? "#4299E1"
                              : "#292F34",
                            border: `1px solid ${
                              optInverted ? "#4299E1" : "#303539"
                            }`,
                          }}
                        >
                          <span
                            className="pointer-events-none block h-full aspect-square rounded-full shadow-lg ring-0 transition-transform"
                            style={{
                              transform: optInverted
                                ? "translateX(20px)"
                                : "translateX(0px)",
                              backgroundColor: optInverted
                                ? "#FFFFFF"
                                : "#7A8084",
                            }}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 已选礼包 */}
          <div className="w-full space-y-4">
            <div className="flex flex-row gap-3 justify-between w-full">
              <p className="text-xl font-bold" style={{ color: "#7A8084" }}>
                已选礼包 ({selectedPackIds.length})
              </p>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={uniqueIds}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 w-full">
                  <div className="max-w-[194px] aspect-[194/294]">
                    <div
                      className="rounded-lg cursor-pointer h-full w-full flex items-center justify-center flex-col gap-2"
                      style={{
                        backgroundImage:
                          "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' viewBox='0 0 194 294' xmlns='http://www.w3.org/2000/svg'%3e%3crect x='2' y='2' width='190' height='290' fill='none' rx='8' ry='8' stroke='%236b7280' stroke-width='1' stroke-dasharray='6%2c5' stroke-dashoffset='0' stroke-linecap='butt'/%3e%3c/svg%3e\")",
                        color: "#FFFFFF",
                      }}
                      onClick={(e) => {
                        // 如果是从拖拽操作来的，不触发点击
                        if ((e.nativeEvent as any).isTrusted) {
                          setIsSelectPackModalOpen(true);
                        }
                      }}
                      onMouseDown={(e) => {
                        // 阻止拖拽时触发点击
                        e.stopPropagation();
                      }}
                    >
                      <div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="40"
                          height="40"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12h14"></path>
                          <path d="M12 5v14"></path>
                        </svg>
                      </div>
                      <p className="font-medium">添加礼包</p>
                    </div>
                  </div>
                  {selectedPacks.map((pack, index) => {
                    const uniqueId = `${pack.id}-${index}`;
                    return (
                      <SortablePackItem
                        key={uniqueId}
                        uniqueId={uniqueId}
                        pack={pack}
                        onRemove={() => {
                          // 找到该 pack 在 selectedPackIds 中对应位置并删除
                          setSelectedPackIds(prev => prev.filter((_, i) => i !== index));
                        }}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
          
          <SelectPackModal
            open={isSelectPackModalOpen}
            onClose={() => setIsSelectPackModalOpen(false)}
            selectedPackIds={selectedPackIds}
            onSelectionChange={(ids) => {
              setSelectedPackIds(ids);
            }}
            maxPacks={undefined}
            minPacks={0}
          />

          {/* 对战摘要 */}
          <div className="w-full" style={{ backgroundColor: "#1D2125" }}>
            <div className="max-w-screen-xl mx-auto w-full space-y-4 py-4">
              <p className="font-semibold text-xl" style={{ color: "#7A8084" }}>
                对战摘要
              </p>
              <div className="space-y-1">
                {[
                  { k: "玩家", v: String(actualPlayersCount) },
                  { k: "包装/回合", v: String(selectedPackIds.length) },
                  { k: "总成本", v: `$${totalCost.toFixed(2)}` },
                ].map((row) => (
                  <div
                    key={row.k}
                    className="text-xl font-semibold flex justify-between p-4 rounded-xl"
                    style={{ backgroundColor: "#22272B", color: "#FFFFFF" }}
                  >
                    <span>{row.k}</span>
                    <span>{row.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 底部按钮 */}
          <button
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus select-none px-8 w-full h-16 sticky bottom-2 !mt-0"
            disabled={
              selectedPackIds.length === 0 ||
              (selectedMode === "elimination" && selectedPackIds.length < actualPlayersCount - 1)
            }
            style={{
              backgroundColor: "#48BB78",
              color: (selectedPackIds.length > 0 && !(selectedMode === "elimination" && selectedPackIds.length < actualPlayersCount - 1)) ? "#FFFFFF" : "#2F855A",
              fontFamily: "var(--font-urbanist)",
              opacity: (selectedPackIds.length > 0 && !(selectedMode === "elimination" && selectedPackIds.length < actualPlayersCount - 1)) ? 1 : 0.5,
              cursor: (selectedPackIds.length > 0 && !(selectedMode === "elimination" && selectedPackIds.length < actualPlayersCount - 1)) ? "pointer" : "not-allowed",
            }}
            onClick={() => {
              if (selectedPackIds.length > 0) {
                console.log('🎮 [创建对战] 当前状态:', {
                  typeState,
                  playersCount,
                  urlPlayersInSolo: searchParams?.get("playersInSolo")
                });
                
                const packIdsParam = selectedPackIds.join(",");
                const params = new URLSearchParams();
                params.set("packIds", packIdsParam);
                
                // 传递战斗类型和对应参数
                params.set("type", typeState);
                if (typeState === "solo") {
                  // 单人模式：确保有默认值2
                  const finalPlayersCount = playersCount || "2";
                  console.log('✅ [创建对战] 单人模式玩家数:', finalPlayersCount);
                  params.set("players", finalPlayersCount);
                } else {
                  // 团队模式：传递teamStructure
                  params.set("teamStructure", teamStructure);
                  // 根据teamStructure计算总玩家数
                  const totalPlayers = teamStructure === "2v2" ? 4 : teamStructure === "3v3" ? 6 : 6; // 2v2v2
                  params.set("players", String(totalPlayers));
                }
                
                // 传递游戏模式
                params.set("gameMode", selectedMode);
                
                // 传递快速对战选项
                if (optFastBattle) {
                  params.set("fastBattle", "true");
                }
                
                // 传递最后的机会选项
                if (optLastChance) {
                  params.set("lastChance", "true");
                }
                
                // 传递倒置模式选项
                if (optInverted) {
                  params.set("upsideDown", "true");
                }
                
                router.replace(`/battles/${Date.now()}?${params.toString()}`);
              }
            }}
          >
            创建对战 for ${totalCost.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreateBattlePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-white">加载中...</p></div>}>
      <CreateBattleContent />
    </Suspense>
  );
}
