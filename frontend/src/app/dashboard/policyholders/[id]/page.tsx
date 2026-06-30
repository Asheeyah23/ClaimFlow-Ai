'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { policyholdersAPI } from '../../../../lib/api';
import { Policyholder, Claim } from '../../../../types';
import { RiskBadge, StatusBadge, FraudScoreBar } from '../../../../components/ui/Badges';
import { Skeleton } from '../../../../components/ui/Skeleton';
import { formatCurrency, formatDate } from '../../../../lib/utils';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Shield, FileText, Wallet } from 'lucide-react';

export default function PolicyholderDetailPage() {
  const { id } = useParams();
  const [policyholder, setPolicyholder] = useState<Policyholder | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    policyholdersAPI
      .getById(id as string)
      .then((res) => {
        setPolicyholder(res.data.policyholder);
        setClaims(res.data.claims || []);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-12 w-72" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!policyholder) return <div className="py-16 text-center text-slate-400">Policyholder not found.</div>;

  const totalClaimed = claims.reduce((s, c) => s + Number(c.claimed_amount || 0), 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/policyholders" className="btn-secondary px-3 py-2.5">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-teal text-lg font-bold text-white">
            {policyholder.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white">{policyholder.full_name}</h1>
            <p className="font-mono text-sm text-teal-400">{policyholder.policy_number}</p>
          </div>
        </div>
      </div>

      {/* Contact tiles */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Tile icon={Phone} label="Contact">
          <p className="text-sm text-slate-200">{policyholder.phone || '—'}</p>
          <p className="truncate text-xs text-slate-500">{policyholder.email}</p>
        </Tile>
        <Tile icon={MapPin} label="Location">
          <p className="text-sm text-slate-200">
            {[policyholder.state, policyholder.country].filter(Boolean).join(', ') || '—'}
          </p>
          <p className="truncate text-xs text-slate-500">{policyholder.address}</p>
        </Tile>
        <Tile icon={Calendar} label="Policy Period">
          <p className="text-sm text-slate-200">
            {formatDate(policyholder.policy_start_date)} – {formatDate(policyholder.policy_end_date)}
          </p>
        </Tile>
      </div>

      {/* Policy details */}
      <div className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-teal-400" />
          <h2 className="text-sm font-semibold text-white">Policy Details</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric icon={FileText} label="Policy Type" value={policyholder.policy_type} />
          <Metric icon={Shield} label="Coverage" value={formatCurrency(policyholder.coverage_amount)} mono />
          <Metric icon={Wallet} label="Premium" value={formatCurrency(policyholder.premium_amount)} mono />
          <Metric icon={FileText} label="Claims Filed" value={String(claims.length)} />
        </div>
      </div>

      {/* Claims history */}
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Claims History</h2>
          {claims.length > 0 && (
            <span className="text-xs text-slate-500">
              Total claimed:{' '}
              <span className="font-mono text-slate-300">{formatCurrency(totalClaimed)}</span>
            </span>
          )}
        </div>
        {claims.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">No claims filed yet.</p>
        ) : (
          <div className="space-y-2.5">
            {claims.map((claim) => (
              <Link
                key={claim.id}
                href={`/dashboard/claims/${claim.id}`}
                className="group flex flex-col gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3.5 transition-all hover:border-white/[0.1] hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-medium text-teal-400">{claim.claim_number}</span>
                  <span className="text-sm text-slate-300">{claim.claim_type}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-24">
                    <FraudScoreBar score={claim.fraud_score} />
                  </div>
                  <RiskBadge level={claim.risk_level} />
                  <StatusBadge status={claim.status} />
                  <span className="font-mono text-sm text-slate-200">{formatCurrency(claim.claimed_amount)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Tile({ icon: Icon, label, children }: { icon: typeof Phone; label: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <div className="mb-1.5 flex items-center gap-2 text-xs text-slate-500">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      {children}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-500">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <p className={`text-sm text-slate-200 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
