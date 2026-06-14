'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

type DashboardTopBarProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  showTheme: boolean;
  collapsible: boolean;
};

export function DashboardTopBar({
  title,
  subtitle,
  backHref,
  showTheme,
  collapsible
}: DashboardTopBarProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!collapsible) {
      setCollapsed(false);
      return;
    }

    const onScroll = () => setCollapsed(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [collapsible]);

  return (
    <div
      className={`sticky top-4 z-30 rounded-[2rem] border border-white/50 bg-white/75 shadow-[0_12px_40px_rgba(57,197,187,0.08)] backdrop-blur-xl transition-all duration-200 dark:border-white/10 dark:bg-slate-900/80 ${
        collapsed ? 'px-4 py-2.5' : 'px-4 py-3'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {backHref ? (
            <Link
              href={backHref as never}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              aria-label="Go back"
            >
              ←
            </Link>
          ) : null}
          <div className="min-w-0">
            <div className={`truncate font-black tracking-tight text-slate-900 transition-all dark:text-white ${collapsed ? 'text-base' : 'text-lg'}`}>
              {title}
            </div>
            {subtitle && !collapsed ? <div className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</div> : null}
          </div>
        </div>
        {showTheme ? <ThemeToggle /> : <div className="h-9 w-9" />}
      </div>
    </div>
  );
}
