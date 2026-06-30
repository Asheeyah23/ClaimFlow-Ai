'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { claimsAPI } from '../../../lib/api';
import { Claim } from '../../../types';
import { StatusBadge, FraudScoreBar } from '../../../components/ui/Badges';
import { Skeleton } from '../../../components/ui/Skeleton';
import { formatCurrency, formatDate } from '../../../lib/utils';
import { AlertTriangle, ChevronRight, ShieldCheck, Brain, TrendingUp } from 'lucide-react';

export default function FraudAlertsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    claimsAPI
      .getAll({ risk_level: 'high', limit: 50 })
      .then((res) => setClaims(res.data.claims || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const exposure = claims.reduce((sum, c) => sum + Number(c.claimed_amount || 0), 0);
  const avgScore = claims.length
    ? Math.round(claims.reduce((s, c) => s + (c.fraud_score || 0), 0) / claims.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white">Fraud Alerts</h1>
            <p className="mt-0.5 text-sm text-slate-400">High-risk claims flagged for investigation</p>
          </div>
        </div>
        {!isLoading && claims.length > 0 && (
          <span className="self-start rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-300 sm:self-auto">
            {claims.length} active {claims.length === 1 ? 'alert' : 'alerts'}
          </span>
        )}
      </div>

      {/* Stat banner */}
      {!isLoading && claims.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Active Alerts', value: String(claims.length), icon: AlertTriangle, color: 'text-rose-400' },
            { label: 'Flagged Exposure', value: formatCurrency(exposure), icon: TrendingUp, color: 'text-orange-400' },
            { label: 'Avg Fraud Score', value: String(avgScore), icon: Brain, color: 'text-teal-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card flex items-center gap-3 p-4">
              <Icon className={`h-5 w-5 ${color}`} />
              <div>
                <p className="font-display text-lg font-bold text-white">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <div className="card flex flex-col items-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10">
            <ShieldCheck className="h-7 w-7 text-emerald-400" />
          </div>
          <p className="font-medium text-white">All clear</p>
          <p className="mt-1 text-sm text-slate-500">No high-risk claims need investigation right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => (
            <Link
              key={claim.id}
              href={`/dashboard/claims/${claim.id}`}
              className="card-hover group flex items-stretch gap-4 overflow-hidden p-5"
            >
              <div className="w-1 shrink-0 rounded-full bg-gradient-to-b from-rose-500 to-rose-700" />
              <div className="grid flex-1 grid-cols-2 items-center gap-4 lg:grid-cols-5">
                <div className="lg:col-span-1">
                  <p className="font-mono text-sm font-semibold text-rose-400">{claim.claim_number}</p>
                  <p className="truncate text-xs text-slate-400">{claim.policyholder_name}</p>
                </div>
                <div className="hidden lg:block">
                  <p className="mb-0.5 text-[11px] uppercase tracking-wide text-slate-500">Type</p>
                  <p className="truncate text-sm text-slate-200">{claim.claim_type}</p>
                </div>
                <div className="lg:col-span-1">
                  <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-500">Fraud Score</p>
                  <FraudScoreBar score={claim.fraud_score} />
                </div>
                <div className="hidden lg:block">
                  <p className="mb-0.5 text-[11px] uppercase tracking-wide text-slate-500">Amount</p>
                  <p className="font-mono text-sm text-white">{formatCurrency(claim.claimed_amount)}</p>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <div className="text-right">
                    <StatusBadge status={claim.status} />
                    <p className="mt-1 text-[11px] text-slate-500">{formatDate(claim.created_at)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-600 transition-all group-hover:translate-x-0.5 group-hover:text-rose-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
