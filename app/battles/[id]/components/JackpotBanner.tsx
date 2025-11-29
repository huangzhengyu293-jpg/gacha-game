"use client";

type JackpotBannerProps = {
  visible: boolean;
  totalValue: number;
};

export default function JackpotBanner({ visible, totalValue }: JackpotBannerProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="flex absolute justify-center top-0 md:top-4 left-0 right-0">
      <div className="flex self-center relative z-[5] bg-gradient-to-b from-[#FFD39F] to-[#3E2D19] rounded-lg p-[1px]">
        <div className="flex bg-gray-650 rounded-lg">
          <div
            className="flex py-2 px-3 rounded-lg"
            style={{
              background:
                'radial-gradient(at center top, rgba(255, 176, 84, 0.627), rgba(255, 211, 159, 0.314) 42%, rgba(153, 106, 50, 0.063) 85%, rgba(153, 106, 50, 0)) no-repeat',
            }}
          >
            <h3 className="text-sm md:text-lg font-bold text-white">
              Jackpot: ${totalValue.toFixed(2)}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}

