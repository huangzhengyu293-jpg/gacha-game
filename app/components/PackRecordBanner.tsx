'use client';

import React, { useMemo } from 'react';

export type PackRecordData = {
  id?: number | string;
  steamId?: number | string;
  productId?: number | string;
  cover?: string;
  bean?: number | string;
  name?: string;
  awards?: {
    bean?: number | string;
    name?: string;
    cover?: string;
  };
};

interface PackRecordBannerProps {
  record?: PackRecordData;
}

export default function PackRecordBanner({ record }: PackRecordBannerProps) {
  const safeRecord = useMemo(() => {
    if (record && typeof record === 'object') {
      return record;
    }
    return undefined;
  }, [record]);

  const cover = useMemo(() => {
    const raw = safeRecord?.awards?.cover ?? safeRecord?.cover;
    if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw.trim();
    }
    return '';
  }, [safeRecord]);

  const name = useMemo(() => {
    const raw = safeRecord?.awards?.name ?? safeRecord?.name;
    if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw.trim();
    }
    return '------';
  }, [safeRecord]);

  const beanValue = useMemo(() => {
    const raw = safeRecord?.awards?.bean ?? safeRecord?.bean;
    const parsed = raw !== undefined && raw !== null ? Number(raw) : 0;
    if (Number.isFinite(parsed)) {
      return parsed;
    }
    return 0;
  }, [safeRecord]);

  const formattedPrice = useMemo(
    () =>
      `$${beanValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    [beanValue],
  );

  return (
    <div
      className="flex flex-col items-center rounded-md p-3 h-full relative z-10 w-24 justify-between"
      style={{ backgroundColor: '#22272b' }}
    >
      <div className="h-14 w-full relative mb-0.5">
        {cover ? (
          <img
            src={cover}
            alt={name}
            className="pointer-events-none object-contain absolute inset-0 w-full h-full"
          />
        ) : (
          <div className="w-full h-full bg-gray-600 rounded-md" />
        )}
      </div>
      <div className="flex-col flex items-center w-full">
        <p
          className="text-ellipsis max-w-16 overflow-hidden whitespace-nowrap text-xs font-semibold"
          style={{ color: '#7A8084' }}
        >
          {name}
        </p>
        <p className="text-white text-xs font-extrabold text-center">{formattedPrice}</p>
      </div>
    </div>
  );
}

