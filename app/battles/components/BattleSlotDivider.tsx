import React from 'react';
import BattleConnectorIcon from './BattleConnectorIcon';

type BattleSlotDividerProps = {
  orientation?: 'vertical' | 'horizontal';
  className?: string;
};

const verticalLineStyleTop = 'linear-gradient(180deg, rgba(149,149,149,0) 0%, rgba(149,149,149,0.8) 55%, rgba(149,149,149,0) 100%)';
const verticalLineStyleBottom = 'linear-gradient(0deg, rgba(149,149,149,0) 0%, rgba(149,149,149,0.8) 55%, rgba(149,149,149,0) 100%)';
const horizontalLineStyleLeft = 'linear-gradient(90deg, rgba(149,149,149,0) 0%, rgba(149,149,149,0.8) 55%, rgba(149,149,149,0) 100%)';
const horizontalLineStyleRight = 'linear-gradient(270deg, rgba(149,149,149,0) 0%, rgba(149,149,149,0.8) 55%, rgba(149,149,149,0) 100%)';

const mergeClassName = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);

export default function BattleSlotDivider({ orientation = 'vertical', className }: BattleSlotDividerProps) {
  if (orientation === 'horizontal') {
    return (
      <div
        className={mergeClassName('flex flex-row justify-center w-full items-center', className)}
        aria-hidden="true"
      >
        <div
          className="flex transition-colors duration-300 animate-in justify-center items-center h-[1px] w-[175px] my-2"
          style={{ background: horizontalLineStyleRight }}
        />
        <div className="flex justify-center items-center relative w-[32px] h-[1px]">
          <div className="flex absolute justify-center items-center w-[25px]">
            <BattleConnectorIcon size={10} className="size-2.5 text-gray-400" />
          </div>
        </div>
        <div
          className="flex transition-colors duration-300 animate-in justify-center items-center h-[1px] w-[175px] my-1"
          style={{ background: horizontalLineStyleLeft }}
        />
      </div>
    );
  }

  return (
    <div
      className={mergeClassName(
        'slot-machine-divider flex h-full w-6 flex-col items-center justify-center self-center px-1',
        className,
      )}
      aria-hidden="true"
    >
      <div className="flex w-px sm:w-[2px] flex-1" style={{ background: verticalLineStyleTop }} />
      <div className="flex items-center justify-center relative h-8 w-px my-1">
        <div className="hidden sm:flex absolute items-center justify-center size-8 rounded-full bg-gradient-to-br from-[#9CA9B6] to-[#41464C] shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-center size-7 rounded-full bg-[#2B3136]">
            <BattleConnectorIcon size={14} className="text-gray-300" />
          </div>
        </div>
        <div className="flex sm:hidden items-center justify-center rounded-full bg-[#2B3136] h-6 w-6 shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
          <BattleConnectorIcon size={12} className="text-gray-300" />
        </div>
      </div>
      <div className="flex w-px sm:w-[2px] flex-1" style={{ background: verticalLineStyleBottom }} />
    </div>
  );
}

