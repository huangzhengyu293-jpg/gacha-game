"use client";

import Image from "next/image";
import { gsap } from "gsap";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type SVGProps } from "react";
import { useI18n } from "@/app/components/I18nProvider";
import { AddBattleRoundCaseModal, type AddBattleRoundCaseSelection } from "@/app/create-battle/AddBattleRoundCaseModal";

const MAX_SELECTED_PACK_QTY = 999;

/** 已选礼包卡片入场：自中心放大弹出 */
const SELECTED_PACK_ENTER_SEC = 0.44;
const SELECTED_PACK_ENTER_STAGGER_SEC = 0.075;
const SELECTED_PACK_ENTER_EASE = "back.out(1.55)";
const SELECTED_PACK_ENTER_SCALE_FROM = 0.52;

const CAROUSEL_SLIDE_ENTER_SEC = 0.32;
const CAROUSEL_SLIDE_STAGGER_SEC = 0.05;
const CAROUSEL_SLIDE_SCALE_FROM = 0.82;

/** 回合数：中间深色区域内数字纵向翻牌（rotationX） */
const ROUNDS_COUNTER_FLIP_IN_SEC = 0.18;
const ROUNDS_COUNTER_FLIP_OUT_SEC = 0.22;
const ROUNDS_COUNTER_FLIP_EASE_IN = "power2.in";
const ROUNDS_COUNTER_FLIP_EASE_OUT = "power2.out";
const ROUNDS_COUNTER_FLIP_PERSPECTIVE = 260;
const ROUNDS_COUNTER_FLIP_FORCE_3D = true;

/** 弹窗 onComplete 后隔两帧再提交主区状态，避免关窗合成与整页 Layout+多路 GSAP 挤在同一帧 */
const POST_MODAL_APPLY_PACKS_RAF_CHAIN = 2;

