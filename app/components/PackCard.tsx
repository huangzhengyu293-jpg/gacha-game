'use client';

import { useEffect, useRef, useState } from 'react';
import PackContentsModal from './PackContentsModal';
import LoadingSpinner from './icons/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { showGlobalToast } from './ToastProvider';
import { useI18n } from './I18nProvider';

interface PackCardProps {
  imageUrl: string;
  overlayUrl?: string;
  alt?: string;
  width?: number;
  height?: number;
  href?: string;
  className?: string;
  hoverTilt?: boolean; // 是否启用"鼠标吸附/倾斜"动画
  showActions?: boolean; // 是否显示右上角操作按钮（hover 时展示）
  packId?: string; // 用于"眼睛"弹出商品列表
  packTitle?: string;
  packPrice?: number;
}

export default function PackCard({
  imageUrl,
  overlayUrl,
  alt = 'pack-card',
  width = 200,
  height = 304,
  href,
  className = '',
  hoverTilt = false,
  showActions = false,
  packId,
  packTitle,
  packPrice,
}: PackCardProps) {
  const { t } = useI18n();
  const cardRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0, scale: 1 });
  const [showModal, setShowModal] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);
  const [isTouchPrimary, setIsTouchPrimary] = useState(false);
  const [touchActionsOpen, setTouchActionsOpen] = useState(false);
  
  const { favoriteIds, toggleFavorite } = useAuth();
  const isFavorited = packId ? favoriteIds.includes(String(packId)) : false;
 

  // 将新接口数据映射为旧格式
 
  
  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!packId || isTogglingFavorite) return;
    
    setIsTogglingFavorite(true);
    
    // 调用收藏接口（全局拦截器会自动处理未登录的情况）
    const result = await toggleFavorite(packId);
    
    setIsTogglingFavorite(false);
    
    if (result.success) {
      showGlobalToast({
        title: t("success"),
        description: t("actionSuccess"),
        variant: 'success',
        durationMs: 2000,
      });
    }
  };

  useEffect(() => {
    if (!hoverTilt) return;
    const card = cardRef.current;
    if (!card) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const rotateY = (deltaX / rect.width) * 20;
      const rotateX = -(deltaY / rect.height) * 20;
      setTransform({ rotateX, rotateY, scale: 1.05 });
    };
    const handleMouseLeave = () => setTransform({ rotateX: 0, rotateY: 0, scale: 1 });
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hoverTilt]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setIsTouchPrimary(!mql.matches);
    update();

    // Safari 舊版可能只有 addListener/removeListener
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', update);
      return () => mql.removeEventListener('change', update);
    }
    (mql as unknown as { addListener?: (cb: () => void) => void }).addListener?.(update);
    return () => {
      (mql as unknown as { removeListener?: (cb: () => void) => void }).removeListener?.(update);
    };
  }, []);

  useEffect(() => {
    if (!touchActionsOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = cardRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setTouchActionsOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [touchActionsOpen]);

  // SSR/硬刷新场景：图片可能在 React 绑定 onLoad/onError 之前就已加载完成，
  // 这会导致 onLoad 事件被错过，从而一直转圈。
  // 这里用 img.complete 做兜底，确保首屏不会永远停在 loading。
  useEffect(() => {
    setIsImageLoaded(false);
    setHasImageError(false);

    const el = imgRef.current;
    if (!el) return;

    // 下一帧再检查，避免读到旧的 complete 状态
    const raf = window.requestAnimationFrame(() => {
      const img = imgRef.current;
      if (!img) return;
      if (img.complete) {
        const ok = img.naturalWidth > 0;
        setHasImageError(!ok);
        setIsImageLoaded(true);
      }
    });
    return () => window.cancelAnimationFrame(raf);
  }, [imageUrl]);

  const forceActionsVisible = showActions && isTouchPrimary && touchActionsOpen;
  const actionVisibilityClass = forceActionsVisible
    ? 'opacity-100 pointer-events-auto'
    : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto';

  const content = (
    <div
      className="flex relative overflow-hidden bg-[#0f1113]"
      style={{ aspectRatio: `${width}/${height}` }}
    >
      <img
        alt={alt}
        loading="lazy"
        width={width}
        height={height}
        decoding="async"
        src={imageUrl}
        ref={imgRef}
        className="color-transparent h-full w-full object-cover"
        style={{ color: 'transparent' }}
        onLoad={() => setIsImageLoaded(true)}
        onError={() => {
          setHasImageError(true);
          setIsImageLoaded(true);
        }}
      />
      {/* 加载遮罩：仅在未加载完成时显示（避免“永远转圈”观感） */}
      {!isImageLoaded && !hasImageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#22272B]" style={{ zIndex: 3 }}>
          <LoadingSpinner
            className="h-10 w-10"
            indicatorColor="#1D2125"
            trackColor="#1D212533"
          />
        </div>
      )}
      {overlayUrl ? (
        <div className="flex absolute w-full h-full inset-0 items-center justify-center" style={{ zIndex: 1 }}>
          <img
            alt=""
            loading="lazy"
            width={width + 43}
            height={height - 17}
            decoding="async"
            src={overlayUrl}
            className="color-transparent object-contain"
            style={{ color: 'transparent' }}
          />
        </div>
      ) : null}
      {hasImageError && isImageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-gray-300 text-sm" style={{ zIndex: 5 }}>
          {t('loadFailed') || 'Load failed'}
        </div>
      )}
      {showActions ? (
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          <button
            className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md disabled:pointer-events-none interactive-focus relative text-base font-bold select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8 transition-all duration-200 ease-in-out z-10 cursor-pointer ${actionVisibilityClass}`}
            aria-label={t("favorite")}
            style={{ backgroundColor: '#34383C' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A5E62'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
            onClick={handleFavoriteClick}
            disabled={isTogglingFavorite}
            type="button"
          >
            <div className="flex justify-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill={isFavorited ? '#EDD75A' : 'none'}
                stroke={isFavorited ? '#EDD75A' : 'white'}
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="lucide lucide-star size-4 transition-all duration-200"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
          </button>
          <button
            className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md disabled:pointer-events-none interactive-focus relative text-base text-white font-bold select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8 transition-opacity duration-100 ease-in-out z-10 cursor-pointer ${actionVisibilityClass}`}
            aria-label={t("viewDetails")}
            style={{ backgroundColor: '#34383C' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A5E62'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowModal(true);
            }}
            type="button"
          >
            <div className="size-4 flex justify-center">
              <svg viewBox="0 0 21 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M10.2015 15.9999C8.17738 16.0075 6.19172 15.4472 4.47046 14.3825C2.74883 13.3179 1.36052 11.7915 0.463115 9.97718C-0.15429 8.73041 -0.15429 7.26686 0.463115 6.02009C1.67464 3.59605 3.74642 1.71115 6.27399 0.733299C8.80128 -0.244433 11.6026 -0.244433 14.1295 0.733299C16.657 1.71103 18.7288 3.59601 19.9404 6.02009C20.5578 7.26686 20.5578 8.73041 19.9404 9.97718C19.043 11.7915 17.6547 13.3179 15.9331 14.3825C14.2116 15.4471 12.2259 16.0075 10.202 15.9999H10.2015ZM2.19045 6.87906C1.83288 7.58259 1.83288 8.41472 2.19045 9.11825C2.91884 10.6182 4.0588 11.8802 5.47715 12.7569C6.89566 13.6336 8.53407 14.0888 10.2014 14.0695C11.8687 14.0888 13.5072 13.6336 14.9256 12.7569C16.344 11.8802 17.4839 10.6182 18.2123 9.11825C18.5699 8.41472 18.5699 7.58259 18.2123 6.87906C17.4839 5.37911 16.344 4.11716 14.9256 3.24044C13.5071 2.36372 11.8687 1.90855 10.2014 1.92778C8.53403 1.90855 6.89562 2.36372 5.47715 3.24044C4.0588 4.11716 2.91884 5.37911 2.19045 6.87906ZM10.2005 11.859C9.1766 11.859 8.19469 11.4523 7.47064 10.7283C6.7466 10.0042 6.3399 9.02232 6.3399 7.99838C6.3399 6.97445 6.7466 5.99254 7.47064 5.2685C8.19469 4.54445 9.1766 4.13776 10.2005 4.13776C11.2245 4.13776 12.2064 4.54445 12.9304 5.2685C13.6545 5.99254 14.0612 6.97445 14.0612 7.99838C14.0612 9.02232 13.6545 10.0042 12.9304 10.7283C12.2064 11.4523 11.2245 11.859 10.2005 11.859Z" fill="currentColor"></path></svg>
            </div>
          </button>
        </div>
      ) : null}
    </div>
  );

  const body = (
    <div
      ref={cardRef}
      className={`relative w-full group ${className}`}
      onClick={(e) => {
        if (!showActions || !isTouchPrimary) return;
        if (touchActionsOpen) return;
        e.preventDefault();
        e.stopPropagation();
        setTouchActionsOpen(true);
      }}
      style={
        hoverTilt
          ? {
              willChange: 'transform',
              transition: '6000ms cubic-bezier(0.03, 0.98, 0.52, 0.99)',
              transform: `perspective(1000px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale3d(${transform.scale}, ${transform.scale}, ${transform.scale})`,
            }
          : undefined
      }
    >
      {content}
    </div>
  );

  if (href) {
    return (
      <>
        <a
          href={href}
          className="block"
          onClick={(e) => {
            if (!showActions || !isTouchPrimary) return;
            if (touchActionsOpen) return;
            e.preventDefault();
            setTouchActionsOpen(true);
          }}
        >
          {body}
        </a>
        {showActions && packId ? (
          <PackContentsModal
            open={showModal}
            onClose={() => setShowModal(false)}
            packId={packId}
          />
        ) : null}
      </>
    );
  }
  return (
    <>
      {body}
      {showActions && packId ? (
        <PackContentsModal
          open={showModal}
          onClose={() => setShowModal(false)}
          packId={packId}
        />
      ) : null}
    </>
  );
}


