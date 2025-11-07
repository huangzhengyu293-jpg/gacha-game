"use client";

import Image from "next/image";
import Link from "next/link";
import PackCard from "./PackCard";

type PackItem = {
  id: string;
  coverSrc: string;
  price: string;
  title?: string;
  priceNumber?: number;
};

// 只渲染 2-3 行的数据（自适应列数），默认提供示例数据
const DEFAULT_ITEMS: PackItem[] = [
  {
    id: "p1",
    coverSrc:
      "https://ik.imagekit.io/hr727kunx/packs/cmf364zuz0000gs0g8kl2j9kk_8813805__877HjEZ6l?tr=q-50,w-640,c-at_max",
    price: "$22,289.96",
  },
  {
    id: "p2",
    coverSrc:
      "https://ik.imagekit.io/hr727kunx/packs/cmh2lqffk001al10paqslua2f_2229948__zIR8y5q-G?tr=q-50,w-640,c-at_max",
    price: "$20,507.39",
  },
  {
    id: "p3",
    coverSrc:
      "https://ik.imagekit.io/hr727kunx/packs/cmgo8hdp90000l40gxmfk970t_5020787__2hFmzl5eh?tr=q-50,w-640,c-at_max",
    price: "$18,120.00",
  },
  {
    id: "p4",
    coverSrc:
      "https://ik.imagekit.io/hr727kunx/packs/cmgmus9260000l80gpntkfktl_3232094__fSM1fwIYl1?tr=q-50,w-640,c-at_max",
    price: "$12,300.00",
  },
  {
    id: "p5",
    coverSrc:
      "https://ik.imagekit.io/hr727kunx/packs/cmgo6ok710000k10g5r0il5rk_7104681__d8no0nmco?tr=q-50,w-640,c-at_max",
    price: "$9,999.00",
  },
  {
    id: "p6",
    coverSrc:
      "https://ik.imagekit.io/hr727kunx/packs/cmh2lqffk001al10paqslua2f_2229948__zIR8y5q-G?tr=q-50,w-640,c-at_max",
    price: "$7,450.00",
  },
];

export default function PacksGrid({ items = DEFAULT_ITEMS }: { items?: PackItem[] }) {
  // 限制最多渲染 12 个（2~3 行，视列数而定）
  const limited = items.slice(0, 12);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 self-stretch">
        {limited.map((p) => (
          <div className="relative w-full" key={p.id}>
            <div className="relative w-full">

              <div className="relative flex flex-col items-stretch w-full mb-12">
                <PackCard
                  imageUrl={p.coverSrc}
                  alt="pack-grid-card"
                  width={200}
                  height={304}
                  href={`/packs/${p.id}`}
                  hoverTilt={false}
                  showActions
                  packId={p.id}
                  packTitle={p.title}
                  packPrice={p.priceNumber}
                />
                <div className="flex justify-center pt-3 absolute left-0 right-0 bottom-[-40px]">
                  <p className="font-bold text-base text-white">{p.price}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


