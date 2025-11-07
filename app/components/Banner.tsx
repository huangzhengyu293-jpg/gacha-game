'use client';
import React from 'react';
import { useI18n } from './I18nProvider';

interface BannerProps {
  title: string;
  icon: React.ReactNode;
  bgClass: string;
  href: string;
  className?: string;
}

export default function Banner({ title, icon, bgClass, href, className = "" }: BannerProps) {
  const { t } = useI18n();
  
  return (
    <a 
      href={href}
      className={`rounded-lg flex-1 p-3 flex flex-col justify-between items-start h-[123px] min-h-[123px] overflow-hidden transition-colors duration-200 relative cursor-pointer ${className}`}
      style={{ backgroundColor: '#22272b' }}
    >
      <div className={`absolute h-full w-full top-0 left-0 ${bgClass}`}></div>
      <div className="flex flex-col justify-between h-full z-10">
        <div className="size-10" style={{ color: '#7A8084' }}>
          {icon}
        </div>
        <p className="text-gray-300 font-urbanist font-extrabold uppercase leading-[1.2] flex flex-col z-10 w-28">
          {title}
        </p>
      </div>
    </a>
  );
}
