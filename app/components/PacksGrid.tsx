"use client";

import Image from "next/image";
import Link from "next/link";

type PackItem = {
  id: string;
  coverSrc: string;
  price: string;
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
              <div className="absolute top-2 right-2 z-10 flex gap-2">
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md disabled:pointer-events-none interactive-focus relative bg-gray-600 text-base text-white font-bold hover:bg-gray-500 disabled:text-gray-400 select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8 transition-opacity duration-100 ease-in-out z-10 opacity-0" aria-label="收藏">
                  <div className="flex justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star size-4"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  </div>
                </button>
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md disabled:pointer-events-none interactive-focus relative bg-gray-600 text-base text-white font-bold hover:bg-gray-500 disabled:text-gray-400 select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8 transition-opacity duration-100 ease-in-out z-10 opacity-0" aria-label="详情">
                  <div className="size-4 flex justify-center">
                    <svg viewBox="0 0 21 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M10.2015 15.9999C8.17738 16.0075 6.19172 15.4472 4.47046 14.3825C2.74883 13.3179 1.36052 11.7915 0.463115 9.97718C-0.15429 8.73041 -0.15429 7.26686 0.463115 6.02009C1.67464 3.59605 3.74642 1.71115 6.27399 0.733299C8.80128 -0.244433 11.6026 -0.244433 14.1295 0.733299C16.657 1.71103 18.7288 3.59601 19.9404 6.02009C20.5578 7.26686 20.5578 8.73041 19.9404 9.97718C19.043 11.7915 17.6547 13.3179 15.9331 14.3825C14.2116 15.4471 12.2259 16.0075 10.202 15.9999H10.2015ZM2.19045 6.87906C1.83288 7.58259 1.83288 8.41472 2.19045 9.11825C2.91884 10.6182 4.0588 11.8802 5.47715 12.7569C6.89566 13.6336 8.53407 14.0888 10.2014 14.0695C11.8687 14.0888 13.5072 13.6336 14.9256 12.7569C16.344 11.8802 17.4839 10.6182 18.2123 9.11825C18.5699 8.41472 18.5699 7.58259 18.2123 6.87906C17.4839 5.37911 16.344 4.11716 14.9256 3.24044C13.5071 2.36372 11.8687 1.90855 10.2014 1.92778C8.53403 1.90855 6.89562 2.36372 5.47715 3.24044C4.0588 4.11716 2.91884 5.37911 2.19045 6.87906ZM10.2005 11.859C9.1766 11.859 8.19469 11.4523 7.47064 10.7283C6.7466 10.0042 6.3399 9.02232 6.3399 7.99838C6.3399 6.97445 6.7466 5.99254 7.47064 5.2685C8.19469 4.54445 9.1766 4.13776 10.2005 4.13776C11.2245 4.13776 12.2064 4.54445 12.9304 5.2685C13.6545 5.99254 14.0612 6.97445 14.0612 7.99838C14.0612 9.02232 13.6545 10.0042 12.9304 10.7283C12.2064 11.4523 11.2245 11.859 10.2005 11.859Z" fill="currentColor"></path></svg>
                  </div>
                </button>
              </div>

              <div className="relative flex flex-col items-stretch w-full mb-12">
                <div className="rounded-lg cursor-pointer overflow-hidden">
                  <Link href={`/packs/${p.id}`}>
                    <div className="flex relative">
                      {/* cover */}
                      {/* 使用 img 标签而非 next/image，以完全复刻原始 DOM 结构与懒加载行为 */}
                      {/* 但保留 next/image 的 remotePatterns 以兼容其他组件 */}
                      <img
                        alt="pack-grid-card"
                        loading="lazy"
                        width={200}
                        height={304}
                        decoding="async"
                        srcSet={`${p.coverSrc} 2x`}
                        src={p.coverSrc}
                        style={{ color: "transparent", height: "auto", width: "100%" }}
                      />
                      {/* overlay */}
                     
                    </div>
                  </Link>
                </div>
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


