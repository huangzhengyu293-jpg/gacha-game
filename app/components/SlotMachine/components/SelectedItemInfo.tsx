import type { SlotMachineItem } from '../SlotMachine.types';

interface SelectedItemInfoProps {
  selectedItem: SlotMachineItem | null;
}

export default function SelectedItemInfo({ selectedItem }: SelectedItemInfoProps) {
  if (!selectedItem) return null;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-40 flex flex-col items-center gap-1 pb-4"
      style={{
        paddingTop: "8px",
      }}
    >
      <p
        className="text-base font-bold text-white max-w-24 overflow-hidden text-ellipsis whitespace-nowrap"
        style={{
          textAlign: "center",
        }}
      >
        {selectedItem.name}
      </p>
      <div
        className="flex justify-center items-center bg-gray-600 rounded px-2 py-0.5"
        style={{
          minWidth: "4rem",
          width: "auto",
        }}
      >
        <p className="text-sm font-semibold text-white">
          {selectedItem.price}
        </p>
      </div>
    </div>
  );
}

