'use client';

import { useState } from 'react';

interface InfoTooltipProps {
  content: string;
}

export default function InfoTooltip({ content }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <button
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none interactive-focus relative text-base text-white font-bold disabled:text-gray-400 select-none size-6 min-h-6 min-w-6 max-h-6 max-w-6 rounded-[4px] hover:bg-gray-700 md:opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="info"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        style={{ backgroundColor: 'transparent' }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-info size-4"
          style={{ color: "#7A8084" }}
        >
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 16v-4"></path>
          <path d="M12 8h.01"></path>
        </svg>
      </button>
      {isVisible && (
        <div
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 text-sm rounded-md shadow-md z-50 whitespace-nowrap"
          style={{
            backgroundColor: "#0a0a0a",
            color: "#FFFFFF",
          }}
        >
          {content}
          <div
            className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1"
            style={{
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid #0a0a0a",
            }}
          />
        </div>
      )}
    </div>
  );
}

