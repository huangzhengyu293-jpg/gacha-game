'use client';

import { useMemo, useState } from 'react';

export default function ActionBarClient({ price }: { price: number }) {
  const [quantity, setQuantity] = useState<number>(1);
  const [hoverMinus, setHoverMinus] = useState<boolean>(false);
  const [hoverPlus, setHoverPlus] = useState<boolean>(false);
  const [hoverOpen, setHoverOpen] = useState<boolean>(false);
  const [hoverDemo, setHoverDemo] = useState<boolean>(false);
  const [hoverQuick, setHoverQuick] = useState<boolean>(false);
  const [quickActive, setQuickActive] = useState<boolean>(false);

  const canDec = quantity > 1;
  const canInc = quantity < 15;
  const totalLabel = useMemo(
    () => `$${(quantity * price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    [quantity, price]
  );

  const btnBaseBg = '#34383C';
  const btnHoverBg = '#5A5E62';
  const qtyBg = '#22272B';

  return (
    <div className="flex flex-col sm:flex-row w-full sm:justify-between sm:items-center gap-3">
      {/* Qty left (desktop) */}
      <div className="hidden sm:flex sm:flex-1 min-w-[230px] min-h-12">
        <div className="flex items-center justify-between rounded-lg p-1 w-36" style={{ backgroundColor: qtyBg }}>
          <div className="flex flex-1">
            <button
              type="button"
              disabled={!canDec}
              onMouseEnter={() => setHoverMinus(true)}
              onMouseLeave={() => setHoverMinus(false)}
              onClick={() => canDec && setQuantity((q) => Math.max(1, q - 1))}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none size-10 min-h-10 min-w-10 max-h-10 max-w-10"
              style={{
                backgroundColor: canDec && hoverMinus ? btnHoverBg : btnBaseBg,
                color: canDec ? '#FFFFFF' : '#7A8084',
                cursor: canDec ? 'pointer' as const : 'default' as const,
              }}
              aria-label="decrease"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
              </svg>
            </button>
            <div className="flex flex-1 justify-center items-center">
              <p className="text-base font-bold" style={{ color: '#FAFAFA' }}>{quantity}</p>
            </div>
            <button
              type="button"
              disabled={!canInc}
              onMouseEnter={() => setHoverPlus(true)}
              onMouseLeave={() => setHoverPlus(false)}
              onClick={() => canInc && setQuantity((q) => Math.min(15, q + 1))}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none size-10 min-h-10 min-w-10 max-h-10 max-w-10"
              style={{
                backgroundColor: canInc && hoverPlus ? btnHoverBg : btnBaseBg,
                color: canInc ? '#FFFFFF' : '#7A8084',
                cursor: canInc ? 'pointer' as const : 'default' as const,
              }}
              aria-label="increase"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Open button center */}
      <div className="flex w-full sm:w-auto sm:flex-1 items-center justify-center">
        <button
          type="button"
          onMouseEnter={() => setHoverOpen(true)}
          onMouseLeave={() => setHoverOpen(false)}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none h-11 px-6 w-full sm:max-w-56"
          style={{
            backgroundColor: hoverOpen ? '#38a169' : '#48BB78',
            color: '#FFFFFF',
            cursor: 'pointer',
          }}
        >
          开启 {quantity} 次价格 {totalLabel}
        </button>
      </div>
      {/* Right side extra buttons */}
      <div className="flex justify-between sm:justify-end items-center gap-2 sm:flex-1">
        {/* Qty (mobile) */}
        <div className="flex sm:hidden">
          <div className="flex items-center justify-between rounded-lg p-1 w-36" style={{ backgroundColor: qtyBg }}>
            <div className="flex flex-1">
              <button
                type="button"
                disabled={!canDec}
                onMouseEnter={() => setHoverMinus(true)}
                onMouseLeave={() => setHoverMinus(false)}
              onClick={() => canDec && setQuantity((q) => Math.max(1, q - 1))}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none size-10 min-h-10 min-w-10 max-h-10 max-w-10"
                style={{
                  backgroundColor: canDec && hoverMinus ? btnHoverBg : btnBaseBg,
                  color: canDec ? '#FFFFFF' : '#7A8084',
                  cursor: canDec ? 'pointer' as const : 'default' as const,
                }}
                aria-label="decrease"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                </svg>
              </button>
              <div className="flex flex-1 justify-center items-center">
                <p className="text-base font-bold" style={{ color: '#FAFAFA' }}>{quantity}</p>
              </div>
              <button
                type="button"
                disabled={!canInc}
                onMouseEnter={() => setHoverPlus(true)}
                onMouseLeave={() => setHoverPlus(false)}
              onClick={() => canInc && setQuantity((q) => Math.min(15, q + 1))}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none size-10 min-h-10 min-w-10 max-h-10 max-w-10"
                style={{
                  backgroundColor: canInc && hoverPlus ? btnHoverBg : btnBaseBg,
                  color: canInc ? '#FFFFFF' : '#7A8084',
                  cursor: canInc ? 'pointer' as const : 'default' as const,
                }}
                aria-label="increase"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onMouseEnter={() => setHoverDemo(true)}
            onMouseLeave={() => setHoverDemo(false)}
            onClick={() => {
              const spinFunction = (window as any).spinSlotMachine;
              if (spinFunction && typeof spinFunction === 'function') {
                spinFunction();
              }
            }}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none size-11 md:w-auto sm:h-11 px-0 md:px-6"
            style={{
              backgroundColor: hoverDemo ? btnHoverBg : btnBaseBg,
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            <div className="size-5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
                <path d="M17 6.75L15.305 5.055C13.9475 3.75 12.14 3 10.25 3C8.91498 3 7.60993 3.39588 6.4999 4.13758C5.38987 4.87928 4.52471 5.93349 4.01382 7.16689C3.50292 8.40029 3.36925 9.75749 3.6297 11.0669C3.89015 12.3762 4.53303 13.579 5.47703 14.523C6.42104 15.467 7.62377 16.1098 8.93314 16.3703C10.2425 16.6307 11.5997 16.4971 12.8331 15.9862C14.0665 15.4753 15.1207 14.6101 15.8624 13.5001C16.3573 12.7595 16.6982 11.9321 16.8703 11.0669" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M17 3V6.75H13.25" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </div>
            <span className="hidden md:flex">演示转动</span>
          </button>
          <button
            type="button"
            onMouseEnter={() => setHoverQuick(true)}
            onMouseLeave={() => setHoverQuick(false)}
            onClick={() => setQuickActive((v) => !v)}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none size-11 p-0"
            style={{
              backgroundColor: hoverQuick ? btnHoverBg : btnBaseBg,
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
            aria-pressed={quickActive}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={quickActive ? '#EDD75A' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap size-4 min-w-4 min-h-4 ">
              <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}


