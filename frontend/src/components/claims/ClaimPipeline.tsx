'use client';
import { Inbox, Brain, GitBranch, Gavel, Banknote, Check, ShieldAlert } from 'lucide-react';
import { ClaimStatus, RiskLevel } from '../../types';
import { cn } from '../../lib/utils';

interface Props {
  status: ClaimStatus;
  riskLevel: RiskLevel;
}

const STAGES = [
  { key: 'intake', label: 'Intake Agent', sub: 'Data extraction', icon: Inbox },
  { key: 'fraud', label: 'Fraud Agent', sub: 'Risk scoring', icon: Brain },
  { key: 'routing', label: 'Maestro Case', sub: 'Smart routing', icon: GitBranch },
  { key: 'adjudication', label: 'Adjudication', sub: 'Decision', icon: Gavel },
  { key: 'payout', label: 'Payout', sub: 'Settlement', icon: Banknote },
] as const;

// Map a claim status to how far along the 5-stage orchestration it is (0-indexed, inclusive).
function stageIndexFor(status: ClaimStatus): number {
  switch (status) {
    case 'submitted':
      return 1; // through intake + fraud
    case 'under_review':
    case 'fraud_investigation':
      return 2; // routed, awaiting decision
    case 'approved':
    case 'partially_approved':
    case 'rejected':
      return 3; // adjudicated
    case 'paid':
      return 4; // paid out
    default:
      return 1;
  }
}

export default function ClaimPipeline({ status, riskLevel }: Props) {
  const reached = stageIndexFor(status);
  const isRejected = status === 'rejected';
  const isFraud = status === 'fraud_investigation';

  const routeLabel =
    riskLevel === 'high' || isFraud
      ? { text: 'High risk → Fraud investigation', cls: 'text-rose-300 bg-rose-500/10 border-rose-500/25', icon: ShieldAlert }
      : riskLevel === 'medium'
      ? { text: 'Medium risk → Human review', cls: 'text-amber-300 bg-amber-500/10 border-amber-500/25', icon: GitBranch }
      : { text: 'Low risk → Auto-adjudication', cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25', icon: Check };

  const RouteIcon = routeLabel.icon;

  return (
    <div className="card card-topline p-5">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-teal-400" />
          <h2 className="text-sm font-semibold text-white">Maestro Case Orchestration</h2>
        </div>
        <span className={cn('badge', routeLabel.cls)}>
          <RouteIcon className="h-3 w-3" />
          {routeLabel.text}
        </span>
      </div>

      <div className="flex items-stretch">
        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          const done = i < reached;
          const active = i === reached;
          const failedHere = isRejected && i === 3;
          return (
            <div key={stage.key} className="flex flex-1 items-start">
              {/* node */}
              <div className="flex flex-col items-center text-center" style={{ flex: '0 0 auto', width: 86 }}>
                <div
                  className={cn(
                    'relative flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-300',
                    failedHere
                      ? 'border-rose-500/50 bg-rose-500/15 text-rose-300'
                      : done
                      ? 'border-teal-500/40 bg-teal-500/15 text-teal-300'
                      : active
                      ? 'border-orange-500/50 bg-orange-500/15 text-orange-300 shadow-glow-orange'
                      : 'border-white/10 bg-white/[0.03] text-slate-500'
                  )}
                >
                  {active && (
                    <span className="absolute inset-0 animate-glow-pulse rounded-xl border border-orange-400/40" />
                  )}
                  {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-semibold',
                    done || active ? 'text-slate-200' : 'text-slate-500'
                  )}
                >
                  {stage.label}
                </span>
                <span className="text-[10px] text-slate-500">{stage.sub}</span>
              </div>

              {/* connector */}
              {i < STAGES.length - 1 && (
                <div className="relative mt-5 h-0.5 flex-1">
                  <div className="absolute inset-0 rounded-full bg-white/10" />
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-full transition-all duration-700',
                      i < reached ? 'bg-gradient-teal' : 'w-0'
                    )}
                    style={{ width: i < reached ? '100%' : '0%' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
