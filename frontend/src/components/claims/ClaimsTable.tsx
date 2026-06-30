'use client';
import { useRouter } from 'next/navigation';
import { Claim } from '../../types';
import { RiskBadge, StatusBadge, FraudScoreBar } from '../ui/Badges';
import { TableRowSkeleton } from '../ui/Skeleton';
import { formatCurrency, formatDate } from '../../lib/utils';
import { ChevronRight, FileSearch } from 'lucide-react';

interface Props {
  claims: Claim[];
  isLoading: boolean;
}

const CHANNEL_BADGE: Record<string, string> = {
  whatsapp: 'text-emerald-300',
  web: 'text-teal-300',
  mobile: 'text-orange-300',
  agent: 'text-slate-300',
};

export default function ClaimsTable({ claims, isLoading }: Props) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="card overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <TableRowSkeleton key={i} cols={7} />
        ))}
      </div>
    );
  }

  if (claims.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <FileSearch className="h-6 w-6 text-slate-500" />
        </div>
        <p className="font-medium text-slate-300">No claims found</p>
        <p className="mt-1 text-sm text-slate-500">Try adjusting your filters or submit a new claim.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-white/[0.06] text-left">
              {['Claim', 'Policyholder', 'Type', 'Status', 'Risk', 'Fraud Score', 'Amount', 'Date', ''].map((h, i) => (
                <th
                  key={i}
                  className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {claims.map((claim) => (
              <tr
                key={claim.id}
                onClick={() => router.push(`/dashboard/claims/${claim.id}`)}
                className="group cursor-pointer transition-colors hover:bg-white/[0.025]"
              >
                <td className="px-4 py-3.5">
                  <span className="font-mono text-sm font-medium text-teal-400">{claim.claim_number}</span>
                  <span className={`mt-0.5 block text-[11px] capitalize ${CHANNEL_BADGE[claim.submission_channel] || 'text-slate-500'}`}>
                    via {claim.submission_channel}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="text-sm font-medium text-slate-200">{claim.policyholder_name || '—'}</div>
                  <div className="font-mono text-[11px] text-slate-500">{claim.policy_number || '—'}</div>
                </td>
                <td className="px-4 py-3.5 text-sm text-slate-300">{claim.claim_type}</td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={claim.status} />
                </td>
                <td className="px-4 py-3.5">
                  <RiskBadge level={claim.risk_level} />
                </td>
                <td className="w-36 px-4 py-3.5">
                  <FraudScoreBar score={claim.fraud_score} />
                </td>
                <td className="px-4 py-3.5 font-mono text-sm text-slate-200">{formatCurrency(claim.claimed_amount)}</td>
                <td className="px-4 py-3.5 text-sm text-slate-400">{formatDate(claim.created_at)}</td>
                <td className="px-4 py-3.5">
                  <ChevronRight className="h-4 w-4 text-slate-600 transition-all group-hover:translate-x-0.5 group-hover:text-teal-400" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
