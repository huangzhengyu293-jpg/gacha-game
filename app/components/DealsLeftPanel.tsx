'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from './I18nProvider';

interface DealsLeftPanelProps {
  priceMin?: number;
  priceMax?: number;
  priceStep?: number;
  initialPrice?: number;
  sliderMin?: number;
  sliderMax?: number;
  initialSlider?: number;
  onPercentChange?: (percent: number, sliderValue: number) => void;
  onSliderInteractionStart?: () => void;
  onSliderInteractionEnd?: () => void;
  disabled?: boolean;
  inactive?: boolean; // 无产品时：显示 0 值并禁用交互
  onReset?: () => void; // 重置：让父级按"重新选择当前物品"处理
  calculatedPrice?: number; // 计算出的价格（spinPrice）
}

export default function DealsLeftPanel({
  priceMin = 3204.36,
  priceMax = 256348.8,
  priceStep = 0.01,
  initialPrice = 167317.58,
  sliderMin = 1,
  sliderMax = 80,
  initialSlider = 35.04,
  onPercentChange,
  onSliderInteractionStart,
  onSliderInteractionEnd,
  disabled = false,
  inactive = false,
  onReset,
  calculatedPrice = 0,
}: DealsLeftPanelProps) {
  const { t } = useI18n();
  const baseAtOnePercent = 3780; // 1% 对应金额
  const [priceInput, setPriceInput] = useState<string>(formatCurrency(initialPrice));
  const [sliderValue, setSliderValue] = useState<number>(initialSlider);
  const syncingExternalRef = useRef(false);

  const selectedPercent = useMemo(() => {
    const clamped = Math.max(sliderMin, Math.min(sliderMax, sliderValue));
    return clamped;
  }, [sliderValue, sliderMin, sliderMax]);

  const gradientFillPercent = useMemo(() => {
    // 用于滑轨填充的百分比（0..100）
    const ratio = (selectedPercent - sliderMin) / Math.max(1, (sliderMax - sliderMin));
    return Math.max(0, Math.min(100, ratio * 100));
  }, [selectedPercent, sliderMin, sliderMax]);

  // 优先同步外部 percent 到本地滑块，避免在 onPercentChange 中回推旧值
  useEffect(() => {
    if (Number.isFinite(initialSlider) && initialSlider !== sliderValue) {
      syncingExternalRef.current = true;
      setSliderValue(Number(initialSlider.toFixed(2)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSlider]);

  // 将本地变化回推父级（跳过外部同步中的一次，或未选中时）
  useEffect(() => {
    if (inactive) return;
    if (syncingExternalRef.current) {
      syncingExternalRef.current = false;
      return;
    }
    if (onPercentChange) {
      onPercentChange(selectedPercent, sliderValue);
    }
  }, [selectedPercent, sliderValue, onPercentChange, inactive]);

  // 使用外部传入的计算价格（spinPrice）
  useEffect(() => {
    if (calculatedPrice !== undefined && calculatedPrice !== null) {
      setPriceInput(formatCurrency(calculatedPrice));
    }
  }, [calculatedPrice]);

  const sliderBg = useMemo(() => ({
    background: 'transparent',
    ['--thumb-bg' as any]: 'rgb(52 56 60)',
    ['--thumb-border' as any]: 'rgb(29 33 37)',
    ['--thumb-hover' as any]: 'rgb(52 56 60)',
    ['--thumb-active' as any]: 'rgb(52 56 60)',
    ['--thumb-disabled' as any]: 'rgb(52 56 60)',
    ['--thumb-border-disabled' as any]: 'rgb(29 33 37)',
    ['--track-disabled' as any]: 'rgb(29 33 37)'
  }) as React.CSSProperties, [gradientFillPercent]);

  function formatCurrency(value: number): string {
    if (Number.isNaN(value)) return '';
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  function parseCurrencyInput(input: string): number | null {
    const cleaned = input.replace(/,/g, '').trim();
    if (!cleaned) return null;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  }

  const onPriceChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    if (inactive) return; // 未选产品时忽略输入
    setPriceInput(e.target.value);
  };

  const onPriceBlur: React.FocusEventHandler<HTMLInputElement> = () => {
    if (inactive) return; // 未选产品时不触发推算
    const parsed = parseCurrencyInput(priceInput);
    if (parsed == null || parsed <= 0) {
      // 恢复为当前百分比对应价格，避免 0 反推为 1%
      const current = baseAtOnePercent * selectedPercent;
      setPriceInput(formatCurrency(current));
      return;
    }
    const snapped = Math.round(parsed / priceStep) * priceStep;
    // 反推百分比并同步滑块（范围 1..80）
    const inferredPercent = clamp(snapped / baseAtOnePercent, sliderMin, sliderMax);
    setSliderValue(Number(inferredPercent.toFixed(2)));
    setPriceInput(formatCurrency(inferredPercent * baseAtOnePercent));
  };

  const setPriceToMax = () => {
    // 点击 max：返回到 1%
    if (inactive) return;
    setSliderByPct(1);
  };

  const setPriceToMin = () => {
    setPriceInput(formatCurrency(priceMin));
  };

  const setSliderByPct = (pct: number) => {
    const value = Number(pct.toFixed(2));
    const clamped = Math.max(sliderMin, Math.min(sliderMax, value));
    setSliderValue(clamped);
  };

  const resetAll = () => {
    if (onReset) {
      onReset();
    } else {
      // 回退：仅本地复原
      setPriceInput(formatCurrency(initialPrice));
      setSliderValue(initialSlider);
    }
  };

  return (
    <div className="col-span-1 px-4 py-6 lg:p-8 lg:pb-6 lg:pt-14 overflow-hidden min-w-0 rounded-md items-center justify-center flex order-1 sm:order-0 self-stretch h-full" style={{ backgroundColor: '#22272B' }}>
      <div className="flex flex-col gap-7 items-stretch flex-1 h-full">
        <div className="grid w-full items-center gap-2">
          <label className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-extrabold" style={{ color: disabled ? '#7A8084' : '#FFFFFF' }}>{t('priceLabel')}</label>
          <div className="flex relative">
            <div className="rounded-tl rounded-bl px-4 text-sm font-bold flex items-center" style={{ backgroundColor: '#34383C', color: disabled ? '#7A8084' : '#FFFFFF' }}>$</div>
            <input
              className="flex h-10 w-full rounded-md border-gray-600 focus:border-gray-600 px-3 py-2 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-700 interactive-focus !-outline-offset-1 rounded-tl-none rounded-bl-none font-black text-lg border-0"
              style={{ backgroundColor: '#1D2125', color: '#7A8084' }}
              inputMode="decimal"
              placeholder="0.00"
              step={priceStep}
              min={baseAtOnePercent * sliderMin}
              max={baseAtOnePercent * sliderMax}
              value={inactive ? '0.00' : priceInput}
              onChange={onPriceChange}
              onBlur={onPriceBlur}
              disabled={true}
            />
            <button
              type="button"
              onClick={setPriceToMax}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus select-none font-bold text-sm !rounded-md absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2 opacity-50"
              style={{ backgroundColor: '#34383C', color: '#7A8084', cursor: 'not-allowed' }}
              disabled={true}
            >
              {t('maxPrice')}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex py-4 lg:py-2">
            <div className="w-full flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-extrabold" style={{ color: disabled ? '#7A8084' : '#FFFFFF' }}>{t('resultLabel')}</label>
                <label className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-extrabold" style={{ color: disabled ? '#7A8084' : '#FFFFFF' }}>{inactive ? '0.00%' : selectedPercent.toFixed(2) + '%'}</label>
              </div>
              <div className="w-full px-1 rounded-md flex items-center" style={{ backgroundColor: '#1D2125' }}>
                <input
                  aria-label="Price Slider"
                  className="w-full h-10 appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:rounded-sm [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-sm [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-md [&::-webkit-slider-thumb]:bg-[var(--thumb-bg)] [&::-webkit-slider-thumb]:border-[var(--thumb-border)] [&::-webkit-slider-thumb:hover]:bg-[var(--thumb-hover)] [&::-webkit-slider-thumb:active]:bg-[var(--thumb-active)] [&::-webkit-slider-thumb]:translate-y-[0px] [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:translate-y-[0px]"
                  type="range"
                  step={0.01}
                  min={sliderMin}
                  max={sliderMax}
                  value={selectedPercent}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setSliderValue(Math.max(sliderMin, Math.min(sliderMax, v)));
                  }}
                  onMouseDown={() => { onSliderInteractionStart && onSliderInteractionStart(); }}
                  onMouseUp={() => { onSliderInteractionEnd && onSliderInteractionEnd(); }}
                  style={sliderBg}
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1 self-stretch">
            <button
              type="button"
              onClick={() => { if (!inactive) setSliderByPct(1); }}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative select-none font-bold h-9 px-6 text-sm"
              style={{ backgroundColor: disabled ? '#34383C' : '#2A2D35', color: disabled ? '#7A8084' : '#FFFFFF', cursor: disabled ? 'default' : 'pointer' }}
              onMouseEnter={(e) => { if (!disabled) (e.target as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
              onMouseLeave={(e) => { if (!disabled) (e.target as HTMLButtonElement).style.backgroundColor = '#2A2D35'; }}
              disabled={disabled}
            >{t('minPrice')}</button>
            <button
              type="button"
              onClick={() => { if (!inactive) setSliderByPct(10); }}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative select-none font-bold h-9 px-6 text-sm"
              style={{ backgroundColor: disabled ? '#34383C' : '#2A2D35', color: disabled ? '#7A8084' : '#FFFFFF', cursor: disabled ? 'default' : 'pointer' }}
              onMouseEnter={(e) => { if (!disabled) (e.target as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
              onMouseLeave={(e) => { if (!disabled) (e.target as HTMLButtonElement).style.backgroundColor = '#2A2D35'; }}
              disabled={disabled}
            >10%</button>
            <button
              type="button"
              onClick={() => { if (!inactive) setSliderByPct(25); }}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative select-none font-bold h-9 px-6 text-sm"
              style={{ backgroundColor: disabled ? '#34383C' : '#2A2D35', color: disabled ? '#7A8084' : '#FFFFFF', cursor: disabled ? 'default' : 'pointer' }}
              onMouseEnter={(e) => { if (!disabled) (e.target as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
              onMouseLeave={(e) => { if (!disabled) (e.target as HTMLButtonElement).style.backgroundColor = '#2A2D35'; }}
              disabled={disabled}
            >25%</button>
            <button
              type="button"
              onClick={() => { if (!inactive) setSliderByPct(50); }}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative select-none font-bold h-9 px-6 text-sm"
              style={{ backgroundColor: disabled ? '#34383C' : '#2A2D35', color: disabled ? '#7A8084' : '#FFFFFF', cursor: disabled ? 'default' : 'pointer' }}
              onMouseEnter={(e) => { if (!disabled) (e.target as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
              onMouseLeave={(e) => { if (!disabled) (e.target as HTMLButtonElement).style.backgroundColor = '#2A2D35'; }}
              disabled={disabled}
            >50%</button>
            <button
              type="button"
              onClick={() => { if (!inactive) setSliderByPct(80); }}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative select-none font-bold h-9 px-6 text-sm"
              style={{ backgroundColor: disabled ? '#34383C' : '#2A2D35', color: disabled ? '#7A8084' : '#FFFFFF', cursor: disabled ? 'default' : 'pointer' }}
              onMouseEnter={(e) => { if (!disabled) (e.target as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
              onMouseLeave={(e) => { if (!disabled) (e.target as HTMLButtonElement).style.backgroundColor = '#2A2D35'; }}
              disabled={disabled}
            >{t('maxPrice')}</button>
          </div>
        </div>

        <div className="flex flex-1"></div>

        <button
          type="button"
          onClick={resetAll}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative text-base font-bold select-none h-11 px-6 w-full"
          style={{ backgroundColor: disabled ? '#34383C' : '#2A2D35', color: disabled ? '#7A8084' : '#FFFFFF', cursor: disabled ? 'default' : 'pointer' }}
          onMouseEnter={(e) => { if (!disabled) (e.target as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
          onMouseLeave={(e) => { if (!disabled) (e.target as HTMLButtonElement).style.backgroundColor = '#2A2D35'; }}
          disabled={disabled}
        >{t('reset')}</button>
      </div>
    </div>
  );
}


