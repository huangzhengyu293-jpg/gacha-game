"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/app/components/I18nProvider";

export interface SlotMachineSymbol {
  id: string;
  name: string;
  image: string;
  price?: number | string;
  description?: string;
}

interface SlotMachineProps {
  symbols: SlotMachineSymbol[];
  selectedPrizeId?: string | null;
  onSpinStart?: (targetId?: string | null) => void;
  onSpinComplete?: (result?: SlotMachineSymbol) => void;
  buttonLabel?: string;
}

const FALLBACK_SYMBOLS: SlotMachineSymbol[] = [
  {
    id: "fallback-emoji-1",
    name: "🍒",
    image: "https://via.placeholder.com/180?text=%F0%9F%8D%92",
  },
];

const ITEMS_PER_REEL = 20;
const ITEM_SIZE = 180;
const REPEAT_TIMES = 3;

const customEase = (t: number) => {
  if (t < 0.2) {
    return t * t * 12.5;
  }
  const t2 = (t - 0.2) / 0.8;
  return 0.5 + 0.5 * (1 - Math.pow(1 - t2, 5));
};

export default function SlotMachine({
  symbols,
  selectedPrizeId,
  onSpinStart,
  onSpinComplete,
  buttonLabel,
}: SlotMachineProps) {
  const { t } = useI18n();
  const displayButtonLabel = buttonLabel || t("start");
  const reelRef = useRef<HTMLDivElement | null>(null);
  const reelContainerRef = useRef<HTMLDivElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string>("");
  const [reelHeight, setReelHeight] = useState(540);

  const baseSymbols = useMemo<SlotMachineSymbol[]>(
    () => (symbols.length ? symbols : FALLBACK_SYMBOLS),
    [symbols],
  );

  const repeatedSymbols = useMemo(() => {
    const sequence: SlotMachineSymbol[] = [];
    for (let i = 0; i < ITEMS_PER_REEL; i += 1) {
      sequence.push(baseSymbols[Math.floor(Math.random() * baseSymbols.length)]);
    }
    return Array.from({ length: REPEAT_TIMES }, () => sequence).flat();
  }, [baseSymbols]);

  const reelCenter = reelHeight / 2;

  const setInitialTop = useCallback(() => {
    const container = reelContainerRef.current;
    if (!container) return;
    const initialIndex = ITEMS_PER_REEL;
    const initialTop = reelCenter - initialIndex * ITEM_SIZE - ITEM_SIZE / 2;
    container.style.top = `${initialTop}px`;
  }, [reelCenter]);

  const initReel = useCallback(() => {
    const container = reelContainerRef.current;
    if (!container) return;
    container.innerHTML = "";

    repeatedSymbols.forEach((symbol) => {
      const item = document.createElement("div");
      item.className = "slot-item";
      item.dataset.id = symbol.id;
      item.dataset.name = symbol.name;
      item.dataset.price = symbol.price ? String(symbol.price) : "";
      item.dataset.image = symbol.image;

      const glow = document.createElement("div");
      glow.className = "item-glow";

      const wrapper = document.createElement("div");
      wrapper.className = "item-image-wrapper";

      const img = document.createElement("img");
      img.src = symbol.image;
      img.alt = symbol.name;
      wrapper.appendChild(img);

      const info = document.createElement("div");
      info.className = "item-info";
      const nameP = document.createElement("p");
      nameP.className = "item-name";
      nameP.textContent = symbol.name;
      const priceP = document.createElement("p");
      priceP.textContent = symbol.price ? `$${symbol.price}` : "";
      info.appendChild(nameP);
      info.appendChild(priceP);

      item.appendChild(glow);
      item.appendChild(wrapper);
      item.appendChild(info);
      container.appendChild(item);
    });

    setInitialTop();
  }, [repeatedSymbols, setInitialTop]);

  const updateSelection = useCallback(() => {
    const container = reelContainerRef.current;
    if (!container) return;
    const items = container.querySelectorAll<HTMLDivElement>(".slot-item");
    let containerTop = parseFloat(container.style.top || "0");
    const totalHeight = ITEMS_PER_REEL * ITEM_SIZE;
    const minTop = -totalHeight * 2;
    const resetTop = -totalHeight;
    if (containerTop < minTop) {
      containerTop = resetTop + (containerTop - minTop);
      container.style.top = `${containerTop}px`;
    }
    items.forEach((item, index) => {
      const itemTop = index * ITEM_SIZE + containerTop;
      const itemCenter = itemTop + ITEM_SIZE / 2;
      const distance = Math.abs(itemCenter - reelCenter);
      if (distance < ITEM_SIZE / 2) {
        item.classList.add("selected");
      } else {
        item.classList.remove("selected");
      }
    });
  }, [reelCenter]);

  const findClosestIndex = useCallback(() => {
    const container = reelContainerRef.current;
    if (!container) return 0;
    const items = container.querySelectorAll<HTMLDivElement>(".slot-item");
    const containerTop = parseFloat(container.style.top || "0");
    let closestIndex = 0;
    let minDistance = Infinity;
    items.forEach((item, index) => {
      const itemTop = index * ITEM_SIZE + containerTop;
      const itemCenter = itemTop + ITEM_SIZE / 2;
      const distance = Math.abs(itemCenter - reelCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });
    return closestIndex;
  }, [reelCenter]);

  const checkAndResetPosition = useCallback((container: HTMLDivElement) => {
    let currentTop = parseFloat(container.style.top || "0");
    const totalHeight = ITEMS_PER_REEL * ITEM_SIZE;
    const minTop = -totalHeight * 2;
    const resetTop = -totalHeight;
    if (currentTop < minTop) {
      currentTop = resetTop + (currentTop - minTop);
      container.style.top = `${currentTop}px`;
    }
    return currentTop;
  }, []);

  const spinPhase1 = useCallback(
    (duration: number, targetSymbol?: SlotMachineSymbol | null) =>
      new Promise<void>((resolve) => {
        const container = reelContainerRef.current;
        if (!container) return resolve();
        const startTop = parseFloat(container.style.top || "0");
        let targetTop: number;

        if (targetSymbol) {
          const items = Array.from(container.querySelectorAll<HTMLDivElement>(".slot-item"));
          const matchingIndices = items
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => item.dataset.id === targetSymbol.id)
            .map(({ index }) => index);

          const minRolls = 25;
          const rollDistance = minRolls * ITEM_SIZE;
          let chosenIndex = matchingIndices.find((index) => startTop - (-(index * ITEM_SIZE) + reelCenter - ITEM_SIZE / 2) >= rollDistance);
          if (chosenIndex === undefined && matchingIndices.length) {
            chosenIndex = matchingIndices[0] + ITEMS_PER_REEL;
          }
          if (chosenIndex !== undefined) {
            const randomOffset = (Math.random() * 40 + 20) * (Math.random() < 0.5 ? 1 : -1);
            targetTop = -(chosenIndex * ITEM_SIZE) + reelCenter - ITEM_SIZE / 2 + randomOffset;
          } else {
            targetTop = startTop - rollDistance;
          }
        } else {
          const rollCount = Math.floor(Math.random() * 6) + 25;
          targetTop = startTop - rollCount * ITEM_SIZE + (Math.random() * 40 + 20) * (Math.random() < 0.5 ? 1 : -1);
        }

        const distance = startTop - targetTop;
        const startTime = Date.now();

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = customEase(progress);
          const currentTop = startTop - distance * easedProgress;
          container.style.top = `${currentTop}px`;
          checkAndResetPosition(container);
          updateSelection();
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            resolve();
          }
        };

        animate();
      }),
    [checkAndResetPosition, reelCenter, updateSelection],
  );

  const spinPhase2 = useCallback(
    () =>
      new Promise<void>((resolve) => {
        const container = reelContainerRef.current;
        if (!container) return resolve();
        const duration = 400;
        const startTime = Date.now();
        const startTop = checkAndResetPosition(container);
        const closestIndex = findClosestIndex();
        const targetTop = -(closestIndex * ITEM_SIZE) + reelCenter - ITEM_SIZE / 2;
        const distance = targetTop - startTop;

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          const newTop = startTop + distance * eased;
          container.style.top = `${newTop}px`;
          updateSelection();
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            container.style.top = `${targetTop}px`;
            updateSelection();
            resolve();
          }
        };

        animate();
      }),
    [checkAndResetPosition, findClosestIndex, reelCenter, updateSelection],
  );

  const getSelectedSymbol = useCallback(() => {
    const container = reelContainerRef.current;
    if (!container) return undefined;
    const selected = container.querySelector<HTMLDivElement>(".slot-item.selected");
    if (!selected) return undefined;
    return baseSymbols.find((symbol) => symbol.id === selected.dataset.id);
  }, [baseSymbols]);

  const startSpin = useCallback(async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setResult("");
    reelContainerRef.current?.querySelectorAll(".slot-item").forEach((item) => item.classList.remove("show-info", "selected"));
    const targetSymbol = baseSymbols.find((symbol) => symbol.id === selectedPrizeId);
    onSpinStart?.(targetSymbol?.id ?? null);

    const duration = 6000 + Math.random() * 1000;
    await spinPhase1(duration, targetSymbol);
    await new Promise((resolve) => setTimeout(resolve, 300));
    await spinPhase2();

    setTimeout(() => {
      const selected = getSelectedSymbol();
      setResult(selected ? `${selected.name}${selected.price ? ` - $${selected.price}` : ""}` : "");
      onSpinComplete?.(selected);
      if (selected) {
        reelContainerRef.current?.querySelectorAll(".slot-item.selected").forEach((item) => item.classList.add("show-info"));
      }
      setIsSpinning(false);
    }, 200);
  }, [baseSymbols, getSelectedSymbol, onSpinComplete, onSpinStart, selectedPrizeId, spinPhase1, spinPhase2, isSpinning]);

  useEffect(() => {
    initReel();
    updateSelection();
  }, [initReel, updateSelection]);

  useEffect(() => {
    if (!reelRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry?.contentRect.height) {
        setReelHeight(entry.contentRect.height);
      }
    });
    observer.observe(reelRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="slot-wrapper">
      <div className="slot-machine">
        <div className="reel" ref={reelRef}>
          <div className="reel-highlight" style={{ height: ITEM_SIZE }} />
          <div ref={reelContainerRef} className="reel-container" />
        </div>
        <div className="controls">
          <button type="button" onClick={startSpin} disabled={isSpinning}>
            {displayButtonLabel}
          </button>
        </div>
        <div className="result">{result}</div>
      </div>
      <style jsx>{`
        .slot-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .slot-machine {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .reel {
          width: 180px;
          background: #f5f5f5;
          border-radius: 10px;
          overflow: hidden;
          position: relative;
        }
        .reel-highlight {
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          transform: translateY(-50%);
          pointer-events: none;
          z-index: 10;
        }
        .reel-container {
          position: relative;
        }
        .slot-item {
          width: 180px;
          height: ${ITEM_SIZE}px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          position: relative;
        }
        .item-glow {
          position: absolute;
          width: 60%;
          aspect-ratio: 1;
          background: radial-gradient(circle, rgba(255, 182, 193, 0.6) 0%, rgba(255, 182, 193, 0.3) 50%, transparent 70%);
          z-index: 1;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .item-image-wrapper {
          position: relative;
          width: 55%;
          height: 55%;
          z-index: 2;
          transition: transform 0.2s;
        }
        .slot-item img {
          position: absolute;
          width: 100%;
          height: 100%;
          object-fit: contain;
          inset: 0;
        }
        .item-info {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(55, 65, 81, 0.4);
          padding: 4px 8px;
          border-radius: 6px;
          transform: translateY(72px);
          max-width: 180px;
          opacity: 0;
          transition: opacity 0.2s;
          z-index: 3;
        }
        .item-info p {
          margin: 0;
          color: white;
          font-weight: 900;
          font-size: 16px;
        }
        .item-info .item-name {
          white-space: nowrap;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .slot-item.selected .item-glow {
          opacity: 1;
        }
        .slot-item.selected .item-image-wrapper {
          transform: scale(1.3);
        }
        .slot-item.show-info .item-info {
          opacity: 1;
        }
        .controls {
          text-align: center;
        }
        .controls button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 15px 50px;
          font-size: 1.2em;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        .controls button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }
        .controls button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .result {
          text-align: center;
          margin-top: 20px;
          font-size: 1.3em;
          color: #667eea;
          font-weight: bold;
          min-height: 30px;
        }
      `}</style>
    </div>
  );
}
