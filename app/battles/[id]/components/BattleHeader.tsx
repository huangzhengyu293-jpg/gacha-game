"use client";

import Link from "next/link";
import React, { type ReactNode } from "react";

export interface PackImage {
  src: string;
  alt: string;
  id: string;
}

export interface BattleHeaderProps {
  packImages?: PackImage[];
  highlightedIndices?: number[];
  awardName?: string;
  statusComponent?: ReactNode;
  currentPackName?: string;
  currentPackPrice?: string;
  totalCost?: string;
  onFairnessClick?: () => void;
  onShareClick?: () => void;
}

export default function BattleHeader({
  packImages = [],
  highlightedIndices = [],
  awardName = "大奖",
  statusComponent,
  currentPackName = "",
  currentPackPrice = "",
  totalCost = "",
  onFairnessClick,
  onShareClick,
}: BattleHeaderProps) {
  const isHighlighted = (index: number) => highlightedIndices.includes(index);

  return (
    <div className="flex self-stretch justify-center border-t-[1px] border-t-gray-650">
      <div className="flex max-w-screen-xl w-full relative">
        {/* Desktop Layout */}
        <div className="hidden sm:flex flex-1">
          <div className="flex flex-1 justify-between pt-2 pb-3  min-h-32">
            {/* Left Column */}
            <div className="flex flex-1 flex-col justify-between">
              <Link href="/battles">
                <div className="flex cursor-pointer items-center">
                  <div className="size-5 text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M8 3L3 8L8 13"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                      <path
                        d="M13 8L3 8"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                    </svg>
                  </div>
                  <p className="text-sm text-white font-bold ml-2">所有对战</p>
                </div>
              </Link>
              <div className="flex flex-col-reverse items-start md:flex-row md:items-center">
                <div className="flex items-center relative gap-2 bg-gray-700 rounded px-3 py-1 after:content-[''] after:absolute after:left-0 after:top-0 after:bottom-0 after:w-0.5 after:rounded-l after:bg-green-100">
                  <p className="text-sm text-gray-300 font-bold">{awardName}</p>
                </div>
              </div>
            </div>

            {/* Middle Column */}
            <div className="flex flex-1 flex-col justify-between items-center">
              {/* Pack Images Gallery */}
              <div className="flex w-[15.75rem] bg-gray-700/50 rounded">
                <div className="flex w-full overflow-x-hidden">
                  <div
                    className="rounded-lg m-[1px] flex gap-2"
                    style={{
                      height: "72px",
                      padding: "4px 188px 4px 4px",
                    }}
                  >
                    {packImages.map((pack, index) => (
                      <img
                        key={pack.id}
                        alt={pack.alt}
                        loading="eager"
                        width="42"
                        height="64"
                        decoding="async"
                        src={pack.src}
                        className="cursor-pointer"
                        style={{
                          color: "transparent",
                          opacity: isHighlighted(index) ? 1 : 0.32,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Battle Status Row */}
              <div className="flex self-center">
                {statusComponent ? (
                  statusComponent
                ) : (
                  <>
                    <div className="flex gap-1">
                      <span className="text-base text-gray-200 font-bold ml-1">
                        回合
                      </span>
                      <span className="text-base text-gray-200 font-bold">
                        12/30
                      </span>
                    </div>
                    <div className="flex w-[1px] h-full bg-gray-600 mx-2"></div>
                    <p className="text-base text-gray-200 font-bold max-w-32 overflow-hidden text-ellipsis whitespace-nowrap">
                      {currentPackName}
                    </p>
                    <div className="flex w-[1px] h-full bg-gray-600 mx-2"></div>
                    <p className="text-base text-gray-200 font-bold">
                      {currentPackPrice}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-1 flex-col justify-between">
              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={onFairnessClick}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-sm text-white font-bold hover:bg-gray-700 select-none h-7 py-1 px-2"
                >
                  <div className="size-4 mb-0.5">
                    <svg
                      viewBox="0 0 22 22"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11.5574 8.74841L8.72897 11.5768C8.27987 12.0259 8.27987 12.7541 8.72897 13.2032C9.17807 13.6523 9.90621 13.6523 10.3553 13.2032L13.1837 10.3748C13.6328 9.92566 13.6328 9.19752 13.1837 8.74841C12.7346 8.29931 12.0065 8.29931 11.5574 8.74841Z"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="0.3"
                      ></path>
                      <path
                        d="M17.4216 13.2022L17.4216 13.2022L19.1601 11.4736C19.1604 11.4734 19.1606 11.4732 19.1608 11.473C20.249 10.4198 20.9215 9.0099 21.0551 7.50139C21.1886 5.99256 20.7741 4.48612 19.8874 3.25802L19.8875 3.25799L19.8848 3.25448C19.3519 2.56042 18.677 1.98809 17.9052 1.57571C17.1334 1.16334 16.2824 0.920415 15.4092 0.863173C14.5361 0.805931 13.6607 0.935688 12.8417 1.24378C12.0227 1.55184 11.2789 2.03111 10.66 2.64958C10.6599 2.64963 10.6599 2.64968 10.6598 2.64973L8.8502 4.44933C8.85016 4.44937 8.8501 4.44943 8.85006 4.44947C8.74233 4.55635 8.65684 4.68348 8.59848 4.82357C8.54009 4.9637 8.51003 5.11402 8.51003 5.26583C8.51003 5.41764 8.54009 5.56796 8.59848 5.70809C8.65686 5.84823 8.74241 5.97542 8.8502 6.08233L8.85016 6.08237L8.85308 6.08511C9.06636 6.28564 9.34809 6.39729 9.64083 6.39729C9.93358 6.39729 10.2153 6.28564 10.4286 6.08511L10.4286 6.08515L10.4313 6.08249L12.2313 4.30249L12.2313 4.30249L12.2319 4.30185C12.6126 3.92084 13.0691 3.62395 13.5717 3.43037C14.0743 3.23679 14.612 3.15083 15.1499 3.17805C15.6878 3.20526 16.2141 3.34504 16.6946 3.58836C17.1745 3.83137 17.5982 4.17226 17.9383 4.58904C18.5341 5.3622 18.8242 6.32778 18.7531 7.30133C18.682 8.27554 18.2542 9.18935 17.5516 9.86793L17.551 9.86854L15.801 11.5785L15.801 11.5785L15.7995 11.5801C15.5853 11.7955 15.465 12.087 15.465 12.3908C15.465 12.6946 15.5853 12.9861 15.7995 13.2016L15.8001 13.2022C16.0156 13.4164 16.307 13.5366 16.6108 13.5366C16.9146 13.5366 17.2061 13.4164 17.4216 13.2022Z"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="0.3"
                      ></path>
                      <path
                        d="M13.1822 17.4416L13.1823 17.4417L13.1858 17.4379C13.383 17.2252 13.4926 16.9459 13.4926 16.6559C13.4926 16.3658 13.383 16.0865 13.1858 15.8739L13.1859 15.8738L13.1816 15.8695C12.9661 15.6553 12.6746 15.5351 12.3708 15.5351C12.0673 15.5351 11.7761 15.6551 11.5606 15.8689C11.5605 15.8691 11.5603 15.8693 11.5601 15.8695L9.6812 17.6984L9.68119 17.6984L9.67972 17.6998C9.29901 18.0808 8.84259 18.3777 8.33997 18.5713C7.83734 18.7649 7.29968 18.8509 6.76175 18.8236C6.22382 18.7964 5.69759 18.6566 5.21706 18.4133C4.73713 18.1703 4.31347 17.8294 3.97337 17.4126C3.37757 16.6395 3.08746 15.6739 3.15853 14.7004C3.22964 13.7261 3.65742 12.8123 4.36003 12.1338L4.36006 12.1338L4.3622 12.1316L6.1122 10.3716L6.11221 10.3716C6.3264 10.1561 6.44662 9.86467 6.44662 9.56086C6.44662 9.25704 6.3264 8.96557 6.11221 8.7501L6.11158 8.74947C5.89611 8.53529 5.60464 8.41506 5.30083 8.41506C4.99702 8.41506 4.70555 8.53529 4.49008 8.74947L4.49007 8.74946L4.48835 8.75122L2.64904 10.6405C2.03083 11.2594 1.55175 12.003 1.24378 12.8217C0.935688 13.6407 0.805931 14.5161 0.863173 15.3893C0.920415 16.2625 1.16334 17.1134 1.57571 17.8852C1.98809 18.657 2.56042 19.3319 3.25448 19.8648L3.25444 19.8649L3.25775 19.8673C4.47946 20.7535 5.97872 21.1717 7.48275 21.0457C8.98663 20.9198 10.3953 20.2581 11.4526 19.1812C11.4527 19.1811 11.4528 19.181 11.4529 19.1809L13.1822 17.4416Z"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="0.3"
                      ></path>
                    </svg>
                  </div>
                  <p>公平性</p>
                </button>
                <button
                  onClick={onShareClick}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative  text-sm text-white font-bold hover:bg-gray-700 select-none h-7 py-1 px-2"
                >
                  <div className="size-4 mb-0.5">
                    <svg
                      viewBox="0 0 22 22"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11.5574 8.74841L8.72897 11.5768C8.27987 12.0259 8.27987 12.7541 8.72897 13.2032C9.17807 13.6523 9.90621 13.6523 10.3553 13.2032L13.1837 10.3748C13.6328 9.92566 13.6328 9.19752 13.1837 8.74841C12.7346 8.29931 12.0065 8.29931 11.5574 8.74841Z"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="0.3"
                      ></path>
                      <path
                        d="M17.4216 13.2022L17.4216 13.2022L19.1601 11.4736C19.1604 11.4734 19.1606 11.4732 19.1608 11.473C20.249 10.4198 20.9215 9.0099 21.0551 7.50139C21.1886 5.99256 20.7741 4.48612 19.8874 3.25802L19.8875 3.25799L19.8848 3.25448C19.3519 2.56042 18.677 1.98809 17.9052 1.57571C17.1334 1.16334 16.2824 0.920415 15.4092 0.863173C14.5361 0.805931 13.6607 0.935688 12.8417 1.24378C12.0227 1.55184 11.2789 2.03111 10.66 2.64958C10.6599 2.64963 10.6599 2.64968 10.6598 2.64973L8.8502 4.44933C8.85016 4.44937 8.8501 4.44943 8.85006 4.44947C8.74233 4.55635 8.65684 4.68348 8.59848 4.82357C8.54009 4.9637 8.51003 5.11402 8.51003 5.26583C8.51003 5.41764 8.54009 5.56796 8.59848 5.70809C8.65686 5.84823 8.74241 5.97542 8.8502 6.08233L8.85016 6.08237L8.85308 6.08511C9.06636 6.28564 9.34809 6.39729 9.64083 6.39729C9.93358 6.39729 10.2153 6.28564 10.4286 6.08511L10.4286 6.08515L10.4313 6.08249L12.2313 4.30249L12.2313 4.30249L12.2319 4.30185C12.6126 3.92084 13.0691 3.62395 13.5717 3.43037C14.0743 3.23679 14.612 3.15083 15.1499 3.17805C15.6878 3.20526 16.2141 3.34504 16.6946 3.58836C17.1745 3.83137 17.5982 4.17226 17.9383 4.58904C18.5341 5.3622 18.8242 6.32778 18.7531 7.30133C18.682 8.27554 18.2542 9.18935 17.5516 9.86793L17.551 9.86854L15.801 11.5785L15.801 11.5785L15.7995 11.5801C15.5853 11.7955 15.465 12.087 15.465 12.3908C15.465 12.6946 15.5853 12.9861 15.7995 13.2016L15.8001 13.2022C16.0156 13.4164 16.307 13.5366 16.6108 13.5366C16.9146 13.5366 17.2061 13.4164 17.4216 13.2022Z"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="0.3"
                      ></path>
                      <path
                        d="M13.1822 17.4416L13.1823 17.4417L13.1858 17.4379C13.383 17.2252 13.4926 16.9459 13.4926 16.6559C13.4926 16.3658 13.383 16.0865 13.1858 15.8739L13.1859 15.8738L13.1816 15.8695C12.9661 15.6553 12.6746 15.5351 12.3708 15.5351C12.0673 15.5351 11.7761 15.6551 11.5606 15.8689C11.5605 15.8691 11.5603 15.8693 11.5601 15.8695L9.6812 17.6984L9.68119 17.6984L9.67972 17.6998C9.29901 18.0808 8.84259 18.3777 8.33997 18.5713C7.83734 18.7649 7.29968 18.8509 6.76175 18.8236C6.22382 18.7964 5.69759 18.6566 5.21706 18.4133C4.73713 18.1703 4.31347 17.8294 3.97337 17.4126C3.37757 16.6395 3.08746 15.6739 3.15853 14.7004C3.22964 13.7261 3.65742 12.8123 4.36003 12.1338L4.36006 12.1338L4.3622 12.1316L6.1122 10.3716L6.11221 10.3716C6.3264 10.1561 6.44662 9.86467 6.44662 9.56086C6.44662 9.25704 6.3264 8.96557 6.11221 8.7501L6.11158 8.74947C5.89611 8.53529 5.60464 8.41506 5.30083 8.41506C4.99702 8.41506 4.70555 8.53529 4.49008 8.74947L4.49007 8.74946L4.48835 8.75122L2.64904 10.6405C2.03083 11.2594 1.55175 12.003 1.24378 12.8217C0.935688 13.6407 0.805931 14.5161 0.863173 15.3893C0.920415 16.2625 1.16334 17.1134 1.57571 17.8852C1.98809 18.657 2.56042 19.3319 3.25448 19.8648L3.25444 19.8649L3.25775 19.8673C4.47946 20.7535 5.97872 21.1717 7.48275 21.0457C8.98663 20.9198 10.3953 20.2581 11.4526 19.1812C11.4527 19.1811 11.4528 19.181 11.4529 19.1809L13.1822 17.4416Z"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="0.3"
                      ></path>
                    </svg>
                  </div>
                  <p>分享</p>
                </button>
              </div>

              {/* Total Cost */}
              <div className="flex justify-end">
                <div className="flex gap-1">
                  <span className="text-base text-gray-200 font-bold">
                    总费用：
                  </span>
                  <span className="text-base text-white font-bold">
                    {totalCost}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex sm:hidden flex-1 w-full">
          <div className="flex flex-1 flex-col w-full gap-2 items-stretch pt-2 pb-3 px-4">
            {/* Top Row: Award Name and Action Buttons */}
            <div className="flex justify-between items-center">
              <div className="flex flex-col-reverse items-start md:flex-row md:items-center">
                <div className="flex items-center relative gap-2 bg-gray-700 rounded px-3 py-1 after:content-[''] after:absolute after:left-0 after:top-0 after:bottom-0 after:w-0.5 after:rounded-l after:bg-green-100">
                  <p className="text-sm text-gray-300 font-bold">{awardName}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onFairnessClick}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none interactive-focus relative bg-gray-600 text-base text-white font-bold hover:bg-gray-500 disabled:text-gray-400 select-none size-6 min-h-6 min-w-6 max-h-6 max-w-6 rounded-[4px]"
                >
                  <div className="text-white size-2.5">公平性图标</div>
                </button>
                <button
                  onClick={onShareClick}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none interactive-focus relative bg-gray-600 text-base text-white font-bold hover:bg-gray-500 disabled:text-gray-400 select-none size-6 min-h-6 min-w-6 max-h-6 max-w-6 rounded-[4px]"
                >
                  <div className="text-white size-2.5">分享图标</div>
                </button>
              </div>
            </div>

            {/* Pack Images Gallery */}
            <div className="flex bg-gray-700/50 rounded">
              <div className="flex w-full overflow-x-hidden">
                <div
                  className="rounded-lg m-[1px] flex gap-2"
                  style={{
                    height: "72px",
                    padding: "4px",
                  }}
                >
                  {packImages.map((pack, index) => (
                    <img
                      key={pack.id}
                      alt={pack.alt}
                      loading="eager"
                      width="42"
                      height="64"
                      decoding="async"
                      src={pack.src}
                      className="cursor-pointer"
                      style={{
                        color: "transparent",
                        opacity: isHighlighted(index) ? 1 : 0.32,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Battle Status Row */}
            <div className="flex self-center">
              {statusComponent ? (
                statusComponent
              ) : (
                <>
                  <div className="flex gap-1">
                    <span className="text-base text-gray-200 font-bold ml-1">
                      回合
                    </span>
                    <span className="text-base text-gray-200 font-bold">
                      12/30
                    </span>
                  </div>
                  <div className="flex w-[1px] h-full bg-gray-600 mx-2"></div>
                  <p className="text-base text-white font-bold max-w-32 overflow-hidden text-ellipsis whitespace-nowrap">
                    {currentPackName}
                  </p>
                  <div className="flex w-[1px] h-full bg-gray-600 mx-2"></div>
                  <p className="text-base text-white font-bold">
                    {currentPackPrice}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
