'use client';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Search, Bell, Plus } from 'lucide-react';
import Link from 'next/link';

const TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/claims': 'Claims',
  '/dashboard/claims/new': 'Submit Claim',
  '/dashboard/policyholders': 'Policyholders',
  '/dashboard/policyholders/new': 'Add Policyholder',
  '/dashboard/fraud': 'Fraud Alerts',
};

export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const title =
    TITLES[pathname] ||
    (pathname.includes('/claims/') ? 'Claim Detail' : pathname.includes('/policyholders/') ? 'Policyholder' : 'ClaimFlow');

  const today = new Date().toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-surface-950/70 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <button onClick={onMenu} className="btn-ghost p-2 lg:hidden">
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <h2 className="truncate font-display text-base font-semibold text-white">{title}</h2>
          <p className="hidden text-xs text-slate-500 sm:block">{today}</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Search (jumps to claims search) */}
          <button
            onClick={() => router.push('/dashboard/claims')}
            className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-500 transition-colors hover:border-white/20 hover:text-slate-300 md:flex"
          >
            <Search className="h-4 w-4" />
            <span>Search claims…</span>
            <kbd className="ml-2 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
              /
            </kbd>
          </button>

          <Link href="/dashboard/fraud" className="btn-ghost relative p-2.5" aria-label="Fraud alerts">
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
          </Link>

          <Link href="/dashboard/claims/new" className="btn-primary px-3 py-2 text-sm">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Claim</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
