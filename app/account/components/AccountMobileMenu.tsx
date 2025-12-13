'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/app/components/I18nProvider';

type MenuItem = { labelKey: string; href: string };

export default function AccountMobileMenu() {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const MENU_ITEMS: MenuItem[] = useMemo(
    () => [
      { labelKey: 'accountProfile', href: '/account' },
      { labelKey: 'accountDepositsTitle', href: '/account/deposits' },
      { labelKey: 'accountWithdrawalsTitle', href: '/account/withdrawals' },
      { labelKey: 'accountClaimsTitle', href: '/account/claims' },
      { labelKey: 'accountSalesTitle', href: '/account/sales' },
      { labelKey: 'accountBattlesTitle', href: '/account/battles' },
      { labelKey: 'accountPacksTitle', href: '/account/packs' },
      { labelKey: 'accountTransactionsTitle', href: '/account/transactions' },
      { labelKey: 'accountDrawsTitle', href: '/account/draws' },
      { labelKey: 'referrals', href: '/account/referrals' },
      { labelKey: 'accountFairnessTitle', href: '/account/fairness' },
      { labelKey: 'accountSecurityTitle', href: '/account/security' },
    ],
    [t],
  );

  const label = useMemo(() => {
    const match = MENU_ITEMS.find((i) => i.href === pathname || i.href === pathname.replace(/\/+$/, ''));
    return t(match?.labelKey ?? 'accountProfile');
  }, [MENU_ITEMS, pathname, t]);

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
                {t(item.labelKey)}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