function formatUsdBattle(n: number) {
  return `US$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const contentPad = "w-full max-w-none px-4 sm:px-6 md:px-8";

function IconLastBattle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" aria-hidden {...props}>
      <path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12H4C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C9.53614 4 7.33243 5.11383 5.86492 6.86543L8 9H2V3L4.44656 5.44648C6.28002 3.33509 8.9841 2 12 2ZM13 7L12.9998 11.585L16.2426 14.8284L14.8284 16.2426L10.9998 12.413L11 7H13Z" />
    </svg>
  );
}

function IconRandom(props: SVGProps<SVGSVGElement>) {
  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" aria-hidden {...props}>
      <path d="M18 17.8832V16L23 19L18 22V19.9095C14.9224 19.4698 12.2513 17.4584 11.0029 14.5453L11 14.5386L10.9971 14.5453C9.57893 17.8544 6.32508 20 2.72483 20H2V18H2.72483C5.52503 18 8.05579 16.3312 9.15885 13.7574L9.91203 12L9.15885 10.2426C8.05579 7.66878 5.52503 6 2.72483 6H2V4H2.72483C6.32508 4 9.57893 6.14557 10.9971 9.45473L11 9.46141L11.0029 9.45473C12.2513 6.5416 14.9224 4.53022 18 4.09051V2L23 5L18 8V6.11684C15.7266 6.53763 13.7737 8.0667 12.8412 10.2426L12.088 12L12.8412 13.7574C13.7737 15.9333 15.7266 17.4624 18 17.8832Z" />
    </svg>
  );
}

function IconEraser(props: SVGProps<SVGSVGElement>) {
  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden {...props}>
      <path d="M13.9999 18.9966H20.9999V20.9966H11.9999L8.00229 20.9991L1.51457 14.5113C1.12405 14.1208 1.12405 13.4877 1.51457 13.0971L12.1212 2.49053C12.5117 2.1 13.1449 2.1 13.5354 2.49053L21.3136 10.2687C21.7041 10.6592 21.7041 11.2924 21.3136 11.6829L13.9999 18.9966ZM15.6567 14.5113L19.1922 10.9758L12.8283 4.61185L9.29275 8.14738L15.6567 14.5113Z" />
    </svg>
  );
}

function IconUserSmall(props: SVGProps<SVGSVGElement>) {
  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 24 24" className="h-[13px] w-[13px] shrink-0 text-navy-200" aria-hidden {...props}>
      <path d="M4 22C4 17.5817 7.58172 14 12 14C16.4183 14 20 17.5817 20 22H4ZM12 13C8.685 13 6 10.315 6 7C6 3.685 8.685 1 12 1C15.315 1 18 3.685 18 7C18 10.315 15.315 13 12 13Z" />
    </svg>
  );
}

function IconAddCase(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="icon h-7 w-7 text-navy-800 transition-transform duration-200" viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        fill="currentColor"
        d="M17.833 6.166c-3.216-3.216-8.45-3.216-11.666 0-3.217 3.217-3.217 8.45 0 11.667 3.216 3.216 8.45 3.216 11.666 0 3.217-3.216 3.217-8.45 0-11.667zm-5.008 9.917h-1.65v-3.258H7.917v-1.65h3.258V7.916h1.65v3.259h3.258v1.65h-3.258v3.258z"
      />
    </svg>
  );
}

function IconDecorCase(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="icon absolute bottom-[-64px] left-[-33px] h-auto w-[117px] rotate-[30deg] text-navy-500 opacity-10" viewBox="0 0 14 15" fill="currentColor" aria-hidden {...props}>
      <path d="M7.436 5.737H5.864v2.135h1.572V5.737ZM7.436 9.021H5.864v5.747h1.572V9.021ZM4.738 7.872H1.08a1.077 1.077 0 0 1-.997-1.493 1.077 1.077 0 0 1 .997-.665h3.66v2.158ZM4.738 14.768a3.563 3.563 0 0 1-3.565-3.566v-2.18h3.565v5.746ZM8.562 7.872h3.659a1.077 1.077 0 0 0 .997-1.493 1.076 1.076 0 0 0-.997-.665H8.56v2.158ZM8.562 14.768a3.563 3.563 0 0 0 3.565-3.566v-2.18H8.562v5.746ZM5.724 4.705 2.158 3.696a.338.338 0 0 1-.094-.586l2.44-1.712a.289.289 0 0 1 .446.14L6.1 4.236a.34.34 0 0 1-.376.47ZM7.084 4.306 9.17.178a.303.303 0 0 1 .54-.024l2.088 3.495a.322.322 0 0 1-.07.427.324.324 0 0 1-.141.066L7.412 4.8a.342.342 0 0 1-.328-.493Z" />
    </svg>
  );
}

function IconInfoCircle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="icon h-5 w-5 text-[#B8BCD0]" viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        fill="currentColor"
        d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10Zm-1-7v2h2v-2h-2Zm2-1.645A3.502 3.502 0 0 0 12 6.5a3.501 3.501 0 0 0-3.433 2.813l1.962.393A1.5 1.5 0 1 1 12 11.5a1 1 0 0 0-1 1V14h2v-.645Z"
      />
    </svg>
  );
}

function IconClassicMode(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 22 21" width={24} height={24} fill="currentColor" className="mr-1 h-4 w-4 shrink-0" aria-hidden {...props}>
      <path d="M16.5946 14.6024L19.4899 17.3453L18.2458 18.524L15.3505 15.781L16.5946 14.6024Z" />
      <path d="M20.3692 17.3857L20.94 17.9265C21.0197 18.002 21.0197 18.1245 20.94 18.2L19.1477 19.8979C19.068 19.9735 18.9387 19.9735 18.859 19.8979L18.2882 19.3572C18.2085 19.2816 18.2085 19.1592 18.2882 19.0836L20.0804 17.3857C20.1602 17.3102 20.2895 17.3102 20.3692 17.3857Z" />
      <path d="M4.50351 3.99049C4.48026 3.96846 4.45265 3.95099 4.42227 3.93907C4.39188 3.92715 4.35932 3.92102 4.32643 3.92102C4.29355 3.92102 4.26098 3.92716 4.2306 3.93909C4.20022 3.95102 4.17262 3.96849 4.14936 3.99053C4.12611 4.01256 4.10767 4.03872 4.09509 4.0675C4.08251 4.09629 4.07603 4.12714 4.07604 4.15829C4.07604 4.18945 4.08252 4.2203 4.09511 4.24908C4.1077 4.27786 4.12615 4.30402 4.14941 4.32604L13.8115 13.4798L12.3454 14.8688L2.60781 5.64342L0.956165 0.965331L5.89389 2.53L15.6317 11.7553L14.1656 13.1443L4.50351 3.99049Z" />
      <path d="M12.5508 15.2364L16.0399 11.9308L16.5363 11.4606L17.3529 12.2341C17.428 12.3052 17.4875 12.3896 17.5282 12.4825C17.5688 12.5753 17.5897 12.6749 17.5897 12.7755C17.5897 12.876 17.5688 12.9756 17.5282 13.0685C17.4875 13.1613 17.428 13.2457 17.3529 13.3168L16.6802 13.9542L14.6671 15.8616L13.983 16.5097C13.908 16.5808 13.8189 16.6373 13.7209 16.6758C13.6228 16.7143 13.5177 16.7341 13.4116 16.7341C13.3055 16.7341 13.2004 16.7143 13.1023 16.6758C13.0043 16.6373 12.9152 16.5808 12.8402 16.5097L12.0237 15.7361L12.5508 15.2364Z" />
      <path d="M4.4057 14.6131L5.64978 15.7917L2.75446 18.5347L1.51038 17.3561L4.4057 14.6131Z" />
      <path d="M0.919392 17.3964L2.71155 19.0947C2.73051 19.1127 2.74555 19.134 2.75582 19.1574C2.76608 19.1809 2.77136 19.2061 2.77136 19.2315C2.77136 19.2569 2.76608 19.282 2.75582 19.3055C2.74555 19.3289 2.73051 19.3503 2.71155 19.3682L2.14071 19.909C2.12176 19.927 2.09926 19.9412 2.07449 19.951C2.04972 19.9607 2.02317 19.9657 1.99636 19.9657C1.96955 19.9657 1.94301 19.9607 1.91824 19.951C1.89347 19.9412 1.87097 19.927 1.85202 19.909L0.0597002 18.2111C0.0214431 18.1748 -4.58451e-05 18.1256 -4.58406e-05 18.0743C-4.58361e-05 18.023 0.0214431 17.9739 0.0597002 17.9376L0.630615 17.3968C0.649537 17.3788 0.672023 17.3645 0.696784 17.3547C0.721546 17.3449 0.748098 17.3399 0.77492 17.3398C0.801743 17.3398 0.828309 17.3448 0.853099 17.3545C0.877889 17.3642 0.900417 17.3784 0.919392 17.3964Z" />
      <path d="M4.98041 11.9602L8.46956 15.2658L8.96594 15.7361L8.14936 16.5097C8.07434 16.5808 7.98527 16.6373 7.88722 16.6758C7.78918 16.7143 7.68409 16.7341 7.57796 16.7341C7.47183 16.7341 7.36674 16.7143 7.26869 16.6758C7.17065 16.6373 7.08158 16.5808 7.00656 16.5097L6.33385 15.8724L4.32041 13.9649L3.63641 13.3168C3.56133 13.2457 3.50177 13.1613 3.46113 13.0684C3.4205 12.9756 3.39958 12.876 3.39958 12.7755C3.39958 12.6749 3.4205 12.5753 3.46113 12.4825C3.50177 12.3896 3.56133 12.3052 3.63641 12.2341L4.45292 11.4606L4.98041 11.9602Z" />
      <path d="M12.623 8.34266L16.8513 4.33677C16.8983 4.29228 16.9246 4.23194 16.9246 4.16903C16.9246 4.10612 16.8983 4.04578 16.8513 4.00129C16.8043 3.9568 16.7407 3.93181 16.6742 3.93181C16.6078 3.93181 16.5441 3.9568 16.4972 4.00129L12.2688 8.00711L10.8027 6.61815L15.1068 2.54058L20.0446 0.976074L18.3929 5.65444L14.0891 9.73185L12.623 8.34266Z" />
      <path d="M8.74323 12.018L10.2094 13.407L8.65513 14.8794L7.18901 13.4904L8.74323 12.018Z" />
      <path d="M6.9227 10.2934L8.38879 11.6824L6.8346 13.1548L5.3685 11.7658L6.9227 10.2934Z" />
    </svg>
  );
}

function IconUnderdog(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="icon mr-1 h-4 w-4 shrink-0" viewBox="0 0 22 22" fill="currentColor" aria-hidden {...props}>
      <path d="M18.4023 17.0273C18.3967 19.3405 16.4551 21.3091 14.2491 21.3208C13.687 21.3239 13.2115 21.0763 12.7663 20.7526C11.0271 19.488 10.8727 19.4847 9.13894 20.7536C8.51354 21.2113 7.85265 21.3926 7.07077 21.2624C5.10343 20.9351 3.53967 19.1705 3.50342 17.1702C3.49015 16.4358 3.74541 15.7971 4.23323 15.2491C4.63681 14.7955 5.10114 14.4072 5.58155 14.0427C6.39891 13.4226 7.05929 12.6681 7.62062 11.8157C8.03313 11.1893 8.42675 10.5473 8.9743 10.0215C10.1427 8.89931 11.7613 8.89905 12.9291 10.021C13.3327 10.4084 13.6661 10.8536 13.9538 11.3279C14.7009 12.5588 15.6656 13.5791 16.8105 14.4501C17.5441 15.0081 18.1978 15.6542 18.3533 16.6344C18.3788 16.7955 18.3939 16.9578 18.4023 17.0273Z" />
      <path d="M0.549316 9.2194C0.561824 8.43267 0.703753 7.76999 1.08308 7.17497C1.86649 5.94586 3.2748 5.71433 4.41354 6.62206C5.79224 7.72124 6.24023 9.96988 5.38738 11.5096C4.61061 12.9121 3.02259 13.1763 1.83943 12.0952C0.96923 11.3003 0.606496 10.2816 0.549316 9.2194Z" />
      <path d="M5.35303 3.9206C5.36349 3.35952 5.5478 2.59296 6.0231 1.91599C7.11871 0.3558 9.0281 0.412214 9.98254 2.0717C10.828 3.54204 10.7884 5.04224 9.83755 6.45871C8.91859 7.8272 7.25068 7.88489 6.18647 6.62693C5.66956 6.01634 5.35405 5.08819 5.35303 3.9206Z" />
      <path d="M16.5572 4.27184C16.5146 5.18365 16.2552 6.09189 15.539 6.8171C14.5942 7.77358 13.2663 7.75852 12.328 6.79106C11.0018 5.42385 11.0299 2.82269 12.3854 1.48764C13.4059 0.482404 14.8153 0.571492 15.7164 1.6939C16.3035 2.42498 16.5411 3.27017 16.5572 4.27184Z" />
      <path d="M21.3384 8.9349C21.2814 10.2518 20.8161 11.3806 19.7473 12.199C18.2708 13.3298 16.4431 12.6651 16.0444 10.8499C15.7204 9.37549 16.1608 8.09533 17.1926 7.04235C17.8879 6.33297 18.7551 5.94267 19.7687 6.30642C20.8214 6.68422 21.1969 7.56871 21.3361 8.5931C21.3514 8.70516 21.3384 8.82105 21.3384 8.9349Z" />
    </svg>
  );
}

function IconPublic(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="icon mr-1 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 16 15" aria-hidden {...props}>
      <path d="M1.781 8.125h3.423c.107 1.98.738 3.895 1.829 5.55a6.253 6.253 0 0 1-5.252-5.55Zm0-1.25a6.253 6.253 0 0 1 5.252-5.55 11.187 11.187 0 0 0-1.829 5.55H1.781Zm12.438 0h-3.423a11.187 11.187 0 0 0-1.829-5.55 6.253 6.253 0 0 1 5.252 5.55Zm0 1.25a6.253 6.253 0 0 1-5.252 5.55 11.187 11.187 0 0 0 1.829-5.55h3.423Zm-7.763 0h3.088A9.942 9.942 0 0 1 8 12.87a9.942 9.942 0 0 1-1.544-4.745Zm0-1.25A9.942 9.942 0 0 1 8 2.13a9.942 9.942 0 0 1 1.544 4.745H6.456Z" />
    </svg>
  );
}

function IconPrivate(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="icon mr-1 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 16 15" aria-hidden {...props}>
      <path d="M9.25 8.908v4.842H3a5 5 0 0 1 6.25-4.842ZM8 8.125a3.749 3.749 0 0 1-3.75-3.75A3.749 3.749 0 0 1 8 .625a3.749 3.749 0 0 1 3.75 3.75A3.749 3.749 0 0 1 8 8.125Zm4.375 2.241 1.326-1.326.884.884-1.326 1.326 1.326 1.326-.884.884-1.326-1.326-1.326 1.326-.884-.884 1.326-1.326-1.326-1.326.884-.884 1.326 1.326Z" />
    </svg>
  );
}

type SegmentIndex = 0 | 1;

function TwoSegmentField({
  testIdPrefix,
  left,
  right,
  value,
  onChange,
}: {
  testIdPrefix: string;
  left: React.ReactNode;
  right: React.ReactNode;
  value: SegmentIndex;
  onChange: (v: SegmentIndex) => void;
}) {
  return (
    <div className="relative grid h-full gap-0.5" style={{ gridTemplateColumns: "repeat(2, minmax(65px, 1fr))" }}>
      <div
        className="pointer-events-none absolute h-full rounded-md bg-gold-400 px-5 text-10px font-semibold uppercase text-gold-400 transition-all duration-300 ease-in-out"
        style={{
          width: "calc(50% - 0.0625rem)",
          left: value === 0 ? "calc(0% + 0rem)" : "calc(50% + 0.0625rem)",
        }}
      />
      <button
        type="button"
        data-testid={testIdPrefix}
        className={`h-8 bg-[#353845] px-5 text-10px font-semibold uppercase transition-colors duration-300 first-of-type:rounded-l last-of-type:rounded-r hover:bg-navy-500 ${value === 0 ? "text-navy-900" : "text-navy-200"}`}
        onClick={() => onChange(0)}
      >
        <span className="relative">{left}</span>
      </button>
      <button
        type="button"
        data-testid={testIdPrefix}
        className={`h-8 bg-[#353845] px-5 text-10px font-semibold uppercase transition-colors duration-300 first-of-type:rounded-l last-of-type:rounded-r hover:bg-navy-500 ${value === 1 ? "text-navy-900" : "text-navy-200"}`}
        onClick={() => onChange(1)}
      >
        <span className="relative">{right}</span>
      </button>
    </div>
  );
}

