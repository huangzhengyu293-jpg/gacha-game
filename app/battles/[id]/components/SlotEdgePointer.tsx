'use client';

export default function SlotEdgePointer({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      className="pointer-events-none absolute flex h-6 w-6 items-center justify-center text-[#C8CDD3] drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
      style={{
        top: '50%',
        transform: 'translateY(-50%)',
        left: side === 'left' ? '12px' : undefined,
        right: side === 'right' ? '12px' : undefined,
      }}
    >
      {side === 'left' ? (
        <svg viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3 w-3">
          <path
            d="M3.00255 0.739429L12.1147 6.01823C13.4213 6.77519 13.4499 8.65172 12.1668 9.44808L3.05473 15.1039C1.72243 15.9309 0 14.9727 0 13.4047V2.47C0 0.929093 1.66922 -0.0329925 3.00255 0.739429Z"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3 w-3">
          <path
            d="M10.9974 0.739429L1.88534 6.01823C0.578686 6.77519 0.550138 8.65172 1.83316 9.44808L10.9453 15.1039C12.2776 15.9309 14 14.9727 14 13.4047V2.47C14 0.929093 12.3308 -0.0329925 10.9974 0.739429Z"
            fill="currentColor"
          />
        </svg>
      )}
    </div>
  );
}

