"use client";
export const dynamic = "force-dynamic";
import React, { useState, useMemo, useEffect, Suspense, useCallback } from "react";
import InlineSelect from "../components/InlineSelect";
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  api,
  type ApiResponse,
  type CatalogPack,
  type CreateBattlePayload,
  type CreateBattleResult,
} from '../lib/api';
import SelectPackModal from '../packs/[id]/SelectPackModal';
import InfoTooltip from '../components/InfoTooltip';
import { showGlobalToast } from '../components/ToastProvider';
import { useAuth } from '../hooks/useAuth';
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
import { useI18n } from "../components/I18nProvider";

const MODE_TO_API_VALUE: Record<
  "classic" | "share" | "sprint" | "jackpot" | "elimination",
  CreateBattlePayload["mode"]
> = {
  classic: 0,
  share: 1,
  sprint: 2,
  jackpot: 3,
  elimination: 4,
};

const TEAM_STRUCTURE_TO_SIZE: Record<
  "2v2" | "3v3" | "2v2v2",
  CreateBattlePayload["team_size"]
> = {
  "2v2": 0,
  "3v3": 1,
  "2v2v2": 2,
};

const MODE_ILLUSTRATIONS: Record<
  "classic" | "share" | "sprint" | "jackpot" | "elimination",
  string
> = {
  classic: "/images/classic.svg",
  share: "/images/share.svg",
  sprint: "/images/rush.svg",
  jackpot: "/images/jackpot.svg",
  elimination: "/images/elimination.svg",
};


interface SortablePackItemProps {
  pack: CatalogPack;
  onRemove: () => void;
  uniqueId: string; // 添加唯一 ID
  highlightLastChance?: boolean;
}

function SortablePackItem({ pack, onRemove, uniqueId, highlightLastChance }: SortablePackItemProps) {
  const { t } = useI18n();
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
        <img
          alt={pack.title}
          src={pack.image}
          width={200}
          height={304}
          className="w-full h-auto"
          style={{ color: 'transparent', pointerEvents: 'none' }}
        />
        {highlightLastChance && (
          <div className="flex justify-start items-start absolute inset-0 border-2 border-red-400 rounded-lg pointer-events-none">
            <div className="flex m-1.5 justify-center items-center rounded size-6" style={{ backgroundColor: '#34383C' }}>
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
                className="lucide lucide-skull text-red-400 size-4"
              >
                <path d="m12.5 17-.5-1-.5 1h1z"></path>
                <path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"></path>
                <circle cx="15" cy="12" r="1"></circle>
                <circle cx="9" cy="12" r="1"></circle>
              </svg>
            </div>
          </div>
        )}
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
        {isHovered ? t("remove") : `$${pack.price.toFixed(2)}`}
      </button>
    </div>
  );
}

