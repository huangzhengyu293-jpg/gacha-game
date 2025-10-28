'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from './I18nProvider';

export default function Navbar() {
  const { t } = useI18n();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [highlightStyle, setHighlightStyle] = useState<{ left: number; width: number; visible: boolean }>({ left: 0, width: 0, visible: false });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const assignItemRef = (index: number) => (el: HTMLDivElement | null) => {
    itemRefs.current[index] = el;
  };

  useEffect(() => {
    if (activeIndex < 0) {
      setHighlightStyle((prev) => ({ ...prev, visible: false }));
      return;
    }
    const container = containerRef.current;
    const target = itemRefs.current[activeIndex];
    if (!container || !target) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const left = targetRect.left - containerRect.left;
    const width = targetRect.width;
    setHighlightStyle({ left, width, visible: true });
  }, [activeIndex]);

  const navigationItems = [
    { labelKey: 'packs', icon: 'packs', href: '/packs' },
    { labelKey: 'battles', icon: 'battles', href: '/battles' },
    { labelKey: 'deals', icon: 'deals', href: '/deals' },
    { labelKey: 'draw', icon: 'draw', href: '/draw' },
    { labelKey: 'events', icon: 'events', href: '/events' },
    { labelKey: 'rewards', icon: 'rewards', href: '/rewards' },
  ];

  const getIcon = (iconName: string) => {
    const icons = {
      packs: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4.15385L4 16.8462C4 17.4834 4.70355 18 5.57143 18L13.4286 18C14.2964 18 15 17.4834 15 16.8462L15 4.15385C15 3.5166 14.2964 3 13.4286 3L5.57143 3C4.70355 3 4 3.5166 4 4.15385Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M8.08771 19.0127C7.98916 19.5993 8.54002 20.1807 9.3181 20.3115L16.3622 21.495C17.1403 21.6257 17.8509 21.2562 17.9495 20.6697L19.9123 8.98725C20.0109 8.4007 19.46 7.81924 18.6819 7.68851L15.1599 7.09675" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      ),
      battles: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.2222 16.8889L3.99998 6.66667V4H6.66665L16.8889 14.2222" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M12.8889 18.2222L18.2223 12.8889" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M15.5557 15.5555L19.1113 19.1111" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M18.2223 20L20 18.2222" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M14.2223 7.11112L17.3334 4H20V6.66667L16.8889 9.77779" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M5.77771 13.7777L9.33328 17.3333" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M7.55558 16.4445L4.88891 19.1112" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M3.99998 18.2222L5.77776 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      ),
      deals: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.5 3.06729C4.23742 4.71411 2 8.09576 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 8.09576 19.7626 4.71411 16.5 3.06729" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path>
          <path d="M8.6822 7C7.06551 8.07492 6 9.91303 6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12C18 9.91303 16.9345 8.07492 15.3178 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path>
          <path d="M13.8534 2H13.2857H10.7143H10.1466C9.71002 2 9.48314 2.5203 9.78021 2.84023L11.6336 4.83619C11.8314 5.04922 12.1686 5.04922 12.3664 4.83619L14.2198 2.84023C14.5169 2.5203 14.29 2 13.8534 2Z" fill="currentColor"></path>
        </svg>
      ),
      draw: (
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.5 9.16667V4.16667C17.5 3.72464 17.3244 3.30072 17.0118 2.98816C16.6993 2.67559 16.2754 2.5 15.8333 2.5H4.16667C3.72464 2.5 3.30072 2.67559 2.98816 2.98816C2.67559 3.30072 2.5 3.72464 2.5 4.16667V15.8333C2.5 16.2754 2.67559 16.6993 2.98816 17.0118C3.30072 17.3244 3.72464 17.5 4.16667 17.5H9.16667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M13.1741 15.4C13.1384 15.2615 13.0662 15.1352 12.9652 15.0341C12.8641 14.933 12.7377 14.8609 12.5993 14.8252L10.1454 14.1924C10.1035 14.1805 10.0667 14.1553 10.0404 14.1206C10.0142 14.0859 10 14.0435 10 14C10 13.9565 10.0142 13.9141 10.0404 13.8794C10.0667 13.8447 10.1035 13.8195 10.1454 13.8076L12.5993 13.1744C12.7377 13.1387 12.864 13.0667 12.9651 12.9656C13.0662 12.8646 13.1383 12.7384 13.1741 12.6L13.8069 10.1461C13.8187 10.1041 13.8438 10.067 13.8786 10.0407C13.9134 10.0143 13.9558 10 13.9995 10C14.0431 10 14.0856 10.0143 14.1204 10.0407C14.1551 10.067 14.1803 10.1041 14.1921 10.1461L14.8245 12.6C14.8602 12.7385 14.9323 12.8648 15.0334 12.9659C15.1345 13.067 15.2608 13.1391 15.3992 13.1748L17.8532 13.8072C17.8954 13.8188 17.9326 13.844 17.9591 13.8788C17.9856 13.9137 18 13.9562 18 14C18 14.0438 17.9856 14.0863 17.9591 14.1212C17.9326 14.156 17.8954 14.1812 17.8532 14.1928L15.3992 14.8252C15.2608 14.8609 15.1345 14.933 15.0334 15.0341C14.9323 15.1352 14.8602 15.2615 14.8245 15.4L14.1917 17.8539C14.1799 17.8959 14.1547 17.933 14.12 17.9593C14.0852 17.9857 14.0427 18 13.9991 18C13.9554 18 13.913 17.9857 13.8782 17.9593C13.8434 17.933 13.8183 17.8959 13.8065 17.8539L13.1741 15.4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      ),
      events: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 13V2L20 6L12 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M20.561 10.222C21.0931 11.8621 21.1429 13.6206 20.7044 15.2883C20.2659 16.9559 19.3576 18.4624 18.0876 19.6287C16.8175 20.7949 15.2391 21.5718 13.5402 21.8668C11.8413 22.1619 10.0935 21.9627 8.50454 21.2929C6.91562 20.6232 5.55254 19.5111 4.57747 18.0889C3.6024 16.6668 3.05639 14.9945 3.0044 13.2709C2.95241 11.5474 3.39662 9.84522 4.28419 8.36689C5.17176 6.88856 6.46532 5.69632 8.01099 4.93201" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M8.00202 9.99701C7.50092 10.664 7.1747 11.4458 7.05306 12.2712C6.93143 13.0966 7.01825 13.9392 7.30562 14.7225C7.59299 15.5057 8.07177 16.2045 8.69835 16.7554C9.32492 17.3062 10.0794 17.6915 10.893 17.8762C11.7065 18.0608 12.5534 18.039 13.3564 17.8126C14.1593 17.5862 14.8929 17.1625 15.4902 16.5801C16.0876 15.9977 16.5297 15.275 16.7762 14.478C17.0228 13.681 17.0661 12.835 16.902 12.017" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      ),
      rewards: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 8H4C3.44772 8 3 8.44772 3 9V11C3 11.5523 3.44772 12 4 12H20C20.5523 12 21 11.5523 21 11V9C21 8.44772 20.5523 8 20 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M12 8V21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M19 12V19C19 19.5304 18.7893 20.0391 18.4142 20.4142C18.0391 20.7893 17.5304 21 17 21H7C6.46957 21 5.96086 20.7893 5.58579 20.4142C5.21071 20.0391 5 19.5304 5 19V12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M7.5 8.00001C6.83696 8.00001 6.20107 7.73662 5.73223 7.26778C5.26339 6.79894 5 6.16305 5 5.50001C5 4.83697 5.26339 4.20108 5.73223 3.73224C6.20107 3.2634 6.83696 3.00001 7.5 3.00001C8.46469 2.9832 9.41003 3.45127 10.2127 4.34317C11.0154 5.23507 11.6383 6.50941 12 8.00001C12.3617 6.50941 12.9846 5.23507 13.7873 4.34317C14.59 3.45127 15.5353 2.9832 16.5 3.00001C17.163 3.00001 17.7989 3.2634 18.2678 3.73224C18.7366 4.20108 19 4.83697 19 5.50001C19 6.16305 18.7366 6.79894 18.2678 7.26778C17.7989 7.73662 17.163 8.00001 16.5 8.00001" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      ),
    };
    return icons[iconName as keyof typeof icons] || null;
  };

  return (
    <div className="flex flex-col fixed z-20 top-0 w-full items-center bg-black">
      <div className="flex z-10 w-full max-w-screen-xl pl-0 pr-2 items-center h-12 min-h-12 lg:h-16 lg:min-h-16 overflow-visible">
        {/* Logo */}
        <Link href="/" className="flex items-center h-[3rem] xs:h-[4rem] mr-5 lg:mr-10 cursor-pointer shrink-0" style={{ marginLeft: 'max(env(safe-area-inset-left, 0px), 20px)' }}>
          <div className="w-6 h-6 mr-2 text-white shrink-0 block">
            <svg viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.21192 7.42225C1.15968 8.23994 0.158879 10.5665 0.976565 12.6187L12.821 42.346C13.6387 44.3982 15.9652 45.399 18.0174 44.5813L34.739 37.9188C36.7913 37.1012 37.7921 34.7746 36.9744 32.7224L25.13 2.99512C24.3123 0.942884 21.9857 -0.0579184 19.9335 0.759768L3.21192 7.42225Z" fill="currentColor"></path>
              <path d="M35.8047 22.5693L35.7383 6.50156C35.7292 4.29244 33.931 2.50898 31.7219 2.5181L27.822 2.5342L35.8047 22.5693Z" fill="currentColor"></path>
              <path d="M38.0241 27.9748L44.3787 13.2168C45.2524 11.1878 44.3158 8.83469 42.2868 7.96101L38.7048 6.41865L38.0241 27.9748Z" fill="currentColor"></path>
            </svg>
          </div>
          <h1 className="text-xl text-white font-black whitespace-nowrap">PackDraw</h1>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex relative items-center h-[4rem] gap-2 overflow-clip px-[1px]">
          <div className="flex gap-0 xl:gap-2 relative" ref={containerRef}>
            {navigationItems.map((item, index) => (
              <div key={index} className="relative z-10">
                <Link href={item.href} className="block">
                  <div
                    ref={assignItemRef(index)}
                    className="flex relative justify-center items-center px-3 h-9 gap-1 text-gray-400 hover:text-white cursor-pointer"
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(-1)}
                  >
                    <div className="mb-[2px] size-5">
                      {getIcon(item.icon)}
                    </div>
                    <p className="text-base text-white font-semibold">{t(item.labelKey as any)}</p>
                  </div>
                </Link>
              </div>
            ))}
            <div
              className="absolute bg-gray-500/30 rounded-md h-9 transition-[left,width,opacity] duration-300 ease-out"
              style={{
                left: `${highlightStyle.left}px`,
                width: `${highlightStyle.width}px`,
                opacity: highlightStyle.visible ? 1 : 0
              }}
            ></div>
          </div>
        </div>

        <div className="flex-grow"></div>

        {/* Right side buttons */}
        <div className="flex flex-row gap-3 items-center lg:-ml-[20px]">
          {/* Sound button */}
          <div className="hidden sm:flex mr-0 sm:mr-2 gap-0 sm:gap-2 items-center">
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-transparent text-base text-gray-400 font-bold hover:text-white select-none size-10 min-h-10 min-w-10 max-h-10 max-w-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-volume2 size-5">
                <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"></path>
                <path d="M16 9a5 5 0 0 1 0 6"></path>
                <path d="M19.364 18.364a9 9 0 0 0 0-12.728"></path>
              </svg>
            </button>
            <div className="flex h-5 w-[1px] bg-gray-600"></div>
          </div>

          {/* Login/Register buttons */}
          <div className="hidden sm:flex gap-2">
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-gray-600 text-base text-white font-bold hover:bg-gray-500 disabled:text-gray-400 select-none px-6 h-8 sm:h-9 w-24">
              <p className="text-sm">{t('login')}</p>
            </button>
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-blue-400 text-base text-white font-bold hover:bg-blue-500 disabled:text-blue-600 select-none px-6 h-8 sm:h-9 w-24">
              <p className="text-sm">{t('register')}</p>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden relative">
            <div className="flex justify-center items-center">
              <svg 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.8" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="lucide lucide-menu flex lg:hidden size-6 min-h-6 min-w-6 text-white cursor-pointer"
              >
                <line x1="4" x2="20" y1="12" y2="12"></line>
                <line x1="4" x2="20" y1="6" y2="6"></line>
                <line x1="4" x2="20" y1="18" y2="18"></line>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="flex lg:hidden flex-col absolute top-0 left-0 right-0 w-full bg-black pt-[3rem] h-screen">
          <div className="flex flex-col gap-3 bg-black border border-gray-700 m-4 rounded-lg mb-6 px-10 py-6 mt-6">
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-gray-600 text-base text-white font-bold hover:bg-gray-500 disabled:text-gray-400 select-none h-10 px-6">
              <p className="text-lg text-white font-bold">{t('login')}</p>
            </button>
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-blue-400 text-base text-white font-bold hover:bg-blue-500 disabled:text-blue-600 select-none h-10 px-6">
              <p className="text-lg text-white font-bold">{t('register')}</p>
            </button>
          </div>
          <div className="flex flex-col px-6">
            {navigationItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2 py-3">
                <div className="size-5 text-gray-400">
                  {getIcon(item.icon)}
                </div>
                <Link href={item.href} className="text-lg text-white font-bold">{t((item as any).labelKey)}</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex z-10 self-stretch h-[1px] bg-gray-600"></div>
    </div>
  );
}
