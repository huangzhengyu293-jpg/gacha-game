"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Lang = "zh" | "en" | "ko" | "ja";

type Dict = Record<string, Record<Lang, string>>;

const dict: Dict = {
  brand: { zh: "PackDraw", en: "PackDraw", ko: "PackDraw", ja: "PackDraw" },
  slogan: { zh: "开启礼包并争夺稀有和贵重产品。", en: "Open packs and compete for rare and premium items.", ko: "팩을 열고 희귀하고 고급 아이템을 획득하세요.", ja: "パックを開けて、レアで高級なアイテムを手に入れよう。" },
  welcome: { zh: "欢迎来到 PackDraw", en: "Welcome to PackDraw", ko: "PackDraw에 오신 것을 환영합니다", ja: "PackDrawへようこそ" },
  games: { zh: "游戏", en: "Games", ko: "게임", ja: "ゲーム" },
  packs: { zh: "礼包", en: "Packs", ko: "パック", ja: "パック" },
  battles: { zh: "对战", en: "Battles", ko: "배틀", ja: "バトル" },
  deals: { zh: "交易", en: "Deals", ko: "거래", ja: "ディール" },
  draw: { zh: "抽奖", en: "Draw", ko: "추첨", ja: "抽選" },
  events: { zh: "活动", en: "Events", ko: "イベント", ja: "イベント" },
  rewards: { zh: "奖励", en: "Rewards", ko: "보상", ja: "リワード" },
  login: { zh: "登录", en: "Log in", ko: "로그인", ja: "ログイン" },
  register: { zh: "注册", en: "Sign up", ko: "登録", ja: "新規登録" },
  legal: { zh: "法律", en: "Legal", ko: "법務", ja: "法務" },
  fairness: { zh: "公平性", en: "Fairness", ko: "公正性", ja: "公平性" },
  privacy: { zh: "隐私政策", en: "Privacy Policy", ko: "プライバシーポリシー", ja: "プライバシーポリシー" },
  terms: { zh: "服务条款", en: "Terms of Service", ko: "利用規約", ja: "利用規約" },
  community: { zh: "社区", en: "Community", ko: "コミュニティ", ja: "コミュニティ" },
  support: { zh: "支持", en: "Support", ko: "サポート", ja: "サポート" },
  email: { zh: "support@packdraw.com", en: "support@packdraw.com", ko: "support@packdraw.com", ja: "support@packdraw.com" },
  chooseLanguage: { zh: "選擇語言", en: "Choose Language", ko: "言語を選択", ja: "言語を選択" },
  copyright: { zh: "版权所有 © PackDraw 2025", en: "Copyright © PackDraw 2025", ko: "著作権 © PackDraw 2025", ja: "著作権 © PackDraw 2025" },
  // New UI strings
  viewAll: { zh: "查看全部", en: "View All", ko: "すべて表示", ja: "すべて表示" },
  newPacks: { zh: "新礼包", en: "New Packs", ko: "新しいパック", ja: "新しいパック" },
  battleHighlights: { zh: "对战亮点", en: "Battle Highlights", ko: "バトルハイライト", ja: "バトルハイライト" },
  tradeHighlights: { zh: "交易亮点", en: "Trade Highlights", ko: "トレードハイライト", ja: "トレードハイライト" },
  bestOpens: { zh: "最佳开启", en: "Best Opens", ko: "ベストオープン", ja: "ベストオープン" },
  liveDrop: { zh: "实时掉落", en: "Live Drops", ko: "ライブドロップ", ja: "ライブドロップ" },
  liveStart: { zh: "直播开启", en: "Live Start", ko: "ライブ開始", ja: "ライブ開始" },
  loadMore: { zh: "加载更多", en: "Load more", ko: "더 보기", ja: "もっと見る" },
  shareMode: { zh: "分享模式", en: "Share Mode", ko: "共有モード", ja: "共有モード" },
  jackpot: { zh: "大奖", en: "Jackpot", ko: "ジャックポット", ja: "ジャックポット" },
  normalMode: { zh: "普通模式", en: "Normal Mode", ko: "ノーマルモード", ja: "ノーマルモード" },
  cost: { zh: "费用", en: "Cost", ko: "費用", ja: "費用" },
  opened: { zh: "已开启", en: "Opened", ko: "開封済み", ja: "開封済み" },
  viewResults: { zh: "查看结果", en: "View Results", ko: "結果を見る", ja: "結果を見る" },
  backToPacks: { zh: "返回包裹", en: "Back to Packs", ko: "팩 목록으로", ja: "パック一覧に戻る" },
  // Packs toolbar
  search: { zh: "搜索", en: "Search", ko: "검색", ja: "検索" },
  reset: { zh: "重置", en: "Reset", ko: "리셋", ja: "リセット" },
  createPack: { zh: "创建礼包", en: "Create Pack", ko: "팩 생성", ja: "パックを作成" },
  official: { zh: "官方", en: "Official", ko: "공식", ja: "公式" },
  priceHighToLow: { zh: "价格从高到低", en: "Price High to Low", ko: "가격 높은순", ja: "価格高い順" },
  volatility: { zh: "波动性", en: "Volatility", ko: "변동성", ja: "ボラティリティ" },
  priceRange: { zh: "价格区间", en: "Price Range", ko: "가격 범위", ja: "価格帯" },
  // Generic/common
  all: { zh: "全部", en: "All", ko: "전체", ja: "すべて" },
  any: { zh: "不限", en: "Any", ko: "무관", ja: "指定なし" },
  high: { zh: "高", en: "High", ko: "높음", ja: "高" },
  medium: { zh: "中", en: "Medium", ko: "중간", ja: "中" },
  low: { zh: "低", en: "Low", ko: "낮음", ja: "低" },
  // Sorting
  priceLowToHigh: { zh: "价格从低到高", en: "Price Low to High", ko: "가격 낮은순", ja: "価格安い順" },
  newest: { zh: "最新", en: "Newest", ko: "최신", ja: "新着" },
  oldest: { zh: "最旧", en: "Oldest", ko: "오래된", ja: "古い順" },
  mostPopular: { zh: "最受欢迎", en: "Most Popular", ko: "인기순", ja: "人気順" },
  // Price ranges
  priceAny: { zh: "不限", en: "Any", ko: "무관", ja: "指定なし" },
  price0to10: { zh: "$0-$10", en: "$0-$10", ko: "$0-$10", ja: "$0-$10" },
  price10to50: { zh: "$10-$50", en: "$10-$50", ko: "$10-$50", ja: "$10-$50" },
  price50to100: { zh: "$50-$100", en: "$50-$100", ko: "$50-$100", ja: "$50-$100" },
  price100plus: { zh: "$100+", en: "$100+", ko: "$100+", ja: "$100+" },
  allPrices: { zh: "全部价格", en: "All Prices", ko: "전체 가격", ja: "すべての価格" },
  gte500: { zh: "≥ $500", en: "GTE $500", ko: "≥ $500", ja: "≥ $500" },
  range250to500: { zh: "$250 - $500", en: "$250 - $500", ko: "$250 - $500", ja: "$250 - $500" },
  range100to250: { zh: "$100 - $250", en: "$100 - $250", ko: "$100 - $250", ja: "$100 - $250" },
  range50to100: { zh: "$50 - $100", en: "$50 - $100", ko: "$50 - $100", ja: "$50 - $100" },
  range25to50: { zh: "$25 - $50", en: "$25 - $50", ko: "$25 - $50", ja: "$25 - $50" },
  range5to25: { zh: "$5 - $25", en: "$5 - $25", ko: "$5 - $25", ja: "$5 - $25" },
  lte5: { zh: "≤ $5", en: "LTE $5", ko: "≤ $5", ja: "≤ $5" },
  // Volatility menu
  maximumVolatility: { zh: "最大波动性", en: "Maximum Volatility", ko: "최대 변동성", ja: "最大ボラティリティ" },
  filterByRisk: { zh: "根据风险筛选礼包", en: "Filter packs by their risk level", ko: "리스크 수준별 필터", ja: "リスクレベルでフィルタ" },
  lowRisk: { zh: "低风险", en: "Low Risk", ko: "낮은 위험", ja: "低リスク" },
  highRisk: { zh: "高风险", en: "High Risk", ko: "높은 위험", ja: "高リスク" },
  legalBrandNote: {
    zh: "PackDraw 是 PackDraw Group 的品牌，该集团由 Packdraw Limited（一家根据塞浦路斯法律注册的公司，公司编号 HE 445177，注册地址：Iakovou Patatsou 4a, Agios Dometios, 2362 尼科西亚，塞浦路斯）和 PackDraw US, LLC（一家根据美利坚合众国法律注册的公司，注册编号 7571319，注册地址：108 West 13th Street Wilmington, Delaware 19801，美国）组成。",
    en: "PackDraw is a brand of the PackDraw Group, which consists of Packdraw Limited (a company registered under the laws of Cyprus, company number HE 445177, registered address: Iakovou Patatsou 4a, Agios Dometios, 2362 Nicosia, Cyprus) and PackDraw US, LLC (a company registered under the laws of the United States, registration number 7571319, registered address: 108 West 13th Street, Wilmington, Delaware 19801, USA).",
    ko: "PackDraw는 PackDraw Group의 브랜드로, Packdraw Limited(키프로스 법에 따라 등록된 회사, 회사 번호 HE 445177, 등록 주소: Iakovou Patatsou 4a, Agios Dometios, 2362 Nicosia, Cyprus)와 PackDraw US, LLC(미국 법에 따라 등록된 회사, 등록 번호 7571319, 등록 주소: 108 West 13th Street, Wilmington, Delaware 19801, USA)로 구성됩니다.",
    ja: "PackDraw は PackDraw Group のブランドであり、Packdraw Limited（キプロス法に基づき登録された会社、会社番号 HE 445177、登録住所：Iakovou Patatsou 4a, Agios Dometios, 2362 Nicosia, Cyprus）および PackDraw US, LLC（米国法に基づき登録された会社、登録番号 7571319、登録住所：108 West 13th Street, Wilmington, Delaware 19801, USA）で構成されています。"
  },
};

type I18nCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof dict) => string;
};

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("zh");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem("lang") as Lang | null) : null;
    if (saved) setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  }, []);

  const t = useCallback((key: keyof typeof dict) => dict[key][lang], [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}


