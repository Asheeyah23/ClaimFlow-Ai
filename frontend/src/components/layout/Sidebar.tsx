'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import {
  LayoutDashboard, FileText, Users, Shield, AlertTriangle, LogOut, Zap, X, Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/claims', label: 'Claims', icon: FileText },
  { href: '/dashboard/policyholders', label: 'Policyholders', icon: Users },
  { href: '/dashboard/fraud', label: 'Fraud Alerts', icon: AlertTriangle, accent: true },
];

export default function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-white/[0.06] bg-surface-900/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-white/[0.06] p-5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-teal shadow-glow">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-sm font-bold leading-tight text-white">ClaimFlow AI</h1>
              <p className="text-[11px] text-teal-400">Claims Intelligence</p>
            </div>
          </Link>
          <button onClick={onClose} className="btn-ghost p-1.5 lg:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* AI status */}
        <div className="mx-4 mb-1 mt-4 overflow-hidden rounded-xl border border-teal-500/15 bg-teal-500/[0.07] px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400" />
            </span>
            <span className="text-xs font-medium text-teal-300">Fraud Agent Active</span>
            <Zap className="ml-auto h-3.5 w-3.5 text-orange-400" />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-3">
          <p className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Operations
          </p>
          {navItems.map(({ href, label, icon: Icon, accent }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                  isActive
                    ? 'bg-white/[0.06] font-medium text-white'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-teal" />
                )}
                <Icon
                  className={cn(
                    'h-4.5 w-4.5 transition-colors',
                    isActive
                      ? accent
                        ? 'text-rose-400'
                        : 'text-teal-400'
                      : 'text-slate-500 group-hover:text-slate-300'
                  )}
                />
                <span className="flex-1">{label}</span>
                {accent && (
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.7)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Upsell / brand card */}
        <div className="mx-3 mb-3 rounded-xl border border-white/[0.06] bg-gradient-to-br from-orange-500/10 to-transparent p-3.5">
          <div className="mb-1 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-xs font-semibold text-slate-200">Maestro Case</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Every claim is orchestrated end-to-end with full audit trails.
          </p>
        </div>

        {/* User */}
        <div className="border-t border-white/[0.06] p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-teal text-xs font-bold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-200">{user?.name}</p>
              <p className="text-xs capitalize text-slate-500">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-400 transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-400"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
