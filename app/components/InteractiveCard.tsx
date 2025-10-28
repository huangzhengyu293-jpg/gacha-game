"use client";
import { useRef, useState, useEffect } from "react";

interface InteractiveCardProps {
  imageUrl: string;
  overlayUrl?: string;
  alt?: string;
  width?: number;
  height?: number;
  href?: string;
  className?: string;
}

export default function InteractiveCard({
  imageUrl,
  overlayUrl,
  alt = "Interactive card",
  width = 200,
  height = 304,
  href,
  className = ""
}: InteractiveCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({
    rotateX: 0,
    rotateY: 0,
    scale: 1
  });

  useEffect(() => {
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
      
      setTransform({
        rotateX,
        rotateY,
        scale: 1.05
      });
    };

    const handleMouseLeave = () => {
      setTransform({ rotateX: 0, rotateY: 0, scale: 1 });
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const cardContent = (
    <div className="flex relative">
      <img
        alt={alt}
        loading="lazy"
        width={width}
        height={height}
        decoding="async"
        src={imageUrl}
        className="color-transparent h-auto w-full"
        style={{ color: 'transparent' }}
      />
      {overlayUrl && (
        <div className="flex absolute w-full">
          <img
            alt=""
            loading="lazy"
            width={width + 43}
            height={height - 17}
            decoding="async"
            src={overlayUrl}
            className="color-transparent"
            style={{ color: 'transparent' }}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className={`rounded-lg cursor-pointer ${className}`}>
      <div
        ref={cardRef}
        style={{
          willChange: 'transform',
          transition: '6000ms cubic-bezier(0.03, 0.98, 0.52, 0.99)',
          transform: `perspective(1000px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale3d(${transform.scale}, ${transform.scale}, ${transform.scale})`
        }}
      >
        {href ? (
          <a href={href}>
            {cardContent}
          </a>
        ) : (
          cardContent
        )}
      </div>
    </div>
  );
}
