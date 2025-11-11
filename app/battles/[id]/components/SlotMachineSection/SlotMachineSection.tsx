'use client';

import { useRef } from 'react';
import SlotMachine, { SlotMachineHandle, SlotMachineItem } from '../../../../components/SlotMachine/SlotMachine';
import { MOCK_SLOT_MACHINE_DATA } from '../../constants';

export default function SlotMachineSection() {
  const slotMachineRef = useRef<SlotMachineHandle>(null);

  const getRandomStopIds = (): string[] => {
    return MOCK_SLOT_MACHINE_DATA.map((column) => {
      const randomIndex = Math.floor(Math.random() * column.length);
      return column[randomIndex].id;
    });
  };

  const handleStartDraw = () => {
    const randomIds = getRandomStopIds();
    slotMachineRef.current?.start(randomIds);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-white">抽奖结果</h2>
        <button
          onClick={handleStartDraw}
          className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors bg-blue-500 hover:bg-blue-600"
        >
          开始抽奖
        </button>
      </div>
      <SlotMachine
        ref={slotMachineRef}
        columns={MOCK_SLOT_MACHINE_DATA}
        itemHeight={80}
        visibleItems={5.625}
        duration={3.5}
        showGuidelines={false}
        onComplete={() => {
          console.log('抽奖完成！');
        }}
      />
    </div>
  );
}