function RoundsHexCounter({ rounds }: { rounds: number }) {
  const flipRef = useRef<HTMLDivElement>(null);
  const flipTlRef = useRef<gsap.core.Timeline | null>(null);
  const visibleValueRef = useRef(rounds);
  const [displayed, setDisplayed] = useState(rounds);

  useLayoutEffect(() => {
    if (rounds === visibleValueRef.current) return;
    const el = flipRef.current;
    flipTlRef.current?.kill();
    gsap.killTweensOf(el);
    if (!el) {
      visibleValueRef.current = rounds;
      setDisplayed(rounds);
      return;
    }
    gsap.set(el, {
      transformPerspective: ROUNDS_COUNTER_FLIP_PERSPECTIVE,
      transformOrigin: "50% 50%",
      rotationX: 0,
      force3D: ROUNDS_COUNTER_FLIP_FORCE_3D,
      backfaceVisibility: "hidden",
    });
    const tl = gsap.timeline({ defaults: { force3D: ROUNDS_COUNTER_FLIP_FORCE_3D } });
    flipTlRef.current = tl;
    tl.to(el, {
      rotationX: -90,
      duration: ROUNDS_COUNTER_FLIP_IN_SEC,
      ease: ROUNDS_COUNTER_FLIP_EASE_IN,
    })
      .add(() => {
        visibleValueRef.current = rounds;
        queueMicrotask(() => {
          setDisplayed(rounds);
        });
      })
      .fromTo(
        el,
        { rotationX: 90 },
        {
          rotationX: 0,
          duration: ROUNDS_COUNTER_FLIP_OUT_SEC,
          ease: ROUNDS_COUNTER_FLIP_EASE_OUT,
          immediateRender: false,
        },
      );
    return () => {
      tl.kill();
      gsap.killTweensOf(el);
    };
  }, [rounds]);

  return (
    <div className="m-0 md:bg-navy-900">
      <div className="relative flex h-[84px] w-[84px] items-center justify-center rounded-full text-xl">
        <svg className="icon absolute left-0 top-0 h-full w-full" viewBox="0 0 74 82" aria-hidden>
          <path
            d="M33.25 1.74254C35.5705 0.402789 38.4295 0.40279 40.75 1.74254L69.1231 18.1237C71.4436 19.4635 72.8731 21.9394 72.8731 24.6189V57.3813C72.8731 60.0608 71.4436 62.5368 69.1231 63.8765L40.75 80.2577C38.4295 81.5975 35.5705 81.5975 33.25 80.2577L4.87693 63.8765C2.55643 62.5368 1.12693 60.0608 1.12693 57.3813V24.6189C1.12693 21.9394 2.55643 19.4635 4.87693 18.1237L33.25 1.74254Z"
            fill="#001A07"
            stroke="#324600"
          />
        </svg>
        <div className="absolute left-[7%] top-1/2 h-px w-[86%] -translate-y-1/2" style={{ backgroundColor: "rgb(181, 218, 89)" }} />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 overflow-visible"
          style={{ perspective: `${ROUNDS_COUNTER_FLIP_PERSPECTIVE}px` }}
        >
          <div
            ref={flipRef}
            className="relative h-full w-full [transform-style:preserve-3d] will-change-transform"
          >
            <svg className="icon h-full w-full [backface-visibility:hidden]" viewBox="0 0 56 62" aria-hidden>
              <path
                d="M25.25 1.66531C26.9517 0.682827 29.0483 0.682827 30.75 1.66531L52.0298 13.9512C53.7315 14.9337 54.7798 16.7494 54.7798 18.7143V43.2861C54.7798 45.2511 53.7315 47.0668 52.0298 48.0493L30.75 60.3352C29.0483 61.3177 26.9517 61.3177 25.25 60.3352L3.9702 48.0493C2.26849 47.0668 1.2202 45.2511 1.2202 43.2861V18.7143C1.2202 16.7494 2.26849 14.9337 3.9702 13.9512L25.25 1.66531Z"
                fill="#324600"
                stroke="#B5DA59"
              />
            </svg>
            <div
              data-testid="single-bttl-rounds-counter"
              className="absolute inset-0 z-10 flex items-center justify-center overflow-visible text-center text-xl font-bold leading-none tabular-nums"
              style={{ color: "rgb(214, 255, 111)" }}
            >
              {displayed}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 按 quantity 展平：每回合一卡，与参考站 carousel 一致 */
function flattenBattleCaseSlides(cases: AddBattleRoundCaseSelection[]): AddBattleRoundCaseSelection[] {
  const rows: AddBattleRoundCaseSelection[] = [];
  for (const c of cases) {
    for (let i = 0; i < c.quantity; i++) {
      rows.push(c);
    }
  }
  return rows;
}

function CreateBattleCasesCarouselStrip({
  slides,
  enterRevision,
}: {
  slides: AddBattleRoundCaseSelection[];
  enterRevision: number;
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row || slides.length === 0) return;
    const children = Array.from(row.children) as HTMLElement[];
    gsap.killTweensOf(children);
    const tween = gsap.fromTo(
      children,
      { opacity: 0, scale: CAROUSEL_SLIDE_SCALE_FROM, force3D: true },
      {
        opacity: 1,
        scale: 1,
        duration: CAROUSEL_SLIDE_ENTER_SEC,
        ease: SELECTED_PACK_ENTER_EASE,
        stagger: CAROUSEL_SLIDE_STAGGER_SEC,
        force3D: true,
      },
    );
    return () => {
      tween.kill();
    };
  }, [enterRevision]);

  if (slides.length === 0) {
    return <div ref={rowRef} className="flex min-h-[84px] w-full items-center" aria-hidden />;
  }

  return (
    <div
      ref={rowRef}
      className="flex w-max min-h-0 items-stretch"
      role="list"
      aria-label="Battle rounds"
    >
      {slides.map((slide, idx) => (
        <div
          key={`${slide.id}-${idx}`}
          className="flex w-[60px] shrink-0 flex-col items-center justify-center last:mr-0 mr-[10px]"
          role="listitem"
        >
          <div className="relative mt-2 flex aspect-[270/375] w-full items-end justify-center overflow-hidden rounded-md pb-1 text-xs uppercase">
            {slide.image ? (
              <Image alt="" src={slide.image} fill className="object-cover" sizes="60px" unoptimized />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-navy-600 via-navy-800 to-navy-900" aria-hidden />
            )}
            <div className="relative z-10 mx-1 max-w-[80%] rounded-sm bg-navy-800 p-1">
              <span className="relative line-clamp-1 overflow-hidden break-words text-center text-10px font-semibold leading-tight text-white">
                {slide.title}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActionButtonRow({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <div className={className}>
      <div className="flex w-full items-center gap-2 md:w-auto md:gap-1.5">
        <div className="flex w-full flex-row gap-2 md:w-auto md:flex-col md:gap-[5px]">
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded bg-navy-600 px-4 py-3 text-xs font-bold uppercase text-white transition-colors hover:bg-navy-500 disabled:opacity-50 md:h-[42px] md:min-w-[199px] md:flex-initial md:gap-3 md:px-9 md:py-2.5"
          >
            <IconLastBattle />
            <span className="truncate">{t("createBattleLastBattle")}</span>
          </button>
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded bg-navy-600 px-4 py-3 text-xs font-bold uppercase text-white transition-colors hover:bg-navy-500 disabled:opacity-50 md:h-[42px] md:flex-initial md:gap-3 md:px-9 md:py-2.5"
          >
            <IconRandom />
            <span className="truncate">{t("createBattleRandomCases")}</span>
          </button>
        </div>
        <button
          type="button"
          className="flex items-center justify-center rounded bg-navy-600 px-4 py-3 text-white transition-colors hover:bg-navy-500 disabled:opacity-50 md:h-[89px] md:w-[42px] md:px-3 md:py-2.5"
          aria-label={t("close")}
        >
          <IconEraser />
        </button>
      </div>
    </div>
  );
}

function CreateBattleSelectedPackTile({
  item,
  staggerIndex,
  onBumpQuantity,
  onQuantityCommit,
}: {
  item: AddBattleRoundCaseSelection;
  staggerIndex: number;
  onBumpQuantity: (id: string, delta: number) => void;
  onQuantityCommit: (id: string, qty: number) => void;
}) {
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);
  const staggerIndexRef = useRef(staggerIndex);
  staggerIndexRef.current = staggerIndex;
  const priceLabel = formatUsdBattle(item.price);

  /** layout 阶段开播，避免 useEffect 首帧已画出完整卡；deps 固定 []，cleanup 仅 kill，不设回最终态，Strict Mode 第二次 effect 会再播一遍弹出。 */
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const delay = staggerIndexRef.current * SELECTED_PACK_ENTER_STAGGER_SEC;
    const tween = gsap.fromTo(
      el,
      { scale: SELECTED_PACK_ENTER_SCALE_FROM, opacity: 0, force3D: true },
      {
        scale: 1,
        opacity: 1,
        duration: SELECTED_PACK_ENTER_SEC,
        ease: SELECTED_PACK_ENTER_EASE,
        delay,
        force3D: true,
      },
    );
    return () => {
      tween.kill();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      data-testid="my-bttl-selected-cases"
      className="relative w-full origin-center will-change-transform md:w-[219px]"
    >
      <div className="absolute right-3 top-3 z-10 flex h-7 items-center justify-center rounded-[6px] bg-navy-800 px-2">
        <span className="text-xs font-semibold text-gold-400">{priceLabel}</span>
      </div>
      <div className="relative flex aspect-[270/375] w-full flex-col items-center justify-end overflow-hidden rounded-md p-3 pb-1 text-xs uppercase">
        {item.image ? (
          <Image alt="" src={item.image} fill className="object-cover" sizes="219px" unoptimized />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-navy-600 via-navy-800 to-navy-900" aria-hidden />
        )}
        <p className="relative z-10 mx-1 line-clamp-2 min-w-[4rem] max-w-full overflow-hidden break-all rounded-[6px] bg-navy-800 p-2 text-center text-sm font-semibold leading-tight text-white md:min-w-[8rem]">
          {item.title}
        </p>
        <div className="relative z-10 mt-1 flex h-12 w-full max-w-full items-center justify-between rounded-lg bg-navy-900 p-2 sm:mt-2">
          <button
            type="button"
            data-testid="my-bttl-subtract-case-minus-btn"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-navy-700 text-white transition-colors duration-200 hover:border-white hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            aria-label={t("addBattleCasePackDecreaseAria")}
            onClick={() => onBumpQuantity(item.id, -1)}
          >
            -
          </button>
          <input
            type="number"
            className="input mx-1.5 h-auto w-full min-w-0 rounded border-0 bg-transparent p-0 text-center text-base font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            data-testid="my-bttl-case-card-counter"
            aria-label={t("addBattleCasePackQuantityInputAria").replace("{title}", item.title)}
            min={1}
            max={MAX_SELECTED_PACK_QTY}
            value={item.quantity}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!Number.isNaN(v)) onQuantityCommit(item.id, v);
            }}
          />
          <button
            type="button"
            data-testid="my-bttl-add-case-plus-btn"
            disabled={item.quantity >= MAX_SELECTED_PACK_QTY}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-navy-700 text-white transition-colors duration-200 hover:border-white hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:pointer-events-none disabled:cursor-default disabled:opacity-25"
            aria-label={t("addBattleCasePackIncreaseAria")}
            onClick={() => onBumpQuantity(item.id, 1)}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

/** 创建对战页主体 UI 复刻（静态占位，后续接数据与接口） */
export function CreateBattleMainShell() {
  const { t } = useI18n();
  const ddId = useId();
  const [addCaseModalOpen, setAddCaseModalOpen] = useState(false);
  const [selectedBattleCases, setSelectedBattleCases] = useState<AddBattleRoundCaseSelection[]>([]);
  const [carouselEnterRevision, setCarouselEnterRevision] = useState(0);
  const [mode, setMode] = useState<SegmentIndex>(0);
  const [privacy, setPrivacy] = useState<SegmentIndex>(0);
  const [borrow, setBorrow] = useState<SegmentIndex>(0);
  const postModalApplyRafRef = useRef<{ chain: number | null }>({ chain: null });

  const carouselSlides = useMemo(() => flattenBattleCaseSlides(selectedBattleCases), [selectedBattleCases]);

  const handleConfirmPacks = useCallback((packs: AddBattleRoundCaseSelection[]) => {
    const pending = postModalApplyRafRef.current;
    if (pending.chain != null) {
      cancelAnimationFrame(pending.chain);
      pending.chain = null;
    }
    let remaining = POST_MODAL_APPLY_PACKS_RAF_CHAIN;
    const step = () => {
      remaining -= 1;
      if (remaining > 0) {
        pending.chain = requestAnimationFrame(step);
        return;
      }
      pending.chain = null;
      setSelectedBattleCases(packs);
      setCarouselEnterRevision((n) => n + 1);
    };
    pending.chain = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    return () => {
      const id = postModalApplyRafRef.current.chain;
      if (id != null) cancelAnimationFrame(id);
      postModalApplyRafRef.current.chain = null;
    };
  }, []);

  const bumpSelectedCaseQty = useCallback((id: string, delta: number) => {
    setSelectedBattleCases((prev) =>
      prev
        .map((c) => {
          if (c.id !== id) return c;
          const n = c.quantity + delta;
          if (n <= 0) return null;
          return { ...c, quantity: Math.min(MAX_SELECTED_PACK_QTY, n) };
        })
        .filter((c): c is AddBattleRoundCaseSelection => c != null),
    );
  }, []);

  const commitSelectedCaseQty = useCallback((id: string, qty: number) => {
    setSelectedBattleCases((prev) =>
      prev
        .map((c) => {
          if (c.id !== id) return c;
          if (qty <= 0) return null;
          return { ...c, quantity: Math.min(MAX_SELECTED_PACK_QTY, qty) };
        })
        .filter((c): c is AddBattleRoundCaseSelection => c != null),
    );
  }, []);

  return (
    <div className="transition-opacity duration-500 opacity-100">
      {/* 仅轮播条 + 桌面侧按钮 + 移动端按钮行使用 md 段 navy-900 底；“添加宝盒”区块单独在外层，不继承此背景 */}
      <div className="mt-3 md:mt-0 md:bg-navy-900">
        <div className={contentPad}>
          <div
            data-testid="my-bttl-cases-carousel"
            className="relative flex w-full items-center pb-3 pt-3 md:pb-4 md:pt-4 xl:pb-6 xl:pt-6"
          >
            <div className="shrink-0">
              <RoundsHexCounter rounds={carouselSlides.length} />
            </div>
            <div className="relative ml-1.5 hidden min-w-0 flex-1 rounded bg-navy-900 px-3 md:block">
              <div className="flex h-full w-full">
                <div className="-mt-2 min-w-0 flex-1 overflow-x-auto overflow-y-hidden no-scrollbar">
                  <CreateBattleCasesCarouselStrip slides={carouselSlides} enterRevision={carouselEnterRevision} />
                </div>
              </div>
            </div>
            <div className="relative ml-1.5 hidden shrink-0 md:block">
              <ActionButtonRow />
            </div>
          </div>
        </div>
        <div className={`${contentPad} my-[15px] p-0 md:hidden`}>
          <ActionButtonRow />
        </div>
      </div>

      <div className={`${contentPad} h-[100px] md:hidden`}>
        <button
          type="button"
          className="group relative box-content h-full w-full cursor-pointer overflow-hidden rounded-lg bg-navy-700"
          onClick={() => setAddCaseModalOpen(true)}
        >
          <div className="absolute inset-0 mb-2 flex w-full scale-100 items-center justify-center gap-2 xl:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-400 shadow-[0_0_10px_rgba(214,255,111,0.49)] transition-all duration-200 group-hover:scale-105">
              <IconAddCase />
            </div>
            <p className="text-center text-sm font-semibold uppercase text-white">{t("createBattleAddCase")}</p>
            <IconDecorCase />
          </div>
        </button>
      </div>
      <div className={contentPad}>
        <div className="container mx-auto my-3 grid w-full max-w-full grid-cols-2 flex-wrap gap-1.5 md:my-6 md:flex md:flex-wrap md:gap-6 xl:mb-10 xl:mt-10">
          {selectedBattleCases.map((item, index) => (
            <CreateBattleSelectedPackTile
              key={item.id}
              item={item}
              staggerIndex={index}
              onBumpQuantity={bumpSelectedCaseQty}
              onQuantityCommit={commitSelectedCaseQty}
            />
          ))}
          <button
            type="button"
            data-testid="bttl-create-add-case-btn"
            className="group relative box-content hidden cursor-pointer rounded-md bg-navy-700 md:block md:w-[219px] lg:rounded-lg"
            onClick={() => setAddCaseModalOpen(true)}
          >
            <div className="aspect-[270/375] w-full pb-1" />
            <div className="absolute inset-0 flex w-full scale-100 flex-col items-center justify-center overflow-hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D6FF6F] drop-shadow-[0_0_10px_#D6FF6F] transition-all duration-200 group-hover:scale-105">
                <IconAddCase />
              </div>
              <p className="mt-5 text-center text-sm font-semibold uppercase text-white">{t("createBattleAddCase")}</p>
              <IconDecorCase />
            </div>
          </button>
        </div>
      </div>

      <div className={contentPad}>
        <div className="mt-3 grid grid-cols-1 rounded-lg bg-navy-700 md:mt-0 xl:grid-cols-[1fr_auto]">
          <div className="col-span-1 grid grid-cols-1 gap-8 p-6 xl:col-span-1 xl:grid-cols-4">
            <div className="flex flex-col">
              <div className="ml-2 flex items-center gap-3">
                <p className="text-xs font-semibold uppercase text-navy-200">{t("createBattleCaseModeLabel")}</p>
              </div>
              <div className="mt-auto rounded-md bg-transparent p-2 transition-opacity duration-200">
                <TwoSegmentField
                  testIdPrefix="my-bttl-mode-btn"
                  value={mode}
                  onChange={setMode}
                  left={
                    <div className="flex items-center justify-center whitespace-nowrap transition-colors duration-300">
                      <IconClassicMode />
                      {t("createBattleModeClassicKd")}
                    </div>
                  }
                  right={
                    <div className="flex items-center justify-center whitespace-nowrap transition-colors duration-300">
                      <IconUnderdog />
                      {t("createBattleModeUnderdog")}
                    </div>
                  }
                />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="ml-2 flex items-center gap-3">
                <p className="text-xs font-semibold uppercase text-navy-200">{t("createBattleSelectType")}</p>
              </div>
              <div className="mt-auto p-2">
                <div className="relative">
                  <button
                    type="button"
                    id={ddId}
                    className="dropdown flex h-8 w-full items-center rounded border-none bg-navy-600 px-3 transition-colors hover:bg-navy-500"
                    aria-haspopup="listbox"
                    aria-expanded="false"
                  >
                    <div className="overflow-hidden whitespace-nowrap px-3 text-base !px-0 lg:text-10px">
                      <div className="flex items-center gap-1">
                        <IconUserSmall />
                        <span className="text-[10px] font-bold uppercase leading-normal text-navy-200">VS</span>
                        <IconUserSmall />
                      </div>
                    </div>
                    <div className="dropdown-arrow ml-auto">
                      <svg className="icon block h-2.5 w-2.5 shrink-0 transition-transform duration-200" viewBox="0 0 10 6" fill="none" aria-hidden>
                        <path d="M1 1L5 5L9 1" stroke="currentColor" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="ml-2 flex items-center gap-3">
                <p className="text-xs font-semibold uppercase text-navy-200">{t("createBattlePrivacy")}</p>
              </div>
              <div className="mt-auto rounded-md bg-transparent p-2 transition-opacity duration-200">
                <TwoSegmentField
                  testIdPrefix="my-bttl-public-private-btn"
                  value={privacy}
                  onChange={setPrivacy}
                  left={
                    <div className="flex items-center justify-center whitespace-nowrap">
                      <IconPublic />
                      {t("createBattlePublic")}
                    </div>
                  }
                  right={
                    <div className="flex items-center justify-center whitespace-nowrap">
                      <IconPrivate />
                      {t("createBattlePrivate")}
                    </div>
                  }
                />
              </div>
            </div>

            <div className="relative flex flex-col">
              <div className="ml-2 flex items-center gap-1">
                <p className="text-xs font-semibold uppercase text-navy-200">{t("createBattleBorrowShort")}</p>
                <div className="shrink-0" title="">
                  <IconInfoCircle />
                </div>
              </div>
              <div className="mt-auto rounded-md bg-transparent p-2 transition-opacity duration-200">
                <TwoSegmentField
                  testIdPrefix="my-bttl-classic-borrow-btn"
                  value={borrow}
                  onChange={setBorrow}
                  left={<span className="relative">{t("createBattleBorrowOff")}</span>}
                  right={<span className="relative">{t("createBattleBorrowOn")}</span>}
                />
              </div>
              <div className="absolute left-[0.5rem] top-full z-10 mt-2 hidden xl:block" />
            </div>
            <div className="md:hidden" />
          </div>

          <div className="fixed bottom-[76px] left-0 right-0 z-50 bg-transparent px-5 transition-all duration-300 md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto md:col-span-1 md:w-auto md:rounded-lg md:bg-navy-500 md:px-0 md:py-4 xl:min-h-[110px] xl:py-6 2xl:min-h-[124px]">
            <div className="flex w-full items-center justify-between sm:flex-row">
              <div className="hidden md:flex">
                <div className="flex h-full w-full flex-col gap-3 text-left sm:mr-2.5 sm:w-auto sm:px-5">
                  <div>
                    <p className="whitespace-nowrap text-xs font-semibold uppercase text-white">{t("createBattleBattleValue")}</p>
                  </div>
                  <div className="flex h-8 items-center justify-center rounded bg-grass-green px-4">
                    <span data-testid="bttl-total-cost-info" className="text-xs font-semibold leading-none text-lime-400">
                      US$0.00
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-auto md:px-5 md:pl-0">
                <div data-testid="my-bttl-create-my-bttl-btn" className="relative w-full">
                  <div className="mb-[-3px] flex h-[55px] w-full cursor-help items-center justify-center gap-0.5 rounded-md bg-grass-green md:h-auto md:py-1">
                    <p className="text-[10px] font-semibold uppercase leading-normal text-lime-400 md:mb-[3px]">{t("createBattleGuaranteedReward")}</p>
                    <svg className="icon mb-[3px] h-3.5 w-3.5 text-lime-400 md:mb-[3px]" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        fill="currentColor"
                        d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10Zm-1-7v2h2v-2h-2Zm2-1.645A3.502 3.502 0 0 0 12 6.5a3.501 3.501 0 0 0-3.433 2.813l1.962.393A1.5 1.5 0 1 1 12 11.5a1 1 0 0 0-1 1V14h2v-.645Z"
                      />
                    </svg>
                  </div>
                  <div className="w-full">
                    <button
                      type="button"
                      data-cy="createCaseBattle-btn"
                      className="grid h-[53px] w-full !w-full grid-cols-1 grid-rows-1 items-center justify-center justify-items-stretch rounded-md bg-[#D6FF6F] py-4 text-xs tabular-nums text-gray-900 ring-1 ring-transparent transition-all hover:bg-[#DEFF8C] focus:outline-none focus-visible:outline-none focus-visible:ring active:bg-grass-green active:text-[#D6FF6F] active:ring-[#DEFF8C] disabled:cursor-default disabled:bg-[#323234] disabled:text-gray-600 disabled:pointer-events-none sm:px-10 md:h-12 md:!min-w-[12.5rem] md:w-[16rem] lg:whitespace-nowrap"
                    >
                      <span className="col-start-1 row-start-1 min-w-[100px] whitespace-nowrap opacity-0 transition-opacity duration-300 pointer-events-none" />
                      <span className="col-start-1 row-start-1 whitespace-nowrap opacity-100 transition-opacity duration-300">{t("createBattleCreateCaseBattleCta")}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={contentPad}>
        <div className="my-6 md:mt-10">
          <div className="flex w-full items-center justify-start overflow-hidden rounded-lg bg-navy-700 px-7 py-[22px]">
            <div className="text-xs leading-normal text-white">
              <p className="mb-0 font-semibold text-gold-400">{t("createBattleClassicSpotlightTitle")}</p>
              <p className="mb-0 font-normal">{t("createBattleClassicSpotlightBody")}</p>
            </div>
          </div>
        </div>
      </div>

      <AddBattleRoundCaseModal
        open={addCaseModalOpen}
        onClose={() => setAddCaseModalOpen(false)}
        onConfirm={handleConfirmPacks}
        initialSelections={selectedBattleCases}
      />
    </div>
  );
}
