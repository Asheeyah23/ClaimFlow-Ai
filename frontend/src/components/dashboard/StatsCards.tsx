'use client';
import { FileText, TrendingUp, AlertTriangle, CheckCircle, ArrowUpRight } from 'lucide-react';
import { DashboardStats } from '../../types';
import AnimatedCounter from '../ui/AnimatedCounter';
import { StatCardSkeleton } from '../ui/Skeleton';

interface Props {
  stats: DashboardStats | null;
  isLoading: boolean;
}

export default function StatsCards({ stats, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const total = parseInt(stats?.totals?.total || '0');
  const claimed = parseFloat(stats?.totals?.total_claimed || '0');
  const approved = parseFloat(stats?.totals?.total_approved || '0');
  const highRisk = parseInt(stats?.by_risk?.find((r) => r.risk_level === 'high')?.count || '0');
  const lowRisk = parseInt(stats?.by_risk?.find((r) => r.risk_level === 'low')?.count || '0');

  const approvalRate = claimed > 0 ? Math.round((approved / claimed) * 100) : 0;
  const autoShare = total > 0 ? Math.round((lowRisk / total) * 100) : 0;

  type Card = {
    label: string;
    value: number;
    prefix?: string;
    icon: typeof FileText;
    accent: string;
    foot: string;
    footIcon?: typeof ArrowUpRight;
  };

  const cards: Card[] = [
    {
      label: 'Total Claims',
      value: total,
      icon: FileText,
      accent: 'teal',
      foot: `${autoShare}% auto-resolvable`,
      footIcon: ArrowUpRight,
    },
    {
      label: 'Total Claimed',
      value: claimed,
      prefix: '₦',
      icon: TrendingUp,
      accent: 'orange',
      foot: 'Across all channels',
    },
    {
      label: 'High-Risk',
      value: highRisk,
      icon: AlertTriangle,
      accent: 'rose',
      foot: 'Need investigation',
    },
    {
      label: 'Total Approved',
      value: approved,
      prefix: '₦',
      icon: CheckCircle,
      accent: 'emerald',
      foot: `${approvalRate}% of claimed value`,
    },
  ];

  const accentMap: Record<string, { box: string; glow: string }> = {
    teal: { box: 'border-teal-500/25 bg-teal-500/10 text-teal-300', glow: 'from-teal-500/10' },
    orange: { box: 'border-orange-500/25 bg-orange-500/10 text-orange-300', glow: 'from-orange-500/10' },
    rose: { box: 'border-rose-500/25 bg-rose-500/10 text-rose-300', glow: 'from-rose-500/10' },
    emerald: { box: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300', glow: 'from-emerald-500/10' },
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, prefix, icon: Icon, accent, foot, footIcon: FootIcon }, i) => {
        const a = accentMap[accent];
        return (
          <div
            key={label}
            className="card card-topline group animate-slide-up overflow-hidden p-5"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${a.glow} to-transparent blur-2xl`} />
            <div className="relative">
              <div className="mb-4 flex items-start justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${a.box}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="font-display text-3xl font-bold tabular-nums text-white">
                <AnimatedCounter value={value} prefix={prefix} />
              </div>
              <div className="mt-1 text-sm font-medium text-slate-300">{label}</div>
              <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                {FootIcon && <FootIcon className="h-3 w-3 text-teal-400" />}
                {foot}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
