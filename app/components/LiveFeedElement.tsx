"use client";

import React from "react";

interface LiveFeedElementProps {
  index?: number;
  href?: string;
  avatarUrl: string;
  productImageUrl: string;
  packImageUrl: string; // 悬停时出现的第二层图片
  title: string;
  priceLabel: string; // 已格式化的价格文案（例如 "$65,000.00"）
  glowColor?: string; // 背景光晕颜色
  className?: string;
}

export default function LiveFeedElement({
  index = 0,
  href,
  avatarUrl,
  productImageUrl,
  packImageUrl,
  title,
  priceLabel,
  glowColor = "#FACC15",
  className = ""
}: LiveFeedElementProps) {
  const content = (
    <div
      data-component={`LiveFeedElement-${index}`}
      className={`group lf-card relative overflow-hidden rounded-lg w-[224px] h-[180px] min-h-[180px] cursor-pointer transition-colors duration-200 ease-in-out ${className}`}
      style={{ backgroundColor: '#22272B' }}
    >
      {/* 顶层内容：头像 + 文案 + 发光 + 主内容图（整体随 hover 下移隐藏） */}
      <div className="lf-top absolute inset-0">
        {/* 头像放在顶层内容中，随顶层一起下移 */}
        <div className="absolute top-4 right-4">
          <div className="overflow-hidden border rounded-full border-gray-600" style={{ borderWidth: 2 }}>
            <div className="relative rounded-full overflow-hidden" style={{ width: 24, height: 24 }}>
              {avatarUrl ? (
                <img
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="pointer-events-none"
                  style={{ position: "absolute", height: "100%", width: "100%", left: 0, top: 0, right: 0, bottom: 0, objectFit: "cover", color: "transparent" }}
                  src={avatarUrl}
                />
              ) : (
                <div style={{ position: "absolute", inset: 0, backgroundColor: "#6B7280" }} />
              )}
            </div>
          </div>
        </div>

        <div data-component="BaseProductCard" className="flex flex-col w-full h-full items-center justify-between p-4">
          <p className="font-semibold text-gray-400 h-6 text-base" />

          <div className="relative flex-1 flex w-full justify-center">
            {/* 中心发光（白色柔光 + 主题色光晕） */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0 }}>
              <div
                className="lf-glow transition-opacity duration-300"
                style={{
                  width: '58%',
                  height: '58%',
                  borderRadius: '9999px',
                  background: 'radial-gradient(closest-side, rgba(255,255,255,0.28), rgba(255,255,255,0) 58%)',
                  filter: 'blur(14px)',
                  opacity: 1
                }}
              />
              <div
                className="lf-glow transition-opacity duration-300"
                style={{
                  width: '26%',
                  height: '26%',
                  borderRadius: '9999px',
                  background: 'radial-gradient(closest-side, rgba(255,255,255,0.9), rgba(255,255,255,0) 70%)',
                  filter: 'blur(10px)',
                  opacity: 0.95
                }}
              />
              <div
                className="lf-glow lf-ambient transition-opacity duration-300"
                style={{
                  width: '92%',
                  height: '92%',
                  borderRadius: '9999px',
                  background: `radial-gradient(closest-side, ${glowColor}AA, rgba(0,0,0,0) 72%)`,
                  filter: 'blur(36px)',
                  opacity: 0.95
                }}
              />
            </div>

            {/* 主内容：图片或占位色块 */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 1 }}>
              {productImageUrl ? (
                <img
                  alt={title}
                  loading="lazy"
                  decoding="async"
                  className="pointer-events-none"
                  style={{ position: "absolute", height: "100%", width: "100%", left: 0, top: 0, right: 0, bottom: 0, objectFit: "contain", color: "transparent" }}
                  src={productImageUrl}
                />
              ) : (
                <div className="rounded-md" style={{ width: "82%", height: "82%", backgroundColor: "#93C5FD" }} />
              )}
            </div>
          </div>

          {/* 标题与价格 */}
          <div className="flex flex-col w-full gap-0.5">
            <p className="font-semibold truncate max-w-full text-center text-base" style={{ color: '#7A8084' }}>{title}</p>
            <div className="flex justify-center">
              <p className="font-extrabold text-base" style={{ color: '#FFFFFF' }}>{priceLabel}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 底部弹出层：默认在容器下方，hover 时自下而上弹入 */}
      <div className="lf-reveal absolute inset-0 flex items-center justify-center">
        {/* 悬停态的背景光（更弱，避免盖过图片） */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0 }}>
          <div
            className="lf-glow transition-opacity duration-300"
            style={{
              width: '86%',
              height: '86%',
              borderRadius: '9999px',
              background: `radial-gradient(closest-side, ${glowColor}99, rgba(0,0,0,0) 70%)`,
              filter: 'blur(30px)',
              opacity: 0.85
            }}
          />
        </div>
        {packImageUrl ? (
          <img
            alt=""
            loading="lazy"
            decoding="async"
            className="pointer-events-none"
            style={{ position: "absolute", height: "100%", width: "100%", left: 0, top: 0, right: 0, bottom: 0, objectFit: "contain", color: "transparent" }}
            src={packImageUrl}
          />
        ) : (
          <div className="rounded-md" style={{ width: "86%", height: "86%", backgroundColor: "#34D399" }} />
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  return content;
}


