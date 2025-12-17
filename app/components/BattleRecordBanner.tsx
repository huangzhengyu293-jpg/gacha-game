'use client';

import React, { useMemo } from 'react';
import { useAuthContext } from '../providers/AuthProvider';

export type BattleRecordData = {
  id?: number | string;
  lv?: number | string;
  win_bean?: number | string;
  user?: {
    name?: string;
    avatar?: string;
  };
};

interface BattleRecordBannerProps {
  record?: BattleRecordData;
}

export default function BattleRecordBanner({ record }: BattleRecordBannerProps) {
  const { user } = useAuthContext();

  const safeRecord = useMemo(() => {
    if (record && typeof record === 'object') {
      return record;
    }
    return undefined;
  }, [record]);

  const name = useMemo(() => {
    const rawName = safeRecord?.user?.name;
    if (typeof rawName === 'string' && rawName.trim().length > 0) {
      return rawName.trim();
    }
    return '------';
  }, [safeRecord]);

  const avatarSrc = useMemo(() => {
    const rawAvatar = safeRecord?.user?.avatar;
    if (typeof rawAvatar === 'string' && rawAvatar.trim().length > 0) {
      return rawAvatar.trim();
    }
    return '';
  }, [safeRecord]);

  const level = useMemo(() => {
    const vipInfo = user?.userInfo?.vip_info || (user as any)?.userInfo?.vipInfo || {};
    const globalVip = Number(vipInfo?.vip_id ?? user?.userInfo?.vip ?? (user as any)?.vip ?? 0);
    if (Number.isFinite(globalVip) && globalVip > 0) {
      return Math.floor(globalVip);
    }
    const rawLv = safeRecord?.lv;
    const parsed = rawLv !== undefined && rawLv !== null ? Number(rawLv) : 0;
    if (Number.isFinite(parsed)) {
      return parsed;
    }
    return 0;
  }, [safeRecord, user]);

  const winBeanValue = useMemo(() => {
    const rawValue = safeRecord?.win_bean;
    const parsed = rawValue !== undefined && rawValue !== null ? Number(rawValue) : 0;
    if (Number.isFinite(parsed)) {
      return parsed;
    }
    return 0;
  }, [safeRecord]);

  const formattedWinBean = useMemo(
    () =>
      `$${winBeanValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    [winBeanValue],
  );

  const nameInitial = useMemo(() => {
    if (name && typeof name === 'string' && name.trim().length > 0) {
      return name.trim().slice(0, 1).toUpperCase();
    }
    return '?';
  }, [name]);

  return (
    <div
      className="flex flex-col items-center rounded-md p-3 h-full relative z-10 w-24 justify-between"
      style={{ backgroundColor: '#22272b' }}
    >
      <div className="flex items-start mb-1 gap-0">
        <div className="overflow-hidden border rounded-full border-[#E3C34A] border-[1px]">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={name}
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs text-gray-200">
              {nameInitial}
            </div>
          )}
        </div>
        <span className="text-white text-xs font-semibold leading-none self-start">{level}</span>
      </div>
      <p
        className="font-semibold text-xs text-ellipsis max-w-16 overflow-hidden whitespace-nowrap"
        style={{ color: '#7A8084' }}
      >
        {name}
      </p>
      <p className="text-white text-sm font-extrabold">{formattedWinBean}</p>
    </div>
  );
}

