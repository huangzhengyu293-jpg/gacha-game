'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Urbanist } from 'next/font/google';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useSession } from 'next-auth/react';

interface DealsCenterPanelProps {
  percent?: number;
  onPercentChange?: (p: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  uiLocked?: boolean;
  onLockChange?: (locked: boolean) => void;
  spinPrice?: number;
  inactive?: boolean;
  productId?: string | null;
  productImage?: string | null;
  productTitle?: string | null;
  productPrice?: number | null;
}

const urbanist = Urbanist({ subsets: ['latin'], weight: ['400', '600', '700', '800', '900'], display: 'swap' });

export default function DealsCenterPanel({ percent = 35.04, onPercentChange, onDragStart, onDragEnd, uiLocked = false, onLockChange, spinPrice = 0, inactive = false, productId = null, productImage = null, productTitle = null, productPrice = null }: DealsCenterPanelProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragging, setDragging] = useState<null | 'start' | 'end' | 'body' | 'percent'>(null);
  const [centerDeg, setCenterDeg] = useState<number>(90);
  const lastAngleRef = useRef<number | null>(null);
  const didDragRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);
  // Demo spin arrow state
  const [demoRunning, setDemoRunning] = useState<boolean>(false);
  const [demoVisible, setDemoVisible] = useState<boolean>(false);
  const [demoAngle, setDemoAngle] = useState<number>(0); // radians 0..2π，用于触发重渲染
  const demoRafRef = useRef<number | null>(null);
  const demoActiveRef = useRef<boolean>(false);
  const [demoOutcome, setDemoOutcome] = useState<'win' | 'lose'>('win');
  const queryClient = useQueryClient();
  const { status } = useSession();
  const isAuthed = status === 'authenticated';
  const addToWarehouse = useMutation({
    mutationFn: async (item: { productId: string; name: string; image: string; price: number; qualityId?: string; quantity?: number }) => {
      return api.addUserWarehouseItems([item]);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['warehouse'] });
    },
  });

  const arc = useMemo(() => {
    const pRaw = Math.max(0, Math.min(80, percent));
    const cx = 160;
    const cy = 160;
    const r = 120;
    // centerDeg 由交互状态驱动（默认以下方为中心 90deg）
    const totalAngle = Math.min((pRaw / 100) * 360, 359.999);
    const halfAngle = totalAngle / 2;
    const startDeg = centerDeg - halfAngle;
    const endDeg = centerDeg + halfAngle;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const sx = cx + r * Math.cos(toRad(startDeg));
    const sy = cy + r * Math.sin(toRad(startDeg));
    const ex = cx + r * Math.cos(toRad(endDeg));
    const ey = cy + r * Math.sin(toRad(endDeg));
    // 绿色条描边宽度（保持原始 16px）
    const strokeWidth = 16;
    // 轨迹中心线半径，白点在描边中心线上（条内居中）
    const centerRadius = r - strokeWidth / 2;
    // 防止贴内侧：将圆点在条厚度方向稍微向外偏 8px（仍在条内）
    const radialOffsetPx = 8;
    const dotRadiusLine = centerRadius + radialOffsetPx;
    // 圆点沿弧线端部向内偏移 10px，避免贴边
    const dotOffsetPx = 10;
    const dotOffsetDeg = (dotOffsetPx / centerRadius) * (180 / Math.PI);
    const startDotAngle = startDeg + dotOffsetDeg;
    const endDotAngle = endDeg - dotOffsetDeg;
    const startDot = {
      x: cx + dotRadiusLine * Math.cos(toRad(startDotAngle)),
      y: cy + dotRadiusLine * Math.sin(toRad(startDotAngle)),
    };
    const endDot = {
      x: cx + dotRadiusLine * Math.cos(toRad(endDotAngle)),
      y: cy + dotRadiusLine * Math.sin(toRad(endDotAngle)),
    };

    const largeArcFlag = totalAngle > 180 ? 1 : 0;
    const sweepFlag = 1; // 顺时针
    const path = totalAngle <= 0 ? '' : `M ${sx} ${sy} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${ex} ${ey}`;
    return {
      path,
      startDeg,
      endDeg,
      centerDeg,
      centerRadius,
      strokeWidth,
      startDot,
      endDot,
      pRaw,
    };
  }, [percent, centerDeg]);

  // 将指针位置转换为角度（0..360）
  function getAngleFromPointer(clientX: number, clientY: number): number | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const dx = x - 160;
    const dy = y - 160;
    const angleRad = Math.atan2(dy, dx); // -PI..PI, 0 is right
    let angleDeg = (angleRad * 180) / Math.PI; // -180..180
    if (angleDeg < 0) angleDeg += 360; // 0..360
    return angleDeg;
  }

  function shortestDiff(a: number, b: number): number {
    let d = a - b;
    d = ((d + 180) % 360) - 180;
    return d;
  }

  function angleDevFromCenter(angle: number, center: number): number {
    return Math.abs(shortestDiff(angle, center));
  }

  function setPercentByAngle(angleDeg: number) {
    const dev = angleDevFromCenter(angleDeg, arc.centerDeg);
    const totalAngle = Math.min(Math.max(dev * 2, 3.6), 288); // 1%..80%
    const p = (totalAngle / 360) * 100;
    if (onPercentChange) onPercentChange(Number(p.toFixed(2)));
  }

  function setPercentByAngleWithHandle(angleDeg: number, mode: 'start' | 'end' | 'percent') {
    const minHalf = 3.6; // 1%
    const maxHalf = 288 / 2; // 80%/2
    // 相对于中心的角度偏差（center - angle）
    const offsetFromCenter = shortestDiff(arc.centerDeg, angleDeg);
    let halfDeg: number;
    if (mode === 'start') {
      // 只允许在中心的“起点侧”（offset>0）改变；否则钳制为最小
      halfDeg = Math.max(minHalf, Math.min(maxHalf, Math.max(0, offsetFromCenter)));
    } else if (mode === 'end') {
      // 只允许在中心的“终点侧”（angle-center>0）改变
      const offsetToEnd = shortestDiff(angleDeg, arc.centerDeg);
      halfDeg = Math.max(minHalf, Math.min(maxHalf, Math.max(0, offsetToEnd)));
    } else {
      // 自由（对称）模式
      halfDeg = Math.max(minHalf, Math.min(maxHalf, Math.abs(offsetFromCenter)));
    }
    const p = (halfDeg * 2 / 360) * 100;
    if (onPercentChange) onPercentChange(Number(p.toFixed(2)));
  }

  function setPercentByAngleRaf(angleDeg: number) {
    if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      setPercentByAngle(angleDeg);
      rafIdRef.current = null;
    });
  }

  function normalizeAngle(deg: number): number {
    let d = deg % 360;
    if (d < 0) d += 360;
    return d;
  }

  function degToRad(d: number) { return (d * Math.PI) / 180; }
  function radNorm(r: number) { const two = 2 * Math.PI; let x = r % two; if (x < 0) x += two; return x; }
  function cwDeltaRad(from: number, to: number) { const two = 2 * Math.PI; const a = radNorm(from), b = radNorm(to); return b >= a ? (b - a) : (b - a + two); }

  // Demo spin controls
  function startDemoSpin() {
    if (demoRunning) return;
    onLockChange && onLockChange(true);
    setDemoVisible(true);
    setDemoRunning(true);
    demoActiveRef.current = true;
    const start = performance.now();
    const duration = 7000; // 7s
    const startAngle = demoVisible ? demoAngle : -Math.PI / 2; // 顶部 or 当前

    // 计算目标角度（顺时针落到绿条或灰环）
    const startDeg = arc.startDeg;
    const endDeg = arc.endDeg;
    const arcSpan = endDeg - startDeg;
    const margin = 3;
    // 根据转盘概率自动判定结果：percent 是 1..80，概率=percent/100
    const win = Math.random() * 100 < Math.max(0, Math.min(100, percent));
    setDemoOutcome(win ? 'win' : 'lose');
    let targetDeg: number;
    if (win) {
      const min = startDeg + margin;
      const max = endDeg - margin;
      const pick = min + Math.random() * Math.max(1, (max - min));
      targetDeg = pick;
    } else {
      const graySpan = 360 - arcSpan;
      const pick = (endDeg + margin + Math.random() * Math.max(1, (graySpan - 2 * margin))) % 360;
      targetDeg = pick;
    }
    const targetRad = degToRad(targetDeg);
    const fullTurn = 2 * Math.PI;
    const extraTurns = 3; // 三圈基础
    const deltaToTarget = cwDeltaRad(startAngle, targetRad);
    const totalDelta = deltaToTarget + extraTurns * fullTurn; // 顺时针总角度

    const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
    const step = (t: number) => {
      if (!demoActiveRef.current) return;
      const elapsed = t - start;
      const p = Math.min(Math.max(elapsed / duration, 0), 1);
      const eased = easeOutCubic(p);
      const ang = startAngle + eased * totalDelta; // 顺时针（角度增大）
      setDemoAngle(ang);
      if (p < 1) {
        demoRafRef.current = requestAnimationFrame(step);
      } else {
        demoActiveRef.current = false;
        setDemoRunning(false);
        demoRafRef.current = null;
        onLockChange && onLockChange(false);
        // 演示转动：不入库
      }
    };
    demoRafRef.current = requestAnimationFrame(step);
  }

  // 实际转动：结束后若中奖则入库
  function startRealSpin() {
    if (demoRunning) return;
    onLockChange && onLockChange(true);
    setDemoVisible(true);
    setDemoRunning(true);
    demoActiveRef.current = true;
    const start = performance.now();
    const duration = 7000; // 7s
    const startAngle = demoVisible ? demoAngle : -Math.PI / 2;
    const startDeg = arc.startDeg;
    const endDeg = arc.endDeg;
    const arcSpan = endDeg - startDeg;
    const margin = 3;
    const win = Math.random() * 100 < Math.max(0, Math.min(100, percent));
    setDemoOutcome(win ? 'win' : 'lose');
    let targetDeg: number;
    if (win) {
      const min = startDeg + margin;
      const max = endDeg - margin;
      const pick = min + Math.random() * Math.max(1, (max - min));
      targetDeg = pick;
    } else {
      const graySpan = 360 - arcSpan;
      const pick = (endDeg + margin + Math.random() * Math.max(1, (graySpan - 2 * margin))) % 360;
      targetDeg = pick;
    }
    const targetRad = degToRad(targetDeg);
    const fullTurn = 2 * Math.PI;
    const extraTurns = 3;
    const deltaToTarget = cwDeltaRad(startAngle, targetRad);
    const totalDelta = deltaToTarget + extraTurns * fullTurn;
    const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
    const step = (t: number) => {
      if (!demoActiveRef.current) return;
      const elapsed = t - start;
      const p = Math.min(Math.max(elapsed / duration, 0), 1);
      const eased = easeOutCubic(p);
      const ang = startAngle + eased * totalDelta;
      setDemoAngle(ang);
      if (p < 1) {
        demoRafRef.current = requestAnimationFrame(step);
      } else {
        demoActiveRef.current = false;
        setDemoRunning(false);
        demoRafRef.current = null;
        onLockChange && onLockChange(false);
        if (win && !inactive && productTitle && (productImage || '') !== '' && (productPrice != null)) {
          const pid = String(productId ?? productTitle);
          addToWarehouse.mutate({
            productId: pid,
            name: productTitle,
            image: String(productImage),
            price: Number(productPrice || 0),
            quantity: 1,
          });
        }
      }
    };
    demoRafRef.current = requestAnimationFrame(step);
  }
  useEffect(() => {
    return () => {
      if (demoRafRef.current != null) cancelAnimationFrame(demoRafRef.current);
    };
  }, []);

  function cwDelta(fromDeg: number, toDeg: number): number {
    // 顺时针从 from 到 to 的角距离，范围 0..360
    let d = toDeg - fromDeg;
    if (d < 0) d += 360;
    return d;
  }

  function adjustByDraggingStart(pointerDeg: number) {
    // 固定 end，不移动它；start 跟随指针，重新计算总角度与中心
    const minAngle = 3.6; // 1%
    const maxAngle = 288; // 80%
    const totalRaw = cwDelta(pointerDeg, arc.endDeg); // 从指针(start) 顺时针到 end 的角度
    const total = Math.max(minAngle, Math.min(maxAngle, totalRaw));
    const newStart = normalizeAngle(arc.endDeg - total);
    const newCenter = normalizeAngle(newStart + total / 2);
    setCenterDeg(newCenter);
    const p = (total / 360) * 100;
    onPercentChange && onPercentChange(Number(p.toFixed(2)));
  }

  function adjustByDraggingEnd(pointerDeg: number) {
    // 固定 start，不移动它；end 跟随指针，重新计算总角度与中心
    const minAngle = 3.6; // 1%
    const maxAngle = 288; // 80%
    const totalRaw = cwDelta(arc.startDeg, pointerDeg); // 从 start 顺时针到指针(end) 的角度
    const total = Math.max(minAngle, Math.min(maxAngle, totalRaw));
    const newEnd = normalizeAngle(arc.startDeg + total);
    const newCenter = normalizeAngle(arc.startDeg + total / 2);
    setCenterDeg(newCenter);
    const p = (total / 360) * 100;
    onPercentChange && onPercentChange(Number(p.toFixed(2)));
  }

  // 移除 click 跳变，统一通过按下+拖拽改百分比

  // 拖拽白点改变百分比
  useEffect(() => {
    function onMove(ev: MouseEvent) {
      if (!dragging) return;
      didDragRef.current = true;
      const angle = getAngleFromPointer(ev.clientX, ev.clientY);
      if (angle == null) return;
      if (dragging === 'body') {
        if (lastAngleRef.current == null) {
          lastAngleRef.current = angle;
        } else {
          const delta = shortestDiff(angle, lastAngleRef.current);
          setCenterDeg((prev) => normalizeAngle(prev + delta));
          lastAngleRef.current = angle;
        }
      } else if (dragging === 'start') {
        adjustByDraggingStart(angle);
      } else if (dragging === 'end') {
        adjustByDraggingEnd(angle);
      } else if (dragging === 'percent') {
        // 自由对称模式（用于空白处拖拽）：改变百分比，不移动中心
        setPercentByAngleRaf(angle);
      }
      ev.preventDefault();
    }
    function onUp() {
      if (dragging) setDragging(null);
      lastAngleRef.current = null;
      // 释放后下一次 click 忽略
      setTimeout(() => { didDragRef.current = false; }, 0);
      onDragEnd && onDragEnd();
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, arc.centerDeg, onPercentChange]);

  // Touch 支持（移动端拖拽）
  useEffect(() => {
    function onTouchMove(ev: TouchEvent) {
      if (!dragging) return;
      const t = ev.touches && ev.touches[0] ? ev.touches[0] : (ev.changedTouches && ev.changedTouches[0]);
      if (!t) return;
      didDragRef.current = true;
      const angle = getAngleFromPointer(t.clientX, t.clientY);
      if (angle == null) return;
      if (dragging === 'body') {
        if (lastAngleRef.current == null) {
          lastAngleRef.current = angle;
        } else {
          const delta = shortestDiff(angle, lastAngleRef.current);
          setCenterDeg((prev) => normalizeAngle(prev + delta));
          lastAngleRef.current = angle;
        }
      } else if (dragging === 'start') {
        adjustByDraggingStart(angle);
      } else if (dragging === 'end') {
        adjustByDraggingEnd(angle);
      } else if (dragging === 'percent') {
        setPercentByAngleRaf(angle);
      }
      ev.preventDefault();
    }
    function onTouchEnd() {
      if (dragging) setDragging(null);
      lastAngleRef.current = null;
      setTimeout(() => { didDragRef.current = false; }, 0);
      onDragEnd && onDragEnd();
    }
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: false });
    window.addEventListener('touchcancel', onTouchEnd, { passive: false });
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [dragging, arc.centerDeg, onPercentChange, onDragEnd]);

  return (
    <div className={`${urbanist.className} col-span-1 flex flex-col items-center order-0 lg:order-1 overflow-hidden min-w-0 rounded-md p-4 pb-6 lg:px-8 h-full`} style={{ backgroundColor: '#22272B' }}>
      <div className="flex justify-center items-center gap-1">
        <div className="size-5 mr-1 text-white">
          <svg viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.21192 7.42225C1.15968 8.23994 0.158879 10.5665 0.976565 12.6187L12.821 42.346C13.6387 44.3982 15.9652 45.399 18.0174 44.5813L34.739 37.9188C36.7913 37.1012 37.7921 34.7746 36.9744 32.7224L25.13 2.99512C24.3123 0.942884 21.9857 -0.0579184 19.9335 0.759768L3.21192 7.42225Z" fill="currentColor"></path>
            <path d="M35.8047 22.5693L35.7383 6.50156C35.7292 4.29244 33.931 2.50898 31.7219 2.5181L27.822 2.5342L35.8047 22.5693Z" fill="currentColor"></path>
            <path d="M38.0241 27.9748L44.3787 13.2168C45.2524 11.1878 44.3158 8.83469 42.2868 7.96101L38.7048 6.41865L38.0241 27.9748Z" fill="currentColor"></path>
          </svg>
        </div>
        <p className="text-white text-lg font-black">FlameDraw</p>
      </div>

      <p className="text-xl select-none font-extrabold mb-0 lg:hidden text-white">{percent.toFixed(2)}%</p>

      <div className="relative select-none touch-none" style={{ width: 320, height: 320 }}>
        <div>
          <svg
            ref={svgRef}
            viewBox="0 0 320 320"
            width="320"
            height="320"
            onMouseDown={(e) => {
              // 空白区域按下：进入位置拖拽（旋转），不改百分比
              if (uiLocked || inactive) { e.preventDefault(); return; }
              const a = getAngleFromPointer(e.clientX, e.clientY);
              if (a != null) {
                setDragging('body');
                lastAngleRef.current = a;
              }
              e.preventDefault();
            }}
            onTouchStart={(e) => {
              if (uiLocked || inactive) { e.preventDefault(); return; }
              const t = e.touches && e.touches[0];
              if (!t) return;
              const a = getAngleFromPointer(t.clientX, t.clientY);
              if (a != null) {
                setDragging('body');
                lastAngleRef.current = a;
              }
              e.preventDefault();
            }}
          >
            <circle cx="160" cy="160" r="120" fill="none" stroke="#FFFFFF" strokeOpacity="0.08" strokeWidth={arc.strokeWidth} style={{ cursor: uiLocked ? 'default' : 'pointer' }}></circle>
            {arc.path ? (
              <>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d={arc.path}
                  fill="none"
                  stroke="#48BB78"
                  strokeWidth={arc.strokeWidth}
                  style={{ cursor: (uiLocked || inactive) ? 'default' : (dragging === 'body' ? 'grabbing' : 'grab') }}
                  onMouseDown={(e) => {
                    if (uiLocked || inactive) { e.preventDefault(); return; }
                    e.stopPropagation();
                    onDragStart && onDragStart();
                    setDragging('body');
                    const a = getAngleFromPointer(e.clientX, e.clientY);
                    if (a != null) lastAngleRef.current = a;
                    e.preventDefault();
                  }}
                  onTouchStart={(e) => {
                    if (uiLocked || inactive) { e.preventDefault(); return; }
                    e.stopPropagation();
                    onDragStart && onDragStart();
                    const t = e.touches && e.touches[0];
                    if (!t) return;
                    setDragging('body');
                    const a = getAngleFromPointer(t.clientX, t.clientY);
                    if (a != null) lastAngleRef.current = a;
                    e.preventDefault();
                  }}
                />
                {arc.pRaw > 5 && (
                  <>
                    <svg
                      x={arc.startDot.x - 12}
                      y={arc.startDot.y - 12}
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ cursor: (uiLocked || inactive) ? 'default' : (dragging === 'start' ? 'grabbing' : 'grab') }}
                      onMouseDown={(e) => {
                        if (uiLocked || inactive) { e.preventDefault(); return; }
                        e.stopPropagation();
                        onDragStart && onDragStart();
                        setDragging('start');
                        e.preventDefault();
                      }}
                      onTouchStart={(e) => {
                        if (uiLocked || inactive) { e.preventDefault(); return; }
                        e.stopPropagation();
                        onDragStart && onDragStart();
                        setDragging('start');
                        e.preventDefault();
                      }}
                    >
                      <rect x="0" y="0" width="24" height="24" fill="white" fillOpacity="0" pointerEvents="all" />
                      <circle cx="12" cy="12" r="3" fill="white"></circle>
                    </svg>
                    <svg
                      x={arc.endDot.x - 12}
                      y={arc.endDot.y - 12}
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ cursor: (uiLocked || inactive) ? 'default' : (dragging === 'end' ? 'grabbing' : 'grab') }}
                      onMouseDown={(e) => {
                        if (uiLocked || inactive) { e.preventDefault(); return; }
                        e.stopPropagation();
                        onDragStart && onDragStart();
                        setDragging('end');
                        e.preventDefault();
                      }}
                      onTouchStart={(e) => {
                        if (uiLocked || inactive) { e.preventDefault(); return; }
                        e.stopPropagation();
                        onDragStart && onDragStart();
                        setDragging('end');
                        e.preventDefault();
                      }}
                    >
                      <rect x="0" y="0" width="24" height="24" fill="white" fillOpacity="0" pointerEvents="all" />
                      <circle cx="12" cy="12" r="3" fill="white"></circle>
                    </svg>
                  </>
                )}
              </>
            ) : null}
          </svg>
        </div>

        {/* Demo arrow overlay - 绝对定位 + CSS transform（与你给的示例一致） */}
        {(demoRunning || demoVisible) && (
          (() => {
            const cx = 160, cy = 160, r = 120, strokeWidth = arc.strokeWidth;
            // 最外沿再外 12px：r + strokeWidth/2 + 12
            const outerRadius = r + strokeWidth / 2 + 12;
            const angle = demoAngle; // radians
            const x = cx + outerRadius * Math.cos(angle);
            const y = cy + outerRadius * Math.sin(angle);
            return (
              <div style={{ position: 'absolute', transformOrigin: 'left top', transform: `translate(${x}px, ${y - 320}px) rotate(${angle + Math.PI / 2}rad)`, pointerEvents: 'none' }}>
                <svg width="16" height="19" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'translate(-50%, -100%)', opacity: 1 }}>
                  <path fillRule="evenodd" clipRule="evenodd" d="M6.19568 7L4.18233 3.83192C3.66534 3.01843 4.30928 2 5.34062 2H12.6593C13.7088 2 14.3501 3.05089 13.7966 3.86376L11.6611 7H14.123C15.5923 7 16.4901 8.57634 15.7152 9.79564L10.4155 18.1349C9.66932 19.3091 7.91096 19.283 7.20166 18.0872L2.25526 9.74788C1.53148 8.52764 2.43299 7 3.87686 7H6.19568Z" fill="white"></path>
                </svg>
              </div>
            );
          })()
        )}

      <div className="absolute flex flex-col items-center justify-center p-14 pointer-events-none" style={{ transform: 'translate(0px, -320px)', height: 320, width: 320 }}>
          <div className="flex flex-1 flex-col w-full items-stretch lg:hidden">
            <div className="flex w-full h-full items-center justify-center">
            <div className="flex relative w-[50%] h-[50%]">
              {(!inactive && productImage) ? (
                <img
                  alt={productTitle || ''}
                  loading="lazy"
                  decoding="async"
                  src={productImage}
                  style={{ position: 'absolute', height: '100%', width: '100%', inset: 0, objectFit: 'contain', color: 'transparent' }}
                />
              ) : (
                <div className="size-48" style={{ color: '#34383C', position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '50%', height: '50%' }}>
                    <path d="M3.21192 7.42225C1.15968 8.23994 0.158879 10.5665 0.976565 12.6187L12.821 42.346C13.6387 44.3982 15.9652 45.399 18.0174 44.5813L34.739 37.9188C36.7913 37.1012 37.7921 34.7746 36.9744 32.7224L25.13 2.99512C24.3123 0.942884 21.9857 -0.0579184 19.9335 0.759768L3.21192 7.42225Z" fill="currentColor"></path>
                    <path d="M35.8047 22.5693L35.7383 6.50156C35.7292 4.29244 33.931 2.50898 31.7219 2.5181L27.822 2.5342L35.8047 22.5693Z" fill="currentColor"></path>
                    <path d="M38.0241 27.9748L44.3787 13.2168C45.2524 11.1878 44.3158 8.83469 42.2868 7.96101L38.7048 6.41865L38.0241 27.9748Z" fill="currentColor"></path>
                  </svg>
                </div>
              )}
            </div>
            </div>
          </div>
        <p className="hidden lg:block text-xl select-none font-extrabold text-white">{inactive ? '0.00%' : percent.toFixed(2) + '%'}</p>
        </div>

        {/* 端点白点（两个独立 SVG），按绝对定位覆盖在主 SVG 之上 */}
        

        
      </div>

      {!inactive && (
        <div className="flex flex-col max-w-full items-center lg:hidden mt-0">
          <p className="text-sm font-extrabold max-w-full select-none overflow-hidden text-ellipsis whitespace-nowrap px-4 text-white">{productTitle || ''}</p>
          <p className="text-lg front-extrabold text-gray-400 select-none">{'$'}{(productPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-lg font-extrabold select-none text-yellow-400">x{(percent > 0 ? ( (92.59 - ((percent - 1) / (80 - 1)) * (92.59 - 1.16))).toFixed(2) : '0.00')}</p>
        </div>
      )}

      <div className="flex lg:hidden flex-col items-stretch w-full gap-2 mt-4">
        <button
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative text-base select-none h-11 px-6"
          style={{ backgroundColor: '#48BB78', color: (uiLocked || demoRunning || !isAuthed) ? '#7A8084' : '#FFFFFF', cursor: (uiLocked || demoRunning || !isAuthed) ? 'default' : 'pointer' }}
          disabled={uiLocked || demoRunning || !isAuthed}
          onClick={startRealSpin}
        >转动获取 {spinPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2, style: 'currency', currency: 'USD' }).replace('$', '$')}</button>
        <button
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative text-base font-bold select-none h-11 px-6"
          style={{ backgroundColor: uiLocked || demoRunning ? '#34383C' : '#2A2D35', color: uiLocked || demoRunning ? '#7A8084' : '#FFFFFF', cursor: uiLocked || demoRunning ? 'default' : 'pointer' }}
          onMouseEnter={(e) => { if (!(uiLocked || demoRunning)) (e.target as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
          onMouseLeave={(e) => { if (!(uiLocked || demoRunning)) (e.target as HTMLButtonElement).style.backgroundColor = '#2A2D35'; }}
          onClick={startDemoSpin}
          disabled={uiLocked || demoRunning}
        >
          <div className="size-4 mb-0.5">
            <svg viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.0484 7.65351L16.1422 2.40444C16.4549 2.08217 17.001 2.30357 17.001 2.75265V8.00171C17.001 8.27785 16.7771 8.50171 16.501 8.50171H11.4072C10.9654 8.50171 10.7407 7.97059 11.0484 7.65351Z" fill="currentColor"></path>
              <path fillRule="evenodd" clipRule="evenodd" d="M14.9554 7.06726C15.6673 6.64369 15.9162 5.71443 15.5113 4.9917C13.3794 1.18654 8.63378 -0.14786 4.89436 2.07691C1.15495 4.30168 -0.0964166 9.20398 2.0355 13.0091C4.16742 16.8143 8.91303 18.1487 12.6524 15.9239C13.3644 15.5004 13.6133 14.5711 13.2084 13.8484C12.8035 13.1257 11.898 12.8831 11.1861 13.3067C8.90694 14.6627 5.95662 13.8721 4.61371 11.4752C3.2708 9.07835 4.08155 6.05011 6.36071 4.69413C8.63988 3.33814 11.5902 4.12872 12.9331 6.52561C13.338 7.24833 14.2434 7.49084 14.9554 7.06726Z" fill="currentColor"></path>
            </svg>
          </div>
          演示转动
        </button>
      </div>

      <div className="hidden lg:flex lg:flex-row lg:items-center gap-2 w-full pt-4">
        <button
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative text-base font-bold select-none h-11 px-6 w-full"
          style={{ backgroundColor: '#48BB78', color: (uiLocked || demoRunning || !isAuthed) ? '#7A8084' : '#FFFFFF', cursor: (uiLocked || demoRunning || !isAuthed) ? 'default' : 'pointer' }}
          disabled={uiLocked || demoRunning || !isAuthed}
          onClick={startRealSpin}
        >转动获取 {spinPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2, style: 'currency', currency: 'USD' }).replace('$', '$')}</button>
        <button
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative text-base font-bold select-none h-11 px-6"
          style={{ backgroundColor: uiLocked || demoRunning ? '#34383C' : '#2A2D35', color: uiLocked || demoRunning ? '#7A8084' : '#FFFFFF', cursor: uiLocked || demoRunning ? 'default' : 'pointer' }}
          onMouseEnter={(e) => { if (!(uiLocked || demoRunning)) (e.target as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
          onMouseLeave={(e) => { if (!(uiLocked || demoRunning)) (e.target as HTMLButtonElement).style.backgroundColor = '#2A2D35'; }}
          onClick={startDemoSpin}
          disabled={uiLocked || demoRunning}
        >
          <div className="size-4 mb-0.5">
            <svg viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.0484 7.65351L16.1422 2.40444C16.4549 2.08217 17.001 2.30357 17.001 2.75265V8.00171C17.001 8.27785 16.7771 8.50171 16.501 8.50171H11.4072C10.9654 8.50171 10.7407 7.97059 11.0484 7.65351Z" fill="currentColor"></path>
              <path fillRule="evenodd" clipRule="evenodd" d="M14.9554 7.06726C15.6673 6.64369 15.9162 5.71443 15.5113 4.9917C13.3794 1.18654 8.63378 -0.14786 4.89436 2.07691C1.15495 4.30168 -0.0964166 9.20398 2.0355 13.0091C4.16742 16.8143 8.91303 18.1487 12.6524 15.9239C13.3644 15.5004 13.6133 14.5711 13.2084 13.8484C12.8035 13.1257 11.898 12.8831 11.1861 13.3067C8.90694 14.6627 5.95662 13.8721 4.61371 11.4752C3.2708 9.07835 4.08155 6.05011 6.36071 4.69413C8.63988 3.33814 11.5902 4.12872 12.9331 6.52561C13.338 7.24833 14.2434 7.49084 14.9554 7.06726Z" fill="currentColor"></path>
            </svg>
          </div>
          演示转动
        </button>
      </div>
    </div>
  );
}


