'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { claimsAPI } from '../../lib/api';
import { DashboardStats, Claim } from '../../types';
import StatsCards from '../../components/dashboard/StatsCards';
import { RiskBadge, FraudScoreBar } from '../../components/ui/Badges';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatCurrency, getStatusLabel } from '../../lib/utils';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import {
  ChevronRight, Brain, Activity, GitBranch, ShieldCheck, Users2, Banknote, ArrowRight, Sparkles,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';

const RISK_COLORS: Record<string, string> = {
  low: '#34d399',
  medium: '#fbbf24',
  high: '#fb7185',
  pending: '#64748b',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    claimsAPI
      .getDashboardStats()
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const total = parseInt(stats?.totals?.total || '0');
  const byRisk = (lvl: string) => parseInt(stats?.by_risk?.find((r) => r.risk_level === lvl)?.count || '0');

  const riskChartData =
    stats?.by_risk
      ?.filter((r) => parseInt(r.count) > 0)
      .map((r) => ({
        name: r.risk_level,
        value: parseInt(r.count),
        color: RISK_COLORS[r.risk_level] || '#64748b',
      })) || [];

  const routes = [
    {
      label: 'Auto-Adjudication',
      sub: 'Low risk · straight-through',
      count: byRisk('low'),
      icon: ShieldCheck,
      color: 'emerald',
      bar: 'bg-emerald-400',
    },
    {
      label: 'Human Review',
      sub: 'Medium risk · adjuster queue',
      count: byRisk('medium'),
      icon: Users2,
      color: 'amber',
      bar: 'bg-amber-400',
    },
    {
      label: 'Fraud Investigation',
      sub: 'High risk · escalated',
      count: byRisk('high'),
      icon: Brain,
      color: 'rose',
      bar: 'bg-rose-400',
    },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-teal-500/20 bg-teal-500/[0.07] px-2.5 py-1 text-xs text-teal-300">
            <Sparkles className="h-3 w-3" /> Live operations
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">
            {greeting}, {user?.name?.split(' ')[0] || 'Adjuster'}
          </h1>
          <p className="mt-0.5 text-sm text-slate-400">Here&apos;s what your claims pipeline looks like today.</p>
        </div>
        <Link href="/dashboard/claims/new" className="btn-primary self-start sm:self-auto">
          <Brain className="h-4 w-4" />
          Submit & Analyze
        </Link>
      </div>

      <StatsCards stats={stats} isLoading={isLoading} />

      {/* Risk + Routing */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Risk donut */}
        <div className="card card-topline p-5">
          <div className="mb-2 flex items-center gap-2">
            <Activity className="h-4 w-4 text-teal-400" />
            <h2 className="text-sm font-semibold text-white">Risk Distribution</h2>
          </div>
          {isLoading ? (
            <Skeleton className="mx-auto h-[180px] w-[180px] rounded-full" />
          ) : riskChartData.length > 0 ? (
            <>
              <div className="relative">
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie
                      data={riskChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={82}
                      paddingAngle={4}
                      cornerRadius={6}
                      dataKey="value"
                      stroke="none"
                    >
                      {riskChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#0d1c1a',
                        border: '1px solid rgba(20,184,166,0.25)',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                      labelStyle={{ color: '#94a3b8' }}
                      itemStyle={{ color: '#e2e8f0', textTransform: 'capitalize' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-2xl font-bold text-white">{total}</span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500">Total</span>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {riskChartData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="capitalize text-slate-400">{d.name} risk</span>
                    </div>
                    <span className="font-mono font-medium text-slate-200">
                      {d.value} · {total > 0 ? Math.round((d.value / total) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-slate-500">No data available</div>
          )}
        </div>

        {/* Routing throughput */}
        <div className="card card-topline p-5 xl:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-teal-400" />
            <h2 className="text-sm font-semibold text-white">Maestro Routing Throughput</h2>
            <span className="ml-auto text-xs text-slate-500">Where claims go after fraud scoring</span>
          </div>
          <div className="space-y-4">
            {routes.map(({ label, sub, count, icon: Icon, color, bar }) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const cmap: Record<string, string> = {
                emerald: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
                amber: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
                rose: 'border-rose-500/25 bg-rose-500/10 text-rose-300',
              };
              return (
                <div key={label} className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${cmap[color]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-200">{label}</p>
                        <p className="text-xs text-slate-500">{sub}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-display text-lg font-bold text-white">{isLoading ? '—' : count}</span>
                        <span className="ml-1 text-xs text-slate-500">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className={`h-full rounded-full ${bar} transition-all duration-1000 ease-out`}
                        style={{ width: isLoading ? '0%' : `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
            <Banknote className="h-4 w-4 text-orange-400" />
            <p className="text-xs text-slate-400">
              Approved payouts to date:{' '}
              <span className="font-mono font-medium text-slate-200">
                {formatCurrency(parseFloat(stats?.totals?.total_approved || '0'))}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Status + Recent */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Status breakdown */}
        <div className="card card-topline p-5 xl:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-white">Claims by Status</h2>
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)
              : stats?.by_status?.map((s) => {
                  const t = total || 1;
                  const pct = Math.round((parseInt(s.count) / t) * 100);
                  return (
                    <div key={s.status}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-slate-300">{getStatusLabel(s.status)}</span>
                        <span className="font-mono text-slate-400">
                          {s.count} · {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-1000"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                }) || <p className="text-sm text-slate-500">No data</p>}
          </div>
        </div>

        {/* Recent claims */}
        <div className="card card-topline p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent Claims</h2>
            <Link
              href="/dashboard/claims"
              className="flex items-center gap-1 text-xs text-teal-400 transition-colors hover:text-teal-300"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
            ) : (stats?.recent_claims?.length || 0) === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No claims yet</p>
            ) : (
              stats?.recent_claims?.map((claim: Claim) => (
                <Link
                  key={claim.id}
                  href={`/dashboard/claims/${claim.id}`}
                  className="group flex items-start gap-3 rounded-xl border border-transparent bg-white/[0.02] p-3 transition-all hover:border-white/[0.08] hover:bg-white/[0.04]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-mono text-xs text-teal-400">{claim.claim_number}</span>
                      <RiskBadge level={claim.risk_level} />
                    </div>
                    <p className="truncate text-xs text-slate-400">{claim.policyholder_name || '—'}</p>
                    <div className="mt-1.5">
                      <FraudScoreBar score={claim.fraud_score} />
                    </div>
                  </div>
                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600 transition-colors group-hover:text-teal-400" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
