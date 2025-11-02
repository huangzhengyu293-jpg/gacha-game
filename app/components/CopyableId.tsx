'use client';

import { useState, useRef } from 'react';

export default function CopyableId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <div className="flex items-center" ref={wrapRef}>
      <p className="text-base text-white">{id}</p>
      <button
        type="button"
        aria-label="复制用户 ID"
        onClick={onCopy}
        className="relative cursor-pointer ml-2 inline-flex items-center justify-center"
        style={{ color: '#FFFFFF' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy size-4">
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
        </svg>
        {/* Tooltip */}
        <div
          className="pointer-events-none absolute z-50 px-3 py-1.5 rounded-md shadow-md"
          style={{
            top: '-34px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#070707',
            minWidth: 'max-content',
            opacity: 0,
          }}
        >
          <p className="text-sm" style={{ color: '#FFFFFF' }}>{copied ? '已复制' : '复制用户 ID'}</p>
        </div>
        <style>{`
          button[aria-label="复制用户 ID"]:hover > div { opacity: 1; animation: fadeIn 120ms ease forwards }
          @keyframes fadeIn { from { opacity: 0; transform: translate(-50%, -2px) } to { opacity: 1; transform: translate(-50%, 0) } }
        `}</style>
      </button>
    </div>
  );
}


