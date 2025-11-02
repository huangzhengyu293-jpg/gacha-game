'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type MenuItem = { label: string; href: string };

const MENU_ITEMS: MenuItem[] = [
  { label: '个人资料', href: '/account' },
  { label: '存款', href: '/account/deposits' },
  { label: '提款', href: '/account/withdrawals' },
  { label: '领取', href: '/account/claims' },
  { label: '销售', href: '/account/sales' },
  { label: '对战历史', href: '/account/battles' },
  { label: '礼包历史', href: '/account/packs' },
  { label: '交易历史', href: '/account/transactions' },
  { label: '抽奖历史', href: '/account/draws' },
  { label: '推荐', href: '/account/referrals' },
  { label: '公平性', href: '/account/fairness' },
  { label: '安全', href: '/account/security' },
];

function getCurrentLabelFromPath(pathname: string): string {
  const match = MENU_ITEMS.find((i) => i.href === pathname);
  if (match) return match.label;
  // 兼容动态路由或末尾斜杠
  const cleaned = pathname.replace(/\/+$/, '');
  const again = MENU_ITEMS.find((i) => i.href === cleaned);
  return again?.label ?? '个人资料';
}

export default function AccountMobileMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const label = getCurrentLabelFromPath(pathname);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open) return;
      const t = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(t)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="relative lg:hidden z-10">
      <button
        type="button"
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative text-base font-bold select-none h-10 px-6"
        style={{ backgroundColor: '#34383C', color: '#FFFFFF' }}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>

      {open && (
        <>
          {/* 遮罩 */}
          <div className="fixed inset-0" style={{ zIndex: 50 }} />
          {/* 下拉 */}
          <div
            ref={menuRef}
            role="menu"
            aria-orientation="vertical"
            className="absolute left-0 top-full mt-2 w-56 rounded-lg p-1 shadow-md overflow-y-auto"
            style={{ backgroundColor: '#22272B', zIndex: 60 }}
          >
            {MENU_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors"
                style={{ color: '#7A8084' }}
                onClick={(e) => {
                  e.preventDefault();
                  setOpen(false);
                  router.push(item.href);
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#34383C'; (e.currentTarget as HTMLAnchorElement).style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = '#7A8084'; }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