function CreateBattleContent() {
  const router = useRouter();
  const { fetchUserBean } = useAuth();
  const searchParams = useSearchParams();
  const { t } = useI18n();

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

    if (isSoloMode) {
      const playersParam = searchParams?.get("playersInSolo");
      // 如果没有参数，或者参数无效，设置默认值2
      if (!playersParam || Number(playersParam) < 1 || Number(playersParam) > 6) {
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

  const replaceUrl = useCallback((updates: Record<string, string | undefined>) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") params.delete(k);
      else params.set(k, String(v));
    });
    const qs = params.toString();
    const pathname = window.location.pathname || "/create-battle";
    const url = qs ? `${pathname}?${qs}` : pathname;
    // 异步更新地址，避免在渲染阶段触发 Router 更新警告
    queueMicrotask(() => {
      window.history.replaceState(null, "", url);
    });
  }, []);

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

  useEffect(() => {
    if (typeState === "team" && selectedMode === "share") {
      setSelectedMode("classic");
      replaceUrl({ gameMode: "classic" });
    }
  }, [typeState, selectedMode, replaceUrl]);

  // "最后的机会"只有在经典和大奖模式才能开启
  const canEnableLastChance = selectedMode === "classic" || selectedMode === "jackpot";

  // "倒置模式"除了分享模式都可以开启
  const canEnableInverted = selectedMode !== "share";

  const [selectedPackIds, setSelectedPackIds] = useState<string[]>([]);
  const [hasInitPackIdsFromQuery, setHasInitPackIdsFromQuery] = useState(false);

  const buildPreviewBattleUrl = () => {
    const params = new URLSearchParams();
    params.set("type", typeState);
    if (typeState === "solo") {
      const finalPlayersCount = playersCount || "2";
      params.set("players", finalPlayersCount);
    } else {
      params.set("teamStructure", teamStructure);
      params.set("players", String(actualPlayersCount));
    }
    params.set("gameMode", selectedMode);
    if (optFastBattle) params.set("fastBattle", "true");
    if (optLastChance) params.set("lastChance", "true");
    if (optInverted) params.set("upsideDown", "true");
    return `/battles/${Date.now()}?${params.toString()}`;
  };

  const createBattleMutation = useMutation({
    mutationFn: (payload: CreateBattlePayload) => api.createBattle(payload),
    onSuccess: (response: ApiResponse<CreateBattleResult>) => {

      const result = response?.data ?? {};

      const createdBattleId =
        result

      if (response?.code === 100000 && createdBattleId) {
        showGlobalToast({
          title: t("success"),
          description: t("actionSuccess"),
          variant: "success",
          durationMs: 2000,
        });
        fetchUserBean?.();
        router.push(`/battles/${createdBattleId}`);
        return;
      }

    },
    onError: (error: Error) => {
      showGlobalToast({
        title: t("error"),
        description:
          error instanceof Error ? error.message : t("retryLater"),
        variant: "error",
        durationMs: 2600,
      });
    },
  });

  const isEliminationRequirementNotMet =
    selectedMode === "elimination" &&
    selectedPackIds.length < actualPlayersCount - 1;
  const isCreateDisabled =
    selectedPackIds.length === 0 ||
    isEliminationRequirementNotMet ||
    createBattleMutation.isPending;

  const handleCreateBattle = () => {
    if (isCreateDisabled) {
      return;
    }

    const payload: CreateBattlePayload = {
      num: actualPlayersCount,
      person_team: typeState === "team" ? 1 : 0,
      team_size:
        typeState === "team" ? TEAM_STRUCTURE_TO_SIZE[teamStructure] : 0,
      mode: MODE_TO_API_VALUE[selectedMode],
      fast: optFastBattle ? 1 : 0,
      finally: canEnableLastChance && optLastChance ? 1 : 0,
      type: canEnableInverted && optInverted ? 1 : 0,
      boxs: selectedPackIds,
    };

    createBattleMutation.mutate(payload);
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
  const [isSelectPackModalOpen, setIsSelectPackModalOpen] = useState(false);

  const { data: boxListData } = useQuery({
    queryKey: ['boxList', { type: '2' }],
    queryFn: () =>
      api.getBoxList({
        sort_type: '1',
        type: '1,2',
      }),
    staleTime: 30_000,
  });

  // 将新接口数据映射为旧格式
  const packs = useMemo(() => {
    if (boxListData?.code === 100000 && Array.isArray(boxListData.data)) {
      return boxListData.data.map((box: any) => ({
        id: String(box.id || box.box_id), // ✅ 统一转为字符串
        title: box.name || box.title || '',
        image: box.cover || '',
        price: Number(box.bean || 0),
        itemCount: 0,
        items: [],
      }));
    }
    return [];
  }, [boxListData]);

  // 从URL的 packIds 预选礼包（来自对战详情页“编辑/复刻”入口）
  const packIdsParam = searchParams?.get("packIds");
  useEffect(() => {
    if (hasInitPackIdsFromQuery) return;
    if (!packIdsParam) {
      setHasInitPackIdsFromQuery(true);
      return;
    }
    const candidateIds = packIdsParam
      .split(",")
      .map((id) => id.trim())
      .filter((id) => !!id);

    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      setHasInitPackIdsFromQuery(true);
      return;
    }

    const validPacks = Array.isArray(packs) ? packs : [];
    if (validPacks.length === 0) return; // 等待包列表加载

    const normalized = candidateIds.filter((id) =>
      validPacks.some((p) => String(p.id) === String(id)),
    );

    if (normalized.length > 0) {
      setSelectedPackIds(normalized);
    }
    setHasInitPackIdsFromQuery(true);
  }, [hasInitPackIdsFromQuery, packIdsParam, packs]);

  const selectedPacks = useMemo(() => {
    return selectedPackIds.map(id => packs.find((p: CatalogPack) => String(p.id) === String(id))).filter(Boolean) as CatalogPack[];
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
                    { label: t("soloBattle"), value: "solo" },
                    { label: t("teamBattle"), value: "team" },
                  ]}
                  centerLabel
                />
              </div>
            </div>

            <div className="text-center w-full">
              <h2
                className="text-xl font-semibold mb-4 text-center"
                style={{ color: "#7A8084" }}
              >
                {t("summaryPlayers")}
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
              {t("battleGameMode")}
            </h2>
            <div
              className={`grid grid-cols-2 gap-3 mb-6 w-full ${
                typeState === "team" ? "sm:grid-cols-4" : "sm:grid-cols-5"
              }`}
            >
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
                  <div
                    className="relative hidden md:block h-40 w-full rounded-xl rounded-b-none overflow-hidden"
                    style={{ backgroundColor: "#1D2125" }}
                  >
                    <img
                      src={MODE_ILLUSTRATIONS.classic}
                      alt={t("battleModeClassic")}
                      className="object-contain absolute inset-0 w-full h-full"
                    />
                  </div>
                  
                  <div
                    className="md:p-4"
                    style={{ backgroundColor: "#22272B", color: "#FFFFFF" }}
                  >
                    <h3 className="font-semibold mb-1 text-center">{t("battleModeClassic")}</h3>
                  </div>
                </div>
              </div>

              {/* 分享模式（僅單人模式可選） */}
              {typeState === "solo" ? (
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
                    <div
                      className="relative hidden md:block h-40 w-full rounded-xl rounded-b-none overflow-hidden"
                      style={{ backgroundColor: "#1D2125" }}
                    >
                    <img
                      src={MODE_ILLUSTRATIONS.share}
                      alt={t("battleModeShare")}
                      className="object-contain absolute inset-0 w-full h-full"
                    />
                    </div>
                    
                    <div
                    className="md:p-4"
                    style={{ backgroundColor: "#22272B", color: "#FFFFFF" }}
                  >
                    <h3 className="font-semibold mb-1 text-center">{t("battleModeShare")}</h3>
                    </div>
                  </div>
                </div>
              ) : null}

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
                      <div
                        className="relative hidden md:block h-40 w-full rounded-xl rounded-b-none overflow-hidden"
                        style={{ backgroundColor: "#1D2125" }}
                      >
                        <img
                          src={MODE_ILLUSTRATIONS.sprint}
                          alt={t("battleModeSprint")}
                          className="object-contain absolute inset-0 w-full h-full"
                        />
                      </div>
                      
                      <div
                        className="md:p-4"
                        style={{ backgroundColor: "#22272B", color: "#FFFFFF" }}
                      >
                        <h3 className="font-semibold mb-1 text-center">{t("battleModeSprint")}</h3>
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
                      <div
                        className="relative hidden md:block h-40 w-full rounded-xl rounded-b-none overflow-hidden"
                        style={{ backgroundColor: "#1D2125" }}
                      >
                        <img
                          src={MODE_ILLUSTRATIONS.jackpot}
                          alt={t("battleModeJackpot")}
                          className="object-contain absolute inset-0 w-full h-full"
                        />
                      </div>
                    
                      <div
                        className="md:p-4"
                        style={{ backgroundColor: "#22272B", color: "#FFFFFF" }}
                      >
                        <h3 className="font-semibold mb-1 text-center">{t("battleModeJackpot")}</h3>
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
                      <div
                        className="relative hidden md:block h-40 w-full rounded-xl rounded-b-none overflow-hidden"
                        style={{ backgroundColor: "#1D2125" }}
                      >
                      <img
                        src={MODE_ILLUSTRATIONS.elimination}
                        alt={t("battleModeElimination")}
                        className="object-contain absolute inset-0 w-full h-full"
                      />
                      </div>
                    
                      <div
                        className="md:p-4"
                        style={{ backgroundColor: "#22272B", color: "#FFFFFF" }}
                      >
                        <h3 className="font-semibold mb-1 text-center">{t("battleModeElimination")}</h3>
                      </div>
                    </div>
                  </div>
                </div>
            {/* 模式说明 */}
              <p
                className="text-gray-400 font-semibold max-w-2xl text-center mx-auto mt-4"
                style={{ color: "#7A8084" }}
              >
                {selectedMode === "classic" && t(optInverted ? "modeClassicDescInverted" : "modeClassicDesc")}
                {selectedMode === "share" && t("modeShareDesc")}
                {selectedMode === "sprint" && t(optInverted ? "modeSprintDescInverted" : "modeSprintDesc")}
                {selectedMode === "jackpot" && t("modeJackpotDesc")}
                {selectedMode === "elimination" &&
                  t(optInverted ? "modeEliminationDescInverted" : "modeEliminationDesc")}
              </p>
            </div>

            {/* 选项 */}
            <div className="w-full">
              <h2
                className="text-xl font-semibold mb-4 text-center"
                style={{ color: "#7A8084" }}
              >
                {t("optionsTitle")}
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
                              {t("fastBattle")}
                            </span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <InfoTooltip 
                                content={t("fastBattleTip")} 
                                buttonClassName="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none interactive-focus relative text-base text-white font-bold disabled:text-gray-400 select-none size-6 min-h-6 min-w-6 max-h-6 max-w-6 rounded-[4px] hover:bg-gray-700"
                                usePortal={true}
                              />
                            </div>
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
                              border: `1px solid ${optFastBattle ? "#4299E1" : "#303539"
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
                              {t("lastChance")}
                            </span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <InfoTooltip 
                                content={t("lastChanceTip")} 
                                buttonClassName="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none interactive-focus relative text-base text-white font-bold disabled:text-gray-400 select-none size-6 min-h-6 min-w-6 max-h-6 max-w-6 rounded-[4px] hover:bg-gray-700"
                                usePortal={true}
                              />
                            </div>
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
                              border: `1px solid ${optLastChance ? "#4299E1" : "#303539"
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
                              {t("inverted")}
                            </span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <InfoTooltip 
                                content={t("invertedTip")} 
                                buttonClassName="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none interactive-focus relative text-base text-white font-bold disabled:text-gray-400 select-none size-6 min-h-6 min-w-6 max-h-6 max-w-6 rounded-[4px] hover:bg-gray-700"
                                usePortal={true}
                              />
                            </div>
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
                              border: `1px solid ${optInverted ? "#4299E1" : "#303539"
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
                  {t("selectedPacks")} ({selectedPackIds.length})
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
                        <p className="font-medium">{t("addPack")}</p>
                      </div>
                    </div>
                    {selectedPacks.map((pack, index) => {
                      const uniqueId = `${pack.id}-${index}`;
                      const isLastSelected = optLastChance && index === selectedPacks.length - 1;
                      return (
                        <SortablePackItem
                          key={uniqueId}
                          uniqueId={uniqueId}
                          pack={pack}
                          highlightLastChance={isLastSelected}
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
              boxType="1,2"
            />

            {/* 对战摘要 */}
            <div className="w-full" style={{ backgroundColor: "#1D2125" }}>
              <div className="max-w-screen-xl mx-auto w-full space-y-4 py-4">
                <p className="font-semibold text-xl" style={{ color: "#7A8084" }}>
                  {t("battleSummary")}
                </p>
                <div className="space-y-1">
                  {[
                    { k: t("summaryPlayers"), v: String(actualPlayersCount) },
                    { k: t("summaryPacksPerRound"), v: String(selectedPackIds.length) },
                    { k: t("summaryTotalCost"), v: `$${totalCost.toFixed(2)}` },
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
              disabled={isCreateDisabled}
              style={{
                backgroundColor: "#48BB78",
                color: !isCreateDisabled ? "#FFFFFF" : "#2F855A",
                fontFamily: "var(--font-urbanist)",
                opacity: !isCreateDisabled ? 1 : 0.5,
                cursor: !isCreateDisabled ? "pointer" : "not-allowed",
              }}
              onClick={handleCreateBattle}
            >
              {createBattleMutation.isPending
                ? t("creatingBattle")
                : t("createBattleFor").replace("{price}", `$${totalCost.toFixed(2)}`)}
            </button>
          </div>
        </div>
      </div>
      );
}

      export default function CreateBattlePage() {
  const { t } = useI18n();
  return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-white">{t("loading")}</p></div>}>
        <CreateBattleContent />
      </Suspense>
      );
}
